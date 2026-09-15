"""Registration, login, token refresh, and profile endpoints."""

from datetime import datetime, timezone

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from db.session import get_db
from db.models import User
from auth.security import (
    hash_password, verify_password, needs_rehash, password_problems,
    create_access_token, create_refresh_token, decode_token, access_token_seconds,
)
from auth.deps import get_current_user

router = APIRouter()


# ── Schemas ──────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name:     str = Field(min_length=1, max_length=120)
    email:    EmailStr
    password: str = Field(min_length=8, max_length=200)


class LoginRequest(BaseModel):
    email:    EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut


class UpdateProfileRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    current_password: str | None = None
    new_password: str | None = Field(default=None, min_length=8, max_length=200)


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    email = body.email.lower().strip()

    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with that email already exists")

    problem = password_problems(body.password)
    if problem:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, problem)

    # First account to be created becomes the admin — otherwise a fresh install
    # has no way to reach the admin panel.
    is_first = db.scalar(select(func.count()).select_from(User)) == 0

    user = User(
        name=body.name.strip(),
        email=email,
        password_hash=hash_password(body.password),
        role="admin" if is_first else "user",
        last_login_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return _tokens_for(user)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    email = body.email.lower().strip()
    user = db.scalar(select(User).where(User.email == email))

    # Same message and roughly the same work either way, so the response does
    # not reveal whether an account exists.
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")

    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account is deactivated")

    # Transparently upgrade hashes if the Argon2 parameters have changed.
    if needs_rehash(user.password_hash):
        user.password_hash = hash_password(body.password)

    user.last_login_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)

    return _tokens_for(user)


@router.post("/refresh", response_model=TokenResponse)
def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    try:
        payload = decode_token(body.refresh_token, expected_type="refresh")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh token expired, please sign in again")
    except jwt.InvalidTokenError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token")

    user = db.get(User, payload.get("sub"))
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User no longer active")

    return _tokens_for(user)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserOut)
def update_me(
    body: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.name:
        user.name = body.name.strip()

    if body.new_password:
        if not body.current_password:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Current password is required to set a new one")
        if not verify_password(body.current_password, user.password_hash):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Current password is incorrect")
        problem = password_problems(body.new_password)
        if problem:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, problem)
        user.password_hash = hash_password(body.new_password)

    db.commit()
    db.refresh(user)
    return user


def _tokens_for(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(user.id, user.role),
        refresh_token=create_refresh_token(user.id),
        expires_in=access_token_seconds(),
        user=UserOut.model_validate(user),
    )
