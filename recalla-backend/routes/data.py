"""
User-scoped data endpoints: meetings, reminders, settings, memory, admin.

Every query is filtered by the authenticated user, so one account can never
read or modify another's data.
"""

from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func, delete
from sqlalchemy.orm import Session, selectinload

from db.session import get_db
from db.models import User, Meeting, Segment, Tag, Reminder, Memory, UserSettings
from auth.deps import get_current_user, get_current_admin

router = APIRouter()


# ── Schemas ──────────────────────────────────────────────────────────────────

class SegmentIn(BaseModel):
    start: float = 0.0
    end: float = 0.0
    speaker: str = "Speaker 1"
    text: str


class SaveMeetingRequest(BaseModel):
    title: str = "Untitled Meeting"
    meeting_type: str = "Team Meeting"
    duration_seconds: float = 0.0
    language: str = "en"
    full_text: str = ""
    summary: Optional[str] = None
    key_points: Optional[list] = None
    segments: List[SegmentIn] = Field(default_factory=list)
    tagging: Optional[dict] = None
    source: str = "live"
    transcript_model: str = "base"
    live_session_id: Optional[str] = None


class SegmentOut(BaseModel):
    start: float
    end: float
    speaker: str
    text: str


class MeetingSummary(BaseModel):
    id: str
    title: str
    meeting_type: str
    started_at: datetime
    duration_seconds: float
    word_count: int
    speakers: List[str]
    tags: List[str]
    has_summary: bool


class MeetingDetailOut(MeetingSummary):
    full_text: Optional[str]
    summary: Optional[str]
    key_points: Optional[list]
    segments: List[SegmentOut]
    tagging: dict
    refine_status: str
    live_session_id: Optional[str]


class ReminderIn(BaseModel):
    title: str
    datetime_iso: Optional[str] = None
    priority: str = "medium"
    category: str = "general"
    notes: str = ""
    meeting_id: Optional[str] = None


class SettingsOut(BaseModel):
    theme: str
    default_meeting_type: str
    spoken_language: str
    auto_summary: bool
    notifications_enabled: bool
    notification_sound: bool
    reminder_lead_minutes: int
    timezone_name: str

    model_config = {"from_attributes": True}


class SettingsIn(BaseModel):
    theme: Optional[str] = None
    default_meeting_type: Optional[str] = None
    spoken_language: Optional[str] = None
    auto_summary: Optional[bool] = None
    notifications_enabled: Optional[bool] = None
    notification_sound: Optional[bool] = None
    reminder_lead_minutes: Optional[int] = Field(default=None, ge=0, le=1440)
    timezone_name: Optional[str] = Field(default=None, max_length=48)


# ── Helpers ──────────────────────────────────────────────────────────────────

TAG_KINDS_FROM_ENTITIES = {"people": "person", "orgs": "org", "dates": "date", "topics": "topic"}
TAG_LIST_KINDS = ("tasks", "decisions", "deadlines", "questions")


def _owned_meeting(db: Session, user: User, meeting_id: str) -> Meeting:
    m = db.scalar(
        select(Meeting)
        .where(Meeting.id == meeting_id, Meeting.user_id == user.id)
        .options(selectinload(Meeting.segments), selectinload(Meeting.tags))
    )
    if not m:
        # 404 rather than 403 so we don't confirm the id exists for someone else.
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Meeting not found")
    return m


def _tagging_dict(m: Meeting) -> dict:
    out = {
        "entities": {"people": [], "orgs": [], "dates": [], "topics": []},
        "auto_tags": [], "tasks": [], "decisions": [], "deadlines": [], "questions": [],
    }
    reverse = {v: k for k, v in TAG_KINDS_FROM_ENTITIES.items()}
    for t in m.tags:
        if t.kind == "auto_tag":
            out["auto_tags"].append(t.value)
        elif t.kind in reverse:
            out["entities"][reverse[t.kind]].append(t.value)
        elif t.kind + "s" in out:
            out[t.kind + "s"].append(t.value)
    return out


def _summary(m: Meeting) -> MeetingSummary:
    return MeetingSummary(
        id=m.id, title=m.title, meeting_type=m.meeting_type,
        started_at=m.started_at, duration_seconds=m.duration_seconds,
        word_count=m.word_count,
        speakers=sorted({s.speaker for s in m.segments}) if m.segments else [],
        tags=[t.value for t in m.tags if t.kind == "auto_tag"],
        has_summary=bool(m.summary),
    )


def _settings_for(db: Session, user: User) -> UserSettings:
    s = db.get(UserSettings, user.id)
    if s is None:
        s = UserSettings(user_id=user.id)
        db.add(s)
        db.commit()
        db.refresh(s)
    return s


# ── Meetings ─────────────────────────────────────────────────────────────────

@router.post("/meetings", status_code=status.HTTP_201_CREATED)
def save_meeting(
    background: BackgroundTasks,
    body: SaveMeetingRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    words = len((body.full_text or "").split())

    meeting = Meeting(
        user_id=user.id,
        title=body.title.strip() or "Untitled Meeting",
        meeting_type=body.meeting_type,
        started_at=datetime.now(timezone.utc),
        duration_seconds=body.duration_seconds,
        language=body.language,
        word_count=words,
        full_text=body.full_text,
        summary=body.summary,
        key_points=body.key_points,
        source=body.source,
        transcript_model=body.transcript_model,
        live_session_id=body.live_session_id,
    )
    db.add(meeting)
    db.flush()   # assigns meeting.id

    for i, seg in enumerate(body.segments):
        db.add(Segment(
            meeting_id=meeting.id, idx=i,
            start_s=seg.start, end_s=seg.end,
            speaker=seg.speaker, text=seg.text,
        ))

    tagging = body.tagging or {}
    for value in tagging.get("auto_tags", []) or []:
        db.add(Tag(meeting_id=meeting.id, kind="auto_tag", value=str(value)))
    for key, kind in TAG_KINDS_FROM_ENTITIES.items():
        for value in (tagging.get("entities", {}) or {}).get(key, []) or []:
            db.add(Tag(meeting_id=meeting.id, kind=kind, value=str(value)))
    for key in TAG_LIST_KINDS:
        for value in tagging.get(key, []) or []:
            db.add(Tag(meeting_id=meeting.id, kind=key[:-1], value=str(value)))

    db.commit()
    db.refresh(meeting)

    # Build the semantic index off the request path. Embedding a long meeting
    # takes a second or two, and the user should not wait for it to see their
    # transcript — search simply becomes available a moment later.
    background.add_task(_reindex, meeting.id)

    return {"success": True, "id": meeting.id}


def _reindex(meeting_id: str, extract: bool = True):
    """
    Everything that happens to a meeting after it is saved: chunk it, embed
    it, and pull out its tasks and decisions.

    All of it runs off the request path, and each step is isolated — a failure
    to extract must not cost the user their search index, and neither must
    cost them the meeting.
    """
    from db.session import SessionLocal
    from models.memory_index import index_meeting

    db = SessionLocal()
    try:
        m = db.get(Meeting, meeting_id)
        if not m:
            return

        try:
            index_meeting(db, m)
        except Exception as e:
            print(f"[Recalla] Indexing failed for {meeting_id}: {e}")

        if not extract:
            return

        # Action items are the reason to record a meeting you attended. Waiting
        # for someone to open a tab before finding them is the wrong default.
        try:
            from models.summarization import extract_tasks_and_decisions
            from models.memory_index import index_extracted

            segs = db.scalars(
                select(Segment).where(Segment.meeting_id == m.id).order_by(Segment.idx)
            ).all()
            transcript = ("\n".join(f"{x.speaker or 'Speaker'}: {x.text}" for x in segs)
                          if segs else (m.full_text or ""))
            if len(transcript.strip()) < 60:
                return

            result = extract_tasks_and_decisions(transcript)
            m.action_items = result.get("tasks") or []
            m.decisions = result.get("decisions") or []
            db.commit()

            index_extracted(db, m, m.action_items, "task")
            index_extracted(db, m, m.decisions, "decision")
            print(f"[Recalla] Extracted {len(m.action_items)} tasks, "
                  f"{len(m.decisions)} decisions from {m.id}")
        except Exception as e:
            print(f"[Recalla] Extraction failed for {meeting_id}: {e}")
    finally:
        db.close()


@router.get("/meetings", response_model=List[MeetingSummary])
def list_meetings(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = None,
):
    q = (
        select(Meeting)
        .where(Meeting.user_id == user.id)
        .options(selectinload(Meeting.segments), selectinload(Meeting.tags))
        .order_by(Meeting.started_at.desc())
        .limit(limit)
    )
    if search:
        like = f"%{search.lower()}%"
        q = q.where(func.lower(Meeting.title).like(like) | func.lower(Meeting.full_text).like(like))
    return [_summary(m) for m in db.scalars(q).all()]


@router.get("/meetings/{meeting_id}", response_model=MeetingDetailOut)
def get_meeting(
    meeting_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    m = _owned_meeting(db, user, meeting_id)
    base = _summary(m)
    return MeetingDetailOut(
        **base.model_dump(),
        full_text=m.full_text, summary=m.summary, key_points=m.key_points,
        segments=[SegmentOut(start=s.start_s, end=s.end_s, speaker=s.speaker, text=s.text)
                  for s in m.segments],
        tagging=_tagging_dict(m),
        refine_status=m.refine_status,
        live_session_id=m.live_session_id,
    )


@router.patch("/meetings/{meeting_id}")
def update_meeting(
    meeting_id: str,
    body: dict,
    background: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    m = _owned_meeting(db, user, meeting_id)

    if "title" in body:
        m.title = (body["title"] or "").strip() or m.title
    if "summary" in body:
        m.summary = body["summary"]
    if "key_points" in body:
        m.key_points = body["key_points"]

    # The refinement pass replaces the whole transcript.
    if "segments" in body and body["segments"]:
        db.execute(delete(Segment).where(Segment.meeting_id == m.id))
        for i, seg in enumerate(body["segments"]):
            db.add(Segment(
                meeting_id=m.id, idx=i,
                start_s=seg.get("start", 0), end_s=seg.get("end", 0),
                speaker=seg.get("speaker", "Speaker 1"), text=seg.get("text", ""),
            ))
        m.full_text = " ".join(s.get("text", "") for s in body["segments"]).strip()
        m.word_count = len(m.full_text.split())
        m.transcript_model = body.get("transcript_model", "small")
        m.refine_status = "done"
        resegmented = True
    else:
        resegmented = False

    db.commit()

    # A refined transcript replaces the draft wording, so the old chunks would
    # answer searches with text the meeting no longer contains.
    if resegmented:
        background.add_task(_reindex, m.id, False)

    return {"success": True}


@router.delete("/meetings/{meeting_id}")
def delete_meeting(
    meeting_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    m = _owned_meeting(db, user, meeting_id)
    db.delete(m)          # cascades to segments, tags, memories
    db.commit()

    # Postgres cascades; Chroma does not. Without this the vectors survive and
    # a deleted meeting keeps answering questions.
    from models import vector_store
    vector_store.delete_meeting(meeting_id)

    return {"success": True}


# ── Notifications ────────────────────────────────────────────────────────────

@router.get("/notifications")
def list_notifications(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reminders the scheduler has fired that this user has not dismissed."""
    rows = db.scalars(
        select(Reminder).where(
            Reminder.user_id == user.id,
            Reminder.notified_at.isnot(None),
            Reminder.seen_at.is_(None),
            Reminder.completed.is_(False),
        ).order_by(Reminder.notified_at.desc()).limit(20)
    ).all()

    return {
        "count": len(rows),
        "notifications": [{
            "id": r.id,
            "title": r.title,
            "notes": r.notes or "",
            "priority": r.priority,
            "due_at": r.due_at.isoformat() if r.due_at else None,
            "notified_at": r.notified_at.isoformat() if r.notified_at else None,
        } for r in rows],
    }


@router.post("/notifications/{reminder_id}/seen")
def dismiss_notification(
    reminder_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    r = db.scalar(
        select(Reminder).where(Reminder.id == reminder_id,
                               Reminder.user_id == user.id)
    )
    if not r:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    r.seen_at = datetime.now(timezone.utc)
    db.commit()
    return {"success": True}


# ── Tasks and decisions ──────────────────────────────────────────────────────

@router.post("/meetings/{meeting_id}/extract")
def extract_meeting(
    meeting_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Pull action items and decisions out of a meeting and store them.

    Results are written twice: structured onto the meeting for the UI, and as
    memories so the same items answer questions like "what do I owe Muzammal"
    across every meeting rather than one.
    """
    m = _owned_meeting(db, user, meeting_id)

    if not (m.full_text or "").strip():
        return {"tasks": [], "decisions": [], "message": "No transcript to read."}

    from models.summarization import extract_tasks_and_decisions
    from models.memory_index import index_extracted

    # Attribute lines to speakers before extracting. full_text is the words
    # only, so a model reading it cannot tell who committed to what — which is
    # exactly the assignee field we are asking it to fill in.
    segs = db.scalars(
        select(Segment).where(Segment.meeting_id == m.id).order_by(Segment.idx)
    ).all()
    if segs:
        transcript = "\n".join(f"{s.speaker or 'Speaker'}: {s.text}" for s in segs)
    else:
        transcript = m.full_text

    try:
        result = extract_tasks_and_decisions(transcript)
    except Exception as e:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"Extraction failed: {e}")

    m.action_items = result.get("tasks") or []
    m.decisions = result.get("decisions") or []
    db.commit()

    # Indexing is a bonus; never fail the request over it.
    try:
        index_extracted(db, m, m.action_items, "task")
        index_extracted(db, m, m.decisions, "decision")
    except Exception as e:
        print(f"[Recalla] Could not index extracted items: {e}")

    return {"tasks": m.action_items, "decisions": m.decisions}


@router.get("/meetings/{meeting_id}/extract")
def get_extracted(
    meeting_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Whatever was extracted before, without paying to run it again."""
    m = _owned_meeting(db, user, meeting_id)
    return {"tasks": m.action_items or [], "decisions": m.decisions or []}


# ── Timeline ─────────────────────────────────────────────────────────────────

@router.get("/timeline")
def timeline(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(60, ge=1, le=200),
):
    """Meetings and reminders merged into one reverse-chronological feed."""
    events = []

    meetings = db.scalars(
        select(Meeting).where(Meeting.user_id == user.id)
        .order_by(Meeting.started_at.desc()).limit(limit)
    ).all()
    for m in meetings:
        events.append({
            "id": m.id, "type": "meeting", "title": m.title,
            "at": m.started_at.isoformat(),
            "detail": f"{round(m.duration_seconds / 60)}m · {m.word_count} words",
        })

    reminders = db.scalars(
        select(Reminder).where(Reminder.user_id == user.id)
        .order_by(Reminder.created_at.desc()).limit(limit)
    ).all()
    for r in reminders:
        events.append({
            "id": r.id, "type": "reminder", "title": r.title,
            "at": (r.due_at or r.created_at).isoformat(),
            "detail": f"{r.priority} priority" + (" · done" if r.completed else ""),
        })

    events.sort(key=lambda e: e["at"], reverse=True)
    return {"events": events[:limit]}


# ── Memory ───────────────────────────────────────────────────────────────────

@router.get("/memory")
def memory(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    kind: Optional[str] = None,
    limit: int = Query(100, ge=1, le=300),
):
    """
    Extracted knowledge across all the user's meetings: decisions, tasks,
    deadlines, questions.
    """
    q = (
        select(Tag, Meeting)
        .join(Meeting, Tag.meeting_id == Meeting.id)
        .where(Meeting.user_id == user.id, Tag.kind.in_(["decision", "task", "deadline", "question"]))
        .order_by(Meeting.started_at.desc())
        .limit(limit)
    )
    if kind:
        q = q.where(Tag.kind == kind)

    items = [{
        "id": t.id, "kind": t.kind, "text": t.value,
        "meeting_id": m.id, "meeting_title": m.title,
        "at": m.started_at.isoformat(),
    } for t, m in db.execute(q).all()]

    return {"items": items, "count": len(items)}


# ── Reminders ────────────────────────────────────────────────────────────────

def _reminder_out(r: Reminder) -> dict:
    return {
        "id": r.id, "title": r.title,
        "datetime": r.due_at.isoformat() if r.due_at else None,
        "priority": r.priority, "category": r.category, "notes": r.notes or "",
        "completed": r.completed, "meeting_id": r.meeting_id,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


@router.get("/reminders")
def list_reminders(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    status_filter: str = Query("pending", alias="status"),
):
    q = select(Reminder).where(Reminder.user_id == user.id)
    if status_filter == "pending":
        q = q.where(Reminder.completed.is_(False))
    elif status_filter == "completed":
        q = q.where(Reminder.completed.is_(True))
    q = q.order_by(Reminder.due_at.asc().nulls_last(), Reminder.created_at.desc())

    rows = db.scalars(q).all()
    return {"success": True, "count": len(rows), "reminders": [_reminder_out(r) for r in rows]}


@router.post("/reminders", status_code=status.HTTP_201_CREATED)
def create_reminder(
    body: ReminderIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    due = None
    if body.datetime_iso:
        try:
            due = datetime.fromisoformat(body.datetime_iso.replace("Z", "+00:00"))
        except ValueError:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Invalid date/time")

    r = Reminder(
        user_id=user.id, title=body.title.strip(), due_at=due,
        priority=body.priority, category=body.category, notes=body.notes,
        meeting_id=body.meeting_id,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return {"success": True, "reminder": _reminder_out(r)}


@router.patch("/reminders/{reminder_id}/complete")
def complete_reminder(
    reminder_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    r = db.scalar(select(Reminder).where(Reminder.id == reminder_id, Reminder.user_id == user.id))
    if not r:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Reminder not found")
    r.completed = True
    r.completed_at = datetime.now(timezone.utc)
    db.commit()
    return {"success": True}


@router.delete("/reminders/{reminder_id}")
def delete_reminder(
    reminder_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    r = db.scalar(select(Reminder).where(Reminder.id == reminder_id, Reminder.user_id == user.id))
    if not r:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Reminder not found")
    db.delete(r)
    db.commit()
    return {"success": True}


# ── Settings ─────────────────────────────────────────────────────────────────

@router.get("/settings", response_model=SettingsOut)
def get_settings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return SettingsOut.model_validate(_settings_for(db, user))


@router.patch("/settings", response_model=SettingsOut)
def update_settings(
    body: SettingsIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s = _settings_for(db, user)
    for field, value in body.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(s, field, value)
    db.commit()
    db.refresh(s)
    return SettingsOut.model_validate(s)


# ── Dashboard stats ──────────────────────────────────────────────────────────

@router.get("/stats")
def stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {
        "meetings":  db.scalar(select(func.count()).select_from(Meeting).where(Meeting.user_id == user.id)) or 0,
        "pending":   db.scalar(select(func.count()).select_from(Reminder)
                               .where(Reminder.user_id == user.id, Reminder.completed.is_(False))) or 0,
        "memories":  db.scalar(select(func.count()).select_from(Memory).where(Memory.user_id == user.id)) or 0,
    }


# ── Admin ────────────────────────────────────────────────────────────────────

@router.get("/admin/users")
def admin_users(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    rows = db.scalars(select(User).order_by(User.created_at)).all()
    out = []
    for u in rows:
        out.append({
            "id": u.id, "name": u.name, "email": u.email, "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None,
            "meetings": db.scalar(select(func.count()).select_from(Meeting).where(Meeting.user_id == u.id)) or 0,
            "reminders": db.scalar(select(func.count()).select_from(Reminder).where(Reminder.user_id == u.id)) or 0,
        })
    return {"users": out, "count": len(out)}


@router.patch("/admin/users/{user_id}")
def admin_update_user(
    user_id: str,
    body: dict,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    if u.id == admin.id and body.get("is_active") is False:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot deactivate your own account")

    if "is_active" in body:
        u.is_active = bool(body["is_active"])
    if "role" in body and body["role"] in ("user", "admin"):
        u.role = body["role"]
    db.commit()
    return {"success": True}
