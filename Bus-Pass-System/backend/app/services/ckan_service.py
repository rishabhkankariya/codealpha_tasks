"""
CKAN Data Service
Fetches PMPML bus route data from OpenCity CKAN portal
"""
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session

try:
    from ckanapi import RemoteCKAN
    CKAN_AVAILABLE = True
except ImportError:
    CKAN_AVAILABLE = False
    print("Warning: ckanapi not installed. Install with: pip install ckanapi")

from app.models.route import Route
from app.models.bus import Bus
from app.models.schedule import Schedule
from app.core.config import settings


class CKANDataService:
    """Service to fetch and sync PMPML data from CKAN portal"""
    
    def __init__(self, db: Session):
        self.db = db
        self.ckan_url = "https://data.opencity.in/"
        self.api_token = os.getenv("CKAN_API_TOKEN", "")
        
        if CKAN_AVAILABLE:
            self.client = RemoteCKAN(self.ckan_url, apikey=self.api_token)
        else:
            self.client = None
    
    def fetch_pmpml_routes(
        self, 
        resource_id: str = "433caa89-75e2-474d-b5d6-db8fd7a3171d",
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Fetch PMPML routes from CKAN datastore
        
        Args:
            resource_id: CKAN resource ID for PMPML data
            limit: Number of records to fetch
            offset: Offset for pagination
        
        Returns:
            List of route records
        """
        if not CKAN_AVAILABLE or not self.client:
            print("CKAN client not available")
            return []
        
        try:
            result = self.client.action.datastore_search(
                resource_id=resource_id,
                limit=limit,
                offset=offset
            )
            return result.get('records', [])
        except Exception as e:
            print(f"Error fetching CKAN data: {e}")
            return []
    
    def search_routes(
        self,
        query: str,
        resource_id: str = "433caa89-75e2-474d-b5d6-db8fd7a3171d",
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search routes using full-text search
        
        Args:
            query: Search query (e.g., "Katraj", "Hinjewadi")
            resource_id: CKAN resource ID
            limit: Number of results
        
        Returns:
            List of matching routes
        """
        if not CKAN_AVAILABLE or not self.client:
            return []
        
        try:
            result = self.client.action.datastore_search(
                resource_id=resource_id,
                limit=limit,
                q=query
            )
            return result.get('records', [])
        except Exception as e:
            print(f"Error searching CKAN data: {e}")
            return []
    
    def filter_routes(
        self,
        filters: Dict[str, Any],
        resource_id: str = "433caa89-75e2-474d-b5d6-db8fd7a3171d",
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Filter routes by specific fields
        
        Args:
            filters: Dictionary of field filters
                Example: {"route_type": "AC", "status": "active"}
            resource_id: CKAN resource ID
            limit: Number of results
        
        Returns:
            List of filtered routes
        """
        if not CKAN_AVAILABLE or not self.client:
            return []
        
        try:
            result = self.client.action.datastore_search(
                resource_id=resource_id,
                filters=filters,
                limit=limit
            )
            return result.get('records', [])
        except Exception as e:
            print(f"Error filtering CKAN data: {e}")
            return []
    
    def sync_routes_to_database(
        self,
        resource_id: str = "433caa89-75e2-474d-b5d6-db8fd7a3171d",
        batch_size: int = 100
    ) -> Dict[str, int]:
        """
        Sync CKAN routes to local database
        
        Args:
            resource_id: CKAN resource ID
            batch_size: Number of records per batch
        
        Returns:
            Dictionary with sync statistics
        """
        if not CKAN_AVAILABLE or not self.client:
            return {"error": "CKAN not available", "synced": 0}
        
        synced = 0
        updated = 0
        errors = 0
        offset = 0
        
        try:
            while True:
                # Fetch batch
                records = self.fetch_pmpml_routes(
                    resource_id=resource_id,
                    limit=batch_size,
                    offset=offset
                )
                
                if not records:
                    break
                
                # Process each record
                for record in records:
                    try:
                        route_data = self._parse_ckan_route(record)
                        
                        if not route_data:
                            continue
                        
                        # Check if route exists
                        existing = self.db.query(Route).filter(
                            Route.route_number == route_data['route_number']
                        ).first()
                        
                        if existing:
                            # Update existing route
                            for key, value in route_data.items():
                                setattr(existing, key, value)
                            existing.updated_at = datetime.utcnow()
                            updated += 1
                        else:
                            # Create new route
                            route = Route(**route_data)
                            self.db.add(route)
                            synced += 1
                        
                        # Commit every 10 records
                        if (synced + updated) % 10 == 0:
                            self.db.commit()
                    
                    except Exception as e:
                        print(f"Error processing record: {e}")
                        errors += 1
                        continue
                
                # Move to next batch
                offset += batch_size
                
                # Break if we got fewer records than requested
                if len(records) < batch_size:
                    break
            
            # Final commit
            self.db.commit()
            
            # Refresh AI embeddings after sync
            try:
                from app.services.ai_chatbot_service import AIRouteAssistant
                assistant = AIRouteAssistant(self.db)
                assistant.refresh_embeddings()
                print("✓ AI embeddings refreshed after CKAN sync")
            except Exception as e:
                print(f"Warning: Could not refresh embeddings: {e}")
            
            return {
                "synced": synced,
                "updated": updated,
                "errors": errors,
                "total": synced + updated
            }
        
        except Exception as e:
            print(f"Error syncing CKAN data: {e}")
            return {"error": str(e), "synced": synced, "updated": updated}
    
    def _parse_ckan_route(self, record: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Parse CKAN record into route data
        
        Adapts CKAN field names to our database schema
        """
        try:
            # Map CKAN fields to our schema
            # Adjust field names based on actual CKAN data structure
            route_data = {
                "route_number": record.get("route_number") or record.get("route_no") or record.get("RouteNo"),
                "origin": record.get("origin") or record.get("source") or record.get("from_stop"),
                "destination": record.get("destination") or record.get("dest") or record.get("to_stop"),
                "distance_km": float(record.get("distance_km", 0) or record.get("distance", 0) or 0),
                "estimated_duration_minutes": int(record.get("duration_minutes", 60) or record.get("duration", 60) or 60),
                "is_active": record.get("status", "active").lower() == "active"
            }
            
            # Validate required fields
            if not route_data["route_number"] or not route_data["origin"] or not route_data["destination"]:
                return None
            
            return route_data
        
        except Exception as e:
            print(f"Error parsing CKAN record: {e}")
            return None
    
    def get_route_by_stops(
        self,
        origin: str,
        destination: str,
        resource_id: str = "433caa89-75e2-474d-b5d6-db8fd7a3171d"
    ) -> List[Dict[str, Any]]:
        """
        Find routes between two stops
        
        Args:
            origin: Origin stop name
            destination: Destination stop name
            resource_id: CKAN resource ID
        
        Returns:
            List of matching routes
        """
        if not CKAN_AVAILABLE or not self.client:
            return []
        
        try:
            # Try filtering by both origin and destination
            result = self.client.action.datastore_search(
                resource_id=resource_id,
                filters={
                    "origin": origin,
                    "destination": destination
                },
                limit=10
            )
            
            routes = result.get('records', [])
            
            # If no exact match, try searching
            if not routes:
                query = f"{origin} {destination}"
                routes = self.search_routes(query, resource_id, limit=5)
            
            return routes
        
        except Exception as e:
            print(f"Error finding routes: {e}")
            return []
    
    def get_active_routes(
        self,
        resource_id: str = "433caa89-75e2-474d-b5d6-db8fd7a3171d",
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get all active routes
        
        Args:
            resource_id: CKAN resource ID
            limit: Number of routes
        
        Returns:
            List of active routes
        """
        return self.filter_routes(
            filters={"status": "active"},
            resource_id=resource_id,
            limit=limit
        )
    
    def get_route_types(
        self,
        route_type: str,
        resource_id: str = "433caa89-75e2-474d-b5d6-db8fd7a3171d",
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Get routes by type (AC, Non-AC, etc.)
        
        Args:
            route_type: Type of route (AC, Non-AC, Sleeper)
            resource_id: CKAN resource ID
            limit: Number of routes
        
        Returns:
            List of routes of specified type
        """
        return self.filter_routes(
            filters={"route_type": route_type},
            resource_id=resource_id,
            limit=limit
        )


# Utility functions for easy access

def fetch_pmpml_data_from_ckan(
    db: Session,
    resource_id: str = "433caa89-75e2-474d-b5d6-db8fd7a3171d",
    sync_to_db: bool = True
) -> Dict[str, Any]:
    """
    Fetch PMPML data from CKAN and optionally sync to database
    
    Args:
        db: Database session
        resource_id: CKAN resource ID
        sync_to_db: Whether to sync data to local database
    
    Returns:
        Dictionary with fetch results
    """
    service = CKANDataService(db)
    
    if sync_to_db:
        return service.sync_routes_to_database(resource_id)
    else:
        routes = service.fetch_pmpml_routes(resource_id)
        return {"fetched": len(routes), "routes": routes}


def search_ckan_routes(
    db: Session,
    query: str,
    resource_id: str = "433caa89-75e2-474d-b5d6-db8fd7a3171d"
) -> List[Dict[str, Any]]:
    """
    Search CKAN routes
    
    Args:
        db: Database session
        query: Search query
        resource_id: CKAN resource ID
    
    Returns:
        List of matching routes
    """
    service = CKANDataService(db)
    return service.search_routes(query, resource_id)


if __name__ == "__main__":
    # Example usage
    from app.core.database import SessionLocal
    
    db = SessionLocal()
    
    # Example 1: Search for routes
    print("Searching for 'Katraj' routes...")
    results = search_ckan_routes(db, "Katraj")
    print(f"Found {len(results)} routes")
    
    # Example 2: Sync all data
    print("\nSyncing CKAN data to database...")
    sync_result = fetch_pmpml_data_from_ckan(db, sync_to_db=True)
    print(f"Synced: {sync_result.get('synced', 0)}")
    print(f"Updated: {sync_result.get('updated', 0)}")
    print(f"Errors: {sync_result.get('errors', 0)}")
    
    db.close()
