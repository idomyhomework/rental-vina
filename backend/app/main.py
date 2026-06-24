# --- MAIN — FastAPI APPLICATION ---

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import admin, amenities, auth, properties

# --- App instance ---
app = FastAPI(
    title="Alquileres Vinaros API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Routers ---
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(properties.router)
app.include_router(amenities.router)


# --- Health check ---
@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
