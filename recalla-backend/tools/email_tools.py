# ============================================================
# FILE PATH:  recalla-backend/tools/email_tools.py
# PURPOSE:    Gmail tools — draft (preview), send (after confirm),
#             read recent, search. Drafts persist in JSON.
# ============================================================

"""
Email tools with safety-first preview pattern:
- The agent can DRAFT but cannot SEND.
- Drafts are stored locally with status "pending".
- The user clicks 'Send' in the UI → frontend calls /api/agent/send-draft/{id}
- Only that endpoint actually calls Gmail's send API.
"""

import os
import json
import uuid
import base64
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from tools.google_client import get_gmail_service


DRAFTS_FILE = os.path.join("data", "email_drafts.json")
os.makedirs("data", exist_ok=True)


def _load_drafts() -> dict:
    if not os.path.exists(DRAFTS_FILE):
        return {}
    try:
        with open(DRAFTS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def _save_drafts(drafts: dict):
    with open(DRAFTS_FILE, "w", encoding="utf-8") as f:
        json.dump(drafts, f, indent=2, ensure_ascii=False)


# ── Tool functions ────────────────────────────────────────────────────────────

def draft_email(to: str, subject: str, body: str, cc: str = "") -> dict:
    """
    Create an email draft. THIS DOES NOT SEND.
    The frontend must call send_email_draft(draft_id) after user confirms.
    """
    if "@" not in to:
        return {"success": False, "error": "Invalid recipient email address"}

    draft_id = str(uuid.uuid4())[:12]
    drafts = _load_drafts()

    draft = {
        "id":         draft_id,
        "to":         to.strip(),
        "cc":         cc.strip() if cc else "",
        "subject":    subject.strip(),
        "body":       body.strip(),
        "status":     "pending",
        "created_at": datetime.now().isoformat(),
    }
    drafts[draft_id] = draft
    _save_drafts(drafts)

    return {
        "success":               True,
        "draft_id":              draft_id,
        "preview":               draft,
        "requires_confirmation": True,
        "message":               f"Email drafted to {to}. Waiting for user confirmation before sending.",
    }


def send_email_draft(draft_id: str) -> dict:
    """
    Actually send a previously drafted email. Called by the frontend
    AFTER the user clicks 'Send' on the preview card.
    """
    drafts = _load_drafts()
    draft = drafts.get(draft_id)

    if not draft:
        return {"success": False, "error": "Draft not found"}
    if draft["status"] == "sent":
        return {"success": False, "error": "Draft already sent"}
    if draft["status"] == "cancelled":
        return {"success": False, "error": "Draft was cancelled"}

    try:
        service = get_gmail_service()

        # Build MIME message
        msg = MIMEText(draft["body"], "plain", "utf-8")
        msg["to"]      = draft["to"]
        msg["subject"] = draft["subject"]
        if draft.get("cc"):
            msg["cc"] = draft["cc"]

        raw = base64.urlsafe_b64encode(msg.as_bytes()).decode("utf-8")

        result = service.users().messages().send(
            userId="me",
            body={"raw": raw},
        ).execute()

        # Mark as sent
        draft["status"]    = "sent"
        draft["sent_at"]   = datetime.now().isoformat()
        draft["gmail_id"]  = result["id"]
        drafts[draft_id]   = draft
        _save_drafts(drafts)

        return {
            "success":  True,
            "gmail_id": result["id"],
            "to":       draft["to"],
            "subject":  draft["subject"],
            "message":  "Email sent successfully",
        }
    except Exception as e:
        return {"success": False, "error": f"Failed to send: {e}"}


def cancel_email_draft(draft_id: str) -> dict:
    """Mark a draft as cancelled (won't be sent)."""
    drafts = _load_drafts()
    draft = drafts.get(draft_id)

    if not draft:
        return {"success": False, "error": "Draft not found"}

    draft["status"]       = "cancelled"
    draft["cancelled_at"] = datetime.now().isoformat()
    _save_drafts(drafts)
    return {"success": True, "message": "Draft cancelled"}


def read_recent_emails(limit: int = 10, query: str = "") -> dict:
    """Read recent emails. Optionally filter by Gmail search query."""
    try:
        service = get_gmail_service()
        q = query if query else "in:inbox"

        result = service.users().messages().list(
            userId="me",
            q=q,
            maxResults=min(limit, 20),
        ).execute()

        message_ids = result.get("messages", [])
        emails = []

        for m in message_ids:
            msg = service.users().messages().get(
                userId="me",
                id=m["id"],
                format="metadata",
                metadataHeaders=["From", "Subject", "Date", "To"],
            ).execute()

            headers = {h["name"]: h["value"] for h in msg["payload"].get("headers", [])}

            emails.append({
                "id":      msg["id"],
                "from":    headers.get("From", ""),
                "to":      headers.get("To", ""),
                "subject": headers.get("Subject", "(no subject)"),
                "date":    headers.get("Date", ""),
                "snippet": msg.get("snippet", "")[:200],
                "unread":  "UNREAD" in msg.get("labelIds", []),
            })

        return {"success": True, "count": len(emails), "emails": emails}
    except Exception as e:
        return {"success": False, "error": f"Failed to read emails: {e}"}


def search_emails(query: str, limit: int = 5) -> dict:
    """Search emails using Gmail query syntax (e.g. 'from:adnan', 'subject:fyp')."""
    return read_recent_emails(limit=limit, query=query)


# ── Tool schemas ──────────────────────────────────────────────────────────────

EMAIL_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "draft_email",
            "description": "DRAFT (not send) an email. The user will review and click Send. Use whenever the user asks to email someone, write to them, or send a message. NEVER skip this for direct sending — always draft first for user safety.",
            "parameters": {
                "type": "object",
                "properties": {
                    "to": {
                        "type": "string",
                        "description": "Recipient email address",
                    },
                    "subject": {
                        "type": "string",
                        "description": "Clear, specific subject line",
                    },
                    "body": {
                        "type": "string",
                        "description": "Full email body. Write naturally and professionally. Sign off as 'Ammad' unless user specifies otherwise.",
                    },
                    "cc": {
                        "type": "string",
                        "description": "Optional CC email(s), comma-separated",
                    },
                },
                "required": ["to", "subject", "body"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "read_recent_emails",
            "description": "Read recent emails from inbox. Use when user asks about their inbox, recent messages, or 'did anyone email me'.",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Max emails to read. Default 10.",
                    },
                    "query": {
                        "type": "string",
                        "description": "Optional Gmail search query (e.g. 'is:unread', 'from:adnan@riphah.edu.pk')",
                    },
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_emails",
            "description": "Search emails by sender, subject, or content. Uses Gmail search syntax.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Gmail search query (e.g. 'from:adnan subject:fyp', 'whisper deployment')",
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Max results. Default 5.",
                    },
                },
                "required": ["query"],
            },
        },
    },
]

EMAIL_FUNCTIONS = {
    "draft_email":        draft_email,
    "read_recent_emails": read_recent_emails,
    "search_emails":      search_emails,
}