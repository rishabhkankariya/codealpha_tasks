import os
import pytest
from unittest.mock import patch, AsyncMock
from uuid import uuid4
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import SessionLocal, engine
from app.models.user import User
from app.models.pass_model import PassType, BusPass
from app.models.payment import Payment, ReferenceType, PaymentStatus
from app.models.qr_code import QRCode

client = TestClient(app)

@pytest.fixture(scope="module")
def db_session():
    # Use the local developer database for validation
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(scope="module")
def test_user_info(db_session: Session):
    email = f"test_rider_{uuid4().hex[:6]}@example.com"
    payload = {
        "email": email,
        "password": "Password123!",
        "first_name": "Test",
        "last_name": "Rider",
        "phone": "9876543210",
        "role": "passenger"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201, f"Registration failed: {response.text}"
    token_data = response.json()
    token = token_data.get("access_token")
    
    user = db_session.query(User).filter(User.email == email).first()
    assert user is not None
    
    user_info = {
        "email": email,
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"},
        "id": user.id
    }
    
    yield user_info
    
    # Cleanup user payments, passes, and user
    db_session.query(Payment).filter(Payment.user_id == user.id).delete()
    db_session.query(BusPass).filter(BusPass.user_id == user.id).delete()
    db_session.query(User).filter(User.id == user.id).delete()
    db_session.commit()

@pytest.fixture(scope="module")
def test_pass_type(db_session: Session):
    # Ensure at least one paid pass type exists
    pass_type = db_session.query(PassType).filter(PassType.price > 0).first()
    if not pass_type:
        pass_type = PassType(
            id=uuid4(),
            pass_name="Premium Monthly Pass",
            price=250.0,
            validity_days=30,
            description="Testing pass type",
            is_active=True
        )
        db_session.add(pass_type)
        db_session.commit()
        db_session.refresh(pass_type)
        
    return pass_type

def test_get_payment_config(test_user_info):
    # Test that authenticated clients can retrieve the config
    response = client.get("/api/v1/payments/config", headers=test_user_info["headers"])
    assert response.status_code == 200
    assert "razorpay_key_id" in response.json()

@patch("app.api.v1.endpoints.payments.verify_and_capture_razorpay")
def test_verify_payment_pass(mock_verify, test_user_info, test_pass_type, db_session: Session):
    # Mock the Razorpay verification call to return a success dict
    mock_verify.return_value = {
        "id": "pay_test_payment123",
        "status": "captured",
        "amount": int(test_pass_type.price * 100),
        "currency": "INR"
    }
    
    # Trigger the verify endpoint
    payload = {
        "payment_id": "pay_test_payment123",
        "email": test_user_info["email"],
        "reference_type": "pass",
        "pass_type_id": str(test_pass_type.id)
    }
    
    response = client.post("/api/v1/payments/verify", json=payload, headers=test_user_info["headers"])
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["reference_type"] == "pass"
    assert "id" in data
    assert data["payment_id"] == "pay_test_payment123"
    
    # Confirm pass and payment were created in db
    pass_id = data["id"]
    bus_pass = db_session.query(BusPass).filter(BusPass.id == pass_id).first()
    assert bus_pass is not None
    assert bus_pass.user_id == test_user_info["id"]
    
    payment = db_session.query(Payment).filter(Payment.reference_id == bus_pass.id).first()
    assert payment is not None
    assert payment.transaction_id == "pay_test_payment123"
    assert payment.payment_status == PaymentStatus.COMPLETED
    
    # Confirm PDF receipt file is generated
    receipt_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "data/receipts"))
    pdf_path = os.path.join(receipt_dir, f"receipt_{pass_id}.pdf")
    assert os.path.exists(pdf_path), f"PDF file not found at: {pdf_path}"
    
    # Test downloading the PDF receipt
    dl_response = client.get(f"/api/v1/payments/receipt/{pass_id}", headers=test_user_info["headers"])
    assert dl_response.status_code == 200
    assert dl_response.headers.get("content-type") == "application/pdf"
    assert len(dl_response.content) > 0
    
    # Clean up generated PDF file
    try:
        os.remove(pdf_path)
    except OSError:
        pass

