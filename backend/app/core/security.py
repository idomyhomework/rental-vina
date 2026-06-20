# --- CORE — SECURITY (password hashing + JWT) ---

from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings

# --- Password hashing ---
# → bcrypt directly: passlib 1.7.4 is unmaintained and breaks on bcrypt >= 4.1
# → bcrypt only reads the first 72 bytes; encode then clip to stay within that
BCRYPT_MAX_BYTES = 72

# --- JWT ---
ALGORITHM = "HS256"


def _to_bcrypt_bytes(password: str) -> bytes:
    return password.encode("utf-8")[:BCRYPT_MAX_BYTES]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_to_bcrypt_bytes(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        _to_bcrypt_bytes(plain_password), hashed_password.encode("utf-8")
    )


# --- Token creation ---
def create_access_token(*, sub: str, role: str) -> str:
    # → sub is the stringified user id; role rides along to avoid a DB hit on guards
    expire = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    payload: dict[str, Any] = {"sub": sub, "role": role, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


# --- Token decoding ---
def decode_access_token(token: str) -> dict[str, Any] | None:
    # → returns None on any failure so callers raise a uniform 401
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
    except JWTError:
        return None
