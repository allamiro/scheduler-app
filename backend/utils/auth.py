"""Shared authentication helpers."""

from __future__ import annotations

from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from models import User


def normalize_username(raw_username: str) -> str:
    """Normalize incoming usernames for consistent comparisons."""
    return raw_username.strip()


def get_user_by_username(db: Session, raw_username: str) -> Optional[User]:
    """Fetch a user using a case-insensitive username lookup."""
    normalized_username = normalize_username(raw_username)
    if not normalized_username:
        return None

    return (
        db.query(User)
        .filter(func.lower(User.username) == normalized_username.lower())
        .first()
    )

