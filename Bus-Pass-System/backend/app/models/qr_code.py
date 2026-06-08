"""QR Code model"""

from sqlalchemy import Column, String, Boolean, DateTime, Integer, Enum
from app.core.types import UUID
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class QRType(str, enum.Enum):
    """QR code type enumeration"""
    TICKET = "ticket"
    PASS = "pass"


class QRCode(Base):
    """QR Code model"""
    __tablename__ = "qr_codes"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    qr_code_data = Column(String, unique=True, nullable=False)
    verification_token = Column(String(255), unique=True, nullable=False, index=True)
    qr_type = Column(Enum(QRType), nullable=False, index=True)
    reference_id = Column(UUID(), nullable=False, index=True)
    is_used = Column(Boolean, default=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    scan_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<QRCode {self.id} - {self.qr_type}>"
