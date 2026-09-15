"""
Password hashing and JWT handling.

Argon2id is used for passwords (it is the current password-hashing
competition winner and the OWASP default recommendation). Tokens come in two
flavours: a short-lived access token sent with every request, and a long-lived
refresh token used only to mint new access tokens.
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_MINUTES = int(os.getenv("ACCESS_TOKEN_MINUTES", "30"))
REFRESH_TOKEN_DAYS   = int(os.getenv("REFRESH_TOKEN_DAYS", "14"))

if not JWT_SECRET:
    # Never fall back to a hardcoded secret — that would silently make every
    # deployment forgeable.
    raise RuntimeError(
        "JWT_SECRET is not set. Add it to recalla-backend/.env:\n"
        "  python -c \"import secrets; print('JWT_SECRET=' + secrets.token_urlsafe(48))\""
    )

_hasher = PasswordHasher()


# ── Passwords ────────────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    return _hasher.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        _hasher.verify(hashed, plain)
        return True
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def needs_rehash(hashed: str) -> bool:
    """True when the stored hash used weaker parameters than we now use."""
    try:
        return _hasher.check_needs_rehash(hashed)
    except Exception:
        return False


def password_problems(password: str) -> Optional[str]:
    """Return a human-readable reason the password is unacceptable, else None."""
    if len(password) < 8:
        return "Password must be at least 8 characters"
    if not any(c.isalpha() for c in password):
        return "Password must contain a letter"
    if not any(c.isdigit() for c in password):
        return "Password must contain a number"
    return None


# ── Tokens ───────────────────────────────────────────────────────────────────

def _create_token(subject: str, token_type: str, expires: timedelta, **claims) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "type": token_type,
        "iat": now,
        "exp": now + expires,
        **claims,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_access_token(user_id: str, role: str = "user") -> str:
    return _create_token(user_id, "access", timedelta(minutes=ACCESS_TOKEN_MINUTES), role=role)


def create_refresh_token(user_id: str) -> str:
    return _create_token(user_id, "refresh", timedelta(days=REFRESH_TOKEN_DAYS))


def decode_token(token: str, expected_type: str = "access") -> dict:
    """
    Decode and validate a token.

    Raises jwt.InvalidTokenError (or a subclass such as ExpiredSignatureError)
    if the token is bad, expired, or of the wrong type — callers turn that into
    a 401.
    """
    payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    if payload.get("type") != expected_type:
        raise jwt.InvalidTokenError(
            f"Expected a {expected_type} token, got {payload.get('type')!r}"
        )
    return payload


def access_token_seconds() -> int:
    return ACCESS_TOKEN_MINUTES * 60
