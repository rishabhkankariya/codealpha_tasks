"""Route endpoints"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.schemas.route import RouteResponse, RoutePaginationResponse
from app.services.route_service import RouteService

router = APIRouter()


@router.get("/", response_model=RoutePaginationResponse)
async def get_all_routes(
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get all active routes with pagination and optional search
    
    Returns paginated list of available bus routes
    """
    route_service = RouteService(db)
    routes = await route_service.get_active_routes_paginated(
        page=page, page_size=page_size, search=search
    )
    return routes


@router.get("/{route_id}", response_model=RouteResponse)
async def get_route(
    route_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get route details by ID
    
    Returns route information including stops
    """
    route_service = RouteService(db)
    route = await route_service.get_route_by_id(route_id)
    
    if not route:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Route not found")
    
    return route


@router.get("/{route_id}/schedules")
async def get_route_schedules(
    route_id: str,
    db: Session = Depends(get_db)
):
    """
    Get schedules for a specific route (public endpoint).
    Returns PMPML-style timings (5 AM – 11:30 PM) with seat availability.
    """
    from app.models.schedule import Schedule
    from app.models.bus import Bus, BusType
    from datetime import time
    import traceback
    import uuid as uuid_lib

    try:
        # Normalise route_id to UUID object
        try:
            route_uuid = uuid_lib.UUID(str(route_id))
        except ValueError:
            from fastapi import HTTPException
            raise HTTPException(status_code=422, detail="Invalid route ID format")

        # Query existing schedules for this route
        schedules = db.query(Schedule).filter(
            Schedule.route_id == route_uuid,
            Schedule.is_active == True
        ).order_by(Schedule.departure_time).all()

        # If no schedules exist, auto-generate PMPML-style ones
        if not schedules:
            bus = db.query(Bus).filter(Bus.is_active == True).first()
            if not bus:
                bus = Bus(
                    bus_number="MH-12-PMPML-001",
                    total_seats=50,
                    bus_type=BusType.STANDARD,
                    is_active=True
                )
                db.add(bus)
                db.commit()
                db.refresh(bus)

            # PMPML schedule: 5:00 AM – 11:30 PM
            sample_times = [
                (time(5, 0),  time(5, 45)),
                (time(5, 30), time(6, 15)),
                (time(6, 0),  time(6, 45)),
                (time(6, 30), time(7, 15)),
                (time(7, 0),  time(7, 45)),
                (time(7, 15), time(8, 0)),
                (time(7, 30), time(8, 15)),
                (time(8, 0),  time(8, 45)),
                (time(8, 30), time(9, 15)),
                (time(9, 0),  time(9, 45)),
                (time(9, 30), time(10, 15)),
                (time(10, 0), time(10, 45)),
                (time(10, 30),time(11, 15)),
                (time(11, 0), time(11, 45)),
                (time(11, 30),time(12, 15)),
                (time(12, 0), time(12, 45)),
                (time(12, 30),time(13, 15)),
                (time(13, 0), time(13, 45)),
                (time(13, 30),time(14, 15)),
                (time(14, 0), time(14, 45)),
                (time(14, 30),time(15, 15)),
                (time(15, 0), time(15, 45)),
                (time(15, 30),time(16, 15)),
                (time(16, 0), time(16, 45)),
                (time(16, 30),time(17, 15)),
                (time(17, 0), time(17, 45)),
                (time(17, 15),time(18, 0)),
                (time(17, 30),time(18, 15)),
                (time(18, 0), time(18, 45)),
                (time(18, 30),time(19, 15)),
                (time(19, 0), time(19, 45)),
                (time(19, 30),time(20, 15)),
                (time(20, 0), time(20, 45)),
                (time(20, 30),time(21, 15)),
                (time(21, 0), time(21, 45)),
                (time(21, 30),time(22, 15)),
                (time(22, 0), time(22, 45)),
                (time(22, 30),time(23, 15)),
                (time(23, 0), time(23, 30)),
            ]

            for dep_time, arr_time in sample_times:
                schedule = Schedule(
                    route_id=route_uuid,
                    bus_id=bus.id,
                    departure_time=dep_time,
                    arrival_time=arr_time,
                    days_of_week=[0, 1, 2, 3, 4, 5, 6],
                    is_active=True
                )
                db.add(schedule)

            db.commit()

            schedules = db.query(Schedule).filter(
                Schedule.route_id == route_uuid,
                Schedule.is_active == True
            ).order_by(Schedule.departure_time).all()

        # Build response
        result = []
        for schedule in schedules:
            bus = db.query(Bus).filter(Bus.id == schedule.bus_id).first()
            total = bus.total_seats if bus else 50
            dep = schedule.departure_time
            is_peak = (time(7, 0) <= dep <= time(10, 0)) or (time(17, 0) <= dep <= time(20, 0))
            available = int(total * 0.3) if is_peak else int(total * 0.8)

            result.append({
                "id": str(schedule.id),
                "departure_time": schedule.departure_time.strftime("%H:%M"),
                "arrival_time": schedule.arrival_time.strftime("%H:%M"),
                "available_seats": available,
                "is_peak": is_peak,
                "bus_type": bus.bus_type.value if bus else "standard"
            })

        return result

    except Exception as e:
        traceback.print_exc()
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"Schedule error: {str(e)}")
    """
    Get schedules for a specific route.
    Returns PMPML-style timings (5 AM – 11:30 PM) with seat availability.
    """
    from app.models.schedule import Schedule
    from app.models.bus import Bus, BusType
    from datetime import time
    import traceback

    try:
        # Query existing schedules for this route
        schedules = db.query(Schedule).filter(
            Schedule.route_id == route_id,
            Schedule.is_active == True
        ).order_by(Schedule.departure_time).all()

        # If no schedules exist, auto-generate PMPML-style ones
        if not schedules:
            # Get or create a default bus
            bus = db.query(Bus).filter(Bus.is_active == True).first()
            if not bus:
                bus = Bus(
                    bus_number="MH-12-PMPML-001",
                    total_seats=50,
                    bus_type=BusType.STANDARD,
                    is_active=True
                )
                db.add(bus)
                db.commit()
                db.refresh(bus)

            # PMPML schedule: 5:00 AM – 11:30 PM, every ~30 mins
            # Peak hours (7-10 AM, 5-8 PM): every 15 mins
            # Normal hours: every 30 mins
            sample_times = [
                (time(5, 0),  time(5, 45)),
                (time(5, 30), time(6, 15)),
                (time(6, 0),  time(6, 45)),
                (time(6, 30), time(7, 15)),
                (time(7, 0),  time(7, 45)),   # Peak
                (time(7, 15), time(8, 0)),    # Peak
                (time(7, 30), time(8, 15)),   # Peak
                (time(8, 0),  time(8, 45)),   # Peak
                (time(8, 30), time(9, 15)),   # Peak
                (time(9, 0),  time(9, 45)),   # Peak
                (time(9, 30), time(10, 15)),  # Peak
                (time(10, 0), time(10, 45)),
                (time(10, 30),time(11, 15)),
                (time(11, 0), time(11, 45)),
                (time(11, 30),time(12, 15)),
                (time(12, 0), time(12, 45)),
                (time(12, 30),time(13, 15)),
                (time(13, 0), time(13, 45)),
                (time(13, 30),time(14, 15)),
                (time(14, 0), time(14, 45)),
                (time(14, 30),time(15, 15)),
                (time(15, 0), time(15, 45)),
                (time(15, 30),time(16, 15)),
                (time(16, 0), time(16, 45)),
                (time(16, 30),time(17, 15)),
                (time(17, 0), time(17, 45)),  # Peak
                (time(17, 15),time(18, 0)),   # Peak
                (time(17, 30),time(18, 15)),  # Peak
                (time(18, 0), time(18, 45)),  # Peak
                (time(18, 30),time(19, 15)),  # Peak
                (time(19, 0), time(19, 45)),  # Peak
                (time(19, 30),time(20, 15)),
                (time(20, 0), time(20, 45)),
                (time(20, 30),time(21, 15)),
                (time(21, 0), time(21, 45)),
                (time(21, 30),time(22, 15)),
                (time(22, 0), time(22, 45)),
                (time(22, 30),time(23, 15)),
                (time(23, 0), time(23, 30)),
            ]

            for dep_time, arr_time in sample_times:
                schedule = Schedule(
                    route_id=route_id,
                    bus_id=bus.id,
                    departure_time=dep_time,
                    arrival_time=arr_time,
                    days_of_week=[0, 1, 2, 3, 4, 5, 6],
                    is_active=True
                )
                db.add(schedule)

            db.commit()

            # Re-fetch
            schedules = db.query(Schedule).filter(
                Schedule.route_id == route_id,
                Schedule.is_active == True
            ).order_by(Schedule.departure_time).all()

        # Build response
        from datetime import datetime as dt
        now_time = dt.now().time()
        result = []
        for schedule in schedules:
            bus = db.query(Bus).filter(Bus.id == schedule.bus_id).first()
            total = bus.total_seats if bus else 50

            # Simulate seat availability: peak hours less seats
            dep = schedule.departure_time
            is_peak = (time(7, 0) <= dep <= time(10, 0)) or (time(17, 0) <= dep <= time(20, 0))
            available = int(total * 0.3) if is_peak else int(total * 0.8)

            result.append({
                "id": str(schedule.id),
                "departure_time": schedule.departure_time.strftime("%H:%M"),
                "arrival_time": schedule.arrival_time.strftime("%H:%M"),
                "available_seats": available,
                "is_peak": is_peak,
                "bus_type": bus.bus_type.value if bus else "standard"
            })

        return result

    except Exception as e:
        traceback.print_exc()
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"Schedule error: {str(e)}")
