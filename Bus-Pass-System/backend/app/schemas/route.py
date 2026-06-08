"""Route schemas"""

from pydantic import BaseModel
from typing import List
from datetime import datetime
from uuid import UUID
from decimal import Decimal


class RouteStopResponse(BaseModel):
    """Route stop response schema"""
    id: UUID
    stop_name: str
    stop_sequence: int
    distance_from_origin_km: Decimal
    
    class Config:
        from_attributes = True


class RouteCreate(BaseModel):
    """Route creation schema"""
    route_number: str
    origin: str
    destination: str
    distance_km: Decimal
    estimated_duration_minutes: int
    base_fare: Decimal
    is_active: bool = True


class RouteUpdate(BaseModel):
    """Route update schema"""
    route_number: str | None = None
    origin: str | None = None
    destination: str | None = None
    distance_km: Decimal | None = None
    estimated_duration_minutes: int | None = None
    base_fare: Decimal | None = None
    is_active: bool | None = None


class RouteResponse(BaseModel):
    """Route response schema"""
    id: UUID
    route_number: str
    origin: str
    destination: str
    distance_km: Decimal
    estimated_duration_minutes: int
    is_active: bool
    created_at: datetime
    fare: Decimal | None = None
    
    class Config:
        from_attributes = True


class RoutePaginationResponse(BaseModel):
    """Route pagination response schema"""
    items: List[RouteResponse]
    total: int
    page: int
    page_size: int
    pages: int
