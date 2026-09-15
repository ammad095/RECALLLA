# ============================================================
# FILE PATH:  recalla-backend/tools/google_client.py
# PURPOSE:    Build Calendar and Gmail clients for the *signed-in user*.
# ============================================================

"""
Per-user Google access.

The developer registers one OAuth client (GOOGLE_CLIENT_ID / SECRET in .env).
Each end user then presses "Connect" once, and their own tokens are stored in
the user_connections table against their account. Nobody types a client ID, and
no two users ever share a mailbox.

An older single-account mode is still honoured: if GOOGLE_REFRESH_TOKEN is
present in .env and the current user has not connected their own account, that
token is used. That keeps a solo developer setup working, but it is a fallback,
never the default.
"""

import os
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv

from auth.context import get_current_user_id

load_dotenv()

SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/gmail.modify",
]

# Cache per user so we don't rebuild a client on every tool call.
_services: dict[tuple[str, str], object] = {}


class GoogleNotConnected(Exception):
    """Raised when the acting user has no usable Google connection."""


def _client_pair():
    cid, secret = os.getenv("GOOGLE_CLIENT_ID"), os.getenv("GOOGLE_CLIENT_SECRET")
    if not (cid and secret):
        raise GoogleNotConnected(
            "Google is not set up on this server yet. The app owner needs to add "
            "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET once — after that, users "
            "connect with a single click from the Connectors page."
        )
    return cid, secret


def _stored_connection(user_id: str):
    """Fetch this user's google row, or None."""
    from sqlalchemy import select
    from db.session import SessionLocal
    from db.models import UserConnection

    db = SessionLocal()
    try:
        return db.scalar(
            select(UserConnection).where(
                UserConnection.user_id == user_id,
                UserConnection.provider == "google",
            )
        )
    finally:
        db.close()


def _persist_refreshed(user_id: str, access_token: str, expiry):
    """Write a rotated access token back so the next call reuses it."""
    from sqlalchemy import select
    from db.session import SessionLocal
    from db.models import UserConnection

    db = SessionLocal()
    try:
        conn = db.scalar(
            select(UserConnection).where(
                UserConnection.user_id == user_id,
                UserConnection.provider == "google",
            )
        )
        if conn:
            conn.access_token = access_token
            conn.expires_at = expiry
            conn.last_used_at = datetime.now(timezone.utc)
            db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


def _credentials():
    """Build Credentials for whoever the agent is currently acting as."""
    try:
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request
    except ImportError:
        raise GoogleNotConnected(
            "Google libraries are missing. Run:\n"
            "  pip install google-auth google-auth-oauthlib google-api-python-client"
        )

    client_id, client_secret = _client_pair()
    user_id = get_current_user_id()

    refresh_token = None
    access_token = None

    if user_id:
        conn = _stored_connection(user_id)
        if conn and conn.refresh_token:
            # A grant that skipped the permission tick-boxes still yields a
            # valid token — it just 403s on the first real call, with a message
            # about scopes that no end user can act on. Fail here instead.
            from routes.connectors import missing_scopes

            lacking = missing_scopes(conn.scopes)
            if lacking:
                raise GoogleNotConnected(
                    f"{' and '.join(lacking)} access was not granted when you "
                    "connected Google. Open Connectors, press Reconnect, and "
                    "tick every permission box on the Google screen."
                )
            refresh_token = conn.refresh_token
            access_token = conn.access_token

    # Fallback: single-account .env mode, for a developer running solo.
    if not refresh_token:
        refresh_token = os.getenv("GOOGLE_REFRESH_TOKEN")

    if not refresh_token:
        raise GoogleNotConnected(
            "Your Google account is not connected yet. Open Connectors and press "
            "Connect on Google — it takes one click."
        )

    creds = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=client_id,
        client_secret=client_secret,
        scopes=SCOPES,
    )

    # Access tokens last about an hour; refresh and store the new one.
    if not creds.valid:
        creds.refresh(Request())
        if user_id:
            _persist_refreshed(
                user_id, creds.token,
                creds.expiry.replace(tzinfo=timezone.utc) if creds.expiry
                else datetime.now(timezone.utc) + timedelta(hours=1),
            )

    return creds


def _service(kind: str, version: str):
    user_id = get_current_user_id() or "_env"
    key = (user_id, kind)
    if key not in _services:
        from googleapiclient.discovery import build
        _services[key] = build(kind, version, credentials=_credentials(), cache_discovery=False)
        print(f"[Recalla] Google {kind} client ready for {user_id}")
    return _services[key]


def get_calendar_service():
    return _service("calendar", "v3")


def get_gmail_service():
    return _service("gmail", "v1")


def invalidate_user(user_id: str):
    """Drop cached clients after a disconnect or reconnect."""
    for key in [k for k in _services if k[0] == user_id]:
        _services.pop(key, None)


def is_google_configured() -> bool:
    """True when the acting user can actually reach Google."""
    if not (os.getenv("GOOGLE_CLIENT_ID") and os.getenv("GOOGLE_CLIENT_SECRET")):
        return False

    user_id = get_current_user_id()
    if user_id:
        conn = _stored_connection(user_id)
        if conn and conn.refresh_token:
            from routes.connectors import missing_scopes

            return not missing_scopes(conn.scopes)

    return bool(os.getenv("GOOGLE_REFRESH_TOKEN"))
