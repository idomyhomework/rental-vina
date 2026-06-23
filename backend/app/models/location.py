# --- LOCATION — MODELS (locations + translations) ---

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.property import Property


# --- Location ---
class Location(Base):
    __tablename__ = "locations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    slug: Mapped[str] = mapped_column(
        String(100), nullable=False, unique=True, index=True
    )

    # --- Relationships ---
    translations: Mapped[list[LocationTranslation]] = relationship(
        back_populates="location", cascade="all, delete-orphan", lazy="selectin"
    )
    properties: Mapped[list[Property]] = relationship(
        back_populates="location"
    )


# --- Location translation ---
class LocationTranslation(Base):
    __tablename__ = "location_translations"
    __table_args__ = (
        UniqueConstraint("location_id", "locale", name="uq_location_locale"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    location_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("locations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    locale: Mapped[str] = mapped_column(String(5), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)

    # --- Relationships ---
    location: Mapped[Location] = relationship(back_populates="translations")
