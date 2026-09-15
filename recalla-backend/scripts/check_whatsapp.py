#!/usr/bin/env python3
"""
Check the WhatsApp Cloud API setup.

Run this after pasting the five WHATSAPP_* values into .env. It reports which
part of Meta's setup is not finished yet, rather than leaving you to guess
from a webhook that never fires.

    ./venv/bin/python scripts/check_whatsapp.py            # check credentials
    ./venv/bin/python scripts/check_whatsapp.py 923001234567   # also send a test
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
from dotenv import load_dotenv

load_dotenv()

GRAPH = "https://graph.facebook.com/v21.0"
OK, BAD, WARN = "  OK  ", " FAIL ", " ..   "


def env(k):
    return (os.getenv(k) or "").strip()


def main() -> int:
    token   = env("WHATSAPP_ACCESS_TOKEN")
    pnid    = env("WHATSAPP_PHONE_NUMBER_ID")
    secret  = env("WHATSAPP_APP_SECRET")
    verify  = env("WHATSAPP_VERIFY_TOKEN")
    waba    = env("WHATSAPP_BUSINESS_ACCOUNT_ID")

    print("\nWhatsApp Cloud API check\n" + "─" * 52)

    missing = [n for n, v in [
        ("WHATSAPP_ACCESS_TOKEN", token),
        ("WHATSAPP_PHONE_NUMBER_ID", pnid),
        ("WHATSAPP_APP_SECRET", secret),
        ("WHATSAPP_VERIFY_TOKEN", verify),
    ] if not v]

    for n in ("WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID",
              "WHATSAPP_APP_SECRET", "WHATSAPP_VERIFY_TOKEN",
              "WHATSAPP_BUSINESS_ACCOUNT_ID"):
        v = env(n)
        shown = (v[:6] + "…") if v and n in ("WHATSAPP_ACCESS_TOKEN", "WHATSAPP_APP_SECRET") else (v or "—")
        print(f"[{OK if v else BAD}] {n:<32} {shown}")

    if missing:
        print(f"\nStill to fill in: {', '.join(missing)}")
        print("They come from developers.facebook.com → your app → WhatsApp → API Setup,")
        print("except APP_SECRET (App Settings → Basic).")
        return 1

    # Does the token actually work, and is it the permanent one?
    r = requests.get(f"{GRAPH}/{pnid}",
                     params={"fields": "display_phone_number,verified_name,quality_rating"},
                     headers={"Authorization": f"Bearer {token}"}, timeout=30)
    if not r.ok:
        print(f"\n[{BAD}] Token rejected by Meta:\n      {r.text[:400]}")
        if "expired" in r.text.lower() or "session" in r.text.lower():
            print("\n      That looks like the 24-hour temporary token. Create a System User")
            print("      token instead: business.facebook.com → Business Settings →")
            print("      Users → System Users → Generate New Token (expiry: Never).")
        return 1

    info = r.json()
    print(f"\n[{OK}] Token valid")
    print(f"       number  : {info.get('display_phone_number')}  ({info.get('verified_name')})")
    print(f"       quality : {info.get('quality_rating', 'n/a')}")

    if waba:
        r2 = requests.get(f"{GRAPH}/{waba}/phone_numbers",
                          headers={"Authorization": f"Bearer {token}"}, timeout=30)
        print(f"[{OK if r2.ok else WARN}] Business account readable"
              + ("" if r2.ok else f"  ({r2.status_code} — check the WABA id)"))

    # Optional live send.
    if len(sys.argv) > 1:
        to = "".join(ch for ch in sys.argv[1] if ch.isdigit())
        print(f"\nSending hello_world template to {to} …")
        r3 = requests.post(
            f"{GRAPH}/{pnid}/messages",
            headers={"Authorization": f"Bearer {token}"},
            json={"messaging_product": "whatsapp", "to": to, "type": "template",
                  "template": {"name": "hello_world", "language": {"code": "en_US"}}},
            timeout=30,
        )
        if r3.ok:
            print(f"[{OK}] Sent. Check that phone.")
        else:
            print(f"[{BAD}] {r3.text[:400]}")
            if "131030" in r3.text:
                print("\n      That number is not on the allowed recipient list. Add it under")
                print("      WhatsApp → API Setup → To → Manage phone number list.")
            return 1

    print("\nCredentials are good. Next: start the tunnel, then set the callback URL")
    print("in WhatsApp → Configuration to  https://<tunnel>/api/whatsapp/webhook")
    print(f"with verify token  {verify}  and subscribe to the 'messages' field.\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
