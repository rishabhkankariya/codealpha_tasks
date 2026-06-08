"""Bus pass endpoints"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from pydantic import BaseModel

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.pass_model import PassType, BusPass, PassStatus
from app.models.qr_code import QRCode
from app.services.pass_service import PassService

router = APIRouter()


class PassPurchaseRequest(BaseModel):
    pass_type_id: UUID


def _pass_to_dict(bus_pass: BusPass, db: Session) -> dict:
    """Convert pass to rich dict with type info and QR code"""
    pass_type = db.query(PassType).filter(PassType.id == bus_pass.pass_type_id).first()
    qr = db.query(QRCode).filter(QRCode.id == bus_pass.qr_code_id).first() if bus_pass.qr_code_id else None

    return {
        "id": str(bus_pass.id),
        "pass_number": bus_pass.pass_number,
        "pass_type_id": str(bus_pass.pass_type_id),
        "start_date": bus_pass.valid_from.isoformat() if bus_pass.valid_from else None,
        "end_date": bus_pass.valid_to.isoformat() if bus_pass.valid_to else None,
        "valid_from": bus_pass.valid_from.isoformat() if bus_pass.valid_from else None,
        "valid_to": bus_pass.valid_to.isoformat() if bus_pass.valid_to else None,
        "status": bus_pass.pass_status.value,
        "pass_status": bus_pass.pass_status.value,
        "qr_code_data": qr.qr_code_data if qr else None,
        "created_at": bus_pass.created_at.isoformat() if bus_pass.created_at else None,
        "pass_type": {
            "name": pass_type.pass_name if pass_type else "Unknown",
            "duration_days": pass_type.validity_days if pass_type else 0,
            "price": float(pass_type.price) if pass_type else 0,
            "category": getattr(pass_type, "category", "General") or "General",
            "travel_area": getattr(pass_type, "travel_area", "") or "",
            "time_validity": getattr(pass_type, "time_validity", "") or "",
            "discount_info": getattr(pass_type, "discount_info", "") or "",
            "eligibility": getattr(pass_type, "eligibility", "") or "",
        } if pass_type else None,
    }


@router.get("/types")
async def get_pass_types(db: Session = Depends(get_db)):
    """Get all available pass types with full PMPML 2026 data"""
    pass_types = db.query(PassType).filter(PassType.is_active == True).all()
    return [
        {
            "id": str(pt.id),
            "name": pt.pass_name,
            "pass_name": pt.pass_name,
            "validity_days": pt.validity_days,
            "duration_days": pt.validity_days,
            "price": float(pt.price),
            "description": pt.description or "",
            "category": getattr(pt, "category", "General") or "General",
            "travel_area": getattr(pt, "travel_area", "") or "",
            "time_validity": getattr(pt, "time_validity", "") or "",
            "discount_info": getattr(pt, "discount_info", "") or "",
            "eligibility": getattr(pt, "eligibility", "") or "",
            "is_active": pt.is_active,
            "is_free": float(pt.price) == 0.0,
        }
        for pt in pass_types
    ]


@router.post("/", status_code=status.HTTP_201_CREATED)
async def purchase_pass(
    request: PassPurchaseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Purchase a bus pass — generates QR code immediately"""
    try:
        service = PassService(db)
        bus_pass = await service.create_pass(
            user_id=current_user.id,
            pass_type_id=request.pass_type_id,
        )
        return _pass_to_dict(bus_pass, db)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/")
async def get_my_passes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all passes for the current user"""
    service = PassService(db)
    passes = await service.get_user_passes(current_user.id)
    return [_pass_to_dict(p, db) for p in passes]


@router.get("/{pass_id}")
async def get_pass(
    pass_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = PassService(db)
    bus_pass = await service.get_pass(pass_id, current_user.id)
    if not bus_pass:
        raise HTTPException(status_code=404, detail="Pass not found")
    return _pass_to_dict(bus_pass, db)
