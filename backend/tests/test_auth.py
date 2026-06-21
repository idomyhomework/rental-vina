# --- TESTS — AUTH (admin-only; no public registration) ---

import uuid

from fastapi import Depends
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import ACCESS_TOKEN_COOKIE
from app.core.security import hash_password
from app.models.user import User, UserRole

PASSWORD = "supersecret"


def _unique_email() -> str:
    return f"user-{uuid.uuid4().hex[:12]}@example.com"


async def _create_user(db: AsyncSession, role: UserRole = UserRole.admin) -> User:
    # → users are seeded directly (the seed script's job); no public signup
    user = User(
        email=_unique_email(),
        hashed_password=hash_password(PASSWORD),
        role=role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


# --- Full flow: login -> me -> logout -> me rejected ---
async def test_login_and_me_flow(client: AsyncClient, db_session: AsyncSession) -> None:
    user = await _create_user(db_session)

    login = await client.post(
        "/auth/login", json={"email": user.email, "password": PASSWORD}
    )
    assert login.status_code == 200
    assert login.json()["email"] == user.email
    assert ACCESS_TOKEN_COOKIE in login.cookies

    me = await client.get("/auth/me")
    assert me.status_code == 200
    assert me.json()["email"] == user.email

    logout = await client.post("/auth/logout")
    assert logout.status_code == 200

    me_after = await client.get("/auth/me")
    assert me_after.status_code == 401


# --- Login with wrong password is rejected ---
async def test_login_wrong_password(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    user = await _create_user(db_session)
    resp = await client.post(
        "/auth/login", json={"email": user.email, "password": "wrongpassword"}
    )
    assert resp.status_code == 401


# --- Login with unknown email is rejected (no user enumeration) ---
async def test_login_unknown_email(client: AsyncClient) -> None:
    resp = await client.post(
        "/auth/login", json={"email": _unique_email(), "password": PASSWORD}
    )
    assert resp.status_code == 401


# --- /auth/me without a cookie is rejected ---
async def test_me_without_cookie(client: AsyncClient) -> None:
    resp = await client.get("/auth/me")
    assert resp.status_code == 401


# --- require_admin: non-admin users are forbidden, admins pass ---
async def test_require_admin_guard(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    from app.core.dependencies import require_admin
    from app.main import app

    # → mount a throwaway guarded route for the duration of this test
    @app.get("/_test/admin-only")
    async def _admin_only(
        _admin: User = Depends(require_admin),
    ) -> dict[str, str]:
        return {"ok": "true"}

    # plain user -> 403
    plain = await _create_user(db_session, role=UserRole.user)
    await client.post("/auth/login", json={"email": plain.email, "password": PASSWORD})
    forbidden = await client.get("/_test/admin-only")
    assert forbidden.status_code == 403

    # admin user -> 200
    admin = await _create_user(db_session, role=UserRole.admin)
    login = await client.post(
        "/auth/login", json={"email": admin.email, "password": PASSWORD}
    )
    assert login.status_code == 200
    allowed = await client.get("/_test/admin-only")
    assert allowed.status_code == 200
