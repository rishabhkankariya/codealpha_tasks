"""Admin Dashboard API Endpoints"""

from datetime import datetime, timedelta, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.api.dependencies import get_current_user, get_db
from app.models.user import User
from app.models.route import Route
from app.models.schedule import Schedule
from app.models.bus import Bus, BusType
from app.models.booking import Booking, BookingStatus
from app.models.pass_model import BusPass, PassType, PassStatus
from app.models.pricing import PricingRule

router = APIRouter()


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    role_val = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if role_val.lower() != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# ── ANALYTICS ────────────────────────────────────────────────────────────────

@router.get("/analytics/summary")
async def get_analytics_summary(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    start_date = datetime.utcnow() - timedelta(days=days)

    total_bookings = db.query(func.count(Booking.id)).filter(
        Booking.created_at >= start_date
    ).scalar() or 0

    active_passes = db.query(func.count(BusPass.id)).filter(
        BusPass.pass_status == PassStatus.ACTIVE
    ).scalar() or 0

    total_revenue = db.query(func.sum(Booking.price)).filter(
        Booking.booking_status == BookingStatus.CONFIRMED,
        Booking.created_at >= start_date
    ).scalar() or 0.0

    pass_revenue = db.query(func.sum(PassType.price)).join(
        BusPass, BusPass.pass_type_id == PassType.id
    ).filter(BusPass.created_at >= start_date).scalar() or 0.0

    active_users = db.query(func.count(func.distinct(Booking.user_id))).filter(
        Booking.created_at >= start_date
    ).scalar() or 0

    total_users = db.query(func.count(User.id)).scalar() or 0
    total_routes = db.query(func.count(Route.id)).filter(Route.is_active == True).scalar() or 0

    return {
        "total_bookings": total_bookings,
        "active_passes": active_passes,
        "total_revenue": float(total_revenue) + float(pass_revenue),
        "booking_revenue": float(total_revenue),
        "pass_revenue": float(pass_revenue),
        "active_users": active_users,
        "total_users": total_users,
        "total_routes": total_routes,
        "avg_booking_value": float(total_revenue) / total_bookings if total_bookings > 0 else 0.0,
        "period_days": days,
    }


@router.get("/analytics/revenue")
async def get_revenue_analytics(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    start_date = datetime.utcnow() - timedelta(days=days)

    booking_revenue = db.query(func.sum(Booking.price)).filter(
        Booking.booking_status == BookingStatus.CONFIRMED,
        Booking.created_at >= start_date
    ).scalar() or 0.0

    pass_revenue = db.query(func.sum(PassType.price)).join(
        BusPass, BusPass.pass_type_id == PassType.id
    ).filter(BusPass.created_at >= start_date).scalar() or 0.0

    # Build daily revenue (last 7 days)
    revenue_by_day = {}
    for i in range(min(days, 7)):
        day = (datetime.utcnow() - timedelta(days=i)).date()
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())
        day_rev = db.query(func.sum(Booking.price)).filter(
            Booking.booking_status == BookingStatus.CONFIRMED,
            Booking.created_at >= day_start,
            Booking.created_at <= day_end
        ).scalar() or 0.0
        revenue_by_day[str(day)] = float(day_rev)

    return {
        "total_revenue": float(booking_revenue) + float(pass_revenue),
        "booking_revenue": float(booking_revenue),
        "pass_revenue": float(pass_revenue),
        "revenue_by_day": revenue_by_day,
        "period_days": days,
    }


@router.get("/analytics/bookings")
async def get_booking_analytics(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    start_date = datetime.utcnow() - timedelta(days=days)

    confirmed = db.query(func.count(Booking.id)).filter(
        Booking.booking_status == BookingStatus.CONFIRMED,
        Booking.created_at >= start_date
    ).scalar() or 0

    cancelled = db.query(func.count(Booking.id)).filter(
        Booking.booking_status == BookingStatus.CANCELLED,
        Booking.created_at >= start_date
    ).scalar() or 0

    completed = db.query(func.count(Booking.id)).filter(
        Booking.booking_status == BookingStatus.COMPLETED,
        Booking.created_at >= start_date
    ).scalar() or 0

    return {
        "total_bookings": confirmed + cancelled + completed,
        "confirmed_bookings": confirmed,
        "cancelled_bookings": cancelled,
        "completed_bookings": completed,
        "period_days": days,
    }


# ── USERS ─────────────────────────────────────────────────────────────────────

@router.get("/users")
async def list_users(
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    users = db.query(User).offset(skip).limit(limit).all()
    return [
        {
            "id": str(u.id),
            "email": u.email,
            "full_name": getattr(u, "full_name", None) or f"{getattr(u,'first_name','')} {getattr(u,'last_name','')}".strip(),
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


# ── ROUTES ────────────────────────────────────────────────────────────────────

@router.get("/routes")
async def list_routes(
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    routes = db.query(Route).offset(skip).limit(limit).all()
    return [
        {
            "id": str(r.id),
            "route_number": r.route_number,
            "origin": r.origin,
            "destination": r.destination,
            "distance_km": float(r.distance_km),
            "is_active": r.is_active,
        }
        for r in routes
    ]


@router.put("/routes/{route_id}/toggle")
async def toggle_route(
    route_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    import uuid as _uuid
    route = db.query(Route).filter(Route.id == _uuid.UUID(route_id)).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    route.is_active = not route.is_active
    db.commit()
    return {"id": str(route.id), "is_active": route.is_active}


# ── PASSES ────────────────────────────────────────────────────────────────────

@router.get("/passes")
async def list_passes(
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    passes = db.query(BusPass).order_by(BusPass.created_at.desc()).offset(skip).limit(limit).all()
    result = []
    for p in passes:
        pt = db.query(PassType).filter(PassType.id == p.pass_type_id).first()
        user = db.query(User).filter(User.id == p.user_id).first()
        result.append({
            "id": str(p.id),
            "pass_number": p.pass_number,
            "user_email": user.email if user else "N/A",
            "pass_type": pt.pass_name if pt else "N/A",
            "valid_from": p.valid_from.isoformat() if p.valid_from else None,
            "valid_to": p.valid_to.isoformat() if p.valid_to else None,
            "status": p.pass_status.value,
        })
    return result


# ── BOOKINGS ──────────────────────────────────────────────────────────────────

@router.get("/bookings")
async def list_bookings(
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    bookings = db.query(Booking).order_by(Booking.created_at.desc()).offset(skip).limit(limit).all()
    result = []
    for b in bookings:
        user = db.query(User).filter(User.id == b.user_id).first()
        schedule = db.query(Schedule).filter(Schedule.id == b.schedule_id).first()
        route = db.query(Route).filter(Route.id == schedule.route_id).first() if schedule else None
        result.append({
            "id": str(b.id),
            "user_email": user.email if user else "N/A",
            "route": f"{route.origin} → {route.destination}" if route else "N/A",
            "journey_date": b.journey_date.isoformat() if b.journey_date else None,
            "price": float(b.price),
            "status": b.booking_status.value,
            "created_at": b.created_at.isoformat() if b.created_at else None,
        })
    return result
