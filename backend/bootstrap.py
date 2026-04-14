"""Startup bootstrap helpers for the API."""

from __future__ import annotations

import logging
from typing import Optional

from sqlalchemy.orm import Session

from auth import get_password_hash, verify_password
from config import settings
from models import User, UserRole, Capacity, AssignmentType
from utils.auth import get_user_by_username, normalize_username

logger = logging.getLogger(__name__)


def ensure_default_admin(db: Session) -> Optional[User]:
    """Ensure a default administrator account exists.

    Returns the created user if a new admin is provisioned, otherwise ``None``.
    """

    username = normalize_username(settings.DEFAULT_ADMIN_USERNAME)
    if not username:
        logger.warning("DEFAULT_ADMIN_USERNAME is blank; skipping bootstrap admin creation.")
        return None

    existing_user = get_user_by_username(db, username)
    if existing_user:
        return None

    email = settings.DEFAULT_ADMIN_EMAIL or f"{username}@scheduler.local"
    password = settings.DEFAULT_ADMIN_PASSWORD
    if not password:
        logger.error("DEFAULT_ADMIN_PASSWORD is blank; cannot create default admin user.")
        return None

    admin_user = User(
        username=username,
        email=email,
        hashed_password=get_password_hash(password),
        role=UserRole.ADMIN,
        is_active=True,
    )

    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)

    logger.info("Provisioned default admin user '%s'", username)
    return admin_user


def ensure_default_capacities(db: Session) -> None:
    """Seed the Capacity table with default values if it is empty."""
    DEFAULT_CAPACITIES = [
        (AssignmentType.ULTRASOUND_MORNING,   3),
        (AssignmentType.ULTRASOUND_AFTERNOON, 3),
        (AssignmentType.XRAY,                 2),
        (AssignmentType.CT_SCAN,              1),
        (AssignmentType.MRI,                  1),
        (AssignmentType.DUTY,                 1),
    ]

    seeded = False
    for assignment_type, max_capacity in DEFAULT_CAPACITIES:
        exists = db.query(Capacity).filter(
            Capacity.assignment_type == assignment_type
        ).first()
        if not exists:
            db.add(Capacity(assignment_type=assignment_type, max_capacity=max_capacity))
            seeded = True

    if seeded:
        db.commit()
        logger.info("Seeded default capacity rows for all assignment types")

