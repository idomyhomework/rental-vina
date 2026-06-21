# --- AUTH — SERVICE ---

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import verify_password
from app.models.user import User


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
