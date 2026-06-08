"""Booking endpoints"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import date, datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.booking import Booking, BookingStatus, PaymentStatus
from app.models.schedule import Schedule
from app.models.route import Route
from app.models.qr_code import QRCode
from app.services.booking_service import BookingService

router = APIRouter()


class BookingRequest(BaseModel):
    schedule_id: UUID
    booking_date: Optional[str] = None   # frontend sends booking_date
    journey_date: Optional[str] = None   # also accept journey_date
    num_seats: int = 1


def _booking_to_dict(booking: Booking, db: Session) -> dict:
    """Convert booking to rich dict with route/schedule info"""
    schedule = db.query(Schedule).filter(Schedule.id == booking.schedule_id).first()
    route = db.query(Route).filter(Route.id == schedule.route_id).first() if schedule else None
    qr = db.query(QRCode).filter(QRCode.id == booking.qr_code_id).first() if booking.qr_code_id else None

    return {
        "id": str(booking.id),
        "schedule_id": str(booking.schedule_id),
        "booking_date": booking.journey_date.isoformat() if booking.journey_date else None,
        "journey_date": booking.journey_date.isoformat() if booking.journey_date else None,
        "num_seats": 1,
        "seat_number": booking.seat_number,
        "total_amount": float(booking.price),
        "status": booking.booking_status.value,
        "booking_status": booking.booking_status.value,
        "payment_status": booking.payment_status.value,
        "created_at": booking.created_at.isoformat() if booking.created_at else None,
        "qr_code_data": qr.qr_code_data if qr else None,
        "route": {
            "route_number": route.route_number if route else "N/A",
            "origin": route.origin if route else "N/A",
            "destination": route.destination if route else "N/A",
        } if route else None,
        "schedule": {
            "departure_time": schedule.departure_time.strftime("%H:%M") if schedule else "N/A",
            "arrival_time": schedule.arrival_time.strftime("%H:%M") if schedule else "N/A",
        } if schedule else None,
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking_data: BookingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new booking — auto-confirmed with QR code"""
    try:
        # Parse date from either field
        raw_date = booking_data.booking_date or booking_data.journey_date
        if raw_date:
            journey_date = date.fromisoformat(raw_date)
        else:
            journey_date = date.today()

        service = BookingService(db)
        booking = await service.create_booking(
            user_id=current_user.id,
            schedule_id=booking_data.schedule_id,
            journey_date=journey_date,
            num_seats=booking_data.num_seats,
        )
        return _booking_to_dict(booking, db)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/")
async def get_my_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all bookings for the current user"""
    service = BookingService(db)
    bookings = await service.get_user_bookings(current_user.id)
    return [_booking_to_dict(b, db) for b in bookings]


@router.get("/{booking_id}")
async def get_booking(
    booking_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = BookingService(db)
    booking = await service.get_booking(booking_id, current_user.id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return _booking_to_dict(booking, db)


@router.put("/{booking_id}/cancel")
async def cancel_booking(
    booking_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = BookingService(db)
    booking = await service.cancel_booking(booking_id, current_user.id)
    return _booking_to_dict(booking, db)


@router.post("/{booking_id}/cancel")
async def cancel_booking_post(
    booking_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = BookingService(db)
    booking = await service.cancel_booking(booking_id, current_user.id)
    return _booking_to_dict(booking, db)
