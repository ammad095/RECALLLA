"""
Who is the agent acting for?

Tool functions are called by the model with exactly the arguments in their JSON
schema, so there is no natural place to pass "and do this as user X" — and
adding a user_id parameter would invite the model to invent one.

A context variable carries the caller instead. The request handler sets it, the
tools read it, and because ContextVar is per-task it stays correct when several
requests are in flight at once.
"""

from contextvars import ContextVar
from typing import Optional

_current_user_id: ContextVar[Optional[str]] = ContextVar("recalla_user_id", default=None)


def set_current_user(user_id: Optional[str]):
    """Set the acting user. Returns a token for reset()."""
    return _current_user_id.set(user_id)


def get_current_user_id() -> Optional[str]:
    return _current_user_id.get()


def reset_current_user(token) -> None:
    try:
        _current_user_id.reset(token)
    except (ValueError, LookupError):
        pass


class acting_as:
    """with acting_as(user.id): ... — scopes tool calls to one account."""

    def __init__(self, user_id: Optional[str]):
        self.user_id = user_id
        self._token = None

    def __enter__(self):
        self._token = set_current_user(self.user_id)
        return self

    def __exit__(self, *exc):
        reset_current_user(self._token)
        return False


# ── Which door did this request come through? ────────────────────────────────
#
# Desktop tools act on the machine running the backend. That is the right
# behaviour from the web app on that machine, and the wrong behaviour from a
# WhatsApp message — "create a folder" would appear to succeed somewhere the
# sender cannot see. Channel travels the same way the user does, and the agent
# filters its tool list with it.

_current_channel: ContextVar[str] = ContextVar("recalla_channel", default="web")


def get_current_channel() -> str:
    return _current_channel.get()


class on_channel:
    """with on_channel("whatsapp"): ... — restricts tools to remote-safe ones."""

    def __init__(self, channel: str):
        self.channel = channel or "web"
        self._token = None

    def __enter__(self):
        self._token = _current_channel.set(self.channel)
        return self

    def __exit__(self, *exc):
        try:
            _current_channel.reset(self._token)
        except (ValueError, LookupError):
            pass
        return False
