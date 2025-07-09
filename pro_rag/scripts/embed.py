"""
Standalone utility so other scripts (or multiprocessing) can import the same logic.
"""

from typing import List
from sentence_transformers import SentenceTransformer

# キャッシュ共有：import 時に 1 回だけロード
_ENCODER = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def embed_texts(texts: List[str], encoder=_ENCODER):
    """Return list[vector].  Normalized L2 = 1."""
    return encoder.encode(texts, normalize_embeddings=True).tolist()
