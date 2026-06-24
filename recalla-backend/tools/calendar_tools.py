# ============================================================
# FILE PATH:  recalla-backend/tools/calendar_tools.py
# PURPOSE:    Google Calendar tools the agent can call.
#             Create, list, find free slots, delete events.
# ============================================================

"""
Calendar tools — direct execution (not preview-confirm).
Calendar events are reversible (can be deleted), so we let the agent create them directly.
"""

from datetime import datetime, timedelta
from tools.google_client import get_calendar_service

# Pakistan timezone — change if user is elsewhere
DEFAULT_TZ = "Asia/Karachi"


# ── Tool functions ────────────────────────────────────────────────────────────

def create_calendar_event(title: str, datetime_iso: str, duration_minutes: int = 30,
                          attendees: list = None, description: str = "",
                          location: str = "") -> dict:
    """Create a new calendar event."""
    try:
        service = get_calendar_service()
        start = datetime.fromisoformat(datetime_iso.replace("Z", ""))
        end = start + timedelta(minutes=duration_minutes)

        event_body = {
            "summary":     title,
            "description": description,
            "location":    location,
            "start": {"dateTime": start.isoformat(), "timeZone": DEFAULT_TZ},
            "end":   {"dateTime": end.isoformat(),   "timeZone": DEFAULT_TZ},
        }

        if attendees:
            event_body["attendees"] = [{"email": e} for e in attendees if "@" in e]

        # Default reminders: popup 10 min before
        event_body["reminders"] = {
            "useDefault": False,
            "overrides": [{"method": "popup", "minutes": 10}],
        }

        created = service.events().insert(
            calendarId="primary",
            body=event_body,
            sendUpdates="all" if attendees else "none",
        ).execute()

        return {
            "success":   True,
            "event_id":  created["id"],
            "title":     created["summary"],
            "start":     created["start"]["dateTime"],
            "end":       created["end"]["dateTime"],
            "html_link": created["htmlLink"],
            "attendees": [a.get("email") for a in created.get("attendees", [])],
            "message":   f"Event '{title}' created for {start.strftime('%a %b %d at %I:%M %p')}",
        }
    except Exception as e:
        return {"success": False, "error": f"Failed to create event: {e}"}


def list_calendar_events(time_min: str = None, time_max: str = None,
                          max_results: int = 10) -> dict:
    """List upcoming calendar events."""
    try:
        service = get_calendar_service()

        # Default: from now to 7 days ahead
        if not time_min:
            time_min = datetime.utcnow().isoformat() + "Z"
        if not time_max:
            time_max = (datetime.utcnow() + timedelta(days=7)).isoformat() + "Z"

        # Normalize ISO format
        if not time_min.endswith("Z") and "+" not in time_min:
            time_min += "Z"
        if not time_max.endswith("Z") and "+" not in time_max:
            time_max += "Z"

        result = service.events().list(
            calendarId="primary",
            timeMin=time_min,
            timeMax=time_max,
            maxResults=max_results,
            singleEvents=True,
            orderBy="startTime",
        ).execute()

        events = []
        for e in result.get("items", []):
            start = e["start"].get("dateTime", e["start"].get("date"))
            end   = e["end"].get("dateTime", e["end"].get("date"))
            events.append({
                "id":        e["id"],
                "title":     e.get("summary", "(no title)"),
                "start":     start,
                "end":       end,
                "attendees": [a.get("email") for a in e.get("attendees", [])],
                "location":  e.get("location", ""),
                "html_link": e.get("htmlLink", ""),
            })

        return {"success": True, "count": len(events), "events": events}
    except Exception as e:
        return {"success": False, "error": f"Failed to list events: {e}"}


def find_free_slot(date: str, duration_minutes: int = 30,
                    working_hours_start: int = 9, working_hours_end: int = 18) -> dict:
    """Find the first free slot on a given date during working hours."""
    try:
        service = get_calendar_service()

        # Parse date — accept "YYYY-MM-DD" or ISO datetime
        target_date = datetime.fromisoformat(date.replace("Z", "").split("T")[0])
        day_start = target_date.replace(hour=working_hours_start, minute=0, second=0, microsecond=0)
        day_end   = target_date.replace(hour=working_hours_end,   minute=0, second=0, microsecond=0)

        # Get busy times on that day
        result = service.events().list(
            calendarId="primary",
            timeMin=day_start.isoformat() + "Z",
            timeMax=day_end.isoformat() + "Z",
            singleEvents=True,
            orderBy="startTime",
        ).execute()

        busy_slots = []
        for e in result.get("items", []):
            start_str = e["start"].get("dateTime")
            end_str   = e["end"].get("dateTime")
            if start_str and end_str:
                busy_slots.append((
                    datetime.fromisoformat(start_str.replace("Z", "").split("+")[0]),
                    datetime.fromisoformat(end_str.replace("Z", "").split("+")[0]),
                ))

        # Walk through the day, find first gap
        cursor = day_start
        duration = timedelta(minutes=duration_minutes)

        for busy_start, busy_end in busy_slots:
            # Naive comparison — strip tz for FYP simplicity
            busy_start = busy_start.replace(tzinfo=None)
            busy_end   = busy_end.replace(tzinfo=None)

            if cursor + duration <= busy_start:
                return {
                    "success":         True,
                    "free_start":      cursor.isoformat(),
                    "free_end":        (cursor + duration).isoformat(),
                    "duration_minutes": duration_minutes,
                    "message":         f"Free slot: {cursor.strftime('%I:%M %p')} - {(cursor + duration).strftime('%I:%M %p')}",
                }
            cursor = max(cursor, busy_end)

        # Check end of day
        if cursor + duration <= day_end:
            return {
                "success":         True,
                "free_start":      cursor.isoformat(),
                "free_end":        (cursor + duration).isoformat(),
                "duration_minutes": duration_minutes,
                "message":         f"Free slot: {cursor.strftime('%I:%M %p')} - {(cursor + duration).strftime('%I:%M %p')}",
            }

        return {"success": False, "message": f"No free {duration_minutes}-minute slot found on {target_date.strftime('%A %B %d')} during working hours"}
    except Exception as e:
        return {"success": False, "error": f"Failed to find free slot: {e}"}


def delete_calendar_event(event_id: str) -> dict:
    """Delete a calendar event by ID."""
    try:
        service = get_calendar_service()
        service.events().delete(calendarId="primary", eventId=event_id, sendUpdates="all").execute()
        return {"success": True, "message": "Event deleted"}
    except Exception as e:
        return {"success": False, "error": f"Failed to delete: {e}"}


# ── Tool schemas — what the agent sees ──────────────────────────────────────

CALENDAR_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "create_calendar_event",
            "description": "Create a new event in the user's Google Calendar. Use when the user asks to schedule a meeting, book time, or add an event. Optionally invite attendees by email.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "Short title of the event (e.g. 'Sync with Muzammal')",
                    },
                    "datetime_iso": {
                        "type": "string",
                        "description": "Start time in ISO 8601 format (e.g. '2026-06-25T15:00:00'). Convert natural language to ISO using today's date as reference.",
                    },
                    "duration_minutes": {
                        "type": "integer",
                        "description": "How long the event lasts. Default 30 minutes.",
                    },
                    "attendees": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of attendee email addresses to invite (e.g. ['muzammal@riphah.edu.pk']). Optional.",
                    },
                    "description": {
                        "type": "string",
                        "description": "Optional details about the event",
                    },
                    "location": {
                        "type": "string",
                        "description": "Optional location (could be physical or virtual link)",
                    },
                },
                "required": ["title", "datetime_iso"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_calendar_events",
            "description": "Get upcoming events from the user's calendar. Use when user asks 'what's on my calendar', 'do I have anything tomorrow', etc. Defaults to next 7 days if no range given.",
            "parameters": {
                "type": "object",
                "properties": {
                    "time_min": {
                        "type": "string",
                        "description": "Start of range in ISO format. Defaults to now.",
                    },
                    "time_max": {
                        "type": "string",
                        "description": "End of range in ISO format. Defaults to 7 days from now.",
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "Max events to return. Default 10.",
                    },
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "find_free_slot",
            "description": "Find an available time slot on a given date. Use when the user wants to schedule something but isn't sure when they're free.",
            "parameters": {
                "type": "object",
                "properties": {
                    "date": {
                        "type": "string",
                        "description": "The date to check, in YYYY-MM-DD format (e.g. '2026-06-25')",
                    },
                    "duration_minutes": {
                        "type": "integer",
                        "description": "How long the meeting needs to be. Default 30.",
                    },
                    "working_hours_start": {
                        "type": "integer",
                        "description": "Earliest acceptable hour (24-hour). Default 9 (9am).",
                    },
                    "working_hours_end": {
                        "type": "integer",
                        "description": "Latest acceptable hour (24-hour). Default 18 (6pm).",
                    },
                },
                "required": ["date"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_calendar_event",
            "description": "Delete a calendar event. Use when user wants to cancel a meeting or remove an event. Requires the event ID (get it from list_calendar_events first).",
            "parameters": {
                "type": "object",
                "properties": {
                    "event_id": {
                        "type": "string",
                        "description": "The Google Calendar event ID",
                    },
                },
                "required": ["event_id"],
            },
        },
    },
]

CALENDAR_FUNCTIONS = {
    "create_calendar_event": create_calendar_event,
    "list_calendar_events":  list_calendar_events,
    "find_free_slot":        find_free_slot,
    "delete_calendar_event": delete_calendar_event,
}