"""
Admin Dashboard Schemas
Pydantic models for admin API requests and responses
"""
from datetime import datetime
from typing import Dict, Optional
from pydantic import BaseModel, Field, validator


# ============================================================================
# ANALYTICS SCHEMAS
# ============================================================================

class AnalyticsSummary(BaseModel):
    """Overall system analytics summary"""
    total_bookings: int = Field(..., description="Total number of bookings")
    active_passes: int = Field(..., description="Number of active passes")
    total_revenue: float = Field(..., description="Total revenue generated")
    active_users: int = Field(..., description="Number of active users")
    total_users: int = Field(..., description="Total registered users")
    total_routes: int = Field(..., description="Total active routes")
    avg_booking_value: float = Field(..., description="Average booking value")
    period_days: int = Field(..., description="Analysis period in days")
    
    class Config:
        from_attributes = True


class RevenueAnalytics(BaseModel):
    """Detailed revenue analytics"""
    total_revenue: float = Field(..., description="Total revenue")
    booking_revenue: float = Field(..., description="Revenue from bookings")
    pass_revenue: float = Field(..., description="Revenue from passes")
    revenue_by_day: Dict[str, float] = Field(..., description="Daily revenue breakdown")
    period_days: int = Field(..., description="Analysis period in days")
    
    class Config:
        from_attributes = True


class BookingAnalytics(BaseModel):
    """Detailed booking analytics"""
    total_bookings: int = Field(..., description="Total bookings")
    confirmed_bookings: int = Field(..., description="Confirmed bookings")
    cancelled_bookings: int = Field(..., description="Cancelled bookings")
    completed_bookings: int = Field(..., description="Completed bookings")
    avg_seats_per_booking: float = Field(..., description="Average seats per booking")
    bookings_by_hour: Dict[int, int] = Field(..., description="Bookings by hour of day")
    period_days: int = Field(..., description="Analysis period in days")
    
    class Config:
        from_attributes = True


class RoutePerformance(BaseModel):
    """Route performance metrics"""
    route_id: int = Field(..., description="Route ID")
    route_number: str = Field(..., description="Route number")
    origin: str = Field(..., description="Origin location")
    destination: str = Field(..., description="Destination location")
    total_bookings: int = Field(..., description="Total bookings for this route")
    total_seats_sold: int = Field(..., description="Total seats sold")
    total_revenue: float = Field(..., description="Total revenue generated")
    occupancy_rate: float = Field(..., description="Average occupancy rate (%)")
    period_days: int = Field(..., description="Analysis period in days")
    
    class Config:
        from_attributes = True


# ============================================================================
# PRICING SCHEMAS
# ============================================================================

class PricingBase(BaseModel):
    """Base pricing schema"""
    route_id: int = Field(..., description="Route ID")
    base_price: float = Field(..., gt=0, description="Base price per seat")
    peak_multiplier: float = Field(1.0, ge=1.0, le=3.0, description="Peak hour price multiplier")
    weekend_multiplier: float = Field(1.0, ge=1.0, le=2.0, description="Weekend price multiplier")
    holiday_multiplier: float = Field(1.0, ge=1.0, le=3.0, description="Holiday price multiplier")
    discount_percentage: float = Field(0.0, ge=0.0, le=100.0, description="Discount percentage")
    effective_from: datetime = Field(..., description="Effective from date")
    effective_until: Optional[datetime] = Field(None, description="Effective until date")


class PricingCreate(PricingBase):
    """Schema for creating pricing"""
    pass


class PricingUpdate(BaseModel):
    """Schema for updating pricing"""
    base_price: Optional[float] = Field(None, gt=0)
    peak_multiplier: Optional[float] = Field(None, ge=1.0, le=3.0)
    weekend_multiplier: Optional[float] = Field(None, ge=1.0, le=2.0)
    holiday_multiplier: Optional[float] = Field(None, ge=1.0, le=3.0)
    discount_percentage: Optional[float] = Field(None, ge=0.0, le=100.0)
    effective_from: Optional[datetime] = None
    effective_until: Optional[datetime] = None
    is_active: Optional[bool] = None


class PricingResponse(PricingBase):
    """Schema for pricing response"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# BUS SCHEMAS
# ============================================================================

class BusBase(BaseModel):
    """Base bus schema"""
    bus_number: str = Field(..., min_length=1, max_length=20, description="Bus registration number")
    capacity: int = Field(..., gt=0, le=100, description="Total seating capacity")
    bus_type: str = Field(..., description="Type of bus (AC/Non-AC/Sleeper)")
    manufacturer: Optional[str] = Field(None, max_length=100, description="Bus manufacturer")
    model: Optional[str] = Field(None, max_length=100, description="Bus model")
    year: Optional[int] = Field(None, ge=2000, le=2030, description="Manufacturing year")
    
    @validator('bus_type')
    def validate_bus_type(cls, v):
        allowed_types = ['AC', 'Non-AC', 'Sleeper', 'Semi-Sleeper', 'Luxury']
        if v not in allowed_types:
            raise ValueError(f"Bus type must be one of: {', '.join(allowed_types)}")
        return v


class BusCreate(BusBase):
    """Schema for creating a bus"""
    pass


class BusUpdate(BaseModel):
    """Schema for updating a bus"""
    bus_number: Optional[str] = Field(None, min_length=1, max_length=20)
    capacity: Optional[int] = Field(None, gt=0, le=100)
    bus_type: Optional[str] = None
    manufacturer: Optional[str] = Field(None, max_length=100)
    model: Optional[str] = Field(None, max_length=100)
    year: Optional[int] = Field(None, ge=2000, le=2030)
    is_active: Optional[bool] = None
    
    @validator('bus_type')
    def validate_bus_type(cls, v):
        if v is not None:
            allowed_types = ['AC', 'Non-AC', 'Sleeper', 'Semi-Sleeper', 'Luxury']
            if v not in allowed_types:
                raise ValueError(f"Bus type must be one of: {', '.join(allowed_types)}")
        return v


class BusResponse(BusBase):
    """Schema for bus response"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# SCHEDULE SCHEMAS
# ============================================================================

class ScheduleBase(BaseModel):
    """Base schedule schema"""
    route_id: int = Field(..., description="Route ID")
    bus_id: int = Field(..., description="Bus ID")
    departure_time: datetime = Field(..., description="Scheduled departure time")
    arrival_time: datetime = Field(..., description="Scheduled arrival time")
    available_seats: int = Field(..., ge=0, description="Available seats")
    
    @validator('arrival_time')
    def validate_arrival_time(cls, v, values):
        if 'departure_time' in values and v <= values['departure_time']:
            raise ValueError("Arrival time must be after departure time")
        return v


class ScheduleCreate(ScheduleBase):
    """Schema for creating a schedule"""
    pass


class ScheduleUpdate(BaseModel):
    """Schema for updating a schedule"""
    route_id: Optional[int] = None
    bus_id: Optional[int] = None
    departure_time: Optional[datetime] = None
    arrival_time: Optional[datetime] = None
    available_seats: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None


class ScheduleResponse(ScheduleBase):
    """Schema for schedule response"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
