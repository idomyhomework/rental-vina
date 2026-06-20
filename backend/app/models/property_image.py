# --- PROPERTY IMAGE — MODEL ---

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.property import Property


class PropertyImage(Base):
    __tablename__ = "property_images"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    property_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("properties.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    public_id: Mapped[str | None] = mapped_column(
        String(300), nullable=True
    )  # → Cloudinary public_id
    position: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default="0"
    )
    is_main: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="false"
    )

    # --- Relationships ---
    property: Mapped[Property] = relationship(back_populates="images")
