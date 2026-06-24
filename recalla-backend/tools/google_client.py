# ============================================================
# FILE PATH:  recalla-backend/tools/google_client.py
# PURPOSE:    Builds authenticated Google API clients using
#             refresh_token from .env. Used by calendar_tools
#             and email_tools.
# ============================================================

"""
Builds Calendar and Gmail service clients from .env credentials.
No browser interaction needed — uses the refresh_token saved during setup.
"""

import os
from dotenv import load_dotenv

load_dotenv()

SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/gmail.modify",
]

# Cached service instances
_calendar_service = None
_gmail_service    = None


def _get_credentials():
    """Build Google Credentials from environment refresh token."""
    try:
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request
    except ImportError:
        raise ImportError(
            "Google libraries not installed. Run:\n"
            "  pip install google-auth google-auth-oauthlib google-api-python-client"
        )

    client_id     = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    refresh_token = os.getenv("GOOGLE_REFRESH_TOKEN")

    if not all([client_id, client_secret, refresh_token]):
        raise ValueError(
            "Google OAuth not configured. Run setup_google_oauth.py first."
        )

    creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=client_id,
        client_secret=client_secret,
        scopes=SCOPES,
    )
    creds.refresh(Request())
    return creds


def get_calendar_service():
    """Get Calendar API client (cached after first call)."""
    global _calendar_service
    if _calendar_service is None:
        from googleapiclient.discovery import build
        _calendar_service = build("calendar", "v3", credentials=_get_credentials(), cache_discovery=False)
        print("[Recalla] Calendar service initialized")
    return _calendar_service


def get_gmail_service():
    """Get Gmail API client (cached after first call)."""
    global _gmail_service
    if _gmail_service is None:
        from googleapiclient.discovery import build
        _gmail_service = build("gmail", "v1", credentials=_get_credentials(), cache_discovery=False)
        print("[Recalla] Gmail service initialized")
    return _gmail_service


def is_google_configured():
    """Check if Google credentials are available without raising errors."""
    return all([
        os.getenv("GOOGLE_CLIENT_ID"),
        os.getenv("GOOGLE_CLIENT_SECRET"),
        os.getenv("GOOGLE_REFRESH_TOKEN"),
    ])