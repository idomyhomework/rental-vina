# --- AMENITY — SERVICE ---

import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.amenity import Amenity, AmenityTranslation
from app.schemas.amenity import AmenityCreate, AmenityUpdate


# --- Create ---
async def create(db: AsyncSession, payload: AmenityCreate) -> Amenity:
    amenity = Amenity(icon=payload.icon)
    db.add(amenity)
    await db.flush()

    for t in payload.translations:
        db.add(
            AmenityTranslation(
                amenity_id=amenity.id,
                locale=t.locale,
                name=t.name,
            )
        )

    await db.commit()
    return await get_by_id(db, amenity.id)


# --- Get by id ---
async def get_by_id(db: AsyncSession, amenity_id: uuid.UUID) -> Amenity:
    amenity = await db.scalar(
        select(Amenity)
        .options(selectinload(Amenity.translations))
        .where(Amenity.id == amenity_id)
    )
    if amenity is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Amenity not found",
        )
    return amenity


# --- List all ---
async def list_all(
    db: AsyncSession,
    *,
    page: int = 1,
    limit: int = 50,
) -> tuple[list[Amenity], int]:
    count_query = select(func.count()).select_from(Amenity)
    total = await db.scalar(count_query) or 0

    query = (
        select(Amenity)
        .options(selectinload(Amenity.translations))
        .offset((page - 1) * limit)
        .limit(limit)
    )
    result = await db.scalars(query)
    return list(result.all()), total


# --- Update ---
async def update(
    db: AsyncSession,
    amenity_id: uuid.UUID,
    payload: AmenityUpdate,
) -> Amenity:
    amenity = await db.get(Amenity, amenity_id)
    if amenity is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Amenity not found",
        )

    if payload.icon is not None:
        amenity.icon = payload.icon

    # --- Upsert translations ---
    if payload.translations is not None:
        existing = await db.scalars(
            select(AmenityTranslation).where(
                AmenityTranslation.amenity_id == amenity_id
            )
        )
        by_locale = {t.locale: t for t in existing.all()}

        for t in payload.translations:
            if t.locale in by_locale:
                by_locale[t.locale].name = t.name
            else:
                db.add(
                    AmenityTranslation(
                        amenity_id=amenity_id,
                        locale=t.locale,
                        name=t.name,
                    )
                )

    await db.commit()
    return await get_by_id(db, amenity_id)


# --- Delete ---
async def delete(db: AsyncSession, amenity_id: uuid.UUID) -> None:
    amenity = await db.get(Amenity, amenity_id)
    if amenity is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Amenity not found",
        )
    await db.delete(amenity)
    await db.commit()
