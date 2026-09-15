#!/usr/bin/env python
"""
Seed / migrate script.

  python scripts/seed.py --migrate-json          move data/*.json into the DB
  python scripts/seed.py --demo                  add a couple of sample meetings
  python scripts/seed.py --reset-users           delete every account (destructive)
  python scripts/seed.py --owner you@email.com   who the migrated rows belong to

Existing reminders and email drafts live in flat JSON files with no notion of
an owner. They are attached to the first admin account unless --owner says
otherwise. Re-running is safe: rows are matched on title + time so nothing is
duplicated.
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select, func            # noqa: E402
from db.session import SessionLocal            # noqa: E402
from db.models import (                        # noqa: E402
    User, Meeting, Segment, Tag, Reminder, Memory, EmailDraft, UserSettings,
)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")


def _parse_dt(value):
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def pick_owner(db, email=None):
    if email:
        user = db.scalar(select(User).where(User.email == email.lower().strip()))
        if not user:
            sys.exit(f"No account with email {email!r}. Register it in the app first.")
        return user

    user = db.scalar(select(User).where(User.role == "admin").order_by(User.created_at))
    if not user:
        user = db.scalar(select(User).order_by(User.created_at))
    if not user:
        sys.exit("No accounts exist yet. Register one in the app, then re-run this.")
    return user


def migrate_reminders(db, owner) -> int:
    path = os.path.join(DATA_DIR, "reminders.json")
    if not os.path.exists(path):
        print("  reminders.json: not found, skipping")
        return 0

    with open(path, encoding="utf-8") as f:
        rows = json.load(f)

    added = 0
    for r in rows:
        title = (r.get("title") or "").strip()
        if not title:
            continue
        due = _parse_dt(r.get("datetime"))
        exists = db.scalar(
            select(Reminder).where(
                Reminder.user_id == owner.id, Reminder.title == title, Reminder.due_at == due,
            )
        )
        if exists:
            continue
        db.add(Reminder(
            user_id=owner.id, title=title, due_at=due,
            priority=r.get("priority", "medium"), category=r.get("category", "general"),
            notes=r.get("notes") or "", completed=bool(r.get("completed", False)),
            created_at=_parse_dt(r.get("created_at")) or datetime.now(timezone.utc),
        ))
        added += 1

    db.commit()
    print(f"  reminders.json: {added} migrated ({len(rows) - added} already present)")
    return added


def migrate_drafts(db, owner) -> int:
    path = os.path.join(DATA_DIR, "email_drafts.json")
    if not os.path.exists(path):
        print("  email_drafts.json: not found, skipping")
        return 0

    with open(path, encoding="utf-8") as f:
        raw = json.load(f)
    rows = list(raw.values()) if isinstance(raw, dict) else raw

    added = 0
    for d in rows:
        to = (d.get("to") or "").strip()
        if not to:
            continue
        subject = d.get("subject") or ""
        if db.scalar(select(EmailDraft).where(
            EmailDraft.user_id == owner.id, EmailDraft.to == to, EmailDraft.subject == subject,
        )):
            continue
        db.add(EmailDraft(
            user_id=owner.id, to=to, cc=d.get("cc") or "", subject=subject,
            body=d.get("body") or "", status=d.get("status", "draft"),
            created_at=_parse_dt(d.get("created_at")) or datetime.now(timezone.utc),
            sent_at=_parse_dt(d.get("sent_at")), gmail_id=d.get("gmail_id"),
        ))
        added += 1

    db.commit()
    print(f"  email_drafts.json: {added} migrated ({len(rows) - added} already present)")
    return added


DEMO = [
    {
        "title": "Backend Architecture Sync",
        "type": "Team Meeting",
        "days_ago": 1,
        "duration": 1920,
        "segments": [
            ("Speaker 1", "Let's decide how we are storing the transcripts."),
            ("Speaker 2", "We agreed to use PostgreSQL for the relational data."),
            ("Speaker 1", "Ammad will wire up the migrations by Friday."),
            ("Speaker 2", "And the vectors go into ChromaDB for semantic search."),
        ],
        "summary": "The team decided to store relational data in PostgreSQL and embeddings in ChromaDB. Ammad took the migration work with a Friday deadline.",
        "auto_tags": ["Backend", "Database"],
        "decisions": ["We agreed to use PostgreSQL for the relational data."],
        "tasks": ["Ammad will wire up the migrations by Friday."],
    },
    {
        "title": "Supervisor FYP Check-in",
        "type": "Supervisor Meeting",
        "days_ago": 6,
        "duration": 1200,
        "segments": [
            ("Speaker 1", "Show me the live transcription working end to end."),
            ("Speaker 2", "Recording now produces the transcript while the meeting runs."),
            ("Speaker 1", "Good. Update the report so it matches what you built."),
        ],
        "summary": "Demonstrated live transcription. The supervisor asked for the report to be updated so it matches the implemented system.",
        "auto_tags": ["FYP", "Meeting"],
        "decisions": [],
        "tasks": ["Update the report so it matches what you built."],
    },
]


def add_demo(db, owner) -> int:
    added = 0
    for d in DEMO:
        if db.scalar(select(Meeting).where(Meeting.user_id == owner.id, Meeting.title == d["title"])):
            continue

        started = datetime.now(timezone.utc) - timedelta(days=d["days_ago"])
        full_text = " ".join(t for _, t in d["segments"])

        m = Meeting(
            user_id=owner.id, title=d["title"], meeting_type=d["type"],
            started_at=started, duration_seconds=d["duration"], language="en",
            word_count=len(full_text.split()), full_text=full_text,
            summary=d["summary"], key_points=d["decisions"] + d["tasks"],
            source="upload", transcript_model="small",
        )
        db.add(m)
        db.flush()

        t = 0.0
        for i, (speaker, text) in enumerate(d["segments"]):
            dur = max(3.0, len(text.split()) * 0.45)
            db.add(Segment(meeting_id=m.id, idx=i, start_s=round(t, 2),
                           end_s=round(t + dur, 2), speaker=speaker, text=text))
            db.add(Memory(user_id=owner.id, meeting_id=m.id, chunk_index=i,
                          text=text, start_s=round(t, 2), speaker=speaker))
            t += dur

        for v in d["auto_tags"]:
            db.add(Tag(meeting_id=m.id, kind="auto_tag", value=v))
        for v in d["decisions"]:
            db.add(Tag(meeting_id=m.id, kind="decision", value=v))
        for v in d["tasks"]:
            db.add(Tag(meeting_id=m.id, kind="task", value=v))

        added += 1

    db.commit()
    print(f"  demo meetings: {added} added")
    return added


def reset_users(db):
    n = db.scalar(select(func.count()).select_from(User)) or 0
    for u in db.scalars(select(User)).all():
        db.delete(u)         # cascades everywhere
    db.commit()
    print(f"  deleted {n} account(s) and all their data")


def main():
    ap = argparse.ArgumentParser(description="Recalla seed / migrate")
    ap.add_argument("--migrate-json", action="store_true", help="move data/*.json into the DB")
    ap.add_argument("--demo", action="store_true", help="add sample meetings")
    ap.add_argument("--reset-users", action="store_true", help="DELETE every account and its data")
    ap.add_argument("--owner", help="email that migrated rows belong to")
    args = ap.parse_args()

    if not any([args.migrate_json, args.demo, args.reset_users]):
        ap.print_help()
        return

    db = SessionLocal()
    try:
        if args.reset_users:
            confirm = input("This deletes ALL accounts and their data. Type 'yes' to continue: ")
            if confirm.strip().lower() != "yes":
                print("  cancelled")
                return
            reset_users(db)
            return

        owner = pick_owner(db, args.owner)
        print(f"Owner: {owner.name} <{owner.email}> ({owner.role})")

        # Make sure the owner has a settings row.
        if not db.get(UserSettings, owner.id):
            db.add(UserSettings(user_id=owner.id))
            db.commit()
            print("  created default settings")

        if args.migrate_json:
            migrate_reminders(db, owner)
            migrate_drafts(db, owner)
        if args.demo:
            add_demo(db, owner)

        print("\nDone.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
