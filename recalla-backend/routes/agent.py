# ============================================================
# FILE PATH:  recalla-backend/routes/agent.py
# PURPOSE:    HTTP API endpoints — chat, summarize, reminders,
#             email draft confirmation, status.
# ============================================================

"""
Agent API endpoints.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List

from models.agent import run_agent
from models.summarization import summarize_meeting, generate_key_points
from models.groq_client import is_groq_available
from tools.google_client import is_google_configured
from tools.reminder_tools import (
    list_reminders as list_reminders_fn,
    complete_reminder,
    delete_reminder,
    create_reminder,
)
from tools.email_tools import send_email_draft, cancel_email_draft

router = APIRouter()


# ── Request models ───────────────────────────────────────────────────────────
class AgentChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = None


class SummarizeRequest(BaseModel):
    transcript: str
    include_key_points: bool = False


class CreateReminderRequest(BaseModel):
    title: str
    datetime_iso: str
    priority: str = "medium"
    category: str = "general"
    notes: str = ""


# ── Health check ─────────────────────────────────────────────────────────────
@router.get("/status")
def agent_status():
    """Check what's configured."""
    return {
        "groq_configured":   is_groq_available(),
        "google_configured": is_google_configured(),
        "available_tools": [
            "reminders",
            *(["calendar", "email"] if is_google_configured() else []),
        ],
    }


# ── Main chat endpoint ───────────────────────────────────────────────────────
@router.post("/chat")
def agent_chat(req: AgentChatRequest):
    """Send a message to the agent. Returns response + actions + history."""
    if not is_groq_available():
        raise HTTPException(status_code=503, detail="Groq API not configured.")

    try:
        result = run_agent(user_message=req.message, conversation_history=req.history or [])
        return JSONResponse(result)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Agent error: {e}")


# ── Summarization ────────────────────────────────────────────────────────────
@router.post("/summarize")
def summarize(req: SummarizeRequest):
    if not is_groq_available():
        raise HTTPException(status_code=503, detail="Groq not configured")
    try:
        result = summarize_meeting(req.transcript)
        if req.include_key_points:
            result["key_points"] = generate_key_points(req.transcript)
        return JSONResponse({"success": True, **result})
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Summarization failed: {e}")


# ── Reminder CRUD ───────────────────────────────────────────────────────────
@router.get("/reminders")
def get_reminders(status: str = "pending", limit: int = 50):
    return list_reminders_fn(filter_status=status, limit=limit)


@router.post("/reminders")
def add_reminder(req: CreateReminderRequest):
    return create_reminder(
        title=req.title, datetime_iso=req.datetime_iso, priority=req.priority,
        category=req.category, notes=req.notes,
    )


@router.patch("/reminders/{reminder_id}/complete")
def mark_reminder_complete(reminder_id: str):
    return complete_reminder(reminder_id)


@router.delete("/reminders/{reminder_id}")
def remove_reminder(reminder_id: str):
    return delete_reminder(reminder_id)


# ── Email draft confirmation ─────────────────────────────────────────────────
@router.post("/send-draft/{draft_id}")
def send_draft(draft_id: str):
    """User clicked Send on a drafted email — actually deliver it via Gmail."""
    result = send_email_draft(draft_id)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Send failed"))
    return result


@router.delete("/draft/{draft_id}")
def cancel_draft(draft_id: str):
    """User clicked Cancel on a drafted email."""
    return cancel_email_draft(draft_id)