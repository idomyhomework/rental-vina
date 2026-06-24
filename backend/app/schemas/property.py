# --- PROPERTY — SCHEMAS ---

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models.property import PropertyKind, PropertyStatus
from app.schemas.amenity import AmenityPublic, AmenityRead
from app.schemas.location import LocationRead

SUPPORTED_LOCALES = Literal["ru", "es", "en", "ua"]


# --- Translation sub-schemas ---
class PropertyTranslationIn(BaseModel):
    locale: SUPPORTED_LOCALES
    title: str = Field(min_length=1, max_length=300)
    slug: str = Field(max_length=300, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str | None = Field(default=None, max_length=50_000)
    meta_title: str | None = Field(default=None, max_length=200)
    meta_description: str | None = Field(default=None, max_length=500)


class PropertyTranslationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    locale: str
    title: str
    slug: str
    description: str | None = None
    meta_title: str | None = None
    meta_description: str | None = None


# --- Image sub-schemas ---
class PropertyImageOut(BaseModel):
    """Public image response — no Cloudinary internal IDs."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    url: str
    position: int
    is_main: bool


class PropertyImageAdmin(PropertyImageOut):
    """Admin image response — includes Cloudinary public_id."""

    public_id: str | None = None


# --- Create ---
class PropertyCreate(BaseModel):
    kind: PropertyKind
    # → new properties always start as draft; publish via update
    bedrooms: int | None = Field(default=None, ge=0, le=100)
    guests: int | None = Field(default=None, ge=1, le=500)
    price_per_night: Decimal | None = Field(
        default=None, ge=0, le=Decimal("99999999.99"), decimal_places=2
    )
    sale_price: int | None = Field(default=None, ge=0, le=9_999_999_999)
    sale_price_discounted: int | None = Field(default=None, ge=0, le=9_999_999_999)
    location_id: uuid.UUID | None = None
    lat: float | None = Field(default=None, ge=-90, le=90)
    lng: float | None = Field(default=None, ge=-180, le=180)
    translations: list[PropertyTranslationIn] = Field(
        default_factory=list, max_length=10
    )
    amenity_ids: list[uuid.UUID] = Field(default_factory=list, max_length=50)


# --- Read (full detail) ---
class PropertyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    kind: PropertyKind
    status: PropertyStatus
    bedrooms: int | None = None
    guests: int | None = None
    price_per_night: Decimal | None = None
    sale_price: int | None = None
    sale_price_discounted: int | None = None
    location: LocationRead | None = None
    lat: float | None = None
    lng: float | None = None
    created_at: datetime
    updated_at: datetime
    translations: list[PropertyTranslationOut] = []
    images: list[PropertyImageOut] = []
    amenities: list[AmenityRead] = []


# --- Read (admin detail — includes Cloudinary public_id on images) ---
class PropertyReadAdmin(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    kind: PropertyKind
    status: PropertyStatus
    bedrooms: int | None = None
    guests: int | None = None
    price_per_night: Decimal | None = None
    sale_price: int | None = None
    sale_price_discounted: int | None = None
    location_id: uuid.UUID | None = None
    location: LocationRead | None = None
    lat: float | None = None
    lng: float | None = None
    created_at: datetime
    updated_at: datetime
    translations: list[PropertyTranslationOut] = []
    images: list[PropertyImageAdmin] = []
    amenities: list[AmenityRead] = []


# --- Update (partial) ---
class PropertyUpdate(BaseModel):
    kind: PropertyKind | None = None
    status: PropertyStatus | None = None
    bedrooms: int | None = Field(default=None, ge=0, le=100)
    guests: int | None = Field(default=None, ge=1, le=500)
    price_per_night: Decimal | None = Field(
        default=None, ge=0, le=Decimal("99999999.99"), decimal_places=2
    )
    sale_price: int | None = Field(default=None, ge=0, le=9_999_999_999)
    sale_price_discounted: int | None = Field(default=None, ge=0, le=9_999_999_999)
    location_id: uuid.UUID | None = None
    lat: float | None = Field(default=None, ge=-90, le=90)
    lng: float | None = Field(default=None, ge=-180, le=180)
    translations: list[PropertyTranslationIn] | None = Field(
        default=None, max_length=10
    )
    amenity_ids: list[uuid.UUID] | None = Field(default=None, max_length=50)


# --- List (flat, single-locale for catalog) ---
class PropertyList(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    kind: PropertyKind
    bedrooms: int | None = None
    guests: int | None = None
    price_per_night: Decimal | None = None
    sale_price: int | None = None
    sale_price_discounted: int | None = None
    location: LocationRead | None = None
    # → single-locale translation inlined for catalog display
    title: str | None = None
    slug: str | None = None
    description: str | None = None
    main_image_url: str | None = None


# --- Read (public detail — single locale, no internal IDs) ---
class PropertyDetailPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    kind: PropertyKind
    bedrooms: int | None = None
    guests: int | None = None
    price_per_night: Decimal | None = None
    sale_price: int | None = None
    sale_price_discounted: int | None = None
    location: LocationRead | None = None
    lat: float | None = None
    lng: float | None = None
    created_at: datetime
    updated_at: datetime
    # → single-locale translation inlined
    title: str | None = None
    slug: str | None = None
    description: str | None = None
    meta_title: str | None = None
    meta_description: str | None = None
    images: list[PropertyImageOut] = []
    amenities: list[AmenityPublic] = []


# --- Image reorder request ---
class ImageReorder(BaseModel):
    ordered_ids: list[uuid.UUID] = Field(min_length=1, max_length=100)
    main_image_id: uuid.UUID | None = None
