# --- PROPERTY — SERVICE ---

import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.amenity import PropertyAmenity
from app.models.property import Property, PropertyKind, PropertyStatus
from app.models.property_image import PropertyImage
from app.models.property_translation import PropertyTranslation
from app.schemas.property import PropertyCreate, PropertyUpdate


# --- Create ---
async def create(db: AsyncSession, payload: PropertyCreate) -> Property:
    prop = Property(
        kind=payload.kind,
        status=PropertyStatus.draft,
        bedrooms=payload.bedrooms,
        guests=payload.guests,
        price_per_night=payload.price_per_night,
        sale_price=payload.sale_price,
        location=payload.location,
        lat=payload.lat,
        lng=payload.lng,
    )
    db.add(prop)
    await db.flush()

    # --- Translations ---
    for t in payload.translations:
        db.add(
            PropertyTranslation(
                property_id=prop.id,
                locale=t.locale,
                title=t.title,
                slug=t.slug,
                description=t.description,
                meta_title=t.meta_title,
                meta_description=t.meta_description,
            )
        )

    # --- Amenity links ---
    for amenity_id in payload.amenity_ids:
        db.add(PropertyAmenity(property_id=prop.id, amenity_id=amenity_id))

    await db.commit()
    return await get_by_id(db, prop.id)


# --- Get by id ---
async def get_by_id(db: AsyncSession, property_id: uuid.UUID) -> Property:
    prop = await db.scalar(
        select(Property)
        .options(
            selectinload(Property.translations),
            selectinload(Property.images),
            selectinload(Property.amenities).selectinload(PropertyAmenity.amenity),
        )
        .where(Property.id == property_id)
    )
    if prop is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found",
        )
    return prop


# --- List all (admin — includes drafts) ---
async def list_all(
    db: AsyncSession,
    *,
    page: int = 1,
    limit: int = 20,
    kind: PropertyKind | None = None,
    status_filter: PropertyStatus | None = None,
) -> tuple[list[Property], int]:
    query = select(Property).options(
        selectinload(Property.translations),
        selectinload(Property.images),
    )
    count_query = select(func.count()).select_from(Property)

    if kind is not None:
        query = query.where(Property.kind == kind)
        count_query = count_query.where(Property.kind == kind)
    if status_filter is not None:
        query = query.where(Property.status == status_filter)
        count_query = count_query.where(Property.status == status_filter)

    query = query.order_by(Property.created_at.desc())
    query = query.offset((page - 1) * limit).limit(limit)

    total = await db.scalar(count_query) or 0
    result = await db.scalars(query)
    return list(result.all()), total


# --- Update (partial) ---
async def update(
    db: AsyncSession,
    property_id: uuid.UUID,
    payload: PropertyUpdate,
) -> Property:
    prop = await db.get(Property, property_id)
    if prop is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found",
        )

    # --- Scalar fields (allowlist prevents mass assignment) ---
    _MUTABLE_FIELDS = {
        "kind",
        "status",
        "bedrooms",
        "guests",
        "price_per_night",
        "sale_price",
        "location",
        "lat",
        "lng",
    }
    update_data = payload.model_dump(
        exclude_unset=True,
        include=_MUTABLE_FIELDS,
    )
    for field, value in update_data.items():
        setattr(prop, field, value)

    # --- Upsert translations ---
    if payload.translations is not None:
        existing = await db.scalars(
            select(PropertyTranslation).where(
                PropertyTranslation.property_id == property_id
            )
        )
        by_locale = {t.locale: t for t in existing.all()}

        for t in payload.translations:
            if t.locale in by_locale:
                row = by_locale[t.locale]
                row.title = t.title
                row.slug = t.slug
                row.description = t.description
                row.meta_title = t.meta_title
                row.meta_description = t.meta_description
            else:
                db.add(
                    PropertyTranslation(
                        property_id=property_id,
                        locale=t.locale,
                        title=t.title,
                        slug=t.slug,
                        description=t.description,
                        meta_title=t.meta_title,
                        meta_description=t.meta_description,
                    )
                )

    # --- Sync amenity links ---
    if payload.amenity_ids is not None:
        existing_links = await db.scalars(
            select(PropertyAmenity).where(PropertyAmenity.property_id == property_id)
        )
        current_ids = {link.amenity_id for link in existing_links.all()}
        desired_ids = set(payload.amenity_ids)

        # → remove links no longer wanted
        for aid in current_ids - desired_ids:
            link = await db.scalar(
                select(PropertyAmenity).where(
                    PropertyAmenity.property_id == property_id,
                    PropertyAmenity.amenity_id == aid,
                )
            )
            if link:
                await db.delete(link)

        # → add new links
        for aid in desired_ids - current_ids:
            db.add(PropertyAmenity(property_id=property_id, amenity_id=aid))

    await db.commit()
    return await get_by_id(db, property_id)


# --- Delete ---
async def delete(db: AsyncSession, property_id: uuid.UUID) -> None:
    prop = await db.get(Property, property_id)
    if prop is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found",
        )
    await db.delete(prop)
    await db.commit()


# --- Add image record ---
async def add_image(
    db: AsyncSession,
    property_id: uuid.UUID,
    *,
    url: str,
    public_id: str | None,
    position: int,
    is_main: bool = False,
) -> PropertyImage:
    # → verify property exists
    prop = await db.get(Property, property_id)
    if prop is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found",
        )

    # → if marking as main, unset any existing main
    if is_main:
        await _unset_main_image(db, property_id)

    image = PropertyImage(
        property_id=property_id,
        url=url,
        public_id=public_id,
        position=position,
        is_main=is_main,
    )
    db.add(image)
    await db.commit()
    await db.refresh(image)
    return image


# --- Reorder images + set main ---
async def reorder_images(
    db: AsyncSession,
    property_id: uuid.UUID,
    ordered_ids: list[uuid.UUID],
    main_image_id: uuid.UUID | None = None,
) -> list[PropertyImage]:
    images = await db.scalars(
        select(PropertyImage).where(PropertyImage.property_id == property_id)
    )
    by_id = {img.id: img for img in images.all()}

    for position, img_id in enumerate(ordered_ids):
        if img_id not in by_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Image {img_id} does not belong to this property",
            )
        by_id[img_id].position = position
        by_id[img_id].is_main = img_id == main_image_id

    await db.commit()

    result = await db.scalars(
        select(PropertyImage)
        .where(PropertyImage.property_id == property_id)
        .order_by(PropertyImage.position)
    )
    return list(result.all())


# --- Delete image ---
async def delete_image(
    db: AsyncSession,
    property_id: uuid.UUID,
    image_id: uuid.UUID,
) -> str | None:
    image = await db.scalar(
        select(PropertyImage).where(
            PropertyImage.id == image_id,
            PropertyImage.property_id == property_id,
        )
    )
    if image is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )
    # → return public_id so caller can delete from Cloudinary
    public_id = image.public_id
    await db.delete(image)
    await db.commit()
    return public_id


# --- Internal: unset main flag ---
async def _unset_main_image(db: AsyncSession, property_id: uuid.UUID) -> None:
    images = await db.scalars(
        select(PropertyImage).where(
            PropertyImage.property_id == property_id,
            PropertyImage.is_main.is_(True),
        )
    )
    for img in images.all():
        img.is_main = False
