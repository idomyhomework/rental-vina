# --- PROPERTIES — PUBLIC ROUTER ---

import math
import uuid
from decimal import Decimal
from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.models.property import PropertyKind
from app.schemas.common import PaginatedResponse
from app.schemas.property import PropertyDetailPublic, PropertyList
from app.services import property_service

router = APIRouter(prefix="/properties", tags=["properties"])

LOCALE = Literal["ru", "es", "en", "ua"]


# --- Catalog (paginated, filtered) ---
@router.get("", response_model=PaginatedResponse[PropertyList])
async def list_properties(
    locale: LOCALE = "ru",
    kind: PropertyKind = PropertyKind.rental,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    location_id: uuid.UUID | None = None,
    bedrooms: int | None = Query(None, ge=0),
    guests: int | None = Query(None, ge=1),
    min_price: Decimal | None = Query(None, ge=0),
    max_price: Decimal | None = Query(None, ge=0),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[PropertyList]:
    items, total = await property_service.list_published(
        db,
        locale=locale,
        kind=kind,
        page=page,
        limit=limit,
        location_id=location_id,
        bedrooms=bedrooms,
        guests=guests,
        min_price=min_price,
        max_price=max_price,
    )
    return PaginatedResponse[PropertyList](
        items=[PropertyList(**item) for item in items],
        total=total,
        page=page,
        limit=limit,
        pages=math.ceil(total / limit) if total else 0,
    )


# --- Detail by slug ---
@router.get("/{slug}", response_model=PropertyDetailPublic)
async def get_property_by_slug(
    slug: str,
    locale: LOCALE = "ru",
    db: AsyncSession = Depends(get_db),
) -> PropertyDetailPublic:
    data = await property_service.get_by_slug(db, slug, locale)
    return PropertyDetailPublic(**data)
