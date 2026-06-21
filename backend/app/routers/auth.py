# --- AUTH — ROUTER ---

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.dependencies import (
    ACCESS_TOKEN_COOKIE,
    get_current_user,
    get_db,
)
from app.core.security import create_access_token
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.user import UserLogin, UserRead
from app.services import auth_service

# → admin-only auth: there is no public registration; admins are provisioned
#   via app/scripts/seed_admin.py. Only login/logout/me are exposed.
router = APIRouter(prefix="/auth", tags=["auth"])


# --- Cookie helper ---
def _set_auth_cookie(response: Response, user: User) -> None:
    # → httpOnly so JS can't read it; SameSite=Strict blocks cross-site CSRF on
    #   the cookie-authenticated admin mutations (no cross-site top-nav flows here)
    token = create_access_token(sub=str(user.id), role=user.role.value)
    response.set_cookie(
        key=ACCESS_TOKEN_COOKIE,
        value=token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="strict",
        max_age=settings.access_token_expire_minutes * 60,
        path="/",
    )


# --- Login ---
@router.post("/login", response_model=UserRead)
async def login(
    payload: UserLogin,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> User:
    user = await auth_service.authenticate(db, payload.email, payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    _set_auth_cookie(response, user)
    return user


# --- Logout ---
@router.post("/logout", response_model=MessageResponse)
async def logout(response: Response) -> MessageResponse:
    # → clear with matching attributes so the browser actually drops it
    response.delete_cookie(
        key=ACCESS_TOKEN_COOKIE,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="strict",
        path="/",
    )
    return MessageResponse(message="Logged out")


# --- Current user ---
@router.get("/me", response_model=UserRead)
async def me(user: User = Depends(get_current_user)) -> User:
    return user
