#!/usr/bin/env python3
"""
Check that every connected Google account still works.

The OAuth app is still in Testing, and Google revokes Testing refresh tokens
after seven days. Nothing fails at that moment — the first sign is a broken
answer in the middle of a demo. This makes a real request on each account, so
the breakage is found on a schedule instead.

Building a client never fails; only an actual request does. So each account
gets one Gmail call and one Calendar call.

For every google row in user_connections:
  * a failure is written to auth_error, which the Connectors card shows;
  * a success clears it;
  * a failure also messages the user's linked WhatsApp number, at most once
    per day, so a daily check does not turn into daily nagging.

    ./venv/bin/python scripts/check_google_health.py
    ./venv/bin/python scripts/check_google_health.py --no-whatsapp

Exits 0 when every account is healthy, 1 otherwise. The scheduler in
models/scheduler.py runs the same check daily.
"""

import argparse
import contextlib
import io
import json
import os
import sys
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from dotenv import load_dotenv

load_dotenv(os.path.join(ROOT, ".env"))

# Last WhatsApp warning per user, keyed by user id. A file is enough: one
# timestamp per user, written once a day at most.
STATE_FILE = os.path.join(ROOT, "data", "google_health_state.json")

EXPIRED = (
    "Google has expired this connection. Open Connectors and press Reconnect "
    "on Google. (Apps still in Testing have their access revoked after seven "
    "days — publishing the app in Google Cloud stops this recurring.)"
)


def _reason(e: Exception) -> str:
    """A message a user can act on. Google's errors never carry the token."""
    from tools.google_client import GoogleNotConnected

    if isinstance(e, GoogleNotConnected):
        return str(e)
    msg = str(e)
    if "invalid_grant" in msg:
        return EXPIRED
    if "has not been used in project" in msg or "is disabled" in msg:
        return f"The Google API is disabled for this project: {msg[:160]}"
    return f"Google refused the request: {type(e).__name__}: {msg[:160]}"


def _check_one(user_id: str) -> dict:
    """Make one real call per service. Returns {"Gmail": err|None, "Calendar": err|None}."""
    from auth.context import acting_as
    from tools.google_client import get_calendar_service, get_gmail_service, invalidate_user

    # Cached clients hold the credentials they were built with. Rebuild from
    # the database so a reconnect since the last check is what gets tested.
    invalidate_user(user_id)

    out = {}
    with acting_as(user_id):
        for name, call in (
            ("Gmail", lambda: get_gmail_service().users().getProfile(userId="me").execute()),
            ("Calendar", lambda: get_calendar_service().calendarList().list(maxResults=1).execute()),
        ):
            try:
                call()
                out[name] = None
            except Exception as e:
                out[name] = _reason(e)
    return out


def _load_state() -> dict:
    try:
        with open(STATE_FILE) as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def _save_state(state: dict):
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    tmp = STATE_FILE + ".tmp"
    with open(tmp, "w") as f:
        json.dump(state, f, indent=2)
    os.replace(tmp, STATE_FILE)


def _warn_on_whatsapp(db, user_id: str, failed: list[str], state: dict, now: datetime) -> bool:
    """Message the user's linked number, unless they were already told today."""
    from sqlalchemy import select
    from db.models import UserConnection

    # One per calendar day (UTC), not one per 24 hours: a daily job that
    # starts a few seconds earlier than yesterday's would otherwise skip a day.
    last = state.get(user_id)
    if last and last[:10] == now.date().isoformat():
        return False

    wa = db.scalar(select(UserConnection).where(
        UserConnection.user_id == user_id, UserConnection.provider == "whatsapp"
    ))
    if not wa or not wa.account_name:
        return False

    try:
        from routes.whatsapp import send_text

        res = send_text(wa.account_name, (
            f"Recalla: your Google connection has stopped working "
            f"({' and '.join(failed)} affected). Open Recalla → Connectors and "
            f"press Reconnect on Google to restore it."
        ))
    except Exception as e:
        print(f"[google-health] WhatsApp warning failed: {e}")
        return False

    if not res.get("success"):
        return False
    state[user_id] = now.isoformat()
    _save_state(state)
    return True


def run(notify: bool = True) -> tuple[bool, str]:
    """Check every Google connection. Returns (healthy, one-line summary)."""
    from sqlalchemy import select
    from db.models import User, UserConnection
    from db.session import SessionLocal
    from tools.google_client import _mark_auth_error

    now = datetime.now(timezone.utc)
    db = SessionLocal()
    try:
        rows = db.execute(
            select(UserConnection.user_id, User.email)
            .join(User, User.id == UserConnection.user_id)
            .where(UserConnection.provider == "google")
        ).all()
        if not rows:
            return True, "Google health: no Google connections to check"

        state = _load_state() if notify else {}
        ok, bad, warned = [], [], 0
        for user_id, email in rows:
            result = _check_one(user_id)
            errors = {k: v for k, v in result.items() if v}
            if not errors:
                _mark_auth_error(user_id, None)
                ok.append(email)
                continue

            # Both services usually fail for the same reason; say it once.
            reasons = list(dict.fromkeys(errors.values()))
            _mark_auth_error(user_id, " ".join(reasons)[:1000])
            bad.append(f"{email} [{', '.join(errors)}]: {reasons[0][:120]}")
            if notify and _warn_on_whatsapp(db, user_id, list(errors), state, now):
                warned += 1
    finally:
        db.close()

    if not bad:
        return True, f"Google health: OK — {len(ok)}/{len(rows)} healthy ({', '.join(ok)})"
    return False, (
        f"Google health: FAIL — {len(ok)}/{len(rows)} healthy; "
        + "; ".join(bad)
        + (f"; WhatsApp warning sent to {warned}" if warned else "")
    )


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--no-whatsapp", action="store_true",
                    help="Record results but do not message anyone.")
    args = ap.parse_args()

    # The client builder announces itself on stdout; keep the output to the
    # one summary line. Errors still reach stderr.
    with contextlib.redirect_stdout(io.StringIO()):
        healthy, summary = run(notify=not args.no_whatsapp)
    print(summary)
    return 0 if healthy else 1


if __name__ == "__main__":
    sys.exit(main())
