from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.comment import CommentCreateRequest, CommentResponse
from app.services.comment_service import _build_nested_comments, create_comment, list_comments_for_document

router = APIRouter(tags=["comments"])


def _author_name(user: User | None) -> str | None:
    if not user:
        return None
    return user.full_name or user.email


def _convert_to_response(comment, author_name):
    responses = []
    resp = CommentResponse(
        id=comment.id,
        document_id=comment.document_id,
        user_id=comment.user_id,
        parent_comment_id=comment.parent_comment_id,
        content=comment.content,
        created_at=comment.created_at,
        author_name=author_name,
        replies=[],
    )
    if hasattr(comment, "replies") and comment.replies:
        for reply in comment.replies:
            reply_resp = _convert_to_response(reply, _author_name(reply.user))
            resp.replies.append(reply_resp)
    return resp


@router.get("/comments/{document_id}", response_model=list[CommentResponse])
def get_comments(
    document_id: int,
    db: Session = Depends(get_db),
):
    comments = list_comments_for_document(db=db, document_id=document_id)
    nested_comments = _build_nested_comments(comments)
    responses = []
    for c in nested_comments:
        responses.append(_convert_to_response(c, _author_name(c.user)))
    return responses


@router.post("/comments", response_model=CommentResponse)
def add_comment(
    payload: CommentCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = create_comment(db=db, payload=payload, current_user=current_user)
    return CommentResponse(
        id=comment.id,
        document_id=comment.document_id,
        user_id=comment.user_id,
        parent_comment_id=comment.parent_comment_id,
        content=comment.content,
        created_at=comment.created_at,
        author_name=current_user.full_name or current_user.email,
        replies=[],
    )
