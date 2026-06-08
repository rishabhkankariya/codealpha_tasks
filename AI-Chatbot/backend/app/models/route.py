"""Route models"""

from sqlalchemy import Column, String, Numeric, Integer, Boolean, DateTime, ForeignKey
from app.core.types import UUID
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class Route(Base):
    """Route model"""
    __tablename__ = "routes"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    route_number = Column(String(50), unique=True, nullable=False, index=True)
    origin = Column(String(255), nullable=False, index=True)
    destination = Column(String(255), nullable=False, index=True)
    distance_km = Column(Numeric(10, 2), nullable=False)
    estimated_duration_minutes = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<Route {self.route_number}: {self.origin} -> {self.destination}>"


class RouteStop(Base):
    """Route stop model"""
    __tablename__ = "route_stops"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    route_id = Column(UUID(), ForeignKey("routes.id", ondelete="CASCADE"), nullable=False, index=True)
    stop_name = Column(String(255), nullable=False)
    stop_sequence = Column(Integer, nullable=False)
    distance_from_origin_km = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<RouteStop {self.stop_name} (Seq: {self.stop_sequence})>"
