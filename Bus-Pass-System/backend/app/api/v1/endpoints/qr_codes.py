"""QR Code endpoints"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.qr_code import QRVerificationRequest, QRVerificationResponse
from app.services.qr_service import QRService

router = APIRouter()


@router.post("/verify", response_model=dict)
async def verify_qr_code(
    verification_data: QRVerificationRequest,
    db: Session = Depends(get_db)
):
    """
    Verify a QR code
    
    Validates QR code and returns ticket or pass details.
    Increments scan count and marks single-use tickets as used.
    
    - **verification_token**: Token from QR code
    
    Returns:
    - For tickets: booking details, passenger name, seat number
    - For passes: pass details, validity period, passenger name
    - Flags fraudulent multiple scans for single-use tickets
    """
    qr_service = QRService(db)
    result = await qr_service.verify_qr_code(verification_data.verification_token)
    return result
