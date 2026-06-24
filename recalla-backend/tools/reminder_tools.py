"""
Local reminder management — stored in a simple JSON file.
No external API needed. Used by the agent as a tool.
"""

import json
import os
import uuid
from datetime import datetime
from typing import Optional


REMINDERS_FILE = os.path.join("data", "reminders.json")
os.makedirs("data", exist_ok=True)


def _load_reminders() -> list:
    """Load reminders from disk."""
    if not os.path.exists(REMINDERS_FILE):
        return []
    try:
        with open(REMINDERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def _save_reminders(reminders: list):
    """Save reminders to disk."""
    with open(REMINDERS_FILE, "w", encoding="utf-8") as f:
        json.dump(reminders, f, indent=2, ensure_ascii=False)


# ── Tool functions ────────────────────────────────────────────────────────────
# These are the functions the agent can call.

def create_reminder(title: str, datetime_iso: str, priority: str = "medium",
                    category: str = "general", notes: str = "") -> dict:
    """
    Create a new reminder.

    Args:
        title: What the reminder is about
        datetime_iso: When to remind (ISO format, e.g. "2026-06-23T15:00:00")
        priority: low | medium | high
        category: general | meeting | task | personal
        notes: Optional extra notes

    Returns:
        Dict with success status and the created reminder
    """
    reminders = _load_reminders()

    reminder = {
        "id":         str(uuid.uuid4())[:8],
        "title":      title,
        "datetime":   datetime_iso,
        "priority":   priority if priority in ("low", "medium", "high") else "medium",
        "category":   category,
        "notes":      notes,
        "completed":  False,
        "created_at": datetime.now().isoformat(),
    }

    reminders.append(reminder)
    _save_reminders(reminders)

    return {
        "success":  True,
        "reminder": reminder,
        "message":  f"Reminder created: '{title}' at {datetime_iso}",
    }


def list_reminders(filter_status: str = "pending", limit: int = 20) -> dict:
    """
    List reminders.

    Args:
        filter_status: pending | completed | all
        limit: Max number to return

    Returns:
        Dict with reminders list
    """
    reminders = _load_reminders()

    if filter_status == "pending":
        reminders = [r for r in reminders if not r.get("completed", False)]
    elif filter_status == "completed":
        reminders = [r for r in reminders if r.get("completed", False)]

    # Sort by datetime ascending
    reminders.sort(key=lambda r: r.get("datetime", ""))

    return {
        "success":   True,
        "count":     len(reminders),
        "reminders": reminders[:limit],
    }


def complete_reminder(reminder_id: str) -> dict:
    """Mark a reminder as completed."""
    reminders = _load_reminders()

    for r in reminders:
        if r["id"] == reminder_id:
            r["completed"] = True
            r["completed_at"] = datetime.now().isoformat()
            _save_reminders(reminders)
            return {"success": True, "message": f"Reminder marked as completed: {r['title']}"}

    return {"success": False, "message": f"Reminder {reminder_id} not found"}


def delete_reminder(reminder_id: str) -> dict:
    """Delete a reminder."""
    reminders = _load_reminders()
    original_count = len(reminders)
    reminders = [r for r in reminders if r["id"] != reminder_id]

    if len(reminders) < original_count:
        _save_reminders(reminders)
        return {"success": True, "message": "Reminder deleted"}
    return {"success": False, "message": f"Reminder {reminder_id} not found"}


# ── Tool schemas — these tell the agent what tools are available ──────────────

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