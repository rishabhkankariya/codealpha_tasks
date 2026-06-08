"""Celery tasks"""

import logging
from datetime import date, timedelta

from app.celery_app import celery_app
from app.core.database import SessionLocal
from app.services.booking_service import BookingService
from app.services.pass_service import PassService
from app.models.pass_model import BusPass, PassStatus
from app.models.notification import Notification, NotificationType
from app.core.config import settings

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.expire_reservations")
def expire_reservations():
    """Expire old seat reservations"""
    db = SessionLocal()
    try:
        booking_service = BookingService(db)
        # Note: This is a sync wrapper for the async method
        # In production, use celery with async support or make service methods sync
        expired_count = 0  # Placeholder
        logger.info(f"Expired {expired_count} reservations")
        return expired_count
    except Exception as e:
        logger.error(f"Error expiring reservations: {e}")
        raise
    finally:
        db.close()


@celery_app.task(name="app.tasks.expire_passes")
def expire_passes():
    """Expire old bus passes"""
    db = SessionLocal()
    try:
        pass_service = PassService(db)
        # Note: This is a sync wrapper for the async method
        expired_count = 0  # Placeholder
        logger.info(f"Expired {expired_count} passes")
        return expired_count
    except Exception as e:
        logger.error(f"Error expiring passes: {e}")
        raise
    finally:
        db.close()


@celery_app.task(name="app.tasks.send_pass_expiry_reminders")
def send_pass_expiry_reminders():
    """Send reminders for passes expiring soon"""
    db = SessionLocal()
    try:
        reminder_date = date.today() + timedelta(days=settings.PASS_EXPIRY_REMINDER_DAYS)
        
        # Get passes expiring soon
        expiring_passes = db.query(BusPass).filter(
            BusPass.pass_status == PassStatus.ACTIVE,
            BusPass.valid_to == reminder_date
        ).all()
        
        # Create notifications
        for bus_pass in expiring_passes:
            notification = Notification(
                user_id=bus_pass.user_id,
                notification_type=NotificationType.PASS_EXPIRY,
                title="Bus Pass Expiring Soon",
                message=f"Your bus pass {bus_pass.pass_number} will expire on {bus_pass.valid_to}. Please renew to continue using the service."
            )
            db.add(notification)
        
        db.commit()
        logger.info(f"Sent {len(expiring_passes)} pass expiry reminders")
        return len(expiring_passes)
    except Exception as e:
        logger.error(f"Error sending pass expiry reminders: {e}")
        db.rollback()
        raise
    finally:
        db.close()


@celery_app.task(name="app.tasks.generate_pass_pdf")
def generate_pass_pdf(pass_id: str):
    """Generate PDF for a bus pass"""
    db = SessionLocal()
    try:
        # TODO: Implement PDF generation
        logger.info(f"Generating PDF for pass {pass_id}")
        return f"pdf_url_for_{pass_id}"
    except Exception as e:
        logger.error(f"Error generating PDF: {e}")
        raise
    finally:
        db.close()


@celery_app.task(name="app.tasks.send_booking_confirmation")
def send_booking_confirmation(booking_id: str):
    """Send booking confirmation notification"""
    db = SessionLocal()
    try:
        # TODO: Implement notification sending
        logger.info(f"Sending booking confirmation for {booking_id}")
        return True
    except Exception as e:
        logger.error(f"Error sending booking confirmation: {e}")
        raise
    finally:
        db.close()
