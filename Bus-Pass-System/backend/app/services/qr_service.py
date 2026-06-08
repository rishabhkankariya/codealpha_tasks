"""QR Code service"""

import secrets
import qrcode
from io import BytesIO
import base64
from datetime import datetime
from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.qr_code import QRCode, QRType
from app.models.booking import Booking
from app.models.pass_model import BusPass
from app.core.exceptions import InvalidQRCodeException, NotFoundException


class QRService:
    """QR Code generation and verification service"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def _generate_verification_token(self) -> str:
        """Generate a cryptographically secure verification token"""
        return secrets.token_urlsafe(32)
    
    def _generate_qr_image(self, data: str) -> str:
        """Generate QR code image and return as base64 string"""
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )
        qr.add_data(data)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return f"data:image/png;base64,{img_str}"
    
    async def generate_ticket_qr(self, booking_id: UUID) -> QRCode:
        """Generate QR code for a ticket"""
        # Verify booking exists
        booking = self.db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise NotFoundException("Booking not found")
        
        # Generate verification token
        verification_token = self._generate_verification_token()
        
        # Create QR code data
        qr_data = f"TICKET:{booking_id}:{verification_token}"
        
        # Generate QR code image
        qr_image = self._generate_qr_image(qr_data)
        
        # Save to database
        qr_code = QRCode(
            qr_code_data=qr_image,
            verification_token=verification_token,
            qr_type=QRType.TICKET,
            reference_id=booking_id
        )
        
        self.db.add(qr_code)
        self.db.commit()
        self.db.refresh(qr_code)
        
        return qr_code
    
    async def generate_pass_qr(self, pass_id: UUID) -> QRCode:
        """Generate QR code for a bus pass"""
        # Verify pass exists
        bus_pass = self.db.query(BusPass).filter(BusPass.id == pass_id).first()
        if not bus_pass:
            raise NotFoundException("Bus pass not found")
        
        # Generate verification token
        verification_token = self._generate_verification_token()
        
        # Create QR code data
        qr_data = f"PASS:{pass_id}:{verification_token}"
        
        # Generate QR code image
        qr_image = self._generate_qr_image(qr_data)
        
        # Save to database
        qr_code = QRCode(
            qr_code_data=qr_image,
            verification_token=verification_token,
            qr_type=QRType.PASS,
            reference_id=pass_id
        )
        
        self.db.add(qr_code)
        self.db.commit()
        self.db.refresh(qr_code)
        
        return qr_code
    
    async def verify_qr_code(self, verification_token: str) -> dict:
        """Verify QR code and return details"""
        # Find QR code
        qr_code = self.db.query(QRCode).filter(
            QRCode.verification_token == verification_token
        ).first()
        
        if not qr_code:
            raise InvalidQRCodeException("Invalid QR code")
        
        # Increment scan count
        qr_code.scan_count += 1
        
        # Check type and get details
        if qr_code.qr_type == QRType.TICKET:
            booking = self.db.query(Booking).filter(
                Booking.id == qr_code.reference_id
            ).first()
            
            if not booking:
                raise InvalidQRCodeException("Ticket not found")
            
            # Check if already used (for single-use tickets)
            if qr_code.is_used and qr_code.scan_count > 1:
                self.db.commit()
                return {
                    "valid": False,
                    "type": "ticket",
                    "message": "Ticket already used - potential fraud",
                    "scan_count": qr_code.scan_count
                }
            
            # Mark as used
            if not qr_code.is_used:
                qr_code.is_used = True
                qr_code.used_at = datetime.utcnow()
            
            self.db.commit()
            
            return {
                "valid": True,
                "type": "ticket",
                "booking_id": str(booking.id),
                "seat_number": booking.seat_number,
                "journey_date": booking.journey_date.isoformat(),
                "scan_count": qr_code.scan_count
            }
        
        elif qr_code.qr_type == QRType.PASS:
            bus_pass = self.db.query(BusPass).filter(
                BusPass.id == qr_code.reference_id
            ).first()
            
            if not bus_pass:
                raise InvalidQRCodeException("Pass not found")
            
            # Check if pass is expired
            from datetime import date
            if bus_pass.valid_to < date.today():
                self.db.commit()
                return {
                    "valid": False,
                    "type": "pass",
                    "message": "Pass has expired",
                    "expired_on": bus_pass.valid_to.isoformat()
                }
            
            self.db.commit()
            
            return {
                "valid": True,
                "type": "pass",
                "pass_id": str(bus_pass.id),
                "pass_number": bus_pass.pass_number,
                "valid_from": bus_pass.valid_from.isoformat(),
                "valid_to": bus_pass.valid_to.isoformat(),
                "scan_count": qr_code.scan_count
            }
        
        raise InvalidQRCodeException("Unknown QR code type")
