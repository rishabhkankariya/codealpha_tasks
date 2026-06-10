from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import get_current_user, get_current_admin
from app.models.database import User, Feedback, Chat
from app.schemas.feedback import FeedbackCreate, FeedbackResponse

router = APIRouter(prefix="/feedback", tags=["feedback"])

@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    payload: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit a feedback review for a chat session (1-5 stars and optional text comment)"""
    # Verify chat session exists and belongs to the user
    chat = db.query(Chat).filter(Chat.id == payload.chat_id, Chat.user_id == current_user.id).first()
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found or access denied."
        )
        
    db_feedback = Feedback(
        user_id=current_user.id,
        chat_id=payload.chat_id,
        rating=payload.rating,
        comment=payload.comment
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback

@router.get("", response_model=List[FeedbackResponse])
def get_all_feedbacks(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Retrieve all submitted user feedbacks (Admin-only)"""
    return db.query(Feedback).order_by(Feedback.created_at.desc()).all()
