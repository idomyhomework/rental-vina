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


# --- Singleton ---
settings = Settings()  # type: ignore[call-arg]
