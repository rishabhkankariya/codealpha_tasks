"""Bus pass models"""

from sqlalchemy import Column, String, Integer, Numeric, Boolean, DateTime, Date, ForeignKey, Enum, Text
from app.core.types import UUID
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class PassStatus(str, enum.Enum):
    """Pass status enumeration"""
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class PassType(Base):
    """Pass type model"""
    __tablename__ = "pass_types"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    pass_name = Column(String(100), nullable=False)
    validity_days = Column(Integer, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    description = Column(Text, nullable=True)
    # Extended PMPML fields
    category = Column(String(50), nullable=True)          # General, Student, Senior Citizen …
    travel_area = Column(String(200), nullable=True)       # PMC+PCMC, All routes …
    time_validity = Column(String(200), nullable=True)     # Full service day, School timings …
    discount_info = Column(String(200), nullable=True)     # Unlimited rides, 50% concession …
    eligibility = Column(Text, nullable=True)              # Who can buy this pass
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<PassType {self.pass_name}>"


class BusPass(Base):
    """Bus pass model"""
    __tablename__ = "bus_passes"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    pass_type_id = Column(UUID(), ForeignKey("pass_types.id", ondelete="CASCADE"), nullable=False)
    route_id = Column(UUID(), ForeignKey("routes.id", ondelete="CASCADE"), nullable=False)
    pass_number = Column(String(50), unique=True, nullable=False, index=True)
    valid_from = Column(Date, nullable=False, index=True)
    valid_to = Column(Date, nullable=False, index=True)
    pass_status = Column(Enum(PassStatus), nullable=False, default=PassStatus.ACTIVE, index=True)
    qr_code_id = Column(UUID(), nullable=True, index=True)
    pdf_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<BusPass {self.pass_number}>"
