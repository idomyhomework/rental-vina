# --- CLOUDINARY — SERVICE ---

import asyncio
from urllib.parse import urlparse

import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings


# --- Configure SDK ---
def _configure() -> None:
    # → the SDK only auto-parses CLOUDINARY_URL from os.environ; pydantic loads
    #   it from .env instead, so we parse the URL and pass the parts explicitly
    if not settings.cloudinary_url:
        return
    parsed = urlparse(settings.cloudinary_url)
    cloudinary.config(
        cloud_name=parsed.hostname,
        api_key=parsed.username,
        api_secret=parsed.password,
        secure=True,
    )


# → configure once at import time
_configure()

UPLOAD_FOLDER = "rental-vina/properties"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
}


# --- Validate upload ---
def _validate_file(file: UploadFile) -> None:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, WebP, and AVIF images are allowed",
        )


# --- Upload image ---
async def upload_image(file: UploadFile) -> tuple[str, str]:
    _validate_file(file)

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 10 MB limit",
        )

    # → run sync Cloudinary SDK call in a thread to avoid blocking
    result = await asyncio.to_thread(
        cloudinary.uploader.upload,
        contents,
        folder=UPLOAD_FOLDER,
        resource_type="image",
        transformation=[
            {"quality": "auto", "fetch_format": "auto"},
        ],
    )
    return result["secure_url"], result["public_id"]


# --- Delete image ---
async def delete_image(public_id: str) -> None:
    await asyncio.to_thread(
        cloudinary.uploader.destroy,
        public_id,
        resource_type="image",
    )
