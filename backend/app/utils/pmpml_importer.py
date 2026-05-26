"""
PMPML Dataset Importer
Imports PMPML bus route data from dataset.csv
"""
import csv
import re
import sys
import os
from typing import Dict, Any, Tuple
from decimal import Decimal

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from sqlalchemy.orm import Session
from app.models.route import Route
from app.core.database import SessionLocal


class PMPMLDatasetImporter:
    """Import PMPML routes from dataset.csv"""
    
    def __init__(self, db: Session):
        self.db = db
        self.routes_created = 0
        self.routes_updated = 0
        self.errors = []
    
    def parse_route_description(self, route_desc: str) -> Tuple[str, str]:
        """
        Parse route description to extract origin and destination
        
        Examples:
        - "Hinjawadi Maan Phase 3 To Ma Na Pa" -> ("Hinjawadi Maan Phase 3", "Ma Na Pa")
        - "Ma Na Pa To Hinjawadi Maan Phase 3" -> ("Ma Na Pa", "Hinjawadi Maan Phase 3")
        """
        # Split by " To " (case insensitive)
        parts = re.split(r'\s+To\s+', route_desc, flags=re.IGNORECASE)
        
        if len(parts) == 2:
            origin = parts[0].strip()
            destination = parts[1].strip()
            return origin, destination
        else:
            # If no "To" found, use the whole description
            return route_desc.strip(), route_desc.strip()
    
    def estimate_duration(self, distance_km: float) -> int:
        """
        Estimate duration in minutes based on distance
        Assumes average speed of 25 km/h in city traffic
        """
        if distance_km <= 0:
            return 30  # Default 30 minutes
        
        # Average speed: 25 km/h
        hours = distance_km / 25.0
        minutes = int(hours * 60)
        
        # Minimum 15 minutes, maximum 180 minutes
        return max(15, min(180, minutes))
    
    def import_from_csv(self, csv_path: str = "data/dataset.csv") -> Dict[str, Any]:
        """
        Import PMPML routes from CSV file
        
        CSV Format:
        _id,Route ID,Route Description,Route Description Marathi,Kilometer
        
        Args:
            csv_path: Path to CSV file
        
        Returns:
            Dictionary with import statistics
        """
        print(f"Importing PMPML routes from {csv_path}...")
        
        try:
            with open(csv_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                
                for row in reader:
                    try:
                        # Extract data
                        route_id = row.get('Route ID', '').strip()
                        route_desc = row.get('Route Description', '').strip()
                        route_desc_marathi = row.get('Route Description Marathi', '').strip()
                        distance_str = row.get('Kilometer', '0').strip()
                        
                        # Skip if no route ID
                        if not route_id:
                            continue
                        
                        # Parse distance
                        try:
                            distance_km = float(distance_str)
                        except:
                            distance_km = 0.0
                        
                        # Parse origin and destination
                        origin, destination = self.parse_route_description(route_desc)
                        
                        # Estimate duration
                        duration_minutes = self.estimate_duration(distance_km)
                        
                        # Check if route already exists
                        existing = self.db.query(Route).filter(
                            Route.route_number == route_id
                        ).first()
                        
                        if existing:
                            # Update existing route
                            existing.origin = origin
                            existing.destination = destination
                            existing.distance_km = Decimal(str(distance_km))
                            existing.estimated_duration_minutes = duration_minutes
                            existing.is_active = True
                            self.routes_updated += 1
                        else:
                            # Create new route
                            route = Route(
                                route_number=route_id,
                                origin=origin,
                                destination=destination,
                                distance_km=Decimal(str(distance_km)),
                                estimated_duration_minutes=duration_minutes,
                                is_active=True
                            )
                            self.db.add(route)
                            self.routes_created += 1
                        
                        # Commit every 50 records
                        if (self.routes_created + self.routes_updated) % 50 == 0:
                            self.db.commit()
                            print(f"Processed {self.routes_created + self.routes_updated} routes...")
                    
                    except Exception as e:
                        error_msg = f"Error processing route {row.get('Route ID', 'unknown')}: {str(e)}"
                        print(error_msg)
                        self.errors.append(error_msg)
                        continue
                
                # Final commit
                self.db.commit()
                print(f"✓ Import complete!")
                print(f"  Created: {self.routes_created}")
                print(f"  Updated: {self.routes_updated}")
                print(f"  Errors: {len(self.errors)}")
                
                # Refresh AI embeddings
                try:
                    from app.services.ai_chatbot_service import AIRouteAssistant
                    print("Refreshing AI embeddings...")
                    assistant = AIRouteAssistant(self.db)
                    assistant.refresh_embeddings()
                    print("✓ AI embeddings refreshed successfully")
                except Exception as e:
                    print(f"Warning: Could not refresh embeddings: {e}")
                
                return {
                    "success": True,
                    "created": self.routes_created,
                    "updated": self.routes_updated,
                    "total": self.routes_created + self.routes_updated,
                    "errors": len(self.errors),
                    "error_messages": self.errors[:10]  # First 10 errors
                }
        
        except FileNotFoundError:
            error_msg = f"File not found: {csv_path}"
            print(f"✗ {error_msg}")
            return {
                "success": False,
                "error": error_msg,
                "created": 0,
                "updated": 0
            }
        
        except Exception as e:
            error_msg = f"Import failed: {str(e)}"
            print(f"✗ {error_msg}")
            return {
                "success": False,
                "error": error_msg,
                "created": self.routes_created,
                "updated": self.routes_updated
            }


def import_pmpml_dataset(csv_path: str = "data/dataset.csv") -> Dict[str, Any]:
    """
    Import PMPML dataset from CSV file
    
    Args:
        csv_path: Path to dataset.csv file
    
    Returns:
        Import statistics
    """
    db = SessionLocal()
    
    try:
        importer = PMPMLDatasetImporter(db)
        result = importer.import_from_csv(csv_path)
        return result
    finally:
        db.close()


if __name__ == "__main__":
    import sys
    
    # Get CSV path from command line or use default
    csv_file = sys.argv[1] if len(sys.argv) > 1 else "dataset.csv"
    
    print("="*60)
    print("PMPML Dataset Importer")
    print("="*60)
    
    result = import_pmpml_dataset(csv_file)
    
    print("\n" + "="*60)
    print("IMPORT SUMMARY")
    print("="*60)
    
    if result.get("success"):
        print(f"✓ Success!")
        print(f"  Routes Created: {result['created']}")
        print(f"  Routes Updated: {result['updated']}")
        print(f"  Total Processed: {result['total']}")
        print(f"  Errors: {result['errors']}")
        
        if result.get('error_messages'):
            print("\nFirst few errors:")
            for error in result['error_messages']:
                print(f"  - {error}")
    else:
        print(f"✗ Failed: {result.get('error', 'Unknown error')}")
    
    print("="*60)
