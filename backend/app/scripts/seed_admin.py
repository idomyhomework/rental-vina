# --- SCRIPTS — SEED ADMIN ---

# → run: python -m app.scripts.seed_admin <email> <password>
#   or set SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD env vars

import asyncio
import os
import sys

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import async_session
from app.models.user import User, UserRole


async def seed_admin(email: str, password: str) -> None:
    email = email.strip().lower()
    async with async_session() as db:
        existing = await db.scalar(select(User).where(User.email == email))
        if existing is not None:
            # → idempotent: promote an existing account instead of erroring
            existing.role = UserRole.superadmin
            existing.hashed_password = hash_password(password)
            await db.commit()
            print(f"Updated existing user '{email}' to superadmin.")
            return

        admin = User(
            email=email,
            hashed_password=hash_password(password),
            role=UserRole.superadmin,
        )
        db.add(admin)
        await db.commit()
        print(f"Created superadmin '{email}'.")


def main() -> None:
    email = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("SEED_ADMIN_EMAIL")
    password = (
        sys.argv[2] if len(sys.argv) > 2 else os.environ.get("SEED_ADMIN_PASSWORD")
    )
    if not email or not password:
        print(
            "Usage: python -m app.scripts.seed_admin <email> <password>",
            file=sys.stderr,
        )
        raise SystemExit(1)
    asyncio.run(seed_admin(email, password))


if __name__ == "__main__":
    main()
