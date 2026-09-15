#!/usr/bin/env python3
"""
Rebuild the semantic index from Postgres.

Chroma is a cache: everything in it can be regenerated from the meetings and
segments tables. Run this after adding semantic search to an existing
database, or any time the index looks wrong.

    ./venv/bin/python scripts/reindex_memory.py            # index what is missing
    ./venv/bin/python scripts/reindex_memory.py --all      # rebuild everything
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select

from db.session import SessionLocal
from db.models import Meeting, Memory, User
from models.memory_index import index_meeting
from models import vector_store


def main() -> int:
    rebuild = "--all" in sys.argv

    db = SessionLocal()
    try:
        meetings = db.scalars(select(Meeting).order_by(Meeting.created_at)).all()
        if not meetings:
            print("No meetings to index.")
            return 0

        print(f"\n{len(meetings)} meeting(s) found. Index holds "
              f"{vector_store.stats().get('chunks', 0)} chunks.\n")

        total = 0
        for m in meetings:
            owner = db.get(User, m.user_id)
            indexed = db.scalar(
                select(Memory).where(Memory.meeting_id == m.id,
                                     Memory.embedded.is_(True))
            )
            if indexed and not rebuild:
                print(f"  skip   {m.title[:38]:40} already indexed")
                continue

            n = index_meeting(db, m)
            total += n
            print(f"  index  {m.title[:38]:40} {n:3} chunks  ({owner.email if owner else '?'})")

        print(f"\nDone. {total} chunks written. "
              f"Index now holds {vector_store.stats().get('chunks', 0)}.\n")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
