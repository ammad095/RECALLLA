#!/usr/bin/env python3
"""
Connect Google for Recalla, using the loopback flow.

The OAuth client registered for this project is a Desktop client, and Google
only ever accepts http://localhost redirects for those — an https:// URI is
rejected outright and the console offers no field to add one. That is why
pressing Connect on the deployed server fails with redirect_uri_mismatch no
matter what is entered there.

A refresh token does not care where it was obtained. Running the consent
flow here, on a machine that *can* serve localhost, produces a token that
works just as well from the server. So: authorise on this laptop, then write
the result straight into the server's database.

    ./venv/bin/python scripts/connect_google.py --email you@gmail.com

The only manual step is approving the consent screen, which Google requires
a human to do.
"""

import argparse
import json
import os
import sys
import urllib.parse as up
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from threading import Thread

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
from dotenv import load_dotenv

load_dotenv()

PORT = 8765
REDIRECT = f"http://localhost:{PORT}"
SCOPES = [
    "openid", "email", "profile",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/gmail.modify",
]

_code = {}


class Catcher(BaseHTTPRequestHandler):
    def do_GET(self):
        q = up.parse_qs(up.urlparse(self.path).query)
        _code["code"] = (q.get("code") or [None])[0]
        _code["error"] = (q.get("error") or [None])[0]
        ok = bool(_code["code"])
        self.send_response(200)
        self.send_header("Content-Type", "text/html")
        self.end_headers()
        self.wfile.write((
            "<html><body style='font-family:system-ui;background:#0B0E14;"
            "color:#F2F5FA;display:grid;place-items:center;height:100vh;margin:0'>"
            f"<div style='text-align:center'><h2>{'Google connected' if ok else 'Authorisation failed'}</h2>"
            f"<p style='color:#A9B4C9'>{'You can close this tab and return to the terminal.' if ok else _code['error']}</p>"
            "</div></body></html>").encode())

    def log_message(self, *a):
        pass


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--email", required=True, help="The Recalla account to attach this to.")
    ap.add_argument("--database-url", default=None,
                    help="Write to this database instead of the local one — "
                         "normally the server's, since that is where Recalla runs.")
    args = ap.parse_args()

    cid = (os.getenv("GOOGLE_CLIENT_ID") or "").strip()
    secret = (os.getenv("GOOGLE_CLIENT_SECRET") or "").strip()
    if not (cid and secret):
        print("GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set in .env")
        return 1

    server = HTTPServer(("localhost", PORT), Catcher)
    Thread(target=server.handle_request, daemon=True).start()

    url = "https://accounts.google.com/o/oauth2/v2/auth?" + up.urlencode({
        "client_id": cid,
        "redirect_uri": REDIRECT,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        # Without this Google returns no refresh token on a repeat consent,
        # and the whole point here is the refresh token.
        "prompt": "consent",
    })

    print("\nOpening Google in your browser.")
    print("Tick BOTH permission boxes (Gmail and Calendar), then Allow.\n")
    print(url + "\n")
    try:
        webbrowser.open(url)
    except Exception:
        pass

    print("Waiting for you to approve…")
    for _ in range(300):
        if _code:
            break
        import time
        time.sleep(1)

    if not _code.get("code"):
        print(f"No authorisation received. {_code.get('error') or ''}")
        return 1

    tok = requests.post("https://oauth2.googleapis.com/token", timeout=40, data={
        "code": _code["code"], "client_id": cid, "client_secret": secret,
        "redirect_uri": REDIRECT, "grant_type": "authorization_code",
    })
    if not tok.ok:
        print("Google rejected the code:", tok.text[:300])
        return 1

    data = tok.json()
    refresh = data.get("refresh_token")
    if not refresh:
        print("Google returned no refresh token. Revoke Recalla's access at "
              "myaccount.google.com/permissions and run this again.")
        return 1

    granted = data.get("scope", "")
    missing = [n for s, n in (
        ("gmail.modify", "Gmail"), ("auth/calendar", "Calendar")
    ) if s not in granted]
    if missing:
        print(f"\n  WARNING: {' and '.join(missing)} not granted — tick every box next time.")


    from sqlalchemy import create_engine, select
    from sqlalchemy.orm import sessionmaker
    from db.session import SessionLocal
    from db.models import User, UserConnection

    # The token is written straight into the database it is needed in. It is
    # never printed: a refresh token in a terminal scrollback or a log file
    # is a credential leak waiting to happen.
    if args.database_url:
        db = sessionmaker(bind=create_engine(args.database_url))()
    else:
        db = SessionLocal()
    try:
        user = db.scalar(select(User).where(User.email == args.email))
        if not user:
            print(f"No Recalla account for {args.email} in this database.")
            return 1

        conn = db.scalar(select(UserConnection).where(
            UserConnection.user_id == user.id, UserConnection.provider == "google"
        )) or UserConnection(user_id=user.id, provider="google")

        conn.refresh_token = refresh
        conn.access_token = data.get("access_token")
        conn.scopes = granted
        # The Google account chosen on the consent screen need not match the
        # Recalla login, so ask Google which mailbox this really is.
        try:
            info = requests.get("https://openidconnect.googleapis.com/v1/userinfo", timeout=20,
                                headers={"Authorization": f"Bearer {data.get('access_token')}"})
            conn.account_email = info.json().get("email") or args.email
        except Exception:
            conn.account_email = args.email
        conn.auth_error = None
        conn.expires_at = None
        db.add(conn)
        db.commit()
        print(f"\n  Stored for {args.email}.")
        print(f"  Scopes: {'Gmail' if 'gmail' in granted else '—'}, "
              f"{'Calendar' if 'calendar' in granted else '—'}")
    finally:
        db.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
