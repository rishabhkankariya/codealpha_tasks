"""QR Code schemas"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

from app.models.qr_code import QRType


class QRCodeResponse(BaseModel):
    """QR Code response schema"""
    id: UUID
    qr_code_data: str
    verification_token: str
    qr_type: QRType
    reference_id: UUID
    is_used: bool
    scan_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class QRVerificationRequest(BaseModel):
    """QR verification request schema"""
    verification_token: str


class QRVerificationResponse(BaseModel):
    """QR verification response schema"""
    valid: bool
    type: str
    message: Optional[str] = None
    scan_count: int
    # Additional fields returned dynamically based on type
