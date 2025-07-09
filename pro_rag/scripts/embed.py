"""
Standalone utility so other scripts (or multiprocessing) can import the same logic.
"""
from typing import List
from sentence_transformers import SentenceTransformer
import yaml
from pathlib import Path

# config.yaml からモデル名を読み込む
config_path = Path(__file__).parent.parent / "configs" / "rag.yaml"
with open(config_path, "r", encoding="utf-8") as f:
    config = yaml.safe_load(f)

# キャッシュ共有：import 時に 1 回だけロード
_ENCODER = SentenceTransformer(config["embedding_model"])

def embed_texts(texts: List[str], encoder=_ENCODER):
    """Return list[vector].  Normalized L2 = 1.""" 
    return encoder.encode(texts, normalize_embeddings=True).tolist()