"""
SQLAlchemy models for Recalla.

Everything a user owns hangs off `users` via `user_id`, so queries can be
scoped per account and one user can never see another's meetings.

Written against SQLAlchemy 2.0 typed mappings. Types are kept portable
(UUID/JSON/DateTime) so the same models work on SQLite if the database is
ever switched via DATABASE_URL.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional, List

from sqlalchemy import (
    String, Text, Integer, Float, Boolean, DateTime, ForeignKey, Index, func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.types import JSON
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


# JSONB on Postgres, plain JSON elsewhere.
JSONType = JSON().with_variant(JSONB(), "postgresql")


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id:            Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    email:         Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name:          Mapped[str] = mapped_column(String(120), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role:          Mapped[str] = mapped_column(String(20), default="user", nullable=False)  # user | admin
    is_active:     Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at:    Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, server_default=func.now())
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    meetings:  Mapped[List["Meeting"]]  = relationship(back_populates="user", cascade="all, delete-orphan")
    reminders: Mapped[List["Reminder"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    settings:  Mapped[Optional["UserSettings"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", uselist=False,
    )

    def __repr__(self) -> str:
        return f"<User {self.email} ({self.role})>"


class Meeting(Base):
    __tablename__ = "meetings"

    id:      Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)

    title:        Mapped[str] = mapped_column(String(300), default="Untitled Meeting", nullable=False)
    meeting_type: Mapped[str] = mapped_column(String(60), default="Team Meeting", nullable=False)

    started_at:       Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    duration_seconds: Mapped[float] = mapped_column(Float, default=0.0)
    language:         Mapped[str] = mapped_column(String(12), default="en")
    word_count:       Mapped[int] = mapped_column(Integer, default=0)

    full_text:  Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    summary:    Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    key_points: Mapped[Optional[list]] = mapped_column(JSONType, nullable=True)

    # Structured extraction. The same items are also written to `memories` so
    # they are searchable; these columns hold the shape the UI renders from —
    # assignee, deadline and priority, which a flat memory chunk cannot carry.
    action_items: Mapped[Optional[list]] = mapped_column(JSONType, nullable=True)
    decisions:    Mapped[Optional[list]] = mapped_column(JSONType, nullable=True)

    # Which pipeline produced this, and how good the transcript currently is.
    source:            Mapped[str] = mapped_column(String(20), default="live")   # live | upload
    transcript_model:  Mapped[str] = mapped_column(String(20), default="base")   # base | small
    refine_status:     Mapped[str] = mapped_column(String(20), default="none")   # none | running | done | error
    live_session_id:   Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    user:     Mapped["User"] = relationship(back_populates="meetings")
    segments: Mapped[List["Segment"]] = relationship(
        back_populates="meeting", cascade="all, delete-orphan", order_by="Segment.idx",
    )
    tags:     Mapped[List["Tag"]] = relationship(back_populates="meeting", cascade="all, delete-orphan")
    memories: Mapped[List["Memory"]] = relationship(back_populates="meeting", cascade="all, delete-orphan")

    __table_args__ = (Index("ix_meetings_user_started", "user_id", "started_at"),)

    def __repr__(self) -> str:
        return f"<Meeting {self.title!r}>"


class Segment(Base):
    """One transcript line, with its speaker and position in the recording."""
    __tablename__ = "segments"

    id:         Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    meeting_id: Mapped[str] = mapped_column(ForeignKey("meetings.id", ondelete="CASCADE"), index=True, nullable=False)

    idx:     Mapped[int] = mapped_column(Integer, nullable=False)
    start_s: Mapped[float] = mapped_column(Float, nullable=False)
    end_s:   Mapped[float] = mapped_column(Float, nullable=False)
    speaker: Mapped[str] = mapped_column(String(60), default="Speaker 1")
    text:    Mapped[str] = mapped_column(Text, nullable=False)

    meeting: Mapped["Meeting"] = relationship(back_populates="segments")

    __table_args__ = (Index("ix_segments_meeting_idx", "meeting_id", "idx"),)


class Tag(Base):
    """
    Flat store for everything the tagger produces.

    `kind` is one of: auto_tag, person, org, date, topic, task, decision,
    deadline, question — one table rather than nine keeps querying simple.
    """
    __tablename__ = "tags"

    id:         Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    meeting_id: Mapped[str] = mapped_column(ForeignKey("meetings.id", ondelete="CASCADE"), index=True, nullable=False)

    kind:  Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    value: Mapped[str] = mapped_column(Text, nullable=False)

    meeting: Mapped["Meeting"] = relationship(back_populates="tags")

    __table_args__ = (Index("ix_tags_meeting_kind", "meeting_id", "kind"),)


class Reminder(Base):
    __tablename__ = "reminders"

    id:      Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    meeting_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("meetings.id", ondelete="SET NULL"), nullable=True, index=True,
    )

    title:    Mapped[str] = mapped_column(String(300), nullable=False)
    due_at:   Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    priority: Mapped[str] = mapped_column(String(20), default="medium")
    category: Mapped[str] = mapped_column(String(60), default="general")
    notes:    Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    completed:    Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # When the scheduler actually delivered this, and whether the user has seen
    # it. These live in the database rather than in memory on purpose: a
    # restart would otherwise re-fire every reminder already delivered.
    notified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    seen_at:     Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at:   Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="reminders")

    __table_args__ = (Index("ix_reminders_user_completed", "user_id", "completed"),)


class Memory(Base):
    """
    A chunk of meeting text prepared for semantic search.

    The vector itself lives in ChromaDB; `vector_id` is the handle. Keeping the
    text here means search results can be rendered without a second lookup, and
    the index can be rebuilt from Postgres if Chroma is ever lost.
    """
    __tablename__ = "memories"

    id:         Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id:    Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    meeting_id: Mapped[str] = mapped_column(ForeignKey("meetings.id", ondelete="CASCADE"), index=True, nullable=False)

    chunk_index: Mapped[int] = mapped_column(Integer, default=0)
    text:        Mapped[str] = mapped_column(Text, nullable=False)
    kind:        Mapped[str] = mapped_column(String(20), default="transcript")  # transcript | decision | task | note
    start_s:     Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    speaker:     Mapped[Optional[str]] = mapped_column(String(60), nullable=True)

    vector_id:  Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    embedded:   Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, server_default=func.now())

    meeting: Mapped["Meeting"] = relationship(back_populates="memories")


class UserSettings(Base):
    """
    Per-user preferences.

    Deliberately excludes engine knobs (model size, diarization on/off,
    whether to store transcripts). Those are not decisions an end user should
    have to make — Recalla always transcribes at the best quality it can,
    always identifies speakers, and always saves the transcript.
    """
    __tablename__ = "user_settings"

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True,
    )

    # Appearance
    theme: Mapped[str] = mapped_column(String(10), default="system")   # system | light | dark

    # Meetings
    default_meeting_type: Mapped[str] = mapped_column(String(60), default="Team Meeting")
    spoken_language:      Mapped[str] = mapped_column(String(12), default="auto")  # auto | en | ur
    auto_summary:         Mapped[bool] = mapped_column(Boolean, default=True)

    # Notifications
    notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    notification_sound:    Mapped[bool] = mapped_column(Boolean, default=True)
    reminder_lead_minutes: Mapped[int]  = mapped_column(Integer, default=10)

    # Reminders are stored in UTC and shown in the user's own zone. Without
    # this a 3pm Karachi reminder announces itself as "due 10:00 UTC", which
    # is correct and useless.
    timezone_name: Mapped[str] = mapped_column(String(48), default="Asia/Karachi")

    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    user: Mapped["User"] = relationship(back_populates="settings")


class UserConnection(Base):
    """
    A third-party account linked to a Recalla user.

    Tokens live here, per user, rather than in .env. That is what lets an end
    user press "Connect" and be done: the developer registers the OAuth client
    once, and each user's own tokens are stored against their row.
    """
    __tablename__ = "user_connections"

    id:       Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id:  Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    provider: Mapped[str] = mapped_column(String(40), nullable=False, index=True)  # google | slack | notion ...

    account_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    account_name:  Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    access_token:  Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    refresh_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    expires_at:    Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    scopes:        Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    connected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, server_default=func.now())
    last_used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("ix_connection_user_provider", "user_id", "provider", unique=True),
        # One phone number maps to exactly one account. Without this a second
        # user could link the same WhatsApp number and the reverse lookup used
        # by the webhook would silently pick whichever row came back first.
        Index("ix_connection_provider_account", "provider", "account_name", unique=True),
    )


class EmailDraft(Base):
    __tablename__ = "email_drafts"

    id:      Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)

    to:      Mapped[str] = mapped_column(String(500), nullable=False)
    cc:      Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    subject: Mapped[str] = mapped_column(String(400), default="")
    body:    Mapped[str] = mapped_column(Text, default="")

    status:     Mapped[str] = mapped_column(String(20), default="draft", index=True)  # draft | sent | cancelled
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, server_default=func.now())
    sent_at:    Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    gmail_id:   Mapped[Optional[str]] = mapped_column(String(120), nullable=True)


class ChatSession(Base):
    """
    One conversation in Ask Recalla.

    Sessions are kept so a user can come back to what they asked last week
    rather than losing it on refresh. The title is derived from the opening
    message; the user can rename it.
    """
    __tablename__ = "chat_sessions"

    id:      Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)

    title: Mapped[str] = mapped_column(String(200), default="New chat")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, server_default=func.now(), onupdate=_now, index=True
    )

    messages: Mapped[List["ChatMessage"]] = relationship(
        back_populates="session", cascade="all, delete-orphan",
        order_by="ChatMessage.idx",
    )

    __table_args__ = (Index("ix_chat_session_user_updated", "user_id", "updated_at"),)


class ChatMessage(Base):
    """
    A single turn. `actions` holds the tool calls the agent made on this turn,
    so reopening a session redraws its email drafts and reminder cards instead
    of leaving bare text where a Send button used to be.
    """
    __tablename__ = "chat_messages"

    id:         Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    session_id: Mapped[str] = mapped_column(ForeignKey("chat_sessions.id", ondelete="CASCADE"), index=True, nullable=False)

    idx:     Mapped[int] = mapped_column(Integer, default=0)
    role:    Mapped[str] = mapped_column(String(20), nullable=False)   # user | assistant
    content: Mapped[str] = mapped_column(Text, default="")
    actions: Mapped[Optional[list]] = mapped_column(JSONType, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, server_default=func.now())

    session: Mapped["ChatSession"] = relationship(back_populates="messages")
