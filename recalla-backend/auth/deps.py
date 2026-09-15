"""FastAPI dependencies for resolving the caller from a bearer token."""

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from db.session import get_db
from db.models import User
from auth.security import decode_token

# auto_error=False so we can return our own 401 body rather than Starlette's.
bearer = HTTPBearer(auto_error=False)

_UNAUTHORIZED = {"WWW-Authenticate": "Bearer"}


def _401(detail: str) -> HTTPException:
    return HTTPException(status.HTTP_401_UNAUTHORIZED, detail, headers=_UNAUTHORIZED)


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if creds is None:
        raise _401("Not authenticated")

    try:
        payload = decode_token(creds.credentials, expected_type="access")
    except jwt.ExpiredSignatureError:
        raise _401("Access token expired")
    except jwt.InvalidTokenError:
        raise _401("Invalid access token")

    user = db.get(User, payload.get("sub"))
    if user is None:
        raise _401("User no longer exists")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account is deactivated")

    return user


def get_current_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin access required")
    return user


def get_optional_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> User | None:
    """For endpoints that work signed-out but personalise when signed in."""
    if creds is None:
        return None
    try:
        payload = decode_token(creds.credentials, expected_type="access")
        user = db.get(User, payload.get("sub"))
        return user if user and user.is_active else None
    except jwt.InvalidTokenError:
        return None
