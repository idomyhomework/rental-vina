# --- AMENITY — MODELS (amenities + translations + join table) ---

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.property import Property


# --- Amenity ---
class Amenity(Base):
    __tablename__ = "amenities"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    icon: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )  # → icon name or class

    # --- Relationships ---
    translations: Mapped[list[AmenityTranslation]] = relationship(
        back_populates="amenity", cascade="all, delete-orphan", lazy="selectin"
    )
    property_links: Mapped[list[PropertyAmenity]] = relationship(
        back_populates="amenity", cascade="all, delete-orphan"
    )


# --- Amenity translation ---
class AmenityTranslation(Base):
    __tablename__ = "amenity_translations"
    __table_args__ = (
        UniqueConstraint("amenity_id", "locale", name="uq_amenity_locale"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    amenity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("amenities.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    locale: Mapped[str] = mapped_column(String(5), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)

    # --- Relationships ---
    amenity: Mapped[Amenity] = relationship(back_populates="translations")


# --- Property ↔ Amenity join table ---
class PropertyAmenity(Base):
    __tablename__ = "property_amenities"
    __table_args__ = (
        UniqueConstraint(
            "property_id", "amenity_id", name="uq_property_amenity"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    property_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("properties.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    amenity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("amenities.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # --- Relationships ---
    property: Mapped[Property] = relationship(back_populates="amenities")
    amenity: Mapped[Amenity] = relationship(back_populates="property_links")
