# ============================================================
# FILE PATH:  recalla-backend/routes/whatsapp.py
# PURPOSE:    Talk to Recalla from WhatsApp.
# ============================================================

"""
WhatsApp Cloud API bridge.

Meta POSTs every inbound message to this webhook; the agent answers and the
reply goes back through the Graph API. The interesting parts are not the agent
call — that already works — but the four things around it:

  * Signature. The callback URL is public, so anything that cannot prove it
    came from Meta is rejected. Without this check, whoever finds the tunnel
    URL can act as any linked user.

  * Speed. Meta retries a webhook it considers slow, and the agent takes
    seconds. The handler acknowledges immediately and answers in the
    background, otherwise every message is answered twice.

  * Identity. A phone number is a claim, not proof. Linking requires a code
    issued to a signed-in session, so both the phone and the account have to
    be in the same pair of hands.

  * Reach. Desktop tools would run on the machine hosting Recalla, which the
    sender cannot see. The channel context restricts WhatsApp to cloud tools.
"""

import hashlib
import hmac
import os
import re
import secrets
import time
from typing import Optional

import requests
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth.context import acting_as, on_channel
from auth.deps import get_current_user
from db.models import User, UserConnection, ChatSession, ChatMessage
from db.session import SessionLocal, get_db
from models.agent import run_agent

router = APIRouter()

GRAPH = "https://graph.facebook.com/v21.0"

# Meta redelivers messages; answering twice looks broken and can send an email
# twice. Ids seen recently are skipped. Bounded so it cannot grow forever.
_seen_ids: dict[str, float] = {}
_SEEN_TTL = 3600

# Linking codes live in memory: short-lived, single-use, and losing them on
# restart is harmless — the user just asks for another.
_link_codes: dict[str, tuple[str, float]] = {}   # code -> (user_id, expires_at)
_LINK_TTL = 600


def _env(name: str) -> str:
    return (os.getenv(name) or "").strip()


def is_configured() -> bool:
    return bool(_env("WHATSAPP_ACCESS_TOKEN") and _env("WHATSAPP_PHONE_NUMBER_ID"))


# ── Outbound ─────────────────────────────────────────────────────────────────

def send_text(to: str, body: str) -> dict:
    """Send a free-form message. Only valid inside the 24-hour window."""
    if not is_configured():
        return {"success": False, "error": "WhatsApp is not configured on this server."}

    # WhatsApp rejects oversized bodies; keep well under the limit.
    if len(body) > 3500:
        body = body[:3480] + "…"

    r = requests.post(
        f"{GRAPH}/{_env('WHATSAPP_PHONE_NUMBER_ID')}/messages",
        headers={"Authorization": f"Bearer {_env('WHATSAPP_ACCESS_TOKEN')}"},
        json={
            "messaging_product": "whatsapp",
            "to": to,
            "type": "text",
            "text": {"preview_url": False, "body": body},
        },
        timeout=30,
    )
    if not r.ok:
        print(f"[whatsapp] send failed {r.status_code}: {r.text[:300]}")
        return {"success": False, "error": r.text[:300]}
    return {"success": True, "id": r.json().get("messages", [{}])[0].get("id")}


def send_template(to: str, name: str, params: list[str], lang: str = "en") -> dict:
    """
    Send an approved template.

    This is the only thing Meta accepts outside the 24-hour service window, so
    it is what a reminder falls back to when the user has not messaged
    recently. The variables are positional and must match what was approved.
    """
    if not is_configured():
        return {"success": False, "error": "WhatsApp is not configured on this server."}

    r = requests.post(
        f"{GRAPH}/{_env('WHATSAPP_PHONE_NUMBER_ID')}/messages",
        headers={"Authorization": f"Bearer {_env('WHATSAPP_ACCESS_TOKEN')}"},
        json={
            "messaging_product": "whatsapp",
            "to": to,
            "type": "template",
            "template": {
                "name": name,
                "language": {"code": lang},
                "components": [{
                    "type": "body",
                    "parameters": [{"type": "text", "text": str(p)} for p in params],
                }],
            },
        },
        timeout=30,
    )
    if not r.ok:
        print(f"[whatsapp] template send failed {r.status_code}: {r.text[:250]}")
        return {"success": False, "error": r.text[:250]}
    return {"success": True, "id": r.json().get("messages", [{}])[0].get("id")}


# ── Identity ─────────────────────────────────────────────────────────────────

def _normalise(phone: str) -> str:
    """Digits only, no plus. Meta reports numbers this way."""
    return re.sub(r"\D", "", phone or "")


def _user_for_phone(db: Session, phone: str) -> Optional[User]:
    conn = db.scalar(
        select(UserConnection).where(
            UserConnection.provider == "whatsapp",
            UserConnection.account_name == _normalise(phone),
        )
    )
    return db.get(User, conn.user_id) if conn else None


@router.post("/link-code")
def create_link_code(user: User = Depends(get_current_user)):
    """
    Issue a short code for the signed-in user to text from their phone.

    Possession of the phone alone must not be enough to reach an account, so
    the code can only be minted from an authenticated session.
    """
    # Drop any earlier code for this user so only the newest one works.
    for c, (uid, _) in list(_link_codes.items()):
        if uid == user.id:
            _link_codes.pop(c, None)

    code = f"{secrets.randbelow(10**6):06d}"
    _link_codes[code] = (user.id, time.time() + _LINK_TTL)
    return {"code": code, "expires_in": _LINK_TTL,
            "instructions": f"Send  link {code}  to Recalla on WhatsApp."}


@router.get("/status")
def whatsapp_status(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conn = db.scalar(
        select(UserConnection).where(
            UserConnection.user_id == user.id, UserConnection.provider == "whatsapp"
        )
    )
    return {
        "server_configured": is_configured(),
        "linked": bool(conn),
        "phone": conn.account_name if conn else None,
    }


@router.delete("/link")
def unlink(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conn = db.scalar(
        select(UserConnection).where(
            UserConnection.user_id == user.id, UserConnection.provider == "whatsapp"
        )
    )
    if conn:
        db.delete(conn)
        db.commit()
    return {"success": True}


def _try_link(db: Session, phone: str, text: str) -> Optional[str]:
    """Handle 'link 123456'. Returns a reply, or None if not a link attempt."""
    m = re.match(r"^\s*link\s+(\d{6})\s*$", text or "", re.I)
    if not m:
        return None

    code = m.group(1)
    entry = _link_codes.get(code)
    if not entry or entry[1] < time.time():
        _link_codes.pop(code, None)
        return "That code is wrong or has expired. Open Recalla → Connectors and generate a new one."

    user_id, _ = entry
    user = db.get(User, user_id)
    if not user:
        return "That code belongs to an account that no longer exists."

    digits = _normalise(phone)

    # A number already linked elsewhere must be released first, or the unique
    # index would raise and the sender would see a generic failure.
    taken = db.scalar(
        select(UserConnection).where(
            UserConnection.provider == "whatsapp",
            UserConnection.account_name == digits,
            UserConnection.user_id != user_id,
        )
    )
    if taken:
        return "This number is already linked to another Recalla account. Unlink it there first."

    conn = db.scalar(
        select(UserConnection).where(
            UserConnection.user_id == user_id, UserConnection.provider == "whatsapp"
        )
    ) or UserConnection(user_id=user_id, provider="whatsapp")
    conn.account_name = digits
    db.add(conn)
    db.commit()

    _link_codes.pop(code, None)
    return (f"Linked to {user.email}. Ask me anything — "
            "\"what's on my calendar tomorrow\", or \"remind me to send the report Friday 3pm\".")


# ── Conversation memory ──────────────────────────────────────────────────────

def _session_for(db: Session, user: User) -> ChatSession:
    """
    One rolling session per user for WhatsApp, so the thread survives between
    messages and shows up in the Ask Recalla history panel beside web chats.
    """
    s = db.scalar(
        select(ChatSession)
        .where(ChatSession.user_id == user.id, ChatSession.title == "WhatsApp")
        .order_by(ChatSession.updated_at.desc())
    )
    if not s:
        s = ChatSession(user_id=user.id, title="WhatsApp")
        db.add(s)
        db.flush()
    return s


# ── Webhook ──────────────────────────────────────────────────────────────────

@router.get("/webhook")
def verify_webhook(request: Request):
    """Meta's one-time handshake when you save the callback URL."""
    q = request.query_params
    if q.get("hub.mode") == "subscribe" and q.get("hub.verify_token") == _env("WHATSAPP_VERIFY_TOKEN"):
        return Response(content=q.get("hub.challenge", ""), media_type="text/plain")
    raise HTTPException(status.HTTP_403_FORBIDDEN, "Verification failed")


def _signature_ok(raw: bytes, header: Optional[str]) -> bool:
    secret = _env("WHATSAPP_APP_SECRET")
    if not secret:
        # Refuse rather than accept unverified traffic — an unsigned webhook is
        # an open door to acting as any linked user.
        print("[whatsapp] WHATSAPP_APP_SECRET is not set; rejecting webhook")
        return False
    if not header or not header.startswith("sha256="):
        return False
    expected = hmac.new(secret.encode(), raw, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, header.split("=", 1)[1])


@router.post("/webhook")
async def receive_webhook(request: Request, background: BackgroundTasks):
    raw = await request.body()
    if not _signature_ok(raw, request.headers.get("X-Hub-Signature-256")):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Bad signature")

    payload = await request.json()

    for entry in payload.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})
            for msg in value.get("messages", []):
                mid = msg.get("id")

                now = time.time()
                for k, t in list(_seen_ids.items()):
                    if now - t > _SEEN_TTL:
                        _seen_ids.pop(k, None)
                if mid in _seen_ids:
                    continue
                _seen_ids[mid] = now

                phone = msg.get("from")
                if msg.get("type") != "text":
                    background.add_task(
                        send_text, phone,
                        "I can only read text messages at the moment.",
                    )
                    continue

                text = (msg.get("text") or {}).get("body", "")
                # Answer out of band: the agent takes seconds and Meta retries
                # anything it thinks is slow.
                background.add_task(handle_message, phone, text)

    # Acknowledge straight away, whatever happens next.
    return {"status": "received"}


def handle_message(phone: str, text: str):
    """Resolve the sender, run the agent, reply. Runs off the request path."""
    db = SessionLocal()
    try:
        linked = _try_link(db, phone, text)
        if linked:
            send_text(phone, linked)
            return

        user = _user_for_phone(db, phone)
        if not user:
            send_text(
                phone,
                "This number isn't linked to a Recalla account yet.\n\n"
                "Open Recalla → Connectors → WhatsApp, generate a code, then send "
                "it here as:  link 123456",
            )
            return

        session = _session_for(db, user)
        history = [
            {"role": m.role, "content": m.content}
            for m in session.messages[-12:]
        ]

        # A dropped connection to Groq should not cost the user their message.
        # Retry once after a short pause; mobile networks blink constantly and
        # a second attempt almost always lands.
        result = None
        for attempt in (1, 2):
            try:
                with acting_as(user.id), on_channel("whatsapp"):
                    result = run_agent(user_message=text, conversation_history=history)
                break
            except Exception as e:
                if attempt == 2 or "onnection" not in str(e):
                    raise
                print(f"[whatsapp] retrying after connection error: {e}")
                time.sleep(2)

        reply = result.get("response") or "I couldn't work that one out."
        send_text(phone, reply)

        idx = len(session.messages)
        db.add(ChatMessage(session_id=session.id, idx=idx, role="user", content=text))
        db.add(ChatMessage(session_id=session.id, idx=idx + 1, role="assistant",
                           content=reply,
                           actions=[{"tool": t["name"], "args": t.get("args"),
                                     "result": t.get("result")}
                                    for t in result.get("tool_calls", [])] or None))
        db.commit()

    except Exception as e:
        import traceback
        traceback.print_exc()

        # Say something the sender can act on. The exception text is for the
        # log, not for a person holding a phone.
        if "onnection" in str(e) or "unreachable" in str(e).lower():
            msg = ("I couldn't reach my AI service just then — looks like a network "
                   "blip. Send that again and it should work.")
        else:
            msg = "Something went wrong on my side. Try again in a moment."
        send_text(phone, msg)
    finally:
        db.close()
