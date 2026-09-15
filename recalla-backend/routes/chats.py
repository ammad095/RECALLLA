# ============================================================
# FILE PATH:  recalla-backend/routes/chats.py
# PURPOSE:    Saved Ask Recalla conversations — list, open, rename, delete.
# ============================================================

"""
Chat session history.

Ask Recalla previously kept the conversation in React state alone, so a
refresh lost it. Sessions live in the database instead, scoped to the account
that created them, and each turn stores the tool calls it made so reopening a
session redraws its email drafts rather than plain text.
"""

from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, delete, func
from sqlalchemy.orm import Session

from db.session import get_db
from db.models import User, ChatSession, ChatMessage
from auth.deps import get_current_user

router = APIRouter()

TITLE_MAX = 60


class TurnIn(BaseModel):
    role: str
    content: str = ""
    actions: Optional[list] = None


class AppendIn(BaseModel):
    session_id: Optional[str] = None
    turns: List[TurnIn]


class RenameIn(BaseModel):
    title: str


def _title_from(text: str) -> str:
    """First line of the opening message, trimmed to something list-sized."""
    line = (text or "").strip().splitlines()[0] if (text or "").strip() else ""
    if not line:
        return "New chat"
    return line[: TITLE_MAX - 1] + "…" if len(line) > TITLE_MAX else line


def _owned(db: Session, user: User, session_id: str) -> ChatSession:
    s = db.scalar(
        select(ChatSession).where(
            ChatSession.id == session_id, ChatSession.user_id == user.id
        )
    )
    # 404 rather than 403 — a wrong id and someone else's id look identical,
    # so session ids cannot be probed for existence.
    if not s:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Chat not found")
    return s


@router.get("")
def list_sessions(limit: int = 60, user: User = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    rows = db.scalars(
        select(ChatSession)
        .where(ChatSession.user_id == user.id)
        .order_by(ChatSession.updated_at.desc())
        .limit(min(limit, 200))
    ).all()

    counts = dict(
        db.execute(
            select(ChatMessage.session_id, func.count(ChatMessage.id))
            .where(ChatMessage.session_id.in_([r.id for r in rows] or [""]))
            .group_by(ChatMessage.session_id)
        ).all()
    )

    return {
        "sessions": [
            {
                "id": r.id,
                "title": r.title,
                "updated_at": r.updated_at.isoformat() if r.updated_at else None,
                "message_count": counts.get(r.id, 0),
            }
            for r in rows
        ]
    }


@router.get("/{session_id}")
def get_session(session_id: str, user: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    s = _owned(db, user, session_id)
    return {
        "id": s.id,
        "title": s.title,
        "messages": [
            {"role": m.role, "content": m.content, "actions": m.actions or []}
            for m in s.messages
        ],
    }


@router.post("/append")
def append_turns(body: AppendIn, user: User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    """
    Add turns to a session, creating it on the first call.

    The client sends the user turn and the assistant turn together once the
    reply lands, so a failed request never leaves a question saved with no
    answer beside it.
    """
    if body.session_id:
        s = _owned(db, user, body.session_id)
    else:
        first = next((t.content for t in body.turns if t.role == "user"), "")
        s = ChatSession(user_id=user.id, title=_title_from(first))
        db.add(s)
        db.flush()

    start = db.scalar(
        select(func.coalesce(func.max(ChatMessage.idx), -1)).where(
            ChatMessage.session_id == s.id
        )
    ) + 1

    for i, t in enumerate(body.turns):
        db.add(ChatMessage(
            session_id=s.id, idx=start + i,
            role=t.role, content=t.content or "", actions=t.actions or None,
        ))

    # Touch the session so it sorts to the top of the list.
    s.updated_at = func.now()
    db.commit()
    db.refresh(s)
    return {"session_id": s.id, "title": s.title}


@router.patch("/{session_id}")
def rename_session(session_id: str, body: RenameIn,
                   user: User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    s = _owned(db, user, session_id)
    title = (body.title or "").strip()
    if title:
        s.title = title[:TITLE_MAX]
        db.commit()
    return {"success": True, "title": s.title}


@router.delete("/{session_id}")
def delete_session(session_id: str, user: User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    s = _owned(db, user, session_id)
    db.delete(s)
    db.commit()
    return {"success": True}
