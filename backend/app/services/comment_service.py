from sqlalchemy.orm import Session, joinedload

from app.models.comment import Comment
from app.models.user import User
from app.schemas.comment import CommentCreateRequest


def create_comment(db: Session, payload: CommentCreateRequest, current_user: User) -> Comment:
    comment = Comment(
        document_id=payload.document_id,
        user_id=current_user.id,
        content=payload.content,
        parent_comment_id=payload.parent_comment_id,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


def _build_nested_comments(comments: list[Comment]) -> list[Comment]:
    comment_map = {c.id: c for c in comments}
    nested_comments = []
    for comment in comments:
        if comment.parent_comment_id is None:
            nested_comments.append(comment)
        else:
            parent = comment_map.get(comment.parent_comment_id)
            if parent:
                if not hasattr(parent, "replies"):
                    parent.replies = []
                parent.replies.append(comment)
    return nested_comments


def list_comments_for_document(db: Session, document_id: int) -> list[Comment]:
    comments = (
        db.query(Comment)
        .options(joinedload(Comment.user))
        .filter(Comment.document_id == document_id)
        .order_by(Comment.created_at.asc())
        .all()
    )
    return comments
