# --- CLOUDINARY — SERVICE ---

import asyncio

import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

# → configure once at import time; CLOUDINARY_URL contains everything
cloudinary.config(cloudinary_url=settings.cloudinary_url or None)

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
