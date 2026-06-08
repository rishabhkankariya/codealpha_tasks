"""Booking schemas"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, date
from uuid import UUID
from decimal import Decimal

from app.models.booking import BookingStatus, PaymentStatus


class BookingCreate(BaseModel):
    """Booking creation schema"""
    schedule_id: UUID
    journey_date: date
    seat_number: int = Field(..., ge=1)


class BookingResponse(BaseModel):
    """Booking response schema"""
    id: UUID
    user_id: UUID
    schedule_id: UUID
    journey_date: date
    seat_number: int
    booking_status: BookingStatus
    price: Decimal
    payment_status: PaymentStatus
    reservation_expires_at: Optional[datetime]
    qr_code_id: Optional[UUID]
    created_at: datetime
    
    class Config:
        from_attributes = True


class SeatAvailability(BaseModel):
    """Seat availability schema"""
    schedule_id: UUID
    journey_date: date
    total_seats: int
    available_seats: List[int]
    booked_seats: List[int]
    
    @property
    def available_count(self) -> int:
        return len(self.available_seats)
    
    @property
    def booked_count(self) -> int:
        return len(self.booked_seats)
