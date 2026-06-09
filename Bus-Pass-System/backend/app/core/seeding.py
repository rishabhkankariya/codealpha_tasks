"""
Database initialization and automatic seeding for SmartBus PMPML
"""
import os
import csv
import re
import logging
from decimal import Decimal
from datetime import date, time
import uuid

from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.database import engine, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.pass_model import PassType
from app.models.bus import Bus, BusType
from app.models.route import Route, RouteStop
from app.models.pricing import PricingRule
from app.models.schedule import Schedule

logger = logging.getLogger(__name__)

# Predefined fallback routes (26 routes) to ensure the system is populated even without CSV
FALLBACK_ROUTES = [
    {"route_number": "2", "origin": "Swargate", "destination": "Shivajinagar", "distance": 6.0, "duration": 20},
    {"route_number": "42", "origin": "Katraj", "destination": "Swargate", "distance": 7.0, "duration": 22},
    {"route_number": "100", "origin": "Pune Station", "destination": "Hinjewadi Phase 3", "distance": 24.0, "duration": 60},
    {"route_number": "111", "origin": "Swargate", "destination": "Hadapsar", "distance": 9.0, "duration": 25},
    {"route_number": "144", "origin": "Kothrud Depot", "destination": "Pune Station", "distance": 11.0, "duration": 30},
    {"route_number": "159", "origin": "Talegaon", "destination": "Pune Station", "distance": 35.0, "duration": 90},
    {"route_number": "204", "origin": "Hadapsar", "destination": "Katraj", "distance": 13.0, "duration": 35},
    {"route_number": "208", "origin": "Pune Station", "destination": "Wagholi", "distance": 15.0, "duration": 45},
    {"route_number": "281", "origin": "Baner", "destination": "Ma Na Pa", "distance": 10.0, "duration": 28},
    {"route_number": "299", "origin": "Katraj", "destination": "Hinjewadi Phase 3", "distance": 28.0, "duration": 75},
    {"route_number": "312", "origin": "Chinchwad Station", "destination": "Hinjewadi Phase 3", "distance": 14.0, "duration": 40},
    {"route_number": "91U", "origin": "Kothrud Depot", "destination": "Katraj", "distance": 12.0, "duration": 32},
    {"route_number": "84", "origin": "Swargate", "destination": "Kondhwa", "distance": 8.0, "duration": 24},
    {"route_number": "102", "origin": "Pune Station", "destination": "Alandi", "distance": 20.0, "duration": 55},
    {"route_number": "115", "origin": "Swargate", "destination": "Nigdi", "distance": 22.0, "duration": 60},
    {"route_number": "122", "origin": "Ma Na Pa", "destination": "Dhayari", "distance": 11.0, "duration": 35},
    {"route_number": "133", "origin": "Swargate", "destination": "Kothrud Depot", "distance": 8.0, "duration": 24},
    {"route_number": "187", "origin": "Pune Station", "destination": "Lohgaon", "distance": 12.0, "duration": 35},
    {"route_number": "202", "origin": "Hadapsar", "destination": "Warje Malwadi", "distance": 18.0, "duration": 50},
    {"route_number": "225", "origin": "Katraj", "destination": "Pune Station", "distance": 10.0, "duration": 30},
    {"route_number": "234", "origin": "Swargate", "destination": "Dhankawadi", "distance": 5.0, "duration": 15},
    {"route_number": "246", "origin": "Hadapsar", "destination": "Wagholi", "distance": 14.0, "duration": 40},
    {"route_number": "276", "origin": "Pune Station", "destination": "Karvenagar", "distance": 9.0, "duration": 28},
    {"route_number": "322", "origin": "Swargate", "destination": "Bhosari", "distance": 16.0, "duration": 45},
    {"route_number": "354", "origin": "Ma Na Pa", "destination": "Akurdi", "distance": 19.0, "duration": 50},
    {"route_number": "381", "origin": "Katraj", "destination": "Bhosari", "distance": 23.0, "duration": 65}
]

# Pass types (18 realistic PMPML types)
PASS_TYPES = [
    # General
    {"name": "Daily Pass (PMC/PCMC)", "category": "General", "price": 70.0, "validity_days": 1, 
     "description": "Unlimited rides for 1 day within Pune (PMC) and Pimpri-Chinchwad (PCMC) limits.", 
     "travel_area": "Pune + PCMC", "time_validity": "Full service day (5:00 AM - 11:30 PM)", "eligibility": "All passengers"},
    
    {"name": "Daily Pass (PMRDA)", "category": "General", "price": 150.0, "validity_days": 1, 
     "description": "Unlimited rides for 1 day covering Pune, PCMC and PMRDA extended routes.", 
     "travel_area": "Pune + PCMC + PMRDA", "time_validity": "Full service day (5:00 AM - 11:30 PM)", "eligibility": "All passengers"},
    
    {"name": "Monthly Pass (PMC/PCMC)", "category": "General", "price": 1500.0, "validity_days": 30, 
     "description": "30-day unlimited travel pass for PMC and PCMC city limits.", 
     "travel_area": "PMC + PCMC", "time_validity": "All operating hours (5:00 AM - 11:30 PM)", "eligibility": "All passengers"},
    
    {"name": "Regional Monthly Pass", "category": "General", "price": 2700.0, "validity_days": 30, 
     "description": "30-day unlimited travel on all PMRDA regional routes including outskirts.", 
     "travel_area": "PMRDA routes (entire region)", "time_validity": "All operating hours", "eligibility": "All passengers"},

    # Students
    {"name": "Student Monthly Pass", "category": "Student", "price": 750.0, "validity_days": 30, 
     "description": "30-day student concession pass for all PMPML routes. Requires bonafide certificate.", 
     "travel_area": "All routes", "time_validity": "All operating hours", "eligibility": "Students with valid school/college ID"},
    
    {"name": "Student Quarterly Pass", "category": "Student", "price": 2000.0, "validity_days": 90, 
     "description": "3-month discounted student pass for all PMPML routes.", 
     "travel_area": "All routes", "time_validity": "All operating hours", "eligibility": "Students with valid school/college ID"},
    
    {"name": "Student Annual Pass", "category": "Student", "price": 5000.0, "validity_days": 365, 
     "description": "Best value 1-year student pass for all PMPML routes.", 
     "travel_area": "All routes", "time_validity": "All operating hours", "eligibility": "Students with valid school/college ID"},
    
    {"name": "Govt School Student Pass (FREE)", "category": "Student", "price": 0.0, "validity_days": 365, 
     "description": "FREE academic year pass for government school students on eligible routes.", 
     "travel_area": "Eligible routes (school routes)", "time_validity": "School timings + general service", "eligibility": "Government school students Std 1-12"},

    # Senior Citizen
    {"name": "Senior Citizen Daily Pass", "category": "Senior Citizen", "price": 40.0, "validity_days": 1, 
     "description": "1-day senior citizen concession pass for entire PMPML network. Age 60+.", 
     "travel_area": "Entire PMPML network", "time_validity": "Full day (5:00 AM - 11:30 PM)", "eligibility": "Age 60 and above"},
    
    {"name": "Senior Citizen Monthly Pass", "category": "Senior Citizen", "price": 500.0, "validity_days": 30, 
     "description": "30-day heavily discounted pass for senior citizens on entire PMPML network.", 
     "travel_area": "Entire PMPML network", "time_validity": "All operating hours", "eligibility": "Age 60 and above with valid ID proof"},

    # Women Special
    {"name": "Women Special Daily Pass", "category": "Women Special", "price": 35.0, "validity_days": 1, 
     "description": "1-day special discounted travel pass for women passengers.", 
     "travel_area": "PMC + PCMC limits", "time_validity": "Full service day", "eligibility": "Women passengers"},
     
    {"name": "Women Special Monthly Pass", "category": "Women Special", "price": 750.0, "validity_days": 30, 
     "description": "30-day unlimited travel pass at 50% discount for women passengers.", 
     "travel_area": "PMC + PCMC limits", "time_validity": "All operating hours", "eligibility": "Women passengers"},

    # Divyang (Disabled)
    {"name": "Divyang Annual Pass (FREE)", "category": "Divyang", "price": 0.0, "validity_days": 365, 
     "description": "FREE 1-year annual pass for persons with disabilities on entire PMPML network.", 
     "travel_area": "Entire network", "time_validity": "All operating hours", "eligibility": "Persons with 40%+ disability certificate"},

    # Other specials
    {"name": "Journalist Annual Pass (FREE)", "category": "Journalist", "price": 0.0, "validity_days": 365, 
     "description": "FREE 1-year annual pass for accredited journalists.", 
     "travel_area": "Entire network", "time_validity": "All operating hours", "eligibility": "Accredited journalists with press card"},
     
    {"name": "Freedom Fighter Annual Pass (FREE)", "category": "Freedom Fighter", "price": 0.0, "validity_days": 365, 
     "description": "FREE 1-year annual pass for freedom fighters and their dependents.", 
     "travel_area": "Entire network", "time_validity": "All operating hours", "eligibility": "Recognized freedom fighters with government certificate"},
     
    {"name": "Municipal Employee Monthly Pass", "category": "Municipal Employee", "price": 700.0, "validity_days": 30, 
     "description": "30-day employee benefit pass for PMC/PCMC municipal employees on selected routes.", 
     "travel_area": "Selected routes (work routes)", "time_validity": "Working hours + regular service", "eligibility": "PMC/PCMC municipal employees with ID"}
]


def parse_route_description(route_desc: str):
    """Split description by ' To ' to extract origin and destination"""
    parts = re.split(r'\s+To\s+', route_desc, flags=re.IGNORECASE)
    if len(parts) == 2:
        return parts[0].strip(), parts[1].strip()
    return route_desc.strip(), route_desc.strip()


def seed_database(db: Session):
    """Seed the database with default configurations, routes, passes, and schedules"""
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    # Run index creation checks to optimize SQLite
    try:
        db.execute(text("CREATE INDEX IF NOT EXISTS idx_routes_origin ON routes (origin)"))
        db.execute(text("CREATE INDEX IF NOT EXISTS idx_routes_destination ON routes (destination)"))
        db.commit()
        logger.info("✓ SQLite origin and destination indexes verified/created")
    except Exception as e:
        logger.warning(f"Could not create SQLite indexes: {e}")
    
    # 1. Seed Admin User
    admin_email = "admin@smartbus.com"
    admin = db.query(User).filter(User.email == admin_email).first()
    if not admin:
        logger.info("Seeding default admin user...")
        admin = User(
            email=admin_email,
            password_hash=get_password_hash("Admin@12345"),
            first_name="System",
            last_name="Admin",
            phone="1234567890",
            role="admin",
            is_active=True,
            email_verified=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        logger.info("✓ Default admin user seeded successfully")
    
    # 2. Seed Default Bus
    bus = db.query(Bus).filter(Bus.is_active == True).first()
    if not bus:
        logger.info("Seeding default bus...")
        bus = Bus(
            bus_number="MH-12-PMPML-001",
            total_seats=50,
            bus_type=BusType.STANDARD,
            is_active=True
        )
        db.add(bus)
        db.commit()
        db.refresh(bus)
        logger.info("✓ Default bus seeded successfully")

    # 3. Seed Pass Types
    pass_types_count = db.query(PassType).count()
    if pass_types_count == 0:
        logger.info("Seeding PMPML pass types...")
        for pt in PASS_TYPES:
            pass_type = PassType(
                pass_name=pt["name"],
                category=pt["category"],
                price=pt["price"],
                validity_days=pt["validity_days"],
                description=pt["description"],
                travel_area=pt["travel_area"],
                time_validity=pt["time_validity"],
                eligibility=pt["eligibility"],
                is_active=True
            )
            db.add(pass_type)
        db.commit()
        logger.info(f"✓ Seeded {len(PASS_TYPES)} pass types successfully")

    # 4. Seed Routes
    routes_count = db.query(Route).count()
    if routes_count == 0:
        logger.info("Seeding routes...")
        routes_to_seed = []
        
        # Try to find CSV
        csv_paths = ["data/dataset.csv", "../data/dataset.csv", "backend/data/dataset.csv", "app/data/dataset.csv"]
        csv_file = None
        for path in csv_paths:
            if os.path.exists(path):
                csv_file = path
                break
                
        if csv_file:
            logger.info(f"Loading routes from CSV dataset: {csv_file}")
            try:
                with open(csv_file, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        route_id = row.get('Route ID', '').strip()
                        route_desc = row.get('Route Description', '').strip()
                        distance_str = row.get('Kilometer', '0').strip()
                        
                        if not route_id or not route_desc:
                            continue
                            
                        try:
                            distance_km = float(distance_str)
                        except:
                            distance_km = 10.0
                            
                        origin, destination = parse_route_description(route_desc)
                        
                        # Calculate estimated duration (assume 25 km/h)
                        duration = max(15, min(180, int((distance_km / 25.0) * 60)))
                        
                        routes_to_seed.append({
                            "route_number": route_id,
                            "origin": origin,
                            "destination": destination,
                            "distance": distance_km,
                            "duration": duration
                        })
            except Exception as e:
                logger.error(f"Error reading routes CSV: {e}. Falling back to hardcoded list.")
                routes_to_seed = FALLBACK_ROUTES
        else:
            logger.info("CSV dataset not found. Seeding fallback route list.")
            routes_to_seed = FALLBACK_ROUTES

        # Seed all routes from dataset
        seeded_routes = []
        for r in routes_to_seed:
            # Double check uniqueness in memory
            if any(sr.route_number == r["route_number"] for sr in seeded_routes):
                continue
                
            route_obj = Route(
                route_number=r["route_number"],
                origin=r["origin"],
                destination=r["destination"],
                distance_km=Decimal(str(r["distance"])),
                estimated_duration_minutes=r["duration"],
                is_active=True
            )
            db.add(route_obj)
            seeded_routes.append(route_obj)
            
        db.commit()
        # Refresh all seeded routes to get IDs
        for sr in seeded_routes:
            db.refresh(sr)
        logger.info(f"✓ Seeded {len(seeded_routes)} routes successfully")
    else:
        logger.info(f"Routes already seeded: {routes_count} routes found")
        seeded_routes = db.query(Route).all()

    # 5. Seed Pricing Rules
    pricing_count = db.query(PricingRule).count()
    if pricing_count == 0:
        logger.info("Seeding pricing rules...")
        BASE_FARE = Decimal("10.00")
        PER_KM_RATE = Decimal("1.50")
        
        for route in seeded_routes:
            # Fare = Base fare + (Distance * Rate) rounded to nearest 5
            distance = float(route.distance_km)
            fare = BASE_FARE + (Decimal(str(distance)) * PER_KM_RATE)
            fare = round(fare / 5) * 5
            fare = max(Decimal("10.00"), min(fare, Decimal("100.00")))
            
            pricing_rule = PricingRule(
                rule_name=f"Standard Fare - {route.route_number}",
                route_id=route.id,
                base_price=fare,
                price_per_km=PER_KM_RATE,
                priority=1,
                valid_from=date(2026, 1, 1),
                is_active=True
            )
            db.add(pricing_rule)
        db.commit()
        logger.info("✓ Pricing rules seeded successfully")

    # 6. Seed Schedules
    schedules_count = db.query(Schedule).count()
    if schedules_count == 0:
        logger.info("Seeding schedules for routes...")
        # Seed 4 departure times per route to make a nice schedule grid
        sample_times = [
            (time(7, 30), time(8, 15)),   # Peak morning
            (time(9, 0), time(9, 45)),    # Peak morning
            (time(13, 0), time(13, 45)),  # Afternoon
            (time(18, 0), time(18, 45))   # Peak evening
        ]
        
        for route in seeded_routes[:30]:  # Seed for first 30 routes to avoid overwhelming the db
            for dep_time, arr_time in sample_times:
                schedule = Schedule(
                    route_id=route.id,
                    bus_id=bus.id,
                    departure_time=dep_time,
                    arrival_time=arr_time,
                    days_of_week=[0, 1, 2, 3, 4, 5, 6],
                    is_active=True
                )
                db.add(schedule)
        db.commit()
        logger.info("✓ Schedules seeded successfully")
    
    logger.info("Database seeding complete!")
