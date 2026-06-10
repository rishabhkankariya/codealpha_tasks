from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class FeedbackCreate(BaseModel):
    chat_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class FeedbackResponse(BaseModel):
    id: int
    chat_id: int
    user_id: Optional[int] = None
    rating: int
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
