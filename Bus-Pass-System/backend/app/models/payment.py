"""Payment model"""

from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Enum
from app.core.types import UUID, JSONB
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class ReferenceType(str, enum.Enum):
    """Reference type enumeration"""
    BOOKING = "booking"
    PASS = "pass"


class PaymentStatus(str, enum.Enum):
    """Payment status enumeration"""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class Payment(Base):
    """Payment model"""
    __tablename__ = "payments"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reference_type = Column(Enum(ReferenceType), nullable=False, index=True)
    reference_id = Column(UUID(), nullable=False, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(String(50), nullable=True)
    payment_status = Column(Enum(PaymentStatus), nullable=False, default=PaymentStatus.PENDING, index=True)
    transaction_id = Column(String(255), unique=True, nullable=True, index=True)
    payment_gateway_response = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<Payment {self.id} - {self.payment_status}>"
