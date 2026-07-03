from pathlib import Path
from io import BytesIO
from PyPDF2 import PdfReader

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import Document
from app.models.metadata import Metadata
from app.models.user import User
from app.services.metadata_extractor import EnhancedMetadataExtractor

CODE_EXT_TO_LANG = {
    ".py": "python",
    ".js": "javascript",
    ".java": "java",
}


def _extract_programming_language(filename: str) -> str | None:
    ext = Path(filename).suffix.lower()
    return CODE_EXT_TO_LANG.get(ext)


def _extract_pdf_text(content: bytes) -> str:
    reader = PdfReader(BytesIO(content))
    page_text: list[str] = []
    for page in reader.pages:
        page_text.append(page.extract_text() or "")
    return "\n".join(page_text).strip()


def _extract_document_content(filename: str, content: bytes) -> tuple[str | None, str | None, str | None]:
    ext = Path(filename).suffix.lower()
    programming_language = _extract_programming_language(filename)

    if ext == ".pdf":
        extracted_text = _extract_pdf_text(content)
        if not extracted_text:
            return None, None, programming_language
        return extracted_text[:10000], extracted_text[:500], programming_language

    decoded = content.decode("utf-8", errors="ignore").strip()
    if not decoded:
        return None, None, programming_language
    return decoded[:10000], decoded[:500], programming_language


async def create_document(
    db: Session,
    uploaded_by: User,
    file: UploadFile,
    course_code: str,
    level: str,
) -> tuple[Document, Metadata]:
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    target_path = upload_dir / file.filename
    content = await file.read()
    target_path.write_bytes(content)

    extractor = EnhancedMetadataExtractor(file.filename or "unknown", content)
    extracted = extractor.extract_all_metadata()

    document = Document(
        title=file.filename,
        file_path=str(target_path),
        content_text=extracted["full_text"],
        uploaded_by=uploaded_by.id,
    )
    db.add(document)
    db.flush()

    metadata_record = Metadata(
        document_id=document.id,
        course_code=course_code,
        level=level,
        language=extracted["programming_language"],
        key_snippet=extracted["key_snippet"],
    )
    db.add(metadata_record)
    db.commit()
    db.refresh(document)
    db.refresh(metadata_record)
    return document, metadata_record
