"""Notification model"""

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum, Text
from app.core.types import UUID
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class NotificationType(str, enum.Enum):
    """Notification type enumeration"""
    BOOKING_CONFIRMATION = "booking_confirmation"
    PASS_EXPIRY = "pass_expiry"
    SYSTEM_UPDATE = "system_update"
    COMPLAINT_UPDATE = "complaint_update"


class Notification(Base):
    """Notification model"""
    __tablename__ = "notifications"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    notification_type = Column(Enum(NotificationType), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, index=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    def __repr__(self):
        return f"<Notification {self.id} - {self.notification_type}>"
