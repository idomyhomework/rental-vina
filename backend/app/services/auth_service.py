# --- AUTH — SERVICE ---

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password
from app.models.user import User, UserRole
from app.schemas.user import UserCreate


# --- Register ---
async def register(db: AsyncSession, payload: UserCreate) -> User:
    # → public registration is always a plain "user"; admins come from seed script
    existing = await db.scalar(select(User).where(User.email == payload.email))
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=UserRole.user,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


# --- Authenticate ---
async def authenticate(db: AsyncSession, email: str, password: str) -> User | None:
    # → returns None on unknown email OR bad password (no user-enumeration leak)
    user = await db.scalar(select(User).where(User.email == email))
    if user is None or not verify_password(password, user.hashed_password):
        return None
    return user


# --- Fetch by id ---
async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> User | None:
    return await db.get(User, user_id)
