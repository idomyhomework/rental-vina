# --- LOCATION — SERVICE ---

import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.location import Location, LocationTranslation
from app.schemas.location import LocationCreate, LocationUpdate


# --- Create ---
async def create(db: AsyncSession, payload: LocationCreate) -> Location:
    location = Location(slug=payload.slug)
    db.add(location)
    await db.flush()

    for t in payload.translations:
        db.add(
            LocationTranslation(
                location_id=location.id,
                locale=t.locale,
                name=t.name,
            )
        )

    await db.commit()
    return await get_by_id(db, location.id)


# --- Get by id ---
async def get_by_id(db: AsyncSession, location_id: uuid.UUID) -> Location:
    location = await db.scalar(
        select(Location)
        .options(selectinload(Location.translations))
        .where(Location.id == location_id)
    )
    if location is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found",
        )
    return location


# --- List all ---
async def list_all(
    db: AsyncSession,
    *,
    page: int = 1,
    limit: int = 50,
) -> tuple[list[Location], int]:
    count_query = select(func.count()).select_from(Location)
    total = await db.scalar(count_query) or 0

    query = (
        select(Location)
        .options(selectinload(Location.translations))
        .order_by(Location.slug)
        .offset((page - 1) * limit)
        .limit(limit)
    )
    result = await db.scalars(query)
    return list(result.all()), total


# --- Update ---
async def update(
    db: AsyncSession,
    location_id: uuid.UUID,
    payload: LocationUpdate,
) -> Location:
    location = await db.get(Location, location_id)
    if location is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found",
        )

    if payload.slug is not None:
        location.slug = payload.slug

    # --- Upsert translations ---
    if payload.translations is not None:
        existing = await db.scalars(
            select(LocationTranslation).where(
                LocationTranslation.location_id == location_id
            )
        )
        by_locale = {t.locale: t for t in existing.all()}

        for t in payload.translations:
            if t.locale in by_locale:
                by_locale[t.locale].name = t.name
            else:
                db.add(
                    LocationTranslation(
                        location_id=location_id,
                        locale=t.locale,
                        name=t.name,
                    )
                )

    await db.commit()
    return await get_by_id(db, location_id)


# --- Delete ---
async def delete(db: AsyncSession, location_id: uuid.UUID) -> None:
    location = await db.get(Location, location_id)
    if location is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found",
        )
    await db.delete(location)
    await db.commit()
