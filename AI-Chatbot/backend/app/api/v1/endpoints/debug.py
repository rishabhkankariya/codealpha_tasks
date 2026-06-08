"""Debug endpoints"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.route import Route
from app.schemas.route import RouteResponse
from app.services.route_service import RouteService

router = APIRouter()


@router.get("/routes/count")
async def get_routes_count(db: Session = Depends(get_db)):
    """
    Get total number of routes in the database
    """
    count = db.query(Route).count()
    active_count = db.query(Route).filter(Route.is_active == True).count()
    return {
        "total_routes": count,
        "active_routes": active_count
    }


@router.get("/routes/sample", response_model=List[RouteResponse])
async def get_routes_sample(db: Session = Depends(get_db)):
    """
    Get a sample of the first 5 active routes with pricing
    """
    route_service = RouteService(db)
    routes = db.query(Route).filter(Route.is_active == True).limit(5).all()
    
    result = []
    for route in routes:
        result.append({
            "id": route.id,
            "route_number": route.route_number,
            "origin": route.origin,
            "destination": route.destination,
            "distance_km": route.distance_km,
            "estimated_duration_minutes": route.estimated_duration_minutes,
            "is_active": route.is_active,
            "created_at": route.created_at,
            "fare": route_service._calculate_fare(route)
        })
    return result
