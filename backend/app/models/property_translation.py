# --- PROPERTY TRANSLATION — MODEL ---

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.property import Property


class PropertyTranslation(Base):
    __tablename__ = "property_translations"
    __table_args__ = (
        UniqueConstraint("property_id", "locale", name="uq_property_locale"),
        UniqueConstraint("locale", "slug", name="uq_locale_slug"),
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
    locale: Mapped[str] = mapped_column(
        String(5), nullable=False, index=True
    )  # → ru, es, en, uk
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    slug: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    meta_title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    meta_description: Mapped[str | None] = mapped_column(
        String(500), nullable=True
    )

    # --- Relationships ---
    property: Mapped[Property] = relationship(back_populates="translations")
