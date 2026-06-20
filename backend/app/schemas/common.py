# --- COMMON — SCHEMAS ---

from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


# --- Message response ---
class MessageResponse(BaseModel):
    message: str


# --- Paginated response ---
class PaginatedResponse(BaseModel, Generic[T]):
    model_config = ConfigDict(from_attributes=True)

    items: list[T]
    total: int
    page: int
    limit: int
    pages: int
