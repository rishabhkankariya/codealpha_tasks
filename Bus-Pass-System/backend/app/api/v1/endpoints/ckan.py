"""
CKAN Data API Endpoints
Fetch and sync PMPML data from OpenCity CKAN portal
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.dependencies import get_current_user, get_db
from app.models.user import User
from app.services.ckan_service import CKANDataService, fetch_pmpml_data_from_ckan, search_ckan_routes

router = APIRouter()


class CKANSyncRequest(BaseModel):
    """CKAN sync request"""
    resource_id: str = "433caa89-75e2-474d-b5d6-db8fd7a3171d"
    batch_size: int = 100


class CKANSearchRequest(BaseModel):
    """CKAN search request"""
    query: str
    resource_id: str = "433caa89-75e2-474d-b5d6-db8fd7a3171d"
    limit: int = 10


@router.post("/sync")
async def sync_ckan_data(
    request: CKANSyncRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Sync PMPML data from CKAN to local database
    
    Admin only - Fetches routes from OpenCity CKAN portal and syncs to database.
    Also refreshes AI embeddings after sync.
    
    **Resource ID**: 433caa89-75e2-474d-b5d6-db8fd7a3171d (PMPML routes)
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        service = CKANDataService(db)
        result = service.sync_routes_to_database(
            resource_id=request.resource_id,
            batch_size=request.batch_size
        )
        
        if "error" in result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result["error"]
            )
        
        return {
            "message": "CKAN data synced successfully",
            "synced": result.get("synced", 0),
            "updated": result.get("updated", 0),
            "errors": result.get("errors", 0),
            "total": result.get("total", 0)
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync CKAN data: {str(e)}"
        )


@router.post("/search")
async def search_ckan(
    request: CKANSearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Search PMPML routes in CKAN
    
    Performs full-text search across all fields in CKAN datastore.
    
    **Example queries**:
    - "Katraj"
    - "Hinjewadi"
    - "AC bus"
    """
    try:
        service = CKANDataService(db)
        results = service.search_routes(
            query=request.query,
            resource_id=request.resource_id,
            limit=request.limit
        )
        
        return {
            "query": request.query,
            "count": len(results),
            "results": results
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search CKAN: {str(e)}"
        )


@router.get("/routes")
async def get_ckan_routes(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    resource_id: str = Query("433caa89-75e2-474d-b5d6-db8fd7a3171d"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get PMPML routes from CKAN
    
    Fetches routes directly from CKAN datastore without syncing to database.
    """
    try:
        service = CKANDataService(db)
        routes = service.fetch_pmpml_routes(
            resource_id=resource_id,
            limit=limit,
            offset=offset
        )
        
        return {
            "count": len(routes),
            "limit": limit,
            "offset": offset,
            "routes": routes
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch CKAN routes: {str(e)}"
        )


@router.get("/routes/between")
async def get_routes_between_stops(
    origin: str = Query(..., description="Origin stop name"),
    destination: str = Query(..., description="Destination stop name"),
    resource_id: str = Query("433caa89-75e2-474d-b5d6-db8fd7a3171d"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Find routes between two stops
    
    Searches CKAN for routes connecting origin and destination.
    
    **Example**:
    - origin: "Katraj"
    - destination: "Hinjewadi"
    """
    try:
        service = CKANDataService(db)
        routes = service.get_route_by_stops(
            origin=origin,
            destination=destination,
            resource_id=resource_id
        )
        
        return {
            "origin": origin,
            "destination": destination,
            "count": len(routes),
            "routes": routes
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to find routes: {str(e)}"
        )


@router.get("/routes/active")
async def get_active_routes(
    limit: int = Query(100, ge=1, le=500),
    resource_id: str = Query("433caa89-75e2-474d-b5d6-db8fd7a3171d"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all active routes from CKAN
    
    Filters routes by status="active"
    """
    try:
        service = CKANDataService(db)
        routes = service.get_active_routes(
            resource_id=resource_id,
            limit=limit
        )
        
        return {
            "count": len(routes),
            "routes": routes
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch active routes: {str(e)}"
        )


@router.get("/routes/type/{route_type}")
async def get_routes_by_type(
    route_type: str,
    limit: int = Query(50, ge=1, le=500),
    resource_id: str = Query("433caa89-75e2-474d-b5d6-db8fd7a3171d"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get routes by type
    
    **Route types**:
    - AC
    - Non-AC
    - Sleeper
    - Semi-Sleeper
    - Luxury
    """
    try:
        service = CKANDataService(db)
        routes = service.get_route_types(
            route_type=route_type,
            resource_id=resource_id,
            limit=limit
        )
        
        return {
            "route_type": route_type,
            "count": len(routes),
            "routes": routes
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch routes by type: {str(e)}"
        )
