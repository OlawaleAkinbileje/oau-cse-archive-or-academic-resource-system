from sqlalchemy import text
from sqlalchemy.orm import Session

from app.schemas.staff_documents import StaffDocumentUpdateRequest
from app.services.storage_service import delete_from_storage


def list_staff_documents(db: Session, uploader_id: str) -> list[dict]:
    rows = db.execute(
        text(
            """
            SELECT
                CAST(d.id AS TEXT) AS id,
                d.file_path AS file_url,
                d.created_at::text AS created_at,
                d.title,
                m.course_code,
                CAST(m.level AS INTEGER) AS level,
                m.language AS programming_language
            FROM public.documents d
            LEFT JOIN public.document_metadata m ON m.document_id = d.id
            WHERE d.uploaded_by = :uploader_id
            ORDER BY d.created_at DESC
            """
        ),
        {"uploader_id": uploader_id},
    ).mappings()
    return [dict(row) for row in rows]


def update_staff_document(
    db: Session,
    *,
    document_id: str,
    uploader_id: str,
    payload: StaffDocumentUpdateRequest,
) -> dict:
    ownership = db.execute(
        text(
            """
            SELECT d.id, d.file_path AS file_url
            FROM public.documents d
            WHERE d.id = :document_id AND d.uploaded_by = :uploader_id
            LIMIT 1
            """
        ),
        {"document_id": document_id, "uploader_id": uploader_id},
    ).mappings().first()
    if not ownership:
        raise ValueError("Document not found or not owned by current staff user")

    # Update both documents and document_metadata tables
    doc_updates: dict[str, object] = {}
    meta_updates: dict[str, object] = {}
    if payload.title is not None:
        doc_updates["title"] = payload.title
    if payload.course_code is not None:
        meta_updates["course_code"] = payload.course_code
    if payload.level is not None:
        meta_updates["level"] = payload.level

    if doc_updates:
        doc_set_clause = ", ".join([f"{column} = :{column}" for column in doc_updates.keys()])
        doc_updates["document_id"] = document_id
        db.execute(
            text(f"UPDATE public.documents SET {doc_set_clause} WHERE id = :document_id"),
            doc_updates,
        )

    if meta_updates:
        meta_set_clause = ", ".join([f"{column} = :{column}" for column in meta_updates.keys()])
        meta_updates["document_id"] = document_id
        db.execute(
            text(f"UPDATE public.document_metadata SET {meta_set_clause} WHERE document_id = :document_id"),
            meta_updates,
        )

    if doc_updates or meta_updates:
        db.commit()

    row = db.execute(
        text(
            """
            SELECT
                CAST(d.id AS TEXT) AS id,
                d.file_path AS file_url,
                d.created_at::text AS created_at,
                d.title,
                m.course_code,
                CAST(m.level AS INTEGER) AS level,
                m.language AS programming_language
            FROM public.documents d
            LEFT JOIN public.document_metadata m ON m.document_id = d.id
            WHERE d.id = :document_id
            LIMIT 1
            """
        ),
        {"document_id": document_id},
    ).mappings().first()
    return dict(row) if row else {}


def delete_staff_document(db: Session, *, document_id: str, uploader_id: str) -> None:
    row = db.execute(
        text(
            """
            SELECT d.id, d.file_path AS file_url
            FROM public.documents d
            WHERE d.id = :document_id AND d.uploaded_by = :uploader_id
            LIMIT 1
            """
        ),
        {"document_id": document_id, "uploader_id": uploader_id},
    ).mappings().first()
    if not row:
        raise ValueError("Document not found or not owned by current staff user")

    delete_from_storage(row["file_url"])
    db.execute(text("DELETE FROM public.document_metadata WHERE document_id = :document_id"), {"document_id": document_id})
    db.execute(text("DELETE FROM public.documents WHERE id = :document_id"), {"document_id": document_id})
    db.commit()
