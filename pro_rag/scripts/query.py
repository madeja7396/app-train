#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
query.py — Retrieval-Augmented QA CLI  (Qwen3 対応, 改良版)

例
---
python scripts/query.py \
    --db_path   ~/rag_vector_store \
    --model_dir models/qwen3-0.6B \
    --quant     4bit \
    --k         4 \
    --thinking  on
"""

from __future__ import annotations
import argparse, textwrap, sys, warnings
from pathlib import Path
from typing import List

import lancedb, pandas as pd
from sentence_transformers import SentenceTransformer
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
)

# ─────────── Embedding util ───────────
_ENCODER = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
def embed(texts: List[str]) -> List[List[float]]:
    return _ENCODER.encode(texts, normalize_embeddings=True).tolist()

# ─────────── Qwen3 loader ─────────────
def load_qwen(model_dir: str | Path, quant: str = "fp16"):
    kwargs = {"trust_remote_code": True}
    if quant in {"4bit", "8bit"}:
        kwargs["quantization_config"] = BitsAndBytesConfig(
            load_in_4bit=(quant == "4bit"),
            load_in_8bit=(quant == "8bit"),
            bnb_4bit_compute_dtype="bfloat16",
        )
    tok = AutoTokenizer.from_pretrained(model_dir, **kwargs)
    mdl = AutoModelForCausalLM.from_pretrained(
        model_dir,
        torch_dtype="auto",
        device_map="auto",
        **kwargs,
    )
    return tok, mdl

# ─────────── RAG QA main ──────────────
SYSTEM_MSG = (
    "あなたは社内ナレッジ QA アシスタントです。\n"
    "1️⃣ 回答は **50 字以内** に要約。\n"
    "2️⃣ 根拠が無ければ『情報不足です』のみ返答。\n"
    "3️⃣ 出力は Markdown 箇条書きで最大 3 行。"
)

def qa(
    question: str,
    tbl,
    tok,
    mdl,
    k: int = 4,
    thinking: bool = True,
    sample: bool = True,
    max_new_tokens: int = 256,
):
    # ① similarity search
    vec = embed([question])[0]
    ctx_df: pd.DataFrame = (
        tbl.search(vec).limit(k).select(["text", "source"]).to_pandas()
    )
    context = "\n\n".join(f"{r.text}\n(Source: {r.source})" for r in ctx_df.itertuples())

    # ② prompt
    msgs = [
        {"role": "system", "content": SYSTEM_MSG},
        {
            "role": "user",
            "content": f"### 質問\n{question}\n\n### コンテキスト\n{context}",
        },
    ]
    prompt = tok.apply_chat_template(
        msgs,
        tokenize=False,
        add_generation_prompt=True,
        enable_thinking=thinking,
    )
    inputs = tok([prompt], return_tensors="pt").to(mdl.device)

    # ③ generation
    gen_kwargs = dict(max_new_tokens=max_new_tokens, eos_token_id=tok.eos_token_id)
    if sample:
        gen_kwargs.update(dict(do_sample=True, temperature=0.7, top_p=0.9, top_k=20))
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        out = mdl.generate(**inputs, **gen_kwargs)
    resp_ids = out[0][inputs["input_ids"].shape[-1] :]
    text = tok.decode(resp_ids, skip_special_tokens=True).strip()

    # strip <think> block
    if "<think>" in text:
        try:
            text = text.split("</think>")[-1].strip()
        except Exception:
            pass
    return text

# ─────────── CLI setup ────────────────
def build_parser():
    ap = argparse.ArgumentParser(description="RAG CLI (Qwen3)")
    ap.add_argument("--db_path", type=Path, required=True, help="LanceDB path")
    ap.add_argument("--table", default="docs", help="LanceDB table name")
    ap.add_argument("--model_dir", required=True, help="Local dir or HF repo ID")
    ap.add_argument("--quant", choices=["fp16", "8bit", "4bit"], default="fp16")
    ap.add_argument("--k", type=int, default=4, help="top-k docs")
    ap.add_argument("--thinking", choices=["on", "off"], default="on")
    return ap

def main():
    args = build_parser().parse_args()
    db = lancedb.connect(str(args.db_path))
    if args.table not in db.table_names():
        sys.exit(f"❌ table '{args.table}' not found in {args.db_path}")
    tbl = db.open_table(args.table)

    print("[+] Loading Qwen3 model…", file=sys.stderr)
    tok, mdl = load_qwen(args.model_dir, args.quant)

    print("Enter your question (Ctrl-D to exit)")
    while True:
        try:
            q = input("\n質問> ").strip()
        except EOFError:
            break
        if not q:
            continue
        ans = qa(
            q,
            tbl,
            tok,
            mdl,
            k=args.k,
            thinking=(args.thinking == "on"),
            sample=True,
        )
        print("\n--- 回答 ---")
        print(textwrap.fill(ans, 120))

if __name__ == "__main__":
    main()
