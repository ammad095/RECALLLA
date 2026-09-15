"""
Connectors — third-party and device integrations.

The registry below is deliberately honest about what each integration needs.
Several services people expect ("just connect WhatsApp") cannot be connected
by writing code alone: they are gated behind business verification, paid
plans, or simply have no public API. Rather than shipping dead buttons, each
entry carries its real status and the reason.

Two categories matter for a cross-platform app:

  scope = "cloud"   the backend talks to the service, so it behaves the same
                    whether Recalla is open on a laptop, phone or tablet.

  scope = "device"  the action happens on the machine running the backend.
                    Opening VS Code from your phone would open it on the
                    laptop, so these are surfaced only on that machine.
"""

import os
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from db.session import get_db
from db.models import User, UserConnection
from auth.deps import get_current_user

router = APIRouter()

GOOGLE_SCOPES = [
    "openid", "email", "profile",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/gmail.modify",
]

# The two that actually let Recalla do anything. Google's consent screen shows
# these as separate tick-boxes, unticked by default, so a user can press
# Continue and land back here "connected" with only their email address shared.
# Everything downstream then fails with a 403 that mentions scopes and nothing
# a user could act on, so check up front and say which permission is missing.
REQUIRED_SCOPES = {
    "https://www.googleapis.com/auth/gmail.modify": "Gmail",
    "https://www.googleapis.com/auth/calendar": "Calendar",
}


def missing_scopes(granted: Optional[str]) -> list[str]:
    """Names of the required permissions this grant does not include."""
    have = set((granted or "").split())
    return [label for scope, label in REQUIRED_SCOPES.items() if scope not in have]


# ── Registry ─────────────────────────────────────────────────────────────────

CONNECTORS = [
    {
        "id": "google",
        "name": "Google",
        "blurb": "Gmail and Calendar — read mail, draft replies, create events.",
        "scope": "cloud",
        "state": "available",
        "actions": ["Draft and send email", "Read recent mail", "Create calendar events", "Find free slots"],
    },
    {
        "id": "desktop",
        "name": "This Computer",
        "blurb": "Open apps, create folders and start projects on the machine running Recalla.",
        "scope": "device",
        "state": "available",
        "actions": ["Open VS Code", "Create a project", "Create folders", "Open files"],
    },
    {
        "id": "whatsapp",
        "name": "WhatsApp",
        "scope": "cloud",
        "state": "available",
        "blurb": "Message Recalla from WhatsApp — ask questions, set reminders, send mail.",
        "actions": ["Ask anything by message", "Set reminders", "Draft and send email",
                    "Check your calendar"],
    },
    {
        "id": "phone",
        "name": "Phone Calls",
        "scope": "cloud",
        "state": "needs_provider",
        "blurb": "Place calls on your behalf.",
        "reason": (
            "Browsers cannot dial. This needs a telephony provider such as Twilio, "
            "a purchased number and per-minute credit."
        ),
    },
    {
        "id": "slack",
        "name": "Slack",
        "scope": "cloud",
        "state": "planned",
        "blurb": "Post messages and read channels.",
        "reason": "Straightforward OAuth. Not built yet.",
    },
    {
        "id": "notion",
        "name": "Notion",
        "scope": "cloud",
        "state": "planned",
        "blurb": "Save meeting notes into a database.",
        "reason": "Straightforward OAuth. Not built yet.",
    },
    {
        "id": "linkedin",
        "name": "LinkedIn",
        "scope": "cloud",
        "state": "blocked",
        "blurb": "Post updates.",
        "reason": "Posting requires LinkedIn Marketing API access, granted only to approved partners.",
    },
    {
        "id": "x",
        "name": "X (Twitter)",
        "scope": "cloud",
        "state": "needs_provider",
        "blurb": "Post updates.",
        "reason": "The write API is on a paid tier; a subscription and app key are required.",
    },
    {
        "id": "instagram",
        "name": "Instagram",
        "scope": "cloud",
        "state": "blocked",
        "blurb": "Post content.",
        "reason": "Publishing needs a Business/Creator account linked to a Facebook Page plus Meta app review.",
    },
]

_BY_ID = {c["id"]: c for c in CONNECTORS}


def google_client_configured() -> bool:
    return bool(os.getenv("GOOGLE_CLIENT_ID") and os.getenv("GOOGLE_CLIENT_SECRET"))


def _connection(db: Session, user: User, provider: str) -> Optional[UserConnection]:
    return db.scalar(
        select(UserConnection).where(
            UserConnection.user_id == user.id, UserConnection.provider == provider
        )
    )


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("")
def list_connectors(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    linked = {
        c.provider: c
        for c in db.scalars(select(UserConnection).where(UserConnection.user_id == user.id)).all()
    }

    out = []
    for c in CONNECTORS:
        entry = dict(c)
        conn = linked.get(c["id"])

        entry["connected"] = bool(conn)
        entry["account"] = conn.account_email if conn else None
        entry["connected_at"] = conn.connected_at.isoformat() if conn and conn.connected_at else None

        # Connected but without the permissions that matter is worse than not
        # connected, because the card claims it works. Report it as partial.
        if c["id"] == "google" and conn:
            lacking = missing_scopes(conn.scopes)
            if lacking:
                entry["state"] = "partial"
                entry["missing"] = lacking
                entry["reason"] = (
                    f"Signed in as {conn.account_email or 'your account'}, but "
                    f"{' and '.join(lacking)} access was not granted. Press "
                    "Reconnect and tick every permission box on the Google screen."
                )

        # Google is the one connector that needs the developer to register an
        # OAuth client. Say so plainly instead of showing a button that 500s.
        if c["id"] == "google" and not google_client_configured():
            entry["state"] = "needs_setup"
            entry["reason"] = (
                "The app owner needs to create a Google Cloud OAuth client once. "
                "After that, signing in here is a single click."
            )

        if c["id"] == "whatsapp":
            from routes.whatsapp import is_configured as wa_configured

            if not wa_configured():
                entry["state"] = "needs_setup"
                entry["reason"] = (
                    "The app owner needs to create a Meta WhatsApp app once and add "
                    "the credentials. After that, linking your number is a short code "
                    "you send from your phone."
                )
            else:
                entry["connected"] = bool(conn)
                entry["account"] = f"+{conn.account_name}" if conn and conn.account_name else None

        # The desktop connector is bound to the machine running the backend.
        if c["id"] == "desktop":
            entry["connected"] = True
            entry["account"] = os.uname().nodename if hasattr(os, "uname") else "this computer"

        out.append(entry)

    return {"connectors": out, "count": len(out)}


@router.get("/google/authorize")
def google_authorize(user: User = Depends(get_current_user)):
    """Return the Google consent URL for this user to click."""
    if not google_client_configured():
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Google is not set up yet. The app owner must add GOOGLE_CLIENT_ID and "
            "GOOGLE_CLIENT_SECRET, then this becomes a one-click connect.",
        )

    from urllib.parse import urlencode

    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8001/api/connectors/google/callback")
    params = {
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": " ".join(GOOGLE_SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "state": user.id,          # ties the callback back to this account
        "include_granted_scopes": "true",
    }
    return {"url": "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)}


@router.get("/google/callback")
def google_callback(code: str = "", state: str = "", db: Session = Depends(get_db)):
    """Exchange the authorization code and store this user's tokens."""
    if not code or not state:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Missing authorization code")

    user = db.get(User, state)
    if not user:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unknown account in callback")

    import requests

    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8001/api/connectors/google/callback")
    resp = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        },
        timeout=30,
    )
    if not resp.ok:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Google rejected the code: {resp.text[:200]}")

    tok = resp.json()

    email = None
    try:
        info = requests.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {tok['access_token']}"},
            timeout=20,
        )
        if info.ok:
            email = info.json().get("email")
    except Exception:
        pass

    conn = _connection(db, user, "google") or UserConnection(user_id=user.id, provider="google")
    conn.access_token = tok.get("access_token")
    if tok.get("refresh_token"):
        conn.refresh_token = tok["refresh_token"]      # only sent on first consent
    conn.scopes = tok.get("scope")
    conn.account_email = email
    conn.connected_at = datetime.now(timezone.utc)
    db.add(conn)
    db.commit()

    from tools.google_client import invalidate_user
    invalidate_user(user.id)

    # Land the user back in the app rather than on a JSON blob. If they skipped
    # the permission tick-boxes, say so here — this is the moment they can still
    # remember what they clicked, unlike an API error an hour later.
    lacking = missing_scopes(conn.scopes)
    if lacking:
        head = "Almost there"
        body = (
            f"Recalla can see your account, but {' and '.join(lacking)} access "
            "was not granted, so it cannot send mail or add events yet.<br><br>"
            "Close this tab, press <b>Connect</b> again and tick every "
            "permission box on the Google screen."
        )
        tint = "#F0B429"
    else:
        head = "Google connected"
        body = "You can close this tab and return to Recalla."
        tint = "#A9B4C9"

    from fastapi.responses import HTMLResponse
    return HTMLResponse(
        "<html><body style='font-family:system-ui;background:#0B0E14;color:#F2F5FA;"
        "display:grid;place-items:center;height:100vh;margin:0'>"
        f"<div style='text-align:center;max-width:32rem;padding:2rem'><h2>{head}</h2>"
        f"<p style='color:{tint};line-height:1.6'>{body}</p>"
        "</div></body></html>"
    )


@router.delete("/{provider}")
def disconnect(provider: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if provider not in _BY_ID:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unknown connector")
    conn = _connection(db, user, provider)
    if conn:
        db.delete(conn)
        db.commit()

    if provider == "google":
        from tools.google_client import invalidate_user
        invalidate_user(user.id)

    return {"success": True}
