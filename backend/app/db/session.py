# --- DATABASE — ASYNC SESSION (asyncpg + Neon) ---

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

# --- Engine ---
engine = create_async_engine(
    settings.async_database_url,
    echo=False,
    pool_pre_ping=True,
)

# --- Session factory ---
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# --- Dependency ---
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session
