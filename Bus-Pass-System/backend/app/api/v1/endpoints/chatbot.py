"""
AI Chatbot API Endpoints
Provides natural language interface for route queries
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.dependencies import get_current_user, get_db
from app.models.user import User
from app.services.ai_chatbot_service import ChatbotService

router = APIRouter()


class ChatMessageRequest(BaseModel):
    """Chat message request"""
    message: str
    session_id: Optional[str] = None
    language: str = "en"


class ChatMessageResponse(BaseModel):
    """Chat message response"""
    session_id: str
    query: str
    answer: str
    routes: list
    suggestions: list
    language: str


@router.post("/message", response_model=ChatMessageResponse)
async def send_chat_message(
    request: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send message to AI chatbot and get intelligent response
    
    The chatbot uses RAG (Retrieval-Augmented Generation) to provide
    accurate information about bus routes, stops, and schedules.
    
    Example queries:
    - "Which bus goes from Katraj to Hinjewadi?"
    - "Show me routes from Pune Station to Wakad"
    - "What buses stop at Swargate?"
    - "Fastest route from Hadapsar to Baner"
    """
    try:
        response = await ChatbotService.send_message(
            db=db,
            user_id=current_user.id,
            message=request.message,
            session_id=request.session_id,
            language=request.language
        )
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process message: {str(e)}"
        )


@router.get("/history/{session_id}")
async def get_chat_history(
    session_id: str,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get chat history for a specific session
    
    Returns all messages in chronological order
    """
    try:
        history = ChatbotService.get_chat_history(
            db=db,
            user_id=current_user.id,
            session_id=session_id,
            limit=limit
        )
        return {"session_id": session_id, "messages": history}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get chat history: {str(e)}"
        )


@router.get("/sessions")
async def get_user_sessions(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get user's chat sessions
    
    Returns list of recent chat sessions
    """
    try:
        sessions = ChatbotService.get_user_sessions(
            db=db,
            user_id=current_user.id,
            limit=limit
        )
        return {"sessions": sessions}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get sessions: {str(e)}"
        )


@router.post("/session")
async def create_chat_session(
    language: str = "en",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create new chat session
    
    Returns session ID for subsequent messages
    """
    try:
        session_id = ChatbotService.create_session(
            db=db,
            user_id=current_user.id,
            language=language
        )
        return {"session_id": session_id, "language": language}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create session: {str(e)}"
        )


@router.post("/refresh-embeddings")
async def refresh_embeddings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Refresh AI embeddings with latest route data
    
    Admin only - Updates vector database with current routes
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        from app.services.ai_chatbot_service import AIRouteAssistant
        assistant = AIRouteAssistant(db)
        assistant.refresh_embeddings()
        return {"message": "Embeddings refreshed successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to refresh embeddings: {str(e)}"
        )


# AI router for /api/v1/ai prefix compatibility
ai_router = APIRouter()


@ai_router.post("/chat", response_model=ChatMessageResponse)
async def send_ai_chat(
    request: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send message to AI chatbot and get response (compatibility endpoint)
    """
    try:
        response = await ChatbotService.send_message(
            db=db,
            user_id=current_user.id,
            message=request.message,
            session_id=request.session_id,
            language=request.language
        )
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process message: {str(e)}"
        )
