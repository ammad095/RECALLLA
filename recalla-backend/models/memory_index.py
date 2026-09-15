# ============================================================
# FILE PATH:  recalla-backend/models/memory_index.py
# PURPOSE:    Keep the memories table and the vector index in step.
# ============================================================

"""
Indexing a meeting into semantic memory.

Two stores have to agree: rows in `memories` (durable, per user, rebuildable)
and vectors in Chroma (searchable). This module owns both writes so they can
never drift — anything that indexes a meeting goes through here.

Re-indexing the same meeting is safe. Old chunks are cleared first, so a
refined transcript replaces its draft rather than accumulating both, which
would otherwise return the same passage twice in different wordings.
"""

from __future__ import annotations

from typing import List, Optional

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from db.models import Meeting, Memory, Segment
from models.embeddings import chunk_segments, chunk_text
from models import vector_store


def index_meeting(db: Session, meeting: Meeting, kinds_to_keep: tuple = ("task", "decision")) -> int:
    """
    (Re)build the semantic index for one meeting.

    Transcript chunks are regenerated from scratch. Extracted tasks and
    decisions are kept, since they come from a separate pass and would
    otherwise be destroyed every time a transcript is refined.
    """
    segs = db.scalars(
        select(Segment).where(Segment.meeting_id == meeting.id).order_by(Segment.idx)
    ).all()

    if segs:
        chunks = chunk_segments([{
            "start": s.start_s, "end": s.end_s,
            "speaker": s.speaker, "text": s.text,
        } for s in segs])
    else:
        chunks = chunk_text(meeting.full_text or "")

    if not chunks:
        return 0

    # Clear previous transcript chunks for this meeting, in both stores.
    old = db.scalars(
        select(Memory).where(
            Memory.meeting_id == meeting.id, Memory.kind == "transcript"
        )
    ).all()
    if old:
        db.execute(
            delete(Memory).where(
                Memory.meeting_id == meeting.id, Memory.kind == "transcript"
            )
        )
        db.flush()
        try:
            vector_store.delete_ids([m.id for m in old])
        except Exception as e:
            print(f"[Recalla] Vector cleanup skipped: {e}")

    rows: List[Memory] = []
    for i, c in enumerate(chunks):
        rows.append(Memory(
            user_id=meeting.user_id, meeting_id=meeting.id,
            chunk_index=i, text=c["text"], kind="transcript",
            start_s=c.get("start_s"), speaker=c.get("speaker"),
        ))
    db.add_all(rows)
    db.flush()          # assigns ids, which become the vector ids

    date = meeting.created_at.isoformat() if meeting.created_at else ""
    vector_store.add_chunks([{
        "id": r.id, "text": r.text,
        "user_id": r.user_id, "meeting_id": r.meeting_id,
        "meeting_title": meeting.title or "Untitled",
        "kind": r.kind, "speaker": r.speaker, "start_s": r.start_s,
        "date": date,
    } for r in rows])

    for r in rows:
        r.vector_id = r.id
        r.embedded = True

    db.commit()
    print(f"[Recalla] Indexed {len(rows)} chunks for meeting {meeting.id}")
    return len(rows)


def index_extracted(db: Session, meeting: Meeting, items: List[dict], kind: str) -> int:
    """
    Index tasks or decisions pulled out of a meeting.

    Storing these as memories means they are searchable in the same breath as
    the transcript, so "what am I supposed to deliver this week" reaches across
    every meeting rather than one.
    """
    if not items:
        return 0

    db.execute(
        delete(Memory).where(Memory.meeting_id == meeting.id, Memory.kind == kind)
    )
    db.flush()

    rows = []
    for i, it in enumerate(items):
        text = (it.get("text") or "").strip()
        if not text:
            continue
        # Fold the useful metadata into the indexed text so a search for
        # "what does Muzammal owe me" can actually match on the name.
        extras = [v for v in (it.get("assignee"), it.get("due")) if v]
        body = f"{text} ({', '.join(extras)})" if extras else text
        rows.append(Memory(
            user_id=meeting.user_id, meeting_id=meeting.id,
            chunk_index=i, text=body, kind=kind,
        ))

    if not rows:
        return 0

    db.add_all(rows)
    db.flush()

    date = meeting.created_at.isoformat() if meeting.created_at else ""
    vector_store.add_chunks([{
        "id": r.id, "text": r.text, "user_id": r.user_id,
        "meeting_id": r.meeting_id, "meeting_title": meeting.title or "Untitled",
        "kind": kind, "date": date,
    } for r in rows])

    for r in rows:
        r.vector_id = r.id
        r.embedded = True

    db.commit()
    return len(rows)


def drop_meeting(db: Session, meeting_id: str) -> None:
    """Remove a meeting from the index. Rows cascade with the meeting itself."""
    vector_store.delete_meeting(meeting_id)
