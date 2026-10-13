#!/usr/bin/env python3
"""
Point the Telegram bot at this server.

Telegram needs to be told where to deliver messages, once per public URL.
Unlike WhatsApp there is no dashboard — it is a single API call, which is
what this script makes.

    ./venv/bin/python scripts/setup_telegram.py           # check + register
    ./venv/bin/python scripts/setup_telegram.py --delete  # stop delivery
"""

import os
import secrets
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
from dotenv import load_dotenv

load_dotenv()
API = "https://api.telegram.org"


def env(k):
    return (os.getenv(k) or "").strip()


def set_env(key, value):
    """Write a value into .env, adding the line if it is not there."""
    import re
    path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    s = open(path).read()
    if re.search(rf"^{key}=.*$", s, re.M):
        s = re.sub(rf"^{key}=.*$", f"{key}={value}", s, flags=re.M)
    else:
        s += f"\n{key}={value}\n"
    open(path, "w").write(s)


def main() -> int:
    token = env("TELEGRAM_BOT_TOKEN")
    print("\nTelegram setup\n" + "─" * 52)

    if not token:
        print("[ FAIL ] TELEGRAM_BOT_TOKEN is not set.\n")
        print("  1. Open Telegram and message @BotFather")
        print("  2. Send /newbot, pick a name and a username ending in 'bot'")
        print("  3. It replies with a token like 8123456789:AAH...")
        print("  4. Put it in recalla-backend/.env as TELEGRAM_BOT_TOKEN=...")
        print("  5. Run this script again\n")
        return 1

    me = requests.get(f"{API}/bot{token}/getMe", timeout=30)
    if not me.ok:
        print(f"[ FAIL ] Telegram rejected the token:\n  {me.text[:200]}")
        return 1
    bot = me.json()["result"]
    print(f"[  OK  ] Bot @{bot['username']}  ({bot.get('first_name')})")
    set_env("TELEGRAM_BOT_USERNAME", bot["username"])

    if "--delete" in sys.argv:
        r = requests.post(f"{API}/bot{token}/deleteWebhook", timeout=30)
        print("[  OK  ] Webhook removed" if r.ok else f"[ FAIL ] {r.text[:200]}")
        return 0 if r.ok else 1

    domain = env("NGROK_DOMAIN")
    if not domain:
        print("[ FAIL ] NGROK_DOMAIN is not set — no public URL to receive messages on.")
        return 1

    secret = env("TELEGRAM_WEBHOOK_SECRET")
    if not secret:
        # Telegram does not sign payloads, so this shared secret is the only
        # thing standing between the public URL and anyone who finds it.
        secret = "tg_" + secrets.token_urlsafe(24)
        set_env("TELEGRAM_WEBHOOK_SECRET", secret)
        print("[  OK  ] Generated a webhook secret")

    url = f"https://{domain}/api/telegram/webhook"
    r = requests.post(
        f"{API}/bot{token}/setWebhook",
        json={"url": url, "secret_token": secret,
              "allowed_updates": ["message", "edited_message"],
              "drop_pending_updates": True},
        timeout=30,
    )
    if not r.ok:
        print(f"[ FAIL ] setWebhook: {r.text[:250]}")
        return 1
    print(f"[  OK  ] Webhook set to {url}")

    info = requests.get(f"{API}/bot{token}/getWebhookInfo", timeout=30).json()["result"]
    print(f"        pending: {info.get('pending_update_count', 0)}")
    if info.get("last_error_message"):
        print(f"        last error: {info['last_error_message']}")

    print(f"\nOpen  https://t.me/{bot['username']}  and send /start\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
