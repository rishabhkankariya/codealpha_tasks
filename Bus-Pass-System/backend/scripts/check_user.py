"""Check and create test user"""
import sys
sys.path.insert(0, '.')

from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash, verify_password

db = SessionLocal()

# Check if user exists
user = db.query(User).filter(User.email == 'test@example.com').first()

if user:
    print(f"✓ User exists: {user.email}")
    print(f"  Name: {user.first_name} {user.last_name}")
    print(f"  Role: {user.role}")
    
    # Test password
    test_password = "Test123!@#"
    if verify_password(test_password, user.password_hash):
        print(f"✓ Password is correct")
    else:
        print(f"✗ Password is incorrect - updating...")
        user.password_hash = get_password_hash(test_password)
        db.commit()
        print(f"✓ Password updated")
else:
    print("✗ User does not exist - creating...")
    new_user = User(
        email='test@example.com',
        password_hash=get_password_hash('Test123!@#'),
        first_name='Test',
        last_name='User',
        role='passenger',
        phone='1234567890'
    )
    db.add(new_user)
    db.commit()
    print(f"✓ User created: test@example.com")

db.close()
