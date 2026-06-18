# --- CORE — DEPENDENCIES ---

from app.db.session import get_db

# → re-export get_db so routers import from one place
__all__ = ["get_db"]
