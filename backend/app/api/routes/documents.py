from types import SimpleNamespace

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user, verify_staff_status
from app.core.database import get_db
from app.models.comment import Comment
from app.models.document import Document
from app.models.metadata import Metadata
from app.models.user import User
from app.schemas.document import DocumentMetadataResponse, DocumentUploadResponse
from app.schemas.staff_documents import StaffDocumentItem, StaffDocumentUpdateRequest
from app.services.document_service import create_document
from app.services.staff_documents_service import delete_staff_document, list_staff_documents, update_staff_document

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    course_code: str = Form(...),
    level: str = Form(...),
    db: Session = Depends(get_db),
    user: User = Depends(verify_staff_status),
):
    document, metadata = await create_document(
        db=db,
        uploaded_by=SimpleNamespace(id=user.id),
        file=file,
        course_code=course_code,
        level=level,
    )
    return DocumentUploadResponse(
        id=document.id,
        title=document.title,
        file_path=document.file_path,
        uploaded_by=document.uploaded_by,
        created_at=document.created_at,
        metadata=DocumentMetadataResponse.model_validate(metadata),
    )


@router.get("/mine", response_model=list[StaffDocumentItem])
def get_my_documents(
    db: Session = Depends(get_db),
    user: User = Depends(verify_staff_status),
):
    return list_staff_documents(db, uploader_id=user.id)


@router.get("/{document_id}")
def get_single_document(
    document_id: int,
    db: Session = Depends(get_db),
):
    doc = (
        db.query(Document)
        .options(joinedload(Document.metadata_items))
        .filter(Document.id == document_id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    metadata = doc.metadata_items[0] if doc.metadata_items else None
    return {
        "id": doc.id,
        "title": doc.title,
        "file_url": doc.file_path,
        "content_text": doc.content_text,
        "created_at": doc.created_at,
        "metadata": {
            "course_code": metadata.course_code if metadata else None,
            "level": metadata.level if metadata else None,
            "programming_language": metadata.language if metadata else None,
            "key_snippet": metadata.key_snippet if metadata else None,
        },
    }


@router.patch("/{document_id}", response_model=StaffDocumentItem)
def patch_document(
    document_id: str,
    payload: StaffDocumentUpdateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(verify_staff_status),
):
    try:
        updated = update_staff_document(
            db,
            document_id=document_id,
            uploader_id=user.id,
            payload=payload,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return updated


@router.delete("/{document_id}")
def remove_document(
    document_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(verify_staff_status),
):
    try:
        delete_staff_document(db, document_id=document_id, uploader_id=user.id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"status": "deleted"}


@router.get("/dashboard/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    user: User = Depends(verify_staff_status),
):
    # Get total documents
    total_docs = db.query(func.count(Document.id)).scalar() or 0
    
    # Get total comments
    total_comments = db.query(func.count(Comment.id)).scalar() or 0
    
    # Get ALL documents to calculate total code/videos
    all_docs = db.query(Document).all()
    total_code_docs = 0
    total_video_docs = 0
    for doc in all_docs:
        title_lower = doc.title.lower()
        if title_lower.endswith(('.py', '.js', '.ts', '.java', '.c', '.cpp', '.h', '.cs', '.php', '.rb', '.go', '.rs', '.kt', '.swift')):
            total_code_docs += 1
        elif title_lower.endswith(('.mp4', '.webm', '.avi', '.mov', '.mkv', '.flv', '.wmv')):
            total_video_docs += 1
    
    # Get staff's documents
    staff_docs = db.query(Document).filter(Document.uploaded_by == user.id).all()
    staff_doc_count = len(staff_docs)
    staff_code_docs = 0
    staff_video_docs = 0
    for doc in staff_docs:
        title_lower = doc.title.lower()
        if title_lower.endswith(('.py', '.js', '.ts', '.java', '.c', '.cpp', '.h', '.cs', '.php', '.rb', '.go', '.rs', '.kt', '.swift')):
            staff_code_docs += 1
        elif title_lower.endswith(('.mp4', '.webm', '.avi', '.mov', '.mkv', '.flv', '.wmv')):
            staff_video_docs += 1
    
    # Get recent activity (last 5 uploaded docs)
    recent_docs = (
        db.query(Document)
        .order_by(Document.created_at.desc())
        .limit(5)
        .all()
    )
    
    activity = []
    for doc in recent_docs:
        activity.append({
            "title": doc.title,
            "created_at": doc.created_at
        })
    
    return {
        "total_documents": total_docs,
        "total_comments": total_comments,
        "staff_documents": staff_doc_count,
        "staff_code_documents": staff_code_docs,
        "staff_video_documents": staff_video_docs,
        "total_code_documents": total_code_docs,
        "total_video_documents": total_video_docs,
        "new_views": 0,  # We don't track views yet
        "new_downloads": 0,  # We don't track downloads yet
        "recent_activity": activity,
        "pending_approvals": []  # We don't have approval system yet
    }
