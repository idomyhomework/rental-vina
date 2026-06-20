# --- PROPERTY — MODEL ---

from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Enum as SAEnum, Integer, Numeric, String, DateTime, Float, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.property_translation import PropertyTranslation
    from app.models.property_image import PropertyImage
    from app.models.amenity import PropertyAmenity


# --- Enums ---
class PropertyKind(str, enum.Enum):
    rental = "rental"
    sale = "sale"


class PropertyStatus(str, enum.Enum):
    draft = "draft"
    published = "published"


class Property(Base):
    __tablename__ = "properties"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    kind: Mapped[PropertyKind] = mapped_column(
        SAEnum(PropertyKind, name="property_kind", native_enum=True),
        nullable=False,
        index=True,
    )
    status: Mapped[PropertyStatus] = mapped_column(
        SAEnum(PropertyStatus, name="property_status", native_enum=True),
        nullable=False,
        server_default=PropertyStatus.draft.value,
        index=True,
    )
    bedrooms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    guests: Mapped[int | None] = mapped_column(Integer, nullable=True)
    price_per_night: Mapped[float | None] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    sale_price: Mapped[float | None] = mapped_column(
        Numeric(12, 2), nullable=True
    )
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # --- Relationships ---
    translations: Mapped[list[PropertyTranslation]] = relationship(
        back_populates="property", cascade="all, delete-orphan", lazy="selectin"
    )
    images: Mapped[list[PropertyImage]] = relationship(
        back_populates="property", cascade="all, delete-orphan", lazy="selectin"
    )
    amenities: Mapped[list[PropertyAmenity]] = relationship(
        back_populates="property", cascade="all, delete-orphan", lazy="selectin"
    )
