import os
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# Ensure the API uses an isolated SQLite database during tests
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_auth.db")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")

from database import Base, engine, SessionLocal, get_db  # noqa: E402
from main import app  # noqa: E402
from models import User, UserRole  # noqa: E402
from auth import get_password_hash, verify_password  # noqa: E402
from bootstrap import ensure_default_admin  # noqa: E402
from config import settings  # noqa: E402
from utils.auth import get_user_by_username, normalize_username  # noqa: E402


def override_get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_database():
    """Reset database tables before each test."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def create_user(username: str, password: str, role: UserRole = UserRole.ADMIN) -> User:
    db = SessionLocal()
    try:
        normalized_username = normalize_username(username)
        user = get_user_by_username(db, normalized_username)
        if user is None:
            user = User(
                username=normalized_username,
                email=f"{normalized_username}@example.com",
                role=role,
                is_active=True,
                hashed_password="",
            )
            db.add(user)

        user.email = f"{normalized_username}@example.com"
        user.role = role
        user.is_active = True
        user.hashed_password = get_password_hash(password)

        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


def test_login_json_returns_token_for_valid_credentials(client: TestClient):
    create_user("admin", "admin")

    response = client.post(
        "/api/auth/login-json",
        json={"username": "admin", "password": "admin"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert "access_token" in payload
    assert payload["token_type"] == "bearer"


def test_login_json_trims_and_ignores_username_case(client: TestClient):
    create_user("admin", "admin")

    response = client.post(
        "/api/auth/login-json",
        json={"username": "  ADMIN  ", "password": "admin"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert "access_token" in payload
    assert payload["token_type"] == "bearer"


def test_login_json_rejects_invalid_credentials(client: TestClient):
    create_user("admin", "admin")

    response = client.post(
        "/api/auth/login-json",
        json={"username": "admin", "password": "wrong"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"


def test_me_endpoint_requires_valid_token(client: TestClient):
    create_user("editor", "editor", role=UserRole.EDITOR)

    login_response = client.post(
        "/api/auth/login-json",
        json={"username": "editor", "password": "editor"},
    )
    token = login_response.json()["access_token"]

    me_response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert me_response.status_code == 200
    user_payload = me_response.json()
    assert user_payload["username"] == "editor"
    assert user_payload["role"] == "editor"


def test_me_endpoint_rejects_missing_token(client: TestClient):
    response = client.get("/api/auth/me")

    # HTTPBearer returns 403 when credentials are missing
    assert response.status_code == 403
    assert response.json()["detail"] == "Not authenticated"


def test_ensure_default_admin_creates_user_when_missing():
    db = SessionLocal()
    try:
        created = ensure_default_admin(db)
        assert created is not None
        assert created.username == settings.DEFAULT_ADMIN_USERNAME.strip()

        # Calling again should be a no-op
        second_created = ensure_default_admin(db)
        assert second_created is None

        users = db.query(User).all()
        assert len(users) == 1
        assert users[0].role == UserRole.ADMIN
    finally:
        db.close()


def test_ensure_default_admin_updates_existing_credentials_when_enabled(monkeypatch):
    db = SessionLocal()
    try:
        ensure_default_admin(db)
        user = get_user_by_username(db, settings.DEFAULT_ADMIN_USERNAME)
        assert user is not None

        # Simulate drift in stored credentials
        user.email = "custom@example.com"
        user.hashed_password = get_password_hash("different")
        db.commit()

        monkeypatch.setattr(settings, "DEFAULT_ADMIN_ENSURE_CREDENTIALS", True)
        monkeypatch.setattr(settings, "DEFAULT_ADMIN_EMAIL", "admin@scheduler.local")
        monkeypatch.setattr(settings, "DEFAULT_ADMIN_PASSWORD", "admin")

        ensure_default_admin(db)
        db.refresh(user)

        assert user.email == "admin@scheduler.local"
        assert verify_password("admin", user.hashed_password)
    finally:
        db.close()


def test_ensure_default_admin_respects_disabled_sync(monkeypatch):
    db = SessionLocal()
    try:
        ensure_default_admin(db)
        user = get_user_by_username(db, settings.DEFAULT_ADMIN_USERNAME)
        assert user is not None

        user.email = "custom@example.com"
        user.hashed_password = get_password_hash("different")
        db.commit()

        monkeypatch.setattr(settings, "DEFAULT_ADMIN_ENSURE_CREDENTIALS", False)

        ensure_default_admin(db)
        db.refresh(user)

        assert user.email == "custom@example.com"
        assert verify_password("different", user.hashed_password)
    finally:
        db.close()
