"""
CSV Data Importer for PMPML Route Data
Imports bus routes, stops, and schedules from CSV files
"""
import csv
import os
from typing import List, Dict, Any
from datetime import datetime, time
from decimal import Decimal
from sqlalchemy.orm import Session

from app.models.route import Route
from app.models.bus import Bus
from app.models.schedule import Schedule
from app.core.database import SessionLocal


class PMPMLDataImporter:
    """Import PMPML data from CSV files"""
    
    def __init__(self, db: Session):
        self.db = db
        self.routes_created = 0
        self.buses_created = 0
        self.schedules_created = 0
        self.errors = []
    
    def import_routes_csv(self, csv_path: str) -> Dict[str, Any]:
        """
        Import routes from CSV file
        
        Expected CSV columns:
        - route_number
        - origin
        - destination
        - distance_km
        - estimated_duration_minutes
        - base_fare (optional)
        """
        print(f"Importing routes from {csv_path}...")
        
        try:
            with open(csv_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                
                for row in reader:
                    try:
                        # Check if route already exists
                        existing = self.db.query(Route).filter(
                            Route.route_number == row['route_number']
                        ).first()
                        
                        if existing:
                            print(f"Route {row['route_number']} already exists, skipping...")
                            continue
                        
                        # Create route
                        route = Route(
                            route_number=row['route_number'],
                            origin=row['origin'],
                            destination=row['destination'],
                            distance_km=Decimal(row.get('distance_km', 0)),
                            estimated_duration_minutes=int(row.get('estimated_duration_minutes', 60)),
                            is_active=True
                        )
                        
                        self.db.add(route)
                        self.routes_created += 1
                        
                        if self.routes_created % 10 == 0:
                            self.db.commit()
                            print(f"Imported {self.routes_created} routes...")
                    
                    except Exception as e:
                        self.errors.append(f"Error importing route {row.get('route_number')}: {str(e)}")
                        continue
                
                self.db.commit()
                print(f"✓ Successfully imported {self.routes_created} routes")
                
        except Exception as e:
            print(f"✗ Error reading CSV file: {str(e)}")
            self.errors.append(str(e))
        
        return self._get_import_summary()
    
    def import_buses_csv(self, csv_path: str) -> Dict[str, Any]:
        """
        Import buses from CSV file
        
        Expected CSV columns:
        - bus_number
        - capacity
        - bus_type (AC/Non-AC/Sleeper)
        - manufacturer (optional)
        - model (optional)
        - year (optional)
        """
        print(f"Importing buses from {csv_path}...")
        
        try:
            with open(csv_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                
                for row in reader:
                    try:
                        # Check if bus already exists
                        existing = self.db.query(Bus).filter(
                            Bus.bus_number == row['bus_number']
                        ).first()
                        
                        if existing:
                            continue
                        
                        # Create bus
                        bus = Bus(
                            bus_number=row['bus_number'],
                            capacity=int(row.get('capacity', 40)),
                            bus_type=row.get('bus_type', 'Non-AC'),
                            manufacturer=row.get('manufacturer'),
                            model=row.get('model'),
                            year=int(row['year']) if row.get('year') else None,
                            is_active=True
                        )
                        
                        self.db.add(bus)
                        self.buses_created += 1
                        
                        if self.buses_created % 10 == 0:
                            self.db.commit()
                            print(f"Imported {self.buses_created} buses...")
                    
                    except Exception as e:
                        self.errors.append(f"Error importing bus {row.get('bus_number')}: {str(e)}")
                        continue
                
                self.db.commit()
                print(f"✓ Successfully imported {self.buses_created} buses")
                
        except Exception as e:
            print(f"✗ Error reading CSV file: {str(e)}")
            self.errors.append(str(e))
        
        return self._get_import_summary()
    
    def import_schedules_csv(self, csv_path: str) -> Dict[str, Any]:
        """
        Import schedules from CSV file
        
        Expected CSV columns:
        - route_number
        - bus_number
        - departure_time (HH:MM format)
        - arrival_time (HH:MM format)
        - available_seats
        """
        print(f"Importing schedules from {csv_path}...")
        
        try:
            with open(csv_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                
                for row in reader:
                    try:
                        # Find route
                        route = self.db.query(Route).filter(
                            Route.route_number == row['route_number']
                        ).first()
                        
                        if not route:
                            self.errors.append(f"Route {row['route_number']} not found")
                            continue
                        
                        # Find bus
                        bus = self.db.query(Bus).filter(
                            Bus.bus_number == row['bus_number']
                        ).first()
                        
                        if not bus:
                            self.errors.append(f"Bus {row['bus_number']} not found")
                            continue
                        
                        # Parse times
                        departure_time = self._parse_time(row['departure_time'])
                        arrival_time = self._parse_time(row['arrival_time'])
                        
                        # Create schedule
                        schedule = Schedule(
                            route_id=route.id,
                            bus_id=bus.id,
                            departure_time=datetime.combine(datetime.today(), departure_time),
                            arrival_time=datetime.combine(datetime.today(), arrival_time),
                            available_seats=int(row.get('available_seats', bus.capacity)),
                            is_active=True
                        )
                        
                        self.db.add(schedule)
                        self.schedules_created += 1
                        
                        if self.schedules_created % 10 == 0:
                            self.db.commit()
                            print(f"Imported {self.schedules_created} schedules...")
                    
                    except Exception as e:
                        self.errors.append(f"Error importing schedule: {str(e)}")
                        continue
                
                self.db.commit()
                print(f"✓ Successfully imported {self.schedules_created} schedules")
                
        except Exception as e:
            print(f"✗ Error reading CSV file: {str(e)}")
            self.errors.append(str(e))
        
        return self._get_import_summary()
    
    def _parse_time(self, time_str: str) -> time:
        """Parse time string in HH:MM format"""
        try:
            hour, minute = map(int, time_str.split(':'))
            return time(hour=hour, minute=minute)
        except:
            return time(hour=0, minute=0)
    
    def _get_import_summary(self) -> Dict[str, Any]:
        """Get import summary"""
        return {
            "routes_created": self.routes_created,
            "buses_created": self.buses_created,
            "schedules_created": self.schedules_created,
            "errors": self.errors,
            "success": len(self.errors) == 0
        }


def import_pmpml_data(
    routes_csv: str = None,
    buses_csv: str = None,
    schedules_csv: str = None
) -> Dict[str, Any]:
    """
    Import PMPML data from CSV files
    
    Args:
        routes_csv: Path to routes CSV file
        buses_csv: Path to buses CSV file
        schedules_csv: Path to schedules CSV file
    
    Returns:
        Import summary with counts and errors
    """
    db = SessionLocal()
    importer = PMPMLDataImporter(db)
    
    results = {
        "routes": None,
        "buses": None,
        "schedules": None
    }
    
    try:
        if routes_csv and os.path.exists(routes_csv):
            results["routes"] = importer.import_routes_csv(routes_csv)
        
        if buses_csv and os.path.exists(buses_csv):
            results["buses"] = importer.import_buses_csv(buses_csv)
        
        if schedules_csv and os.path.exists(schedules_csv):
            results["schedules"] = importer.import_schedules_csv(schedules_csv)
        
        # Refresh AI embeddings after import
        try:
            from app.services.ai_chatbot_service import AIRouteAssistant
            assistant = AIRouteAssistant(db)
            assistant.refresh_embeddings()
            print("✓ AI embeddings refreshed")
        except Exception as e:
            print(f"Warning: Could not refresh embeddings: {e}")
        
    finally:
        db.close()
    
    return results


if __name__ == "__main__":
    # Example usage
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python csv_importer.py <routes.csv> [buses.csv] [schedules.csv]")
        sys.exit(1)
    
    routes_file = sys.argv[1] if len(sys.argv) > 1 else None
    buses_file = sys.argv[2] if len(sys.argv) > 2 else None
    schedules_file = sys.argv[3] if len(sys.argv) > 3 else None
    
    results = import_pmpml_data(routes_file, buses_file, schedules_file)
    
    print("\n" + "="*50)
    print("IMPORT SUMMARY")
    print("="*50)
    print(f"Routes: {results.get('routes', {}).get('routes_created', 0)}")
    print(f"Buses: {results.get('buses', {}).get('buses_created', 0)}")
    print(f"Schedules: {results.get('schedules', {}).get('schedules_created', 0)}")
    print("="*50)
