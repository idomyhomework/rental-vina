# --- AMENITIES — PUBLIC ROUTER ---

from typing import Literal

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.schemas.amenity import AmenityPublic
from app.services import amenity_service

router = APIRouter(prefix="/amenities", tags=["amenities"])

LOCALE = Literal["ru", "es", "en", "ua"]


# --- List all amenities (flat, single-locale) ---
@router.get("", response_model=list[AmenityPublic])
async def list_amenities(
    locale: LOCALE = "ru",
    db: AsyncSession = Depends(get_db),
) -> list[AmenityPublic]:
    items = await amenity_service.list_public(db, locale=locale)
    return [AmenityPublic(**item) for item in items]
