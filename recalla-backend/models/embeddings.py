# ============================================================
# FILE PATH:  recalla-backend/models/embeddings.py
# PURPOSE:    Turn text into vectors, and transcripts into chunks.
# ============================================================

"""
Sentence embeddings for semantic memory.

The model is all-MiniLM-L6-v2: 384 dimensions, about 80MB, runs locally on
CPU. It costs nothing per call, which matters because every meeting produces
dozens of chunks and re-indexing should never be something to ration.

Loading takes a few seconds, so it happens once, lazily, on the first call
rather than at import — a server start should not wait for a model nobody may
use in that session.
"""

from __future__ import annotations

import re
import threading
from typing import Iterable, List, Optional

MODEL_NAME = "all-MiniLM-L6-v2"
DIMENSIONS = 384

_model = None
_lock = threading.Lock()


def get_model():
    """Load the embedding model once, on first use."""
    global _model
    if _model is None:
        with _lock:
            if _model is None:
                from sentence_transformers import SentenceTransformer

                print(f"[Recalla] Loading embedding model {MODEL_NAME}…")
                _model = SentenceTransformer(MODEL_NAME)
                print("[Recalla] Embedding model ready")
    return _model


def embed(texts: Iterable[str]) -> List[List[float]]:
    """Embed a batch of strings. Batching is much faster than one at a time."""
    items = [t for t in texts]
    if not items:
        return []
    vecs = get_model().encode(items, batch_size=32, show_progress_bar=False)
    return [v.tolist() for v in vecs]


def embed_one(text: str) -> List[float]:
    return embed([text])[0]


# ── Chunking ─────────────────────────────────────────────────────────────────

# Roughly 3 sentences per chunk with one sentence of overlap. Overlap is the
# point: a decision that straddles a boundary would otherwise be split in half
# and match nothing. Chunks stay small so a retrieved passage is quotable
# rather than a wall of transcript.
SENTENCES_PER_CHUNK = 3
SENTENCE_OVERLAP = 1
MIN_CHARS = 40

_SENT_SPLIT = re.compile(r"(?<=[.!?])\s+")


def split_sentences(text: str) -> List[str]:
    return [s.strip() for s in _SENT_SPLIT.split(text or "") if s.strip()]


def chunk_segments(segments: List[dict]) -> List[dict]:
    """
    Turn transcript segments into overlapping chunks.

    Each segment is {start, end, speaker, text}. Chunks never span a speaker
    change: mixing two voices into one passage makes "who said this?"
    unanswerable, and attribution is most of the value of a meeting search.
    """
    chunks: List[dict] = []

    # Group consecutive segments by speaker first.
    groups: List[dict] = []
    for seg in segments or []:
        spk = seg.get("speaker") or "Speaker 1"
        text = (seg.get("text") or "").strip()
        if not text:
            continue
        if groups and groups[-1]["speaker"] == spk:
            groups[-1]["text"] += " " + text
        else:
            groups.append({
                "speaker": spk, "text": text,
                "start": float(seg.get("start") or 0.0),
            })

    for g in groups:
        sents = split_sentences(g["text"])
        if not sents:
            continue
        step = max(1, SENTENCES_PER_CHUNK - SENTENCE_OVERLAP)
        for i in range(0, len(sents), step):
            body = " ".join(sents[i:i + SENTENCES_PER_CHUNK]).strip()
            if len(body) < MIN_CHARS and chunks:
                # Too short to be worth its own entry; append to the previous.
                chunks[-1]["text"] += " " + body
                continue
            chunks.append({
                "text": body,
                "speaker": g["speaker"],
                "start_s": g["start"],
            })
            if i + SENTENCES_PER_CHUNK >= len(sents):
                break

    return chunks


def chunk_text(text: str, speaker: Optional[str] = None) -> List[dict]:
    """Chunk a plain transcript with no segment structure."""
    sents = split_sentences(text)
    out: List[dict] = []
    step = max(1, SENTENCES_PER_CHUNK - SENTENCE_OVERLAP)
    for i in range(0, len(sents), step):
        body = " ".join(sents[i:i + SENTENCES_PER_CHUNK]).strip()
        if body:
            out.append({"text": body, "speaker": speaker, "start_s": None})
        if i + SENTENCES_PER_CHUNK >= len(sents):
            break
    return out
