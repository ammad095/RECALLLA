"""
Reminder tools — backed by the reminders table, scoped to the acting user.

These used to write to data/reminders.json. That file had no user_id column,
so every account's reminders landed in one shared list, and the dashboard —
which reads the database — never saw anything the agent created. Asking for a
reminder in Ask Recalla or over WhatsApp appeared to work and then vanished.

Everything now goes through the same table the rest of the app uses, keyed on
the user the agent is acting for.
"""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select

from auth.context import get_current_user_id
from db.session import SessionLocal
from db.models import Reminder


class NoActingUser(Exception):
    """Raised when a reminder tool runs with nobody to attribute it to."""


def _uid() -> str:
    uid = get_current_user_id()
    if not uid:
        # Better to fail loudly than to write a reminder nobody owns — that is
        # exactly how the old JSON file ended up unattributable.
        raise NoActingUser("No signed-in user for this request.")
    return uid


def _parse_dt(value: str) -> Optional[datetime]:
    """Accept ISO strings with or without a timezone; store as UTC."""
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _as_dict(r: Reminder) -> dict:
    return {
        "id": r.id,
        "title": r.title,
        "datetime": r.due_at.isoformat() if r.due_at else None,
        "priority": r.priority,
        "category": r.category,
        "notes": r.notes or "",
        "status": "completed" if r.completed else "pending",
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


# ── Tool functions ────────────────────────────────────────────────────────────
# These are the functions the agent can call.

def create_reminder(title: str, datetime_iso: str, priority: str = "medium",
                    category: str = "general", notes: str = "") -> dict:
    """Create a reminder for the signed-in user."""
    due = _parse_dt(datetime_iso)
    db = SessionLocal()
    try:
        r = Reminder(
            user_id=_uid(), title=title.strip(), due_at=due,
            priority=priority or "medium", category=category or "general",
            notes=notes or None,
        )
        db.add(r)
        db.commit()
        db.refresh(r)
        return {
            "success": True,
            "type": "reminder_created",
            "reminder": _as_dict(r),
            "message": f"Reminder set: {r.title}",
        }
    except NoActingUser as e:
        return {"success": False, "error": str(e)}
    finally:
        db.close()


def list_reminders(filter_status: str = "pending", limit: int = 20) -> dict:
    """List the signed-in user's reminders, soonest first."""
    db = SessionLocal()
    try:
        q = select(Reminder).where(Reminder.user_id == _uid())
        if filter_status == "pending":
            q = q.where(Reminder.completed.is_(False))
        elif filter_status == "completed":
            q = q.where(Reminder.completed.is_(True))
        rows = db.scalars(
            q.order_by(Reminder.due_at.asc().nullslast()).limit(max(1, min(limit, 100)))
        ).all()
        return {"success": True, "count": len(rows),
                "reminders": [_as_dict(r) for r in rows]}
    except NoActingUser as e:
        return {"success": False, "error": str(e), "reminders": []}
    finally:
        db.close()


def _owned(db, reminder_id: str) -> Optional[Reminder]:
    """A reminder belonging to the acting user, or None."""
    return db.scalar(
        select(Reminder).where(Reminder.id == reminder_id,
                               Reminder.user_id == _uid())
    )


def complete_reminder(reminder_id: str) -> dict:
    db = SessionLocal()
    try:
        r = _owned(db, reminder_id)
        if not r:
            return {"success": False, "error": "Reminder not found."}
        r.completed = True
        r.completed_at = datetime.now(timezone.utc)
        db.commit()
        return {"success": True, "message": f"Marked done: {r.title}"}
    except NoActingUser as e:
        return {"success": False, "error": str(e)}
    finally:
        db.close()


def delete_reminder(reminder_id: str) -> dict:
    db = SessionLocal()
    try:
        r = _owned(db, reminder_id)
        if not r:
            return {"success": False, "error": "Reminder not found."}
        title = r.title
        db.delete(r)
        db.commit()
        return {"success": True, "message": f"Deleted: {title}"}
    except NoActingUser as e:
        return {"success": False, "error": str(e)}
    finally:
        db.close()


REMINDER_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "create_reminder",
            "description": "Create a new reminder for the user. Use when the user asks to be reminded about something, set a reminder, or remember to do something.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "Short description of what the reminder is about (e.g. 'Call Muzammal about API bug')",
                    },
                    "datetime_iso": {
                        "type": "string",
                        "description": "When to remind, in ISO 8601 format (e.g. '2026-06-23T15:00:00'). Convert natural language like 'tomorrow at 3pm' to ISO format based on today's date.",
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["low", "medium", "high"],
                        "description": "Priority level. Default to 'medium' unless user specifies urgency.",
                    },
                    "category": {
                        "type": "string",
                        "enum": ["general", "meeting", "task", "personal"],
                        "description": "Category of the reminder",
                    },
                    "notes": {
                        "type": "string",
                        "description": "Optional additional notes",
                    },
                },
                "required": ["title", "datetime_iso"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_reminders",
            "description": "Get a list of the user's reminders. Use when the user asks 'what are my reminders', 'show pending tasks', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "filter_status": {
                        "type": "string",
                        "enum": ["pending", "completed", "all"],
                        "description": "Filter by status. Default 'pending'.",
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Max number of reminders to return. Default 20.",
                    },
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "complete_reminder",
            "description": "Mark a reminder as completed. Use when the user says they've done something or finished a task.",
            "parameters": {
                "type": "object",
                "properties": {
                    "reminder_id": {
                        "type": "string",
                        "description": "The ID of the reminder to complete",
                    },
                },
                "required": ["reminder_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_reminder",
            "description": "Delete a reminder permanently. Use when the user says to remove/cancel a reminder.",
            "parameters": {
                "type": "object",
                "properties": {
                    "reminder_id": {
                        "type": "string",
                        "description": "The ID of the reminder to delete",
                    },
                },
                "required": ["reminder_id"],
            },
        },
    },
]


# ── Tool dispatcher ───────────────────────────────────────────────────────────
# Maps tool name → function. The agent calls these via this dict.

REMINDER_FUNCTIONS = {
    "create_reminder":   create_reminder,
    "list_reminders":    list_reminders,
    "complete_reminder": complete_reminder,
    "delete_reminder":   delete_reminder,
}