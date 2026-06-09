"""Chatbot models"""

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum, Text
from app.core.types import UUID, JSONB
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class MessageType(str, enum.Enum):
    """Message type enumeration"""
    USER = "user"
    BOT = "bot"


class ChatbotSession(Base):
    """Chatbot session model"""
    __tablename__ = "chatbot_sessions"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    session_token = Column(String(255), unique=True, nullable=False, index=True)
    context = Column(JSONB, nullable=True)
    is_active = Column(Boolean, default=True)
    last_activity_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<ChatbotSession {self.id}>"


class ChatbotMessage(Base):
    """Chatbot message model"""
    __tablename__ = "chatbot_messages"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(), ForeignKey("chatbot_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    message_type = Column(Enum(MessageType), nullable=False)
    message_text = Column(Text, nullable=False)
    message_metadata = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    def __repr__(self):
        return f"<ChatbotMessage {self.id} - {self.message_type}>"
