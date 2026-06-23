# --- LOCATION — SCHEMAS ---

import uuid
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

SUPPORTED_LOCALES = Literal["ru", "es", "en", "uk"]


# --- Translation sub-schemas ---
class LocationTranslationIn(BaseModel):
    locale: SUPPORTED_LOCALES
    name: str = Field(min_length=1, max_length=200)


class LocationTranslationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    locale: str
    name: str


# --- Create ---
class LocationCreate(BaseModel):
    slug: str = Field(
        min_length=1, max_length=100, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$"
    )
    translations: list[LocationTranslationIn] = Field(
        default_factory=list, max_length=10
    )


# --- Read ---
class LocationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    translations: list[LocationTranslationOut] = []


# --- Update ---
class LocationUpdate(BaseModel):
    slug: str | None = Field(
        default=None, min_length=1, max_length=100, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$"
    )
    translations: list[LocationTranslationIn] | None = Field(
        default=None, max_length=10
    )
