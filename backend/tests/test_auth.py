# --- TESTS — AUTH ---

import uuid

from fastapi import Depends
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import ACCESS_TOKEN_COOKIE
from app.core.security import hash_password
from app.models.user import User, UserRole


def _unique_email() -> str:
    return f"user-{uuid.uuid4().hex[:12]}@example.com"


# --- Register sets cookie and returns the new user ---
async def test_register_sets_cookie(client: AsyncClient) -> None:
    email = _unique_email()
    resp = await client.post(
        "/auth/register", json={"email": email, "password": "supersecret"}
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["email"] == email
    assert body["role"] == "user"
    assert ACCESS_TOKEN_COOKIE in resp.cookies


# --- Duplicate email is rejected ---
async def test_register_duplicate_email(client: AsyncClient) -> None:
    email = _unique_email()
    payload = {"email": email, "password": "supersecret"}
    first = await client.post("/auth/register", json=payload)
    assert first.status_code == 201
    second = await client.post("/auth/register", json=payload)
    assert second.status_code == 409


# --- Full flow: register -> me -> logout -> me rejected ---
async def test_login_and_me_flow(client: AsyncClient) -> None:
    email = _unique_email()
    password = "supersecret"
    await client.post("/auth/register", json={"email": email, "password": password})

    me = await client.get("/auth/me")
    assert me.status_code == 200
    assert me.json()["email"] == email

    logout = await client.post("/auth/logout")
    assert logout.status_code == 200

    me_after = await client.get("/auth/me")
    assert me_after.status_code == 401


# --- Login with wrong password is rejected ---
async def test_login_wrong_password(client: AsyncClient) -> None:
    email = _unique_email()
    await client.post(
        "/auth/register", json={"email": email, "password": "supersecret"}
    )
    await client.post("/auth/logout")

    resp = await client.post(
        "/auth/login", json={"email": email, "password": "wrongpassword"}
    )
    assert resp.status_code == 401


# --- /auth/me without a cookie is rejected ---
async def test_me_without_cookie(client: AsyncClient) -> None:
    resp = await client.get("/auth/me")
    assert resp.status_code == 401


# --- require_admin: plain users are forbidden, admins pass ---
async def test_require_admin_guard(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    from app.core.dependencies import require_admin
    from app.main import app

    # → mount a throwaway guarded route for the duration of this test
    @app.get("/_test/admin-only")
    async def _admin_only(_admin: User = Depends(require_admin)) -> dict[str, str]:
        return {"ok": "true"}

    # plain user -> 403
    user_email = _unique_email()
    await client.post(
        "/auth/register", json={"email": user_email, "password": "supersecret"}
    )
    forbidden = await client.get("/_test/admin-only")
    assert forbidden.status_code == 403

    # admin user -> 200
    admin = User(
        email=_unique_email(),
        hashed_password=hash_password("supersecret"),
        role=UserRole.admin,
    )
    db_session.add(admin)
    await db_session.commit()

    login = await client.post(
        "/auth/login",
        json={"email": admin.email, "password": "supersecret"},
    )
    assert login.status_code == 200
    allowed = await client.get("/_test/admin-only")
    assert allowed.status_code == 200
