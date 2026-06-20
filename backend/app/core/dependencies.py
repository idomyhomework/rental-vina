# --- CORE — DEPENDENCIES ---

import uuid

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User, UserRole
from app.services import auth_service

# → cookie that carries the JWT (httpOnly, set by the auth router)
ACCESS_TOKEN_COOKIE = "access_token"

# → re-export get_db so routers import from one place
__all__ = ["ACCESS_TOKEN_COOKIE", "get_current_user", "get_db", "require_admin"]


# --- Current user ---
async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    # → token lives in an httpOnly cookie, never the Authorization header
    token = request.cookies.get(ACCESS_TOKEN_COOKIE)
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
    )
    if not token:
        raise credentials_error

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_error

    sub = payload.get("sub")
    if not sub:
        raise credentials_error
    try:
        user_id = uuid.UUID(sub)
    except (ValueError, TypeError):
        raise credentials_error from None

    user = await auth_service.get_user_by_id(db, user_id)
    if user is None:
        raise credentials_error
    return user


# --- Admin guard ---
async def require_admin(
    user: User = Depends(get_current_user),
) -> User:
    # → deny by default; only admin/superadmin pass
    if user.role not in (UserRole.admin, UserRole.superadmin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return user
