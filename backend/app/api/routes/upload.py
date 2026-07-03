from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import verify_staff_status
from app.core.database import get_db
from app.models.user import User
from app.services.supabase_document_service import upload_document_and_metadata

router = APIRouter(tags=["upload"])


@router.post("/upload")
async def upload_resource(
    file: UploadFile = File(...),
    course_code: str = Form(...),
    level: int = Form(...),
    title: str | None = Form(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(verify_staff_status),
):
    return await upload_document_and_metadata(
        db,
        file=file,
        uploader_id=user.id,
        course_code=course_code,
        level=level,
        title=title,
    )
