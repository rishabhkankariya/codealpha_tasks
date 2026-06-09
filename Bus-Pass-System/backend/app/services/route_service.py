"""Route service"""

from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import or_
from decimal import Decimal

from app.models.route import Route
from app.models.pricing import PricingRule
from app.core.exceptions import NotFoundException


class RouteService:
    """Route service for route management"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def _calculate_fare(self, route: Route) -> Decimal:
        """Calculate fare for a route"""
        # Check if there's a pricing rule for this route
        pricing_rule = self.db.query(PricingRule).filter(
            PricingRule.route_id == route.id,
            PricingRule.is_active == True
        ).first()
        
        if pricing_rule:
            return pricing_rule.base_price
        
        # Fallback calculation
        BASE_FARE = Decimal("10.00")
        PER_KM_RATE = Decimal("1.50")
        fare = BASE_FARE + (route.distance_km * PER_KM_RATE)
        fare = round(fare / 5) * 5  # Round to nearest ₹5
        return max(Decimal("10.00"), min(fare, Decimal("100.00")))
    
    async def get_all_active_routes(self) -> List[dict]:
        """Get all active routes with pricing"""
        routes = self.db.query(Route).filter(Route.is_active == True).all()
        
        result = []
        for route in routes:
            route_dict = {
                "id": route.id,
                "route_number": route.route_number,
                "origin": route.origin,
                "destination": route.destination,
                "distance_km": route.distance_km,
                "estimated_duration_minutes": route.estimated_duration_minutes,
                "is_active": route.is_active,
                "created_at": route.created_at,
                "fare": self._calculate_fare(route)
            }
            result.append(route_dict)
        
        return result
    
    async def get_route_by_id(self, route_id: UUID) -> Optional[dict]:
        """Get route by ID with pricing"""
        route = self.db.query(Route).filter(Route.id == route_id).first()
        
        if not route:
            return None
        
        return {
            "id": route.id,
            "route_number": route.route_number,
            "origin": route.origin,
            "destination": route.destination,
            "distance_km": route.distance_km,
            "estimated_duration_minutes": route.estimated_duration_minutes,
            "is_active": route.is_active,
            "created_at": route.created_at,
            "fare": self._calculate_fare(route)
        }
    
    async def get_active_routes_paginated(
        self, page: int = 1, page_size: int = 20, search: Optional[str] = None
    ) -> dict:
        """Get active routes with pagination and search"""
        query = self.db.query(Route).filter(Route.is_active == True)
        
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Route.route_number.ilike(search_pattern),
                    Route.origin.ilike(search_pattern),
                    Route.destination.ilike(search_pattern)
                )
            )
            
        total = query.count()
        pages = (total + page_size - 1) // page_size if total > 0 else 0
        
        # Calculate offset
        offset = (page - 1) * page_size
        routes = query.offset(offset).limit(page_size).all()
        
        items = []
        for route in routes:
            items.append({
                "id": route.id,
                "route_number": route.route_number,
                "origin": route.origin,
                "destination": route.destination,
                "distance_km": route.distance_km,
                "estimated_duration_minutes": route.estimated_duration_minutes,
                "is_active": route.is_active,
                "created_at": route.created_at,
                "fare": self._calculate_fare(route)
            })
            
        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": pages
        }
