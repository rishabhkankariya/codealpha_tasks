"""Add pricing to routes based on distance"""
import sys
sys.path.insert(0, '.')

from app.core.database import SessionLocal
from app.models.route import Route
from decimal import Decimal

db = SessionLocal()

# PMPML Pricing Structure (2026)
# Base fare: ₹10
# Per km rate: ₹1.50

BASE_FARE = Decimal("10.00")
PER_KM_RATE = Decimal("1.50")

print("Adding pricing to routes...")
print("=" * 60)

routes = db.query(Route).all()
updated_count = 0

for route in routes:
    # Calculate fare based on distance
    distance = float(route.distance_km)
    
    # Fare = Base fare + (Distance × Per km rate)
    fare = BASE_FARE + (Decimal(str(distance)) * PER_KM_RATE)
    
    # Round to nearest ₹5
    fare = round(fare / 5) * 5
    
    # Minimum fare ₹10, Maximum fare ₹100
    fare = max(Decimal("10.00"), min(fare, Decimal("100.00")))
    
    # Store in route (we'll add a price field or use description)
    # For now, let's update the route to include price info
    route.estimated_fare = fare
    updated_count += 1
    
    if updated_count <= 5:  # Show first 5 examples
        print(f"✓ {route.route_number}: {route.distance_km} km → ₹{fare}")

# Since we don't have a fare column, let's create a pricing rule for each route
from app.models.pricing import PricingRule
from datetime import date

print("\nCreating pricing rules for routes...")

# Clear existing pricing rules
db.query(PricingRule).delete()

for route in routes:
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
        valid_to=None,
        is_active=True
    )
    db.add(pricing_rule)

db.commit()

print("=" * 60)
print(f"\n✅ Complete!")
print(f"   Routes processed: {len(routes)}")
print(f"   Pricing rules created: {len(routes)}")
print(f"\nPricing Structure:")
print(f"   Base Fare: ₹{BASE_FARE}")
print(f"   Per KM Rate: ₹{PER_KM_RATE}")
print(f"   Minimum Fare: ₹10")
print(f"   Maximum Fare: ₹100")

db.close()
