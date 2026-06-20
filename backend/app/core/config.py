# --- APPLICATION — SETTINGS (pydantic-settings, loaded from .env) ---

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Database (Neon) ---
    database_url: str

    # --- Auth ---
    jwt_secret: str
    access_token_expire_minutes: int = 60
    # → secure cookies require HTTPS; keep False on localhost, True in prod
    cookie_secure: bool = False

    # --- CORS ---
    frontend_origin: str = "http://localhost:3000"

    # --- Email (Resend) ---
    resend_api_key: str = ""
    email_from: str = (
        "Alquileres Vinaros <hola@alquileresturisticosvinaros.com>"
    )

    # --- Anti-spam ---
    turnstile_secret_key: str = ""
    upstash_redis_rest_url: str = ""
    upstash_redis_rest_token: str = ""

    # --- Images ---
    cloudinary_url: str = ""

    @property
    def async_database_url(self) -> str:
        # → ensure asyncpg driver prefix and fix sslmode for asyncpg
        url = self.database_url
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        # → asyncpg uses "ssl" not "sslmode"
        url = url.replace("sslmode=require", "ssl=require")
        url = url.replace("channel_binding=require", "")
        # → clean up stray "&" or "?" leftovers
        url = url.replace("?&", "?").replace("&&", "&").rstrip("&").rstrip("?")
        return url


# --- Singleton ---
settings = Settings()  # type: ignore[call-arg]
