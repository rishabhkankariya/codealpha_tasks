"""Booking service - simplified, no Redis dependency"""

from datetime import datetime, timedelta, date
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.booking import Booking, BookingStatus, PaymentStatus
from app.models.schedule import Schedule
from app.models.route import Route
from app.models.pricing import PricingRule
from app.core.exceptions import NotFoundException, BadRequestException
from app.services.qr_service import QRService


class BookingService:
    def __init__(self, db: Session):
        self.db = db
        self.qr_service = QRService(db)

    def _get_fare(self, schedule_id: UUID) -> float:
        """Calculate fare from pricing rules or distance"""
        schedule = self.db.query(Schedule).filter(Schedule.id == schedule_id).first()
        if not schedule:
            return 30.0
        route = self.db.query(Route).filter(Route.id == schedule.route_id).first()
        if not route:
            return 30.0
        # Try pricing rule
        rule = self.db.query(PricingRule).filter(
            PricingRule.route_id == route.id,
            PricingRule.is_active == True
        ).first()
        if rule:
            return float(rule.base_price)
        # Fallback: distance-based
        return max(10.0, round(10 + float(route.distance_km) * 1.5))

    async def create_booking(self, user_id: UUID, schedule_id: UUID,
                              journey_date: date, num_seats: int = 1) -> Booking:
        """Create a confirmed booking with QR code"""
        schedule = self.db.query(Schedule).filter(Schedule.id == schedule_id).first()
        if not schedule:
            raise NotFoundException("Schedule not found")

        # Allow today and future dates (use UTC date, subtract 1 day buffer for timezone)
        from datetime import timedelta
        min_date = date.today() - timedelta(days=1)
        if journey_date < min_date:
            raise BadRequestException("Cannot book for past dates. Please select today or a future date.")

        fare = self._get_fare(schedule_id)
        total_price = fare * num_seats

        # Create booking (auto-confirmed, no payment gateway)
        booking = Booking(
            user_id=user_id,
            schedule_id=schedule_id,
            journey_date=journey_date,
            seat_number=1,  # simplified seat assignment
            booking_status=BookingStatus.CONFIRMED,
            price=total_price,
            payment_status=PaymentStatus.COMPLETED,
            reservation_expires_at=None,
        )
        self.db.add(booking)
        self.db.commit()
        self.db.refresh(booking)

        # Generate QR code immediately
        try:
            qr_code = await self.qr_service.generate_ticket_qr(booking.id)
            booking.qr_code_id = qr_code.id
            self.db.commit()
            self.db.refresh(booking)
        except Exception as e:
            print(f"QR generation warning: {e}")

        return booking

    async def cancel_booking(self, booking_id: UUID, user_id: UUID) -> Booking:
        booking = self.db.query(Booking).filter(
            and_(Booking.id == booking_id, Booking.user_id == user_id)
        ).first()
        if not booking:
            raise NotFoundException("Booking not found")
        if booking.booking_status == BookingStatus.COMPLETED:
            raise BadRequestException("Cannot cancel completed booking")
        booking.booking_status = BookingStatus.CANCELLED
        self.db.commit()
        self.db.refresh(booking)
        return booking

    async def get_user_bookings(self, user_id: UUID) -> List[Booking]:
        return self.db.query(Booking).filter(
            Booking.user_id == user_id
        ).order_by(Booking.created_at.desc()).all()

    async def get_booking(self, booking_id: UUID, user_id: UUID) -> Optional[Booking]:
        return self.db.query(Booking).filter(
            and_(Booking.id == booking_id, Booking.user_id == user_id)
        ).first()
