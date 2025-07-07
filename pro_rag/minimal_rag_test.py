# -*- coding: utf-8 -*-
"""
minimal_rag_test.py  –  LanceDB 0.24.x 最小 RAG パイプライン（ローカル E5 手動埋め込み）
================================================================
1. Sentence‑Transformers で埋め込み生成（./models/e5）
2. LanceDB に **Fixed‑size ListArray[float32;768]** を保存して検索
   └ PyArrow では `pa.list_(dtype, size)` で固定長を表現
3. (任意) Qwen3‑0.6B‑Instruct で回答生成

依存ライブラリ（バージョン固定推奨）:
  pip install lancedb==0.24.* pyarrow==16.1.0 \
              sentence-transformers transformers accelerate --upgrade
"""

from __future__ import annotations

import pyarrow as pa
import lancedb
from lancedb.embeddings import TextEmbeddingFunction
from sentence_transformers import SentenceTransformer
from typing import List, Union
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
from pydantic import PrivateAttr

# ------------------------------------------------------------------
# 1. Embedding Function
# ------------------------------------------------------------------
EMBED_MODEL_PATH = "./models/e5"  # ローカル保存した E5 モデル

class E5Embedder(TextEmbeddingFunction):
    """Sentence‑Transformers ラッパ（手動呼び出しのみ）"""

    name: str = "e5-base-local"
    model_path: str = EMBED_MODEL_PATH
    device: str = "cuda"

    _model: SentenceTransformer = PrivateAttr()

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        object.__setattr__(self, "_model", SentenceTransformer(self.model_path, device=self.device))

    def ndims(self) -> int:
        return self._model.get_sentence_embedding_dimension()

    def generate_embeddings(self, texts: Union[str, List[str]]):
        if isinstance(texts, str):
            texts = [texts]
        vecs = self._model.encode(
            texts,
            convert_to_numpy=True,
            normalize_embeddings=True,
            batch_size=32,
        )
        return vecs.astype("float32").tolist()  # LanceDB は list[list[float32]] を要求

embedder = E5Embedder()
EMB_DIM = embedder.ndims()  # 768

# ------------------------------------------------------------------
# 2. LanceDB テーブル
# ------------------------------------------------------------------
DB_PATH = "./lancedb"
TABLE_NAME = "docs"

db = lancedb.connect(DB_PATH)

# PyArrow 固定長リスト型は list_(dtype, size) で生成
vector_type = pa.list_(pa.float32(), EMB_DIM)

schema = pa.schema([
    ("doc_id", pa.int64()),
    ("text", pa.string()),
    ("embedding", vector_type),
])

# 既存テーブルがあってもスキーマ不一致の可能性が高いので常に上書き作成
if TABLE_NAME in db.table_names():
    db.drop_table(TABLE_NAME)

table = db.create_table(TABLE_NAME, schema=schema, mode="overwrite")

# ------------------------------------------------------------------
# 3. サンプル文書投入
# ------------------------------------------------------------------
SAMPLE_DOCS = [
    (1, "量子重力理論は、量子力学と一般相対性理論を統合する試みである。"),
    (2, "RAG は検索と生成を組み合わせ、高品質な回答を生むアーキテクチャである。"),
]

if len(table) == 0:
    rows = [
        {
            "doc_id": did,
            "text": txt,
            "embedding": embedder.generate_embeddings(txt)[0],
        }
        for did, txt in SAMPLE_DOCS
    ]
    table.add(rows)

# ------------------------------------------------------------------
# 4. Retrieval テスト
# ------------------------------------------------------------------
QUERY = "量子重力を説明してください"
print(f"\n>>> QUERY: {QUERY}\n")

query_vec = embedder.generate_embeddings(QUERY)[0]
results = (
    table.search(query_vec, vector_column_name="embedding")
    .limit(2)
    .to_list()
)

for i, row in enumerate(results):
    dist = row.get("_distance", row.get("distance", 0.0))
    print(f"[{i}] score={dist:.4f} | text={row['text']}")

# ------------------------------------------------------------------
# 5. 生成モデル（任意）
# ------------------------------------------------------------------
USE_GENERATION = False

if USE_GENERATION and results:
    GEN_MODEL = "Qwen/Qwen3-0.6B-Instruct"
    print("\nLoading Qwen3-0.6B-Instruct … (初回は数分)\n")

    tokenizer = AutoTokenizer.from_pretrained(GEN_MODEL, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(
        GEN_MODEL,
        device_map="auto",
        torch_dtype=torch.float16,
        trust_remote_code=True,
    )

    context = "\n".join([r["text"] for r in results])
    prompt = (
        "あなたは専門家です。以下のコンテキストを参考にユーザの質問に日本語で説明してください。\n"
        f"### コンテキスト:\n{context}\n\n### 質問:\n{QUERY}\n\n### 回答:"
    )

    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=256,
            do_sample=False,
            temperature=0.1,
        )
    answer = tokenizer.decode(outputs[0], skip_special_tokens=True)
    print("\n===== Generated Answer =====\n")
    print(answer.split("回答:")[-1].strip())
