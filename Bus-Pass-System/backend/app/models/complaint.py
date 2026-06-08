"""Complaint model"""

from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Text
from app.core.types import UUID
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class ComplaintCategory(str, enum.Enum):
    """Complaint category enumeration"""
    SERVICE_QUALITY = "service_quality"
    TECHNICAL_ISSUE = "technical_issue"
    BILLING_DISPUTE = "billing_dispute"
    OTHER = "other"


class ComplaintStatus(str, enum.Enum):
    """Complaint status enumeration"""
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class ComplaintPriority(str, enum.Enum):
    """Complaint priority enumeration"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class Complaint(Base):
    """Complaint model"""
    __tablename__ = "complaints"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    complaint_number = Column(String(50), unique=True, nullable=False, index=True)
    category = Column(Enum(ComplaintCategory), nullable=False)
    description = Column(Text, nullable=False)
    booking_id = Column(UUID(), ForeignKey("bookings.id"), nullable=True)
    status = Column(Enum(ComplaintStatus), nullable=False, default=ComplaintStatus.OPEN, index=True)
    priority = Column(Enum(ComplaintPriority), default=ComplaintPriority.NORMAL, index=True)
    assigned_to = Column(UUID(), ForeignKey("users.id"), nullable=True, index=True)
    resolution = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    
    def __repr__(self):
        return f"<Complaint {self.complaint_number}>"
