"""Knowledge base model"""

from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Text, Integer, Boolean
from app.core.types import UUID, ARRAY
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class KnowledgeCategory(str, enum.Enum):
    """Knowledge category enumeration"""
    ROUTES = "routes"
    POLICIES = "policies"
    PROCEDURES = "procedures"
    FAQS = "faqs"


class KnowledgeBase(Base):
    """Knowledge base model"""
    __tablename__ = "knowledge_base"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    category = Column(Enum(KnowledgeCategory), nullable=False, index=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    keywords = Column(ARRAY(Text), nullable=True)
    # embedding = Column(Vector(384), nullable=True)  # Requires pgvector extension
    usage_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True, index=True)
    created_by = Column(UUID(), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<KnowledgeBase {self.id} - {self.category}>"
