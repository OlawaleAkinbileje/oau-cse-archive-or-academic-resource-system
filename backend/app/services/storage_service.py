from datetime import UTC, datetime
from pathlib import Path
from urllib.parse import urlparse

from fastapi import UploadFile

from app.core.config import settings
from app.core.supabase_client import get_supabase_client


async def upload_to_storage(file_bytes: bytes, filename: str | None, content_type: str | None, user_id: str) -> str:
    supabase = get_supabase_client()
    if not file_bytes:
        raise ValueError("Cannot upload an empty file")

    original_name = filename or "resource.bin"
    timestamp = int(datetime.now(UTC).timestamp())
    safe_name = Path(original_name).name.replace(" ", "_")
    storage_name = f"{user_id}_{timestamp}_{safe_name}"
    object_path = f"{user_id}/{storage_name}"

    print("=== upload_to_storage ===")
    print("Supabase URL:", settings.supabase_url)
    print("Storage Bucket:", settings.supabase_storage_bucket)
    print("Object Path:", object_path)
    print("File size (bytes):", len(file_bytes))
    print("Content-Type:", content_type or "application/octet-stream")

    try:
        upload_result = supabase.storage.from_(settings.supabase_storage_bucket).upload(
            object_path,
            file_bytes,
            {"content-type": content_type or "application/octet-stream"},
        )
        print("Upload result:", upload_result)
    except Exception as exc:
        import traceback
        print("=== upload_to_storage ERROR ===")
        print("Error type:", type(exc).__name__)
        print("Error message:", str(exc))
        print("Traceback:", traceback.format_exc())
        # Let's try to list buckets to check
        try:
            buckets = supabase.storage.list_buckets()
            print("Available buckets:", [bucket.name for bucket in buckets])
        except Exception as e:
            print("Error listing buckets:", str(e))
        raise RuntimeError(f"Supabase storage upload failed: {str(exc)}") from exc

    public_url = supabase.storage.from_(settings.supabase_storage_bucket).get_public_url(object_path)
    print("Public URL:", public_url)
    if not public_url:
        raise RuntimeError("Supabase storage upload failed: missing public URL")
    return public_url


def _object_path_from_public_url(public_url: str) -> str:
    parsed = urlparse(public_url)
    marker = f"/storage/v1/object/public/{settings.supabase_storage_bucket}/"
    if marker not in parsed.path:
        raise ValueError("Invalid storage public URL")
    return parsed.path.split(marker, 1)[1]


def delete_from_storage(public_url: str) -> None:
    supabase = get_supabase_client()
    object_path = _object_path_from_public_url(public_url)
    try:
        supabase.storage.from_(settings.supabase_storage_bucket).remove([object_path])
    except Exception as exc:
        raise RuntimeError("Failed to delete file from Supabase Storage") from exc
