#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Load raw docs, chunk, embed, and write to LanceDB.
"""

import argparse, uuid, json, multiprocessing as mp
from pathlib import Path

import pandas as pd
import lancedb, pyarrow as pa
from tqdm import tqdm

from unstructured.partition.auto import partition          # 型自動判定
from sentence_transformers import SentenceTransformer
from embed import embed_texts                               # 自家製 util


def yield_chunks(file_path: Path, chunk_size: int = 400):
    """Parse a single file → yield {id,text,source} dicts."""
    elements = partition(str(file_path))
    text = "\n".join(el.text for el in elements if getattr(el, "text", None))

    for i in range(0, len(text), chunk_size):
        yield {
            "id": str(uuid.uuid4()),
            "text": text[i : i + chunk_size],
            "source": file_path.name,
        }


def main(raw_dir: Path, db_path: Path, table: str, chunk_size: int, batch: int):
    # LanceDB 接続
    db = lancedb.connect(str(db_path))
    tbl = db.open_table(table) if table in db.table_names() else None

    # ① チャンク生成 → ② 埋め込み → ③ テーブル追加
    encoder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

    buf = []
    for path in tqdm(list(raw_dir.rglob("*.*")), desc="Scanning"):
        if path.is_file():
            for ch in yield_chunks(path, chunk_size):
                buf.append(ch)
                if len(buf) >= batch:
                    _flush(buf, tbl, encoder, db, table)
                    buf.clear()

    if buf:
        _flush(buf, tbl, encoder, db, table)


def _flush(buf, tbl, encoder, db, table):
    df = pd.DataFrame(buf)
    df["vector"] = list(embed_texts(df["text"].tolist(), encoder))

    if tbl is None:
        tbl = db.create_table(table, data=df[["id", "text", "source", "vector"]])
    else:
        tbl.add(df[["id", "text", "source", "vector"]])


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("raw_dir", type=Path, help="Path to data/raw/")
    p.add_argument("--db", type=Path, default=Path("data/processed/vector_store"))
    p.add_argument("--table", default="docs")
    p.add_argument("--chunk", type=int, default=400)
    p.add_argument("--batch", type=int, default=256, help="flush batch size")
    args = p.parse_args()
    main(args.raw_dir, args.db, args.table, args.chunk, args.batch)
