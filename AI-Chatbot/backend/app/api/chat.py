from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.database import User, Chat, Message
from app.schemas.chat import ChatResponse, ChatDetailResponse, MessageResponse
from app.services.ai_service import ai_service

router = APIRouter(prefix="/chats", tags=["chats"])

# Local response model for message interaction
class ChatInteractionRequest(BaseModel):
    chat_id: Optional[int] = None
    message: str

class ChatInteractionResponse(BaseModel):
    chat_id: int
    title: str
    user_message: MessageResponse
    bot_message: MessageResponse

@router.get("", response_model=List[ChatResponse])
def get_chats(
    search: Optional[str] = Query(None, description="Search chats by title"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve chat list for current user, supporting search filtering by title"""
    query = db.query(Chat).filter(Chat.user_id == current_user.id)
    if search:
        query = query.filter(Chat.title.like(f"%{search}%"))
    return query.order_by(Chat.created_at.desc()).all()

@router.post("/message", response_model=ChatInteractionResponse)
def send_message(
    payload: ChatInteractionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a user message, trigger AI prediction, and return the question-answer pair"""
    message_text = payload.message.strip()
    if not message_text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message content cannot be empty.")

    # 1. Retrieve or create chat session
    chat = None
    if payload.chat_id:
        chat = db.query(Chat).filter(Chat.id == payload.chat_id, Chat.user_id == current_user.id).first()
        if not chat:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found.")
    
    if not chat:
        # Generate title from first 5 words of user message
        words = message_text.split()
        title_snippet = " ".join(words[:5])
        if len(words) > 5:
            title_snippet += "..."
        
        chat = Chat(user_id=current_user.id, title=title_snippet)
        db.add(chat)
        db.commit()
        db.refresh(chat)

    # 2. Save user message
    user_msg = Message(
        chat_id=chat.id,
        sender="user",
        message=message_text
    )
    db.add(user_msg)
    
    # 3. Call AI Service to predict response
    bot_response_text = ai_service.predict(message_text, db)
    
    # 4. Save chatbot message
    bot_msg = Message(
        chat_id=chat.id,
        sender="bot",
        message=bot_response_text
    )
    db.add(bot_msg)
    
    db.commit()
    db.refresh(user_msg)
    db.refresh(bot_msg)

    return {
        "chat_id": chat.id,
        "title": chat.title,
        "user_message": user_msg,
        "bot_message": bot_msg
    }

@router.get("/{chat_id}", response_model=ChatDetailResponse)
def get_chat_detail(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve full message history for a specific chat"""
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == current_user.id).first()
    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found.")
    
    # Sort messages chronologically
    chat.messages = db.query(Message).filter(Message.chat_id == chat_id).order_by(Message.timestamp.ascii()).all()
    return chat

@router.delete("/{chat_id}")
def delete_chat(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a chat session and all associated messages"""
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == current_user.id).first()
    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found.")
    
    db.delete(chat)
    db.commit()
    return {"message": "Chat deleted successfully."}

@router.get("/{chat_id}/export", response_class=PlainTextResponse)
def export_chat_history(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export the chat history as a formatted text file transcript"""
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == current_user.id).first()
    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found.")
        
    messages = db.query(Message).filter(Message.chat_id == chat_id).order_by(Message.timestamp.asc()).all()
    
    transcript = f"Chat Session: {chat.title}\n"
    transcript += f"Export Date: {chat.created_at.strftime('%Y-%m-%d %H:%M:%S')}\n"
    transcript += "=" * 50 + "\n\n"
    
    for msg in messages:
        sender_label = "USER" if msg.sender == "user" else "AI CHATBOT"
        timestamp_str = msg.timestamp.strftime('%Y-%m-%d %H:%M:%S')
        transcript += f"[{timestamp_str}] {sender_label}:\n{msg.message}\n\n"
        
    return transcript
