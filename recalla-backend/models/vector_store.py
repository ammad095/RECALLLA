# ============================================================
# FILE PATH:  recalla-backend/models/vector_store.py
# PURPOSE:    Store and search meeting memory as vectors.
# ============================================================

"""
ChromaDB-backed semantic index.

Every chunk is stored twice on purpose: the vector here, the text in the
`memories` table. That means a search result can be rendered without a second
lookup, and if this index is ever lost it can be rebuilt entirely from
Postgres — Chroma is a cache of something durable, not the only copy.

Every query is filtered by user_id. Recalla isolates accounts everywhere else,
and a shared vector index would be the one place another person's meetings
could surface in your answers.
"""

from __future__ import annotations

import os
import threading
from typing import List, Optional

from models.embeddings import embed, embed_one

CHROMA_DIR = os.path.join("data", "chroma")
COLLECTION = "recalla_memories"

_client = None
_collection = None
_lock = threading.Lock()


def _get_collection():
    global _client, _collection
    if _collection is None:
        with _lock:
            if _collection is None:
                import chromadb
                from chromadb.config import Settings

                os.makedirs(CHROMA_DIR, exist_ok=True)
                _client = chromadb.PersistentClient(
                    path=CHROMA_DIR,
                    settings=Settings(anonymized_telemetry=False, allow_reset=False),
                )
                _collection = _client.get_or_create_collection(
                    name=COLLECTION,
                    metadata={"hnsw:space": "cosine"},
                )
                print(f"[Recalla] Vector store ready ({_collection.count()} chunks)")
    return _collection


def add_chunks(records: List[dict]) -> int:
    """
    Index chunks. Each record needs id, text, user_id, meeting_id, and may
    carry meeting_title, kind, speaker, start_s, date.
    """
    if not records:
        return 0

    col = _get_collection()
    vectors = embed([r["text"] for r in records])

    col.upsert(
        ids=[r["id"] for r in records],
        embeddings=vectors,
        documents=[r["text"] for r in records],
        metadatas=[{
            "user_id":       r["user_id"],
            "meeting_id":    r["meeting_id"],
            "meeting_title": r.get("meeting_title") or "",
            "kind":          r.get("kind") or "transcript",
            "speaker":       r.get("speaker") or "",
            "start_s":       float(r.get("start_s") or 0.0),
            "date":          r.get("date") or "",
        } for r in records],
    )
    return len(records)


# Below this cosine similarity a "match" is noise. Measured against this
# corpus: a genuine hit scores 0.3-0.55, while an unrelated question ("best
# biryani recipe") still pulls back meeting text at 0.11-0.15. Without a floor
# the agent is handed irrelevant context on every off-topic question and has
# to be trusted to ignore it, which is exactly how confident nonsense starts.
MIN_SIMILARITY = 0.22


def search(query: str, user_id: str, limit: int = 5,
           kind: Optional[str] = None, meeting_id: Optional[str] = None,
           min_similarity: float = MIN_SIMILARITY) -> List[dict]:
    """Most relevant chunks for this user. Never returns another user's text."""
    col = _get_collection()
    if col.count() == 0:
        return []

    where = {"user_id": user_id}
    extra = {}
    if kind:
        extra["kind"] = kind
    if meeting_id:
        extra["meeting_id"] = meeting_id
    if extra:
        where = {"$and": [{"user_id": user_id}] + [{k: v} for k, v in extra.items()]}

    res = col.query(
        query_embeddings=[embed_one(query)],
        n_results=max(1, min(limit, 20)),
        where=where,
    )

    docs  = (res.get("documents") or [[]])[0]
    metas = (res.get("metadatas") or [[]])[0]
    dists = (res.get("distances") or [[]])[0]

    out = []
    for doc, meta, dist in zip(docs, metas, dists):
        # Chroma returns cosine distance; similarity reads better everywhere else.
        score = round(1.0 - float(dist), 3)
        if score < min_similarity:
            continue
        out.append({
            "text": doc,
            "similarity": score,
            "meeting_id": meta.get("meeting_id"),
            "meeting_title": meta.get("meeting_title"),
            "speaker": meta.get("speaker") or None,
            "start_s": meta.get("start_s"),
            "date": meta.get("date"),
            "kind": meta.get("kind"),
        })
    return out


def delete_meeting(meeting_id: str) -> None:
    """Drop a meeting's chunks — called when the meeting itself is deleted."""
    try:
        _get_collection().delete(where={"meeting_id": meeting_id})
    except Exception as e:
        print(f"[Recalla] Could not delete vectors for {meeting_id}: {e}")


def delete_user(user_id: str) -> None:
    try:
        _get_collection().delete(where={"user_id": user_id})
    except Exception as e:
        print(f"[Recalla] Could not delete vectors for user {user_id}: {e}")


def stats() -> dict:
    try:
        return {"chunks": _get_collection().count(), "path": CHROMA_DIR}
    except Exception as e:
        return {"chunks": 0, "error": str(e)}


def delete_ids(ids: List[str]) -> None:
    """Remove specific chunks, used when a meeting is re-indexed."""
    if not ids:
        return
    try:
        _get_collection().delete(ids=ids)
    except Exception as e:
        print(f"[Recalla] Could not delete vector ids: {e}")
