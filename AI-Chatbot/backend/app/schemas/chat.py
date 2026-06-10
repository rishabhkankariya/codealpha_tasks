from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class MessageCreate(BaseModel):
    message: str

class MessageResponse(BaseModel):
    id: int
    chat_id: int
    sender: str  # 'user' or 'bot'
    message: str
    timestamp: datetime

    class Config:
        from_attributes = True

class ChatCreate(BaseModel):
    title: Optional[str] = None

class ChatResponse(BaseModel):
    id: int
    user_id: int
    title: str
    created_at: datetime

    class Config:
        from_attributes = True

class ChatDetailResponse(ChatResponse):
    messages: List[MessageResponse] = []
