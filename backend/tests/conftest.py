# --- TESTS — FIXTURES (Neon + per-test rollback) ---

from collections.abc import AsyncGenerator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.core.dependencies import get_db
from app.main import app

# → dedicated test engine with NullPool: pytest-asyncio gives each test its own
#   event loop, and a pooled connection bound to a closed loop raises
#   "Event loop is closed". NullPool opens a fresh connection per test instead.
test_engine = create_async_engine(settings.async_database_url, poolclass=NullPool)


# --- DB session bound to a rolled-back outer transaction ---
@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    # → open one connection with an outer transaction we never commit
    connection = await test_engine.connect()
    transaction = await connection.begin()
    # → create_savepoint makes service-level commit() land on a SAVEPOINT,
    #   so the outer transaction can still be rolled back to isolate the test
    session = AsyncSession(
        bind=connection,
        expire_on_commit=False,
        join_transaction_mode="create_savepoint",
    )
    try:
        yield session
    finally:
        await session.close()
        await transaction.rollback()
        await connection.close()


# --- HTTP client with get_db overridden to the test session ---
@pytest_asyncio.fixture
async def client(
    db_session: AsyncSession,
) -> AsyncGenerator[AsyncClient, None]:
    async def _override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
