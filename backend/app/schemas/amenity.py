# --- AMENITY — SCHEMAS ---

import uuid
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

SUPPORTED_LOCALES = Literal["ru", "es", "en", "ua"]


# --- Translation sub-schemas ---
class AmenityTranslationIn(BaseModel):
    locale: SUPPORTED_LOCALES
    name: str = Field(min_length=1, max_length=200)


class AmenityTranslationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    locale: str
    name: str


# --- Create ---
class AmenityCreate(BaseModel):
    icon: str | None = Field(default=None, max_length=100, pattern=r"^[a-zA-Z0-9_-]+$")
    translations: list[AmenityTranslationIn] = Field(
        default_factory=list, max_length=10
    )


# --- Read ---
class AmenityRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    icon: str | None = None
    translations: list[AmenityTranslationOut] = []


# --- Public (flat, single-locale) ---
class AmenityPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    icon: str | None = None
    name: str


# --- Update ---
class AmenityUpdate(BaseModel):
    icon: str | None = Field(default=None, max_length=100, pattern=r"^[a-zA-Z0-9_-]+$")
    translations: list[AmenityTranslationIn] | None = Field(default=None, max_length=10)
