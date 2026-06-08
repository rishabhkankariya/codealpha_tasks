"""Schedule model"""

from sqlalchemy import Column, Time, Boolean, DateTime, ForeignKey, Integer
from app.core.types import UUID, ARRAY
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class Schedule(Base):
    """Schedule model"""
    __tablename__ = "schedules"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    route_id = Column(UUID(), ForeignKey("routes.id", ondelete="CASCADE"), nullable=False, index=True)
    bus_id = Column(UUID(), ForeignKey("buses.id", ondelete="CASCADE"), nullable=False, index=True)
    departure_time = Column(Time, nullable=False, index=True)
    arrival_time = Column(Time, nullable=False)
    days_of_week = Column(ARRAY(Integer), nullable=False)  # 0=Sunday, 6=Saturday
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<Schedule {self.id} - Departure: {self.departure_time}>"
