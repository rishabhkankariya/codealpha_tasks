"""Bus pass schemas"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from uuid import UUID
from decimal import Decimal

from app.models.pass_model import PassStatus


class PassCreate(BaseModel):
    """Pass creation schema"""
    pass_type_id: UUID
    route_id: UUID


class PassResponse(BaseModel):
    """Pass response schema"""
    id: UUID
    user_id: UUID
    pass_type_id: UUID
    route_id: UUID
    pass_number: str
    valid_from: date
    valid_to: date
    pass_status: PassStatus
    qr_code_id: Optional[UUID]
    pdf_url: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True
