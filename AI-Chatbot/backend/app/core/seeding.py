import sys
import os

from .database import SessionLocal, engine, Base
from .security import get_password_hash
from ..models.database import User, KnowledgeBase
from ..services.ai_service import ai_service

def seed_database():
    print("Initializing SQLite database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # 1. Create Admin User
        admin_email = "admin@example.com"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            print("Creating default admin account...")
            admin = User(
                name="System Administrator",
                email=admin_email,
                password_hash=get_password_hash("adminpassword123"),
                role="admin"
            )
            db.add(admin)
            db.commit()
            print("Admin account created (email: admin@example.com, password: adminpassword123)")
        else:
            print("Admin account already exists.")
            
        # 2. Create Regular User
        user_email = "user@example.com"
        user = db.query(User).filter(User.email == user_email).first()
        if not user:
            print("Creating default user account...")
            user = User(
                name="Regular Student",
                email=user_email,
                password_hash=get_password_hash("userpassword123"),
                role="user"
            )
            db.add(user)
            db.commit()
            print("User account created (email: user@example.com, password: userpassword123)")
        else:
            print("User account already exists.")
            
        # 3. Seed Knowledge Base Q&As
        if db.query(KnowledgeBase).count() == 0:
            print("Seeding default Knowledge Base FAQs...")
            faqs = [
                # Admission
                {
                    "category": "Admission",
                    "question": "What documents are required for admission?",
                    "answer": "You need to submit your high school transcripts, passport-sized photos, identity proof (e.g. passport or national ID), and your letters of recommendation during admission."
                },
                {
                    "category": "Admission",
                    "question": "What is the minimum GPA score required for admission?",
                    "answer": "For undergraduate programs, a minimum GPA of 3.0 or equivalent is required. For postgraduate applications, we require a minimum GPA of 3.2."
                },
                # Fees
                {
                    "category": "Fees",
                    "question": "Are there any installment options for semester fee payment?",
                    "answer": "Yes, semester fees can be paid in up to three equal installments upon submission of a request form to the accounts department prior to the start of the semester."
                },
                {
                    "category": "Fees",
                    "question": "Is there a scholarship option for outstanding students?",
                    "answer": "We offer Merit Scholarships for top 5% academic performers and Need-based Financial Aid. You can apply on the financial aid page of the student portal."
                },
                # Hostel
                {
                    "category": "Hostel",
                    "question": "What items are provided in the hostel room?",
                    "answer": "Each hostel room is furnished with a single bed, study table, chair, wardrobe, and a bookshelf. Wi-Fi and common laundry services are provided."
                },
                {
                    "category": "Hostel",
                    "question": "Is there a curfew time for hostel students?",
                    "answer": "Yes, the entry gates for the student hostel close at 10:00 PM on weekdays and 11:30 PM on weekends. Late entry requests must be submitted online."
                },
                # Bus Pass
                {
                    "category": "Bus Pass",
                    "question": "How long does it take to issue a new bus pass?",
                    "answer": "Once submitted online, application verification and physical card printing takes 2 to 3 business days. You can pick it up at the transport office."
                },
                {
                    "category": "Bus Pass",
                    "question": "Can I cancel my bus pass and get a refund?",
                    "answer": "Yes, you can cancel your bus pass. Refund is calculated pro-rata based on the remaining months of the semester, minus a $10 processing fee."
                },
                # Bus Routes
                {
                    "category": "Bus Routes",
                    "question": "What is Route 1 transport schedule?",
                    "answer": "Route 1 starts from Central Station at 7:30 AM, passes through North End (7:45 AM), Civic Square (8:00 AM), and arrives at College Campus at 8:20 AM."
                },
                {
                    "category": "Bus Routes",
                    "question": "Are there evening bus routes for late library study?",
                    "answer": "Yes, we run a special late-evening bus route at 8:30 PM covering major arterial roads. It departs from the campus library round-about."
                }
            ]
            
            for faq in faqs:
                kb_entry = KnowledgeBase(
                    category=faq["category"],
                    question=faq["question"],
                    answer=faq["answer"]
                )
                db.add(kb_entry)
            db.commit()
            print(f"Successfully seeded {len(faqs)} KnowledgeBase FAQ records.")
        else:
            print("KnowledgeBase FAQs already seeded.")
            
        # 4. Trigger FAISS Index Rebuild
        print("Rebuilding FAISS vector search index...")
        ai_service.rebuild_kb_index(db)
        print("Database seeding completed successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()
