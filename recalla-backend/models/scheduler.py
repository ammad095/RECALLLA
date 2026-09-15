# ============================================================
# FILE PATH:  recalla-backend/models/scheduler.py
# PURPOSE:    Actually fire reminders when they come due.
# ============================================================

"""
The reminder scheduler.

Until now Recalla stored reminders and displayed them, but nothing ever asked
"is anything due?" — so a reminder set for Friday at 3pm passed in silence.
This job wakes every minute and delivers what has come due.

Two decisions worth knowing:

  * `notified_at` is a column, not a set in memory. A restart would otherwise
    re-deliver every reminder already sent, which is worse than sending none.

  * A reminder missed while the machine was asleep is delivered late rather
    than dropped, within a grace window. Being told at 6pm about a 3pm
    deadline is useful; silence is not. Anything older than the window is
    marked delivered without a message, so restarting after a week of
    downtime does not fire a burst of stale notifications.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import func, select

from db.models import Reminder, User, UserConnection, UserSettings
from db.session import SessionLocal

CHECK_SECONDS = 60
LATE_GRACE = timedelta(hours=12)

_scheduler = None


REMINDER_TEMPLATE = "recalla_reminder"


def _deliver_whatsapp(user_id: str, text: str, template_args: Optional[list] = None) -> bool:
    """Send to a linked WhatsApp number, if there is one and it is reachable."""
    db = SessionLocal()
    try:
        conn = db.scalar(
            select(UserConnection).where(
                UserConnection.user_id == user_id,
                UserConnection.provider == "whatsapp",
            )
        )
        if not conn or not conn.account_name:
            return False
    finally:
        db.close()

    try:
        from routes.whatsapp import send_text, is_configured

        if not is_configured():
            return False
        res = send_text(conn.account_name, text)
        if res.get("success"):
            return True

        # Outside the 24-hour service window Meta refuses free-form text. An
        # approved template is the only thing that gets through, so fall back
        # to it rather than letting the reminder go undelivered.
        print(f"[scheduler] Free-form declined: {str(res.get('error'))[:120]}")
        if template_args:
            from routes.whatsapp import send_template

            tpl = send_template(conn.account_name, REMINDER_TEMPLATE, template_args)
            if tpl.get("success"):
                print("[scheduler] Delivered via template instead")
                return True
            print(f"[scheduler] Template declined too: {str(tpl.get('error'))[:120]}")
        return False
    except Exception as e:
        print(f"[scheduler] WhatsApp delivery failed: {e}")
        return False


def _settings(db, user_id: str) -> UserSettings | None:
    return db.scalar(select(UserSettings).where(UserSettings.user_id == user_id))


def _when(r: Reminder, tz_name: str = "Asia/Karachi") -> str:
    """The due time in the user's own zone, not the server's."""
    if not r.due_at:
        return ""
    try:
        from zoneinfo import ZoneInfo

        return r.due_at.astimezone(ZoneInfo(tz_name)).strftime("%a %d %b, %H:%M")
    except Exception:
        return r.due_at.astimezone(timezone.utc).strftime("%H:%M UTC")


def _format(r: Reminder, tz_name: str = "Asia/Karachi") -> str:
    """The free-form message used inside the 24-hour window."""
    when = _when(r, tz_name)
    line = f"Reminder: {r.title}"
    if when:
        line += f"\nDue {when}"
    if r.notes:
        line += f"\n{r.notes}"
    return line


def check_due(now: Optional[datetime] = None) -> int:
    """Deliver everything that has come due. Returns how many were sent."""
    now = now or datetime.now(timezone.utc)
    db = SessionLocal()
    sent = 0
    try:
        # Widen the window by the largest lead time any user has configured,
        # then apply each user's own lead below. Selecting per-user would mean
        # a query per account every minute.
        max_lead = db.scalar(select(func.max(UserSettings.reminder_lead_minutes))) or 0
        horizon = now + timedelta(minutes=int(max_lead))

        due = db.scalars(
            select(Reminder).where(
                Reminder.completed.is_(False),
                Reminder.notified_at.is_(None),
                Reminder.due_at.isnot(None),
                Reminder.due_at <= horizon,
            ).limit(50)
        ).all()

        settings_cache: dict[str, UserSettings | None] = {}

        for r in due:
            if r.user_id not in settings_cache:
                settings_cache[r.user_id] = _settings(db, r.user_id)
            st = settings_cache[r.user_id]

            lead = timedelta(minutes=int(st.reminder_lead_minutes) if st else 10)
            if r.due_at and r.due_at - lead > now:
                continue          # this user wants less notice than the horizon

            too_old = r.due_at and (now - r.due_at) > LATE_GRACE
            if too_old:
                # Stamp it so it never fires, without waking anyone at 3am
                # about something from last week.
                r.notified_at = now
                continue

            # A switch labelled "notifications" has to actually stop them.
            # Mark it seen as well, so the in-app panel stays quiet too.
            if st and not st.notifications_enabled:
                r.notified_at = now
                r.seen_at = now
                continue

            tz = (st.timezone_name if st and st.timezone_name else "Asia/Karachi")
            owner = db.get(User, r.user_id)
            first_name = (owner.name or "there").split()[0] if owner else "there"
            when = _when(r, tz) or "soon"
            _deliver_whatsapp(r.user_id, _format(r, tz),
                              template_args=[first_name, r.title, when])
            r.notified_at = now          # the in-app panel reads this
            sent += 1
            print(f"[scheduler] Delivered reminder: {r.title}")

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[scheduler] check failed: {e}")
    finally:
        db.close()
    return sent


def start():
    """Start the background scheduler. Safe to call once, at app startup."""
    global _scheduler
    if _scheduler is not None:
        return _scheduler

    from apscheduler.schedulers.background import BackgroundScheduler

    _scheduler = BackgroundScheduler(timezone="UTC")
    _scheduler.add_job(
        check_due, "interval", seconds=CHECK_SECONDS,
        id="recalla_reminders", replace_existing=True,
        max_instances=1, coalesce=True,      # never stack overlapping runs
    )
    _scheduler.start()
    print(f"[Recalla] Reminder scheduler running (every {CHECK_SECONDS}s)")
    return _scheduler


def stop():
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
