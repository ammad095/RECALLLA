# ============================================================
# FILE PATH:  recalla-backend/tools/recall_tools.py
# PURPOSE:    Answer questions that span meetings, not passages.
# ============================================================

"""
Memory across meetings.

search_memory finds passages — good for "what did we say about X". It cannot
answer the questions people actually carry around between meetings, because
those need the whole history at once:

    "What did I commit to that is still open?"
    "Has that decision changed since we made it?"
    "What keeps coming up and never gets resolved?"

Each of those is a query over structure — tasks, decisions, dates, who said
what — rather than a similarity search, so they are separate tools. This is
the difference between recording meetings and remembering them.

Everything is scoped to the acting user, like the rest of Recalla.
"""

from __future__ import annotations

from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import select

from auth.context import get_current_user_id
from db.models import Meeting, Memory, Reminder, Tag
from db.session import SessionLocal


def _uid() -> Optional[str]:
    return get_current_user_id()


def _window(days: Optional[int]):
    if not days:
        return None
    return datetime.now(timezone.utc) - timedelta(days=int(days))


def list_commitments(assignee: str = "", days: int = 0, include_done: bool = False) -> dict:
    """Every task anyone committed to, across all meetings."""
    uid = _uid()
    if not uid:
        return {"success": False, "error": "No signed-in user.", "commitments": []}

    since = _window(days)
    db = SessionLocal()
    try:
        q = select(Meeting).where(Meeting.user_id == uid)
        if since is not None:
            q = q.where(Meeting.created_at >= since)
        meetings = db.scalars(q.order_by(Meeting.created_at.desc())).all()

        # Reminders the user already set are how a commitment gets "closed",
        # so match them by title to avoid listing work already tracked.
        done = {
            (r.title or "").strip().lower()
            for r in db.scalars(
                select(Reminder).where(Reminder.user_id == uid, Reminder.completed.is_(True))
            ).all()
        }

        out = []
        for m in meetings:
            for t in (m.action_items or []):
                text = (t.get("text") or "").strip()
                if not text:
                    continue
                who = (t.get("assignee") or "").strip()
                if assignee and assignee.lower() not in who.lower():
                    continue
                closed = text.lower() in done
                if closed and not include_done:
                    continue
                out.append({
                    "task": text,
                    "assignee": who or "unassigned",
                    "due": (t.get("due") or "").strip() or None,
                    "priority": t.get("priority") or "medium",
                    "from_meeting": m.title,
                    "meeting_id": m.id,
                    "when": m.created_at.strftime("%d %b %Y") if m.created_at else None,
                    "done": closed,
                })

        return {
            "success": True,
            "count": len(out),
            "commitments": out,
            "message": "Nothing outstanding." if not out else None,
        }
    finally:
        db.close()


def decision_history(topic: str = "", days: int = 0) -> dict:
    """
    Decisions in the order they were made.

    Chronology is the point: seeing "we chose Mongo" in August and "we are
    going with Postgres" in September is how someone notices a decision was
    reversed. A similarity search returns both and implies neither came
    first.
    """
    uid = _uid()
    if not uid:
        return {"success": False, "error": "No signed-in user.", "decisions": []}

    since = _window(days)
    db = SessionLocal()
    try:
        q = select(Meeting).where(Meeting.user_id == uid)
        if since is not None:
            q = q.where(Meeting.created_at >= since)
        meetings = db.scalars(q.order_by(Meeting.created_at.asc())).all()

        needle = topic.strip().lower()
        out = []
        for m in meetings:
            for d in (m.decisions or []):
                text = (d.get("text") or "").strip()
                if not text:
                    continue
                if needle and needle not in text.lower() and needle not in (m.title or "").lower():
                    continue
                out.append({
                    "decision": text,
                    "context": (d.get("context") or "").strip() or None,
                    "from_meeting": m.title,
                    "meeting_id": m.id,
                    "when": m.created_at.strftime("%d %b %Y") if m.created_at else None,
                })

        return {
            "success": True,
            "count": len(out),
            "decisions": out,
            "note": ("Listed oldest first — a later entry on the same subject "
                     "may supersede an earlier one.") if len(out) > 1 else None,
        }
    finally:
        db.close()


def recurring_themes(min_meetings: int = 2, days: int = 0) -> dict:
    """
    Subjects that appear in several meetings.

    A topic discussed once is a topic. A topic discussed in four meetings is
    usually something unresolved, and that is worth surfacing without being
    asked.
    """
    uid = _uid()
    if not uid:
        return {"success": False, "error": "No signed-in user.", "themes": []}

    since = _window(days)
    db = SessionLocal()
    try:
        q = select(Meeting).where(Meeting.user_id == uid)
        if since is not None:
            q = q.where(Meeting.created_at >= since)
        meetings = db.scalars(q).all()
        ids = [m.id for m in meetings]
        if not ids:
            return {"success": True, "count": 0, "themes": [], "message": "No meetings yet."}

        by_title = {m.id: m.title for m in meetings}
        tags = db.scalars(select(Tag).where(Tag.meeting_id.in_(ids))).all()

        seen: dict[str, set] = {}
        for t in tags:
            # Count a tag once per meeting; a word repeated inside one
            # meeting is emphasis, not recurrence.
            key = (t.value or "").strip()
            if not key:
                continue
            seen.setdefault(key, set()).add(t.meeting_id)

        themes = [
            {
                "theme": k,
                "meetings": len(v),
                "where": [by_title[mid] for mid in list(v)[:4] if mid in by_title],
            }
            for k, v in seen.items()
            if len(v) >= max(2, int(min_meetings))
        ]
        themes.sort(key=lambda x: -x["meetings"])

        return {
            "success": True,
            "count": len(themes),
            "themes": themes[:15],
            "message": None if themes else
                       "Nothing has come up in more than one meeting yet.",
        }
    finally:
        db.close()


def meeting_timeline(days: int = 30) -> dict:
    """What has happened recently, as a list — for 'catch me up'."""
    uid = _uid()
    if not uid:
        return {"success": False, "error": "No signed-in user.", "meetings": []}

    since = _window(days) or _window(30)
    db = SessionLocal()
    try:
        meetings = db.scalars(
            select(Meeting)
            .where(Meeting.user_id == uid, Meeting.created_at >= since)
            .order_by(Meeting.created_at.desc())
            .limit(25)
        ).all()

        return {
            "success": True,
            "count": len(meetings),
            "meetings": [{
                "title": m.title,
                "meeting_id": m.id,
                "when": m.created_at.strftime("%d %b %Y") if m.created_at else None,
                "summary": (m.summary or "")[:220] or None,
                "tasks": len(m.action_items or []),
                "decisions": len(m.decisions or []),
            } for m in meetings],
        }
    finally:
        db.close()


RECALL_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "list_commitments",
            "description": (
                "Every task people committed to across ALL meetings, with who owes it "
                "and when. Use for 'what do I owe', 'what is outstanding', 'what did "
                "Muzammal promise', 'what is still open'. This spans meetings — "
                "search_memory only finds passages within them."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "assignee": {"type": "string", "description": "Filter to one person's name. Empty for everyone."},
                    "days": {"type": "integer", "description": "Only meetings from the last N days. 0 for all time."},
                    "include_done": {"type": "boolean", "description": "Include commitments already completed."},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "decision_history",
            "description": (
                "Decisions across all meetings in the order they were made. Use for "
                "'what have we decided', 'did we change our mind about X', 'has this "
                "been settled'. Chronological, so a reversal is visible."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {"type": "string", "description": "Filter to decisions mentioning this. Empty for all."},
                    "days": {"type": "integer", "description": "Only the last N days. 0 for all time."},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "recurring_themes",
            "description": (
                "Subjects that come up in multiple meetings — usually the unresolved "
                "ones. Use for 'what do we keep talking about', 'what keeps coming "
                "up', 'what is unresolved'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "min_meetings": {"type": "integer", "description": "How many meetings a theme must appear in (default 2)."},
                    "days": {"type": "integer", "description": "Only the last N days. 0 for all time."},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "meeting_timeline",
            "description": (
                "Recent meetings with their summaries and counts. Use for 'catch me "
                "up', 'what have I missed', 'what happened this week'. The summaries "
                "returned ARE the answer — do not call search_memory afterwards to "
                "look up each meeting individually."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "days": {"type": "integer", "description": "How far back to look (default 30)."},
                },
            },
        },
    },
]

RECALL_FUNCTIONS = {
    "list_commitments": list_commitments,
    "decision_history": decision_history,
    "recurring_themes": recurring_themes,
    "meeting_timeline": meeting_timeline,
}
