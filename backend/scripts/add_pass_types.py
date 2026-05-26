"""
Update PMPML Pass Types with full 2026 data:
validity, travel area, time validity, discount info
Uses the PassType model (pass_types table).
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.models.pass_model import PassType

def update_pass_types():
    # Ensure new columns exist (SQLite: add columns if missing)
    from sqlalchemy import inspect, text
    with engine.connect() as conn:
        inspector = inspect(engine)
        existing_cols = [c["name"] for c in inspector.get_columns("pass_types")]
        for col, col_type in [
            ("category",      "VARCHAR(50)"),
            ("travel_area",   "VARCHAR(200)"),
            ("time_validity", "VARCHAR(200)"),
            ("discount_info", "VARCHAR(200)"),
            ("eligibility",   "TEXT"),
        ]:
            if col not in existing_cols:
                conn.execute(text(f"ALTER TABLE pass_types ADD COLUMN {col} {col_type}"))
                print(f"  Added column: {col}")
        conn.commit()

    db = SessionLocal()
    try:
        db.query(PassType).delete()
        db.commit()
        print("Cleared existing pass types.")

        pass_types = [
            # ── GENERAL ──────────────────────────────────────────────────────────
            dict(pass_name="Daily Pass (PMC/PCMC)",      category="General",
                 validity_days=1,   price=70.0,
                 description="Unlimited rides for 1 day within Pune (PMC) and Pimpri-Chinchwad (PCMC) limits.",
                 travel_area="Pune + PCMC",
                 time_validity="Full service day (5:00 AM – 11:30 PM)",
                 discount_info="Unlimited rides", eligibility="All passengers"),

            dict(pass_name="Daily Pass (PMRDA)",         category="General",
                 validity_days=1,   price=150.0,
                 description="Unlimited rides for 1 day covering Pune, PCMC and PMRDA extended routes.",
                 travel_area="Pune + PCMC + PMRDA",
                 time_validity="Full service day (5:00 AM – 11:30 PM)",
                 discount_info="Unlimited rides", eligibility="All passengers"),

            dict(pass_name="Monthly Pass (PMC/PCMC)",    category="General",
                 validity_days=30,  price=1500.0,
                 description="30-day unlimited travel pass for PMC and PCMC city limits.",
                 travel_area="PMC + PCMC",
                 time_validity="All operating hours (5:00 AM – 11:30 PM)",
                 discount_info="Unlimited rides", eligibility="All passengers"),

            dict(pass_name="Regional Monthly Pass",      category="General",
                 validity_days=30,  price=2700.0,
                 description="30-day unlimited travel on all PMRDA regional routes including outskirts.",
                 travel_area="PMRDA routes (entire region)",
                 time_validity="All operating hours",
                 discount_info="Unlimited rides", eligibility="All passengers"),

            dict(pass_name="22-Day Punch Pass",          category="General",
                 validity_days=22,  price=0.0,
                 description="22 travel days punch pass. Fare is distance-based per route. Valid on selected routes.",
                 travel_area="Selected routes",
                 time_validity="Operating hours",
                 discount_info="Route-based fare", eligibility="All passengers"),

            # ── STUDENTS ─────────────────────────────────────────────────────────
            dict(pass_name="Student Monthly Pass",       category="Student",
                 validity_days=30,  price=750.0,
                 description="30-day student concession pass for all PMPML routes. Requires bonafide certificate + Aadhaar.",
                 travel_area="All routes",
                 time_validity="All operating hours",
                 discount_info="Student concession (~50% off regular fare)",
                 eligibility="Students with valid bonafide certificate"),

            dict(pass_name="Student Quarterly Pass",     category="Student",
                 validity_days=90,  price=2000.0,
                 description="3-month discounted student pass for all PMPML routes.",
                 travel_area="All routes",
                 time_validity="All operating hours",
                 discount_info="Discounted quarterly rate",
                 eligibility="Students with valid bonafide certificate"),

            dict(pass_name="Student Half-Yearly Pass",   category="Student",
                 validity_days=180, price=3000.0,
                 description="6-month discounted student pass for all PMPML routes.",
                 travel_area="All routes",
                 time_validity="All operating hours",
                 discount_info="Discounted half-yearly rate",
                 eligibility="Students with valid bonafide certificate"),

            dict(pass_name="Student Annual Pass",        category="Student",
                 validity_days=365, price=5000.0,
                 description="Best value 1-year student pass for all PMPML routes.",
                 travel_area="All routes",
                 time_validity="All operating hours",
                 discount_info="Best value – cheapest long-term option",
                 eligibility="Students with valid bonafide certificate"),

            dict(pass_name="Student Trip Pass (50% Off)", category="Student",
                 validity_days=1,   price=0.0,
                 description="Per-trip pass at 50% concession on fare. Valid on selected routes per journey.",
                 travel_area="Selected routes",
                 time_validity="Per journey",
                 discount_info="50% fare concession per trip",
                 eligibility="Students with valid ID"),

            # ── SENIOR CITIZENS ──────────────────────────────────────────────────
            dict(pass_name="Senior Citizen Daily Pass",  category="Senior Citizen",
                 validity_days=1,   price=40.0,
                 description="1-day senior citizen concession pass for entire PMPML network. Age 60+.",
                 travel_area="Entire PMPML network",
                 time_validity="Full day (5:00 AM – 11:30 PM)",
                 discount_info="Senior citizen concession",
                 eligibility="Age 60 and above"),

            dict(pass_name="Senior Citizen Monthly Pass", category="Senior Citizen",
                 validity_days=30,  price=500.0,
                 description="30-day heavily discounted pass for senior citizens on entire PMPML network.",
                 travel_area="Entire PMPML network",
                 time_validity="All operating hours",
                 discount_info="Heavy discount for senior citizens",
                 eligibility="Age 60 and above with valid ID proof"),

            # ── DIVYANG ──────────────────────────────────────────────────────────
            dict(pass_name="Divyang Annual Pass (FREE)", category="Divyang",
                 validity_days=365, price=0.0,
                 description="FREE 1-year annual pass for persons with disabilities on entire PMPML network.",
                 travel_area="Entire network",
                 time_validity="All operating hours",
                 discount_info="100% concession – FREE",
                 eligibility="Persons with disability certificate (40%+ disability)"),

            # ── JOURNALISTS ──────────────────────────────────────────────────────
            dict(pass_name="Journalist Annual Pass (FREE)", category="Journalist",
                 validity_days=365, price=0.0,
                 description="FREE 1-year annual pass for accredited journalists. Issued via PMPML HQ.",
                 travel_area="Entire network",
                 time_validity="All operating hours",
                 discount_info="100% concession – FREE",
                 eligibility="Accredited journalists with press card"),

            # ── FREEDOM FIGHTERS ─────────────────────────────────────────────────
            dict(pass_name="Freedom Fighter Annual Pass (FREE)", category="Freedom Fighter",
                 validity_days=365, price=0.0,
                 description="FREE 1-year annual pass for freedom fighters and their dependents.",
                 travel_area="Entire network",
                 time_validity="All operating hours",
                 discount_info="100% concession – FREE",
                 eligibility="Recognized freedom fighters with government certificate"),

            # ── MUNICIPAL EMPLOYEES ──────────────────────────────────────────────
            dict(pass_name="Municipal Employee Monthly Pass", category="Municipal Employee",
                 validity_days=30,  price=700.0,
                 description="30-day employee benefit pass for PMC/PCMC municipal employees on selected routes.",
                 travel_area="Selected routes (work routes)",
                 time_validity="Working hours + regular service",
                 discount_info="Employee benefit rate",
                 eligibility="PMC/PCMC municipal employees with ID"),

            # ── GOVT SCHOOL STUDENTS ─────────────────────────────────────────────
            dict(pass_name="Govt School Student Pass (FREE)", category="Student",
                 validity_days=365, price=0.0,
                 description="FREE academic year pass for government school students on eligible routes.",
                 travel_area="Eligible routes (school routes)",
                 time_validity="School timings + general service",
                 discount_info="100% concession – FREE",
                 eligibility="Government school students Std 1–12 with school ID"),

            # ── PRIVATE SCHOOL STUDENTS ──────────────────────────────────────────
            dict(pass_name="Private School Student Pass (75% Off)", category="Student",
                 validity_days=365, price=0.0,
                 description="Academic year pass for private school students (Std 5–10) at 75% concession.",
                 travel_area="Eligible routes (school routes)",
                 time_validity="School timings + general service",
                 discount_info="75% concession – pay only 25% of fare",
                 eligibility="Private school students Std 5–10 with school ID"),
        ]

        for pt in pass_types:
            obj = PassType(
                pass_name    = pt["pass_name"],
                validity_days= pt["validity_days"],
                price        = pt["price"],
                description  = pt.get("description", ""),
                category     = pt.get("category", "General"),
                travel_area  = pt.get("travel_area", ""),
                time_validity= pt.get("time_validity", ""),
                discount_info= pt.get("discount_info", ""),
                eligibility  = pt.get("eligibility", ""),
                is_active    = True,
            )
            db.add(obj)

        db.commit()
        print(f"\n✅ Added {len(pass_types)} PMPML pass types successfully!")

        passes = db.query(PassType).all()
        print(f"\n📋 Pass Types in Database ({len(passes)} total):")
        for p in passes:
            price_str = f"₹{p.price:.0f}" if p.price > 0 else "FREE"
            print(f"  [{p.category}] {p.pass_name} — {price_str} / {p.validity_days}d")

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        import traceback; traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    update_pass_types()
