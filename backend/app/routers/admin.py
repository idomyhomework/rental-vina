# --- ADMIN — ROUTER ---

import math
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, require_admin
from app.models.property import PropertyKind, PropertyStatus
from app.schemas.amenity import AmenityCreate, AmenityRead, AmenityUpdate
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.property import (
    ImageReorder,
    PropertyCreate,
    PropertyImageAdmin,
    PropertyReadAdmin,
    PropertyUpdate,
)
from app.services import amenity_service, cloudinary_service, property_service

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_admin)],
)


# ============================================================
#  Properties
# ============================================================


# --- Create property ---
@router.post(
    "/properties",
    response_model=PropertyReadAdmin,
    status_code=status.HTTP_201_CREATED,
)
async def create_property(
    payload: PropertyCreate,
    db: AsyncSession = Depends(get_db),
) -> PropertyReadAdmin:
    prop = await property_service.create(db, payload)
    return PropertyReadAdmin.model_validate(prop)


# --- List properties (admin — all statuses) ---
@router.get("/properties", response_model=PaginatedResponse[PropertyReadAdmin])
async def list_properties(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    kind: PropertyKind | None = None,
    status_filter: PropertyStatus | None = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[PropertyReadAdmin]:
    items, total = await property_service.list_all(
        db, page=page, limit=limit, kind=kind, status_filter=status_filter
    )
    return PaginatedResponse[PropertyReadAdmin](
        items=[PropertyReadAdmin.model_validate(p) for p in items],
        total=total,
        page=page,
        limit=limit,
        pages=math.ceil(total / limit) if total else 0,
    )


# --- Get property detail ---
@router.get("/properties/{property_id}", response_model=PropertyReadAdmin)
async def get_property(
    property_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> PropertyReadAdmin:
    prop = await property_service.get_by_id(db, property_id)
    return PropertyReadAdmin.model_validate(prop)


# --- Update property ---
@router.patch("/properties/{property_id}", response_model=PropertyReadAdmin)
async def update_property(
    property_id: uuid.UUID,
    payload: PropertyUpdate,
    db: AsyncSession = Depends(get_db),
) -> PropertyReadAdmin:
    prop = await property_service.update(db, property_id, payload)
    return PropertyReadAdmin.model_validate(prop)


# --- Delete property ---
@router.delete("/properties/{property_id}", response_model=MessageResponse)
async def delete_property(
    property_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    # → delete Cloudinary images first, then DB record (cascade)
    prop = await property_service.get_by_id(db, property_id)
    for img in prop.images:
        if img.public_id:
            await cloudinary_service.delete_image(img.public_id)
    await property_service.delete(db, property_id)
    return MessageResponse(message="Property deleted")


# ============================================================
#  Property images
# ============================================================


# --- Upload images ---
@router.post(
    "/properties/{property_id}/images",
    response_model=list[PropertyImageAdmin],
    status_code=status.HTTP_201_CREATED,
)
async def upload_images(
    property_id: uuid.UUID,
    files: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
) -> list[PropertyImageAdmin]:
    # → cap uploads per request to prevent abuse
    if len(files) > 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 20 images per upload",
        )

    # → get current max position so new images go after existing ones
    prop = await property_service.get_by_id(db, property_id)
    max_pos = max((img.position for img in prop.images), default=-1)

    uploaded: list[PropertyImageAdmin] = []
    is_first = len(prop.images) == 0

    for i, file in enumerate(files):
        url, public_id = await cloudinary_service.upload_image(file)
        image = await property_service.add_image(
            db,
            property_id,
            url=url,
            public_id=public_id,
            position=max_pos + 1 + i,
            is_main=is_first and i == 0,
        )
        uploaded.append(PropertyImageAdmin.model_validate(image))

    return uploaded


# --- Reorder images ---
@router.patch(
    "/properties/{property_id}/images",
    response_model=list[PropertyImageAdmin],
)
async def reorder_images(
    property_id: uuid.UUID,
    payload: ImageReorder,
    db: AsyncSession = Depends(get_db),
) -> list[PropertyImageAdmin]:
    images = await property_service.reorder_images(
        db, property_id, payload.ordered_ids, payload.main_image_id
    )
    return [PropertyImageAdmin.model_validate(img) for img in images]


# --- Delete image ---
@router.delete(
    "/properties/{property_id}/images/{image_id}",
    response_model=MessageResponse,
)
async def delete_image(
    property_id: uuid.UUID,
    image_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    public_id = await property_service.delete_image(db, property_id, image_id)
    # → clean up from Cloudinary
    if public_id:
        await cloudinary_service.delete_image(public_id)
    return MessageResponse(message="Image deleted")


# ============================================================
#  Amenities
# ============================================================


# --- List amenities ---
@router.get("/amenities", response_model=PaginatedResponse[AmenityRead])
async def list_amenities(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[AmenityRead]:
    items, total = await amenity_service.list_all(db, page=page, limit=limit)
    return PaginatedResponse[AmenityRead](
        items=[AmenityRead.model_validate(a) for a in items],
        total=total,
        page=page,
        limit=limit,
        pages=math.ceil(total / limit) if total else 0,
    )


# --- Create amenity ---
@router.post(
    "/amenities",
    response_model=AmenityRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_amenity(
    payload: AmenityCreate,
    db: AsyncSession = Depends(get_db),
) -> AmenityRead:
    amenity = await amenity_service.create(db, payload)
    return AmenityRead.model_validate(amenity)


# --- Update amenity ---
@router.patch("/amenities/{amenity_id}", response_model=AmenityRead)
async def update_amenity(
    amenity_id: uuid.UUID,
    payload: AmenityUpdate,
    db: AsyncSession = Depends(get_db),
) -> AmenityRead:
    amenity = await amenity_service.update(db, amenity_id, payload)
    return AmenityRead.model_validate(amenity)


# --- Delete amenity ---
@router.delete("/amenities/{amenity_id}", response_model=MessageResponse)
async def delete_amenity(
    amenity_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    await amenity_service.delete(db, amenity_id)
    return MessageResponse(message="Amenity deleted")
