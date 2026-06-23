# --- MIGRATION — RENAME LOCALE uk → ua ---

"""rename locale uk to ua

Revision ID: a1b2c3d4e5f6
Revises: 90a2cadb8941
Create Date: 2026-06-23 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: str = "90a2cadb8941"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# → tables that store a locale column with 'uk' values
TABLES = ["property_translations", "location_translations", "amenity_translations"]


def upgrade() -> None:
    for table in TABLES:
        op.execute(
            f"UPDATE {table} SET locale = 'ua' WHERE locale = 'uk'"
        )


def downgrade() -> None:
    for table in TABLES:
        op.execute(
            f"UPDATE {table} SET locale = 'uk' WHERE locale = 'ua'"
        )
