# ============================================================
# FILE PATH:  recalla-backend/routes/telegram.py
# PURPOSE:    Talk to Recalla from Telegram.
# ============================================================

"""
Telegram bridge.

Architecturally this is the WhatsApp bridge with the hard parts removed.
Telegram has no business verification, no approved templates, no 24-hour
messaging window and no recipient allowlist, so a bot can message anyone who
has messaged it, whenever it likes. For reminders in particular that is the
difference between "works" and "works if you spoke to it today".

Setup is a token from @BotFather and nothing else, which also makes this the
connector a second person can set up for themselves in a minute.

What is shared with WhatsApp is deliberate: the same link-code identity
check, the same acting_as/on_channel scoping, the same chat_sessions memory.
A conversation is a conversation regardless of which app it arrived through.
"""

import hmac
import os
import re
import secrets
import time
from typing import Optional

import requests
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth.context import acting_as, on_channel
from auth.deps import get_current_user
from db.models import ChatMessage, ChatSession, User, UserConnection
from db.session import SessionLocal, get_db
from models.agent import run_agent

router = APIRouter()

API = "https://api.telegram.org"

_seen_ids: dict[int, float] = {}
_SEEN_TTL = 3600

_link_codes: dict[str, tuple[str, float]] = {}
_LINK_TTL = 600


def _env(name: str) -> str:
    return (os.getenv(name) or "").strip()


def is_configured() -> bool:
    return bool(_env("TELEGRAM_BOT_TOKEN"))


def _url(method: str) -> str:
    return f"{API}/bot{_env('TELEGRAM_BOT_TOKEN')}/{method}"


# ── Outbound ─────────────────────────────────────────────────────────────────

def send_text(chat_id: str, body: str) -> dict:
    """Send a message. No template rules, no time window — it just sends."""
    if not is_configured():
        return {"success": False, "error": "Telegram is not configured on this server."}

    if len(body) > 4000:                 # Telegram's limit is 4096
        body = body[:3980] + "…"

    try:
        r = requests.post(_url("sendMessage"),
                          json={"chat_id": chat_id, "text": body},
                          timeout=30)
    except Exception as e:
        return {"success": False, "error": str(e)[:200]}

    if not r.ok:
        print(f"[telegram] send failed {r.status_code}: {r.text[:200]}")
        return {"success": False, "error": r.text[:200]}
    return {"success": True, "id": r.json().get("result", {}).get("message_id")}


# ── Identity ─────────────────────────────────────────────────────────────────

def _user_for_chat(db: Session, chat_id: str) -> Optional[User]:
    conn = db.scalar(
        select(UserConnection).where(
            UserConnection.provider == "telegram",
            UserConnection.account_name == str(chat_id),
        )
    )
    return db.get(User, conn.user_id) if conn else None


@router.post("/link-code")
def create_link_code(user: User = Depends(get_current_user)):
    """A code the signed-in user sends from Telegram to prove both halves."""
    for c, (uid, _) in list(_link_codes.items()):
        if uid == user.id:
            _link_codes.pop(c, None)

    code = f"{secrets.randbelow(10**6):06d}"
    _link_codes[code] = (user.id, time.time() + _LINK_TTL)
    return {"code": code, "expires_in": _LINK_TTL,
            "instructions": f"Send  /link {code}  to the Recalla bot on Telegram."}


@router.get("/status")
def telegram_status(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conn = db.scalar(
        select(UserConnection).where(
            UserConnection.user_id == user.id, UserConnection.provider == "telegram"
        )
    )
    return {
        "server_configured": is_configured(),
        "linked": bool(conn),
        "account": conn.account_email if conn else None,
        "bot": _env("TELEGRAM_BOT_USERNAME") or None,
    }


@router.delete("/link")
def unlink(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conn = db.scalar(
        select(UserConnection).where(
            UserConnection.user_id == user.id, UserConnection.provider == "telegram"
        )
    )
    if conn:
        db.delete(conn)
        db.commit()
    return {"success": True}


def _try_link(db: Session, chat_id: str, text: str, display: str) -> Optional[str]:
    """Handle '/link 123456'. Returns a reply, or None if not a link attempt."""
    m = re.match(r"^\s*/?link\s+(\d{6})\s*$", text or "", re.I)
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

    taken = db.scalar(
        select(UserConnection).where(
            UserConnection.provider == "telegram",
            UserConnection.account_name == str(chat_id),
            UserConnection.user_id != user_id,
        )
    )
    if taken:
        return "This Telegram account is already linked to another Recalla account."

    conn = db.scalar(
        select(UserConnection).where(
            UserConnection.user_id == user_id, UserConnection.provider == "telegram"
        )
    ) or UserConnection(user_id=user_id, provider="telegram")
    conn.account_name = str(chat_id)
    conn.account_email = display or None
    db.add(conn)
    db.commit()

    _link_codes.pop(code, None)
    return (f"Linked to {user.email}. Ask me anything — \"what did we decide "
            "about the database\", or \"remind me to send the report Friday 3pm\".")


def _session_for(db: Session, user: User) -> ChatSession:
    s = db.scalar(
        select(ChatSession)
        .where(ChatSession.user_id == user.id, ChatSession.title == "Telegram")
        .order_by(ChatSession.updated_at.desc())
    )
    if not s:
        s = ChatSession(user_id=user.id, title="Telegram")
        db.add(s)
        db.flush()
    return s


# ── Webhook ──────────────────────────────────────────────────────────────────

@router.post("/webhook")
async def receive_webhook(request: Request, background: BackgroundTasks):
    """
    Telegram does not sign payloads. Instead it echoes back a secret chosen at
    setWebhook time in a header, which serves the same purpose: without it,
    anyone who found this public URL could act as any linked user.
    """
    expected = _env("TELEGRAM_WEBHOOK_SECRET")
    got = request.headers.get("X-Telegram-Bot-Api-Secret-Token", "")
    if not expected or not hmac.compare_digest(expected, got):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Bad secret token")

    update = await request.json()
    msg = update.get("message") or update.get("edited_message")
    if not msg:
        return {"ok": True}

    uid = update.get("update_id")
    now = time.time()
    for k, t in list(_seen_ids.items()):
        if now - t > _SEEN_TTL:
            _seen_ids.pop(k, None)
    if uid in _seen_ids:
        return {"ok": True}
    _seen_ids[uid] = now

    chat_id = str((msg.get("chat") or {}).get("id") or "")
    text = (msg.get("text") or "").strip()
    frm = msg.get("from") or {}
    display = frm.get("username") or " ".join(
        x for x in (frm.get("first_name"), frm.get("last_name")) if x
    )

    if not chat_id:
        return {"ok": True}

    if not text:
        background.add_task(send_text, chat_id, "I can only read text messages at the moment.")
        return {"ok": True}

    background.add_task(handle_message, chat_id, text, display)
    return {"ok": True}


def handle_message(chat_id: str, text: str, display: str = ""):
    """Resolve the sender, run the agent, reply. Runs off the request path."""
    db = SessionLocal()
    try:
        if text.strip().lower() in ("/start", "start"):
            send_text(chat_id,
                      "This is Recalla, your meeting assistant.\n\n"
                      "To connect your account: open Recalla → Connectors → Telegram, "
                      "generate a code, then send it here as:  /link 123456")
            return

        linked = _try_link(db, chat_id, text, display)
        if linked:
            send_text(chat_id, linked)
            return

        user = _user_for_chat(db, chat_id)
        if not user:
            send_text(chat_id,
                      "This Telegram account isn't linked to Recalla yet.\n\n"
                      "Open Recalla → Connectors → Telegram, generate a code, "
                      "then send it here as:  /link 123456")
            return

        session = _session_for(db, user)
        history = [{"role": m.role, "content": m.content} for m in session.messages[-12:]]

        result = None
        for attempt in (1, 2):
            try:
                with acting_as(user.id), on_channel("telegram"):
                    result = run_agent(user_message=text, conversation_history=history)
                break
            except Exception as e:
                if attempt == 2 or "onnection" not in str(e):
                    raise
                print(f"[telegram] retrying after connection error: {e}")
                time.sleep(2)

        reply = result.get("response") or "I couldn't work that one out."
        send_text(chat_id, reply)

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
        if "onnection" in str(e) or "unreachable" in str(e).lower():
            msg = ("I couldn't reach my AI service just then — looks like a network "
                   "blip. Send that again and it should work.")
        else:
            msg = "Something went wrong on my side. Try again in a moment."
        send_text(chat_id, msg)
    finally:
        db.close()
