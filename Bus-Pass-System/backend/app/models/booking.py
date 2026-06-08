"""Booking model"""

from sqlalchemy import Column, String, Integer, Numeric, DateTime, Date, ForeignKey, Enum
from app.core.types import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum

from app.core.database import Base


class BookingStatus(str, enum.Enum):
    """Booking status enumeration"""
    RESERVED = "reserved"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class PaymentStatus(str, enum.Enum):
    """Payment status enumeration"""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class Booking(Base):
    """Booking model"""
    __tablename__ = "bookings"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    schedule_id = Column(UUID(), ForeignKey("schedules.id", ondelete="CASCADE"), nullable=False, index=True)
    journey_date = Column(Date, nullable=False, index=True)
    seat_number = Column(Integer, nullable=False)
    booking_status = Column(Enum(BookingStatus), nullable=False, default=BookingStatus.RESERVED, index=True)
    price = Column(Numeric(10, 2), nullable=False)
    payment_status = Column(Enum(PaymentStatus), nullable=False, default=PaymentStatus.PENDING)
    reservation_expires_at = Column(DateTime(timezone=True), nullable=True, index=True)
    qr_code_id = Column(UUID(), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<Booking {self.id} - Seat {self.seat_number}>"
