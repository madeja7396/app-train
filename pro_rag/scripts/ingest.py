#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Load raw docs, chunk, embed, and write to LanceDB.
"""
import argparse, uuid
from pathlib import Path

import pandas as pd
import lancedb
from tqdm import tqdm

from unstructured.partition.auto import partition
from embed import embed_texts  # 共通化したutil


def yield_chunks(file_path: Path, chunk_size: int = 400):
    """Parse a single file 
 yield {id,text,source} dicts."""
    try:
        elements = partition(str(file_path))
        text = "\n".join(el.text for el in elements if getattr(el, "text", None))

        for i in range(0, len(text), chunk_size):
            yield {
                "id": str(uuid.uuid4()),
                "text": text[i : i + chunk_size],
                "source": file_path.name,
            }
    except Exception as e:
        print(f"⚠️ Error processing {file_path}: {e}", file=sys.stderr)


def main(raw_dir: Path, db_path: Path, table: str, chunk_size: int, batch: int):
    db = lancedb.connect(str(db_path))
    tbl = db.open_table(table) if table in db.table_names() else None

    buf = []
    for path in tqdm(list(raw_dir.rglob("*.*")), desc="Scanning"):
        if path.is_file():
            for ch in yield_chunks(path, chunk_size):
                buf.append(ch)
                if len(buf) >= batch:
                    tbl = _flush(buf, tbl, db, table)  # tblを更新
                    buf.clear()
    if buf:
        _flush(buf, tbl, db, table)


def _flush(buf, tbl, db, table):
    df = pd.DataFrame(buf)
    df["vector"] = embed_texts(df["text"].tolist())

    if tbl is None:
        tbl = db.create_table(table, data=df[["id", "text", "source", "vector"]])
    else:
        tbl.add(df[["id", "text", "source", "vector"]])
    return tbl


if __name__ == "__main__":
    import sys
    p = argparse.ArgumentParser()
    p.add_argument("raw_dir", type=Path, help="Path to data/raw/")
    p.add_argument("--db", type=Path, default=Path("data/processed/vector_store"))
    p.add_argument("--table", default="docs")
    p.add_argument("--chunk", type=int, default=400)
    p.add_argument("--batch", type=int, default=256, help="flush batch size")
    args = p.parse_args()
    main(args.raw_dir, args.db, args.table, args.chunk, args.batch)