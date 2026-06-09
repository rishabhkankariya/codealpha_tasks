"""Pricing rule model"""

from sqlalchemy import Column, String, Numeric, Integer, Boolean, DateTime, Date, ForeignKey
from app.core.types import UUID
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class PricingRule(Base):
    """Pricing rule model"""
    __tablename__ = "pricing_rules"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    rule_name = Column(String(255), nullable=False)
    route_id = Column(UUID(), ForeignKey("routes.id", ondelete="CASCADE"), nullable=True, index=True)
    bus_type = Column(String(50), nullable=True)
    base_price = Column(Numeric(10, 2), nullable=False)
    price_per_km = Column(Numeric(10, 2), nullable=True)
    priority = Column(Integer, default=0, index=True)
    valid_from = Column(Date, nullable=False, index=True)
    valid_to = Column(Date, nullable=True, index=True)
    is_active = Column(Boolean, default=True)
    created_by = Column(UUID(), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<PricingRule {self.rule_name}>"
