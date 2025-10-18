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
from auth import get_password_hash  # noqa: E402


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
        user = User(
            username=username,
            email=f"{username}@example.com",
            hashed_password=get_password_hash(password),
            role=role,
            is_active=True,
        )
        db.add(user)
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
