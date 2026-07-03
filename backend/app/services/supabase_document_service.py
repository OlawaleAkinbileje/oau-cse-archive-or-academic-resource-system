from uuid import uuid4

from fastapi import UploadFile
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.services.document_service import _extract_document_content
from app.services.storage_service import upload_to_storage


async def upload_document_and_metadata(
    db: Session,
    *,
    file: UploadFile,
    uploader_id: str,
    course_code: str,
    level: int,
    title: str | None = None,
) -> dict:
    try:
        print("=== Starting upload_document_and_metadata ===")
        # Read file once and pass to both upload and extraction
        file_bytes = await file.read()
        print(f"Read file, {len(file_bytes)} bytes")
        
        file_url = await upload_to_storage(file_bytes, file.filename, file.content_type, uploader_id)
        print(f"Uploaded to storage, URL: {file_url}")
        
        filename = file.filename or f"document-{uuid4()}"
        content_text, key_snippet, programming_language = _extract_document_content(filename, file_bytes)
        
        # Remove any NUL characters from strings to prevent database errors
        def clean_string(s: str | None) -> str | None:
            if s is None:
                return None
            return s.replace('\x00', '')
        
        content_text = clean_string(content_text)
        key_snippet = clean_string(key_snippet)
        
        print(f"Extracted content: content_text length {len(content_text) if content_text else 0}, programming_language: {programming_language}")
        
        # Insert document table uses id (we'll let DB generate integer autoincrement for id
        result = db.execute(
            text(
                """
            INSERT INTO public.documents (title, file_path, uploaded_by, content_text)
            VALUES (:title, :file_path, :uploaded_by, :content_text)
            RETURNING id
            """
            ),
            {
                "title": title or filename,
                "file_path": file_url,
                "uploaded_by": uploader_id,
                "content_text": content_text
            },
        )
        document_id = result.scalar()  # Get the returned id
        print(f"Inserted document with ID: {document_id}")

        db.execute(
            text(
                """
            INSERT INTO public.document_metadata (document_id, course_code, level, language, key_snippet)
            VALUES (:document_id, :course_code, :level, :language, :key_snippet)
            """
            ),
            {
                "document_id": document_id,
                "course_code": course_code,
                "level": str(level),  # model expects String
                "language": programming_language,
                "key_snippet": key_snippet or (content_text[:500] if content_text else None),
            },
        )
        print("Inserted document metadata")
        
        db.commit()
        print("Committed transaction!")
    except Exception as e:
        import traceback
        print("=== ERROR in upload_document_and_metadata ===")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print(traceback.format_exc())
        raise

    return {
        "document_id": document_id,
        "file_url": file_url,
        "title": title or filename,
        "course_code": course_code,
        "level": level,
        "programming_language": programming_language,
    }
