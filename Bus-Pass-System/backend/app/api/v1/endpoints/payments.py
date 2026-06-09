import os
import logging
from uuid import UUID
from datetime import date
from typing import Optional
import httpx

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.core.config import settings
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.payment import Payment, ReferenceType, PaymentStatus
from app.models.pass_model import PassType, BusPass
from app.models.booking import Booking, BookingStatus, PaymentStatus as BookingPaymentStatus
from app.models.qr_code import QRCode
from app.services.booking_service import BookingService
from app.services.pass_service import PassService
from app.services.pdf_service import generate_receipt_pdf
from app.services.email_service import send_receipt_email

logger = logging.getLogger(__name__)

router = APIRouter()


class PaymentVerifyRequest(BaseModel):
    payment_id: str
    email: EmailStr
    reference_type: str  # "booking" or "pass"
    
    # If booking:
    schedule_id: Optional[UUID] = None
    journey_date: Optional[str] = None
    num_seats: Optional[int] = 1
    
    # If pass:
    pass_type_id: Optional[UUID] = None


@router.get("/config")
async def get_payment_config(current_user: User = Depends(get_current_user)):
    """Expose Razorpay public key to authenticated frontend users"""
    return {"razorpay_key_id": settings.RAZORPAY_KEY_ID}


async def verify_and_capture_razorpay(payment_id: str, amount_paise: int) -> dict:
    """Verify payment status via Razorpay API and capture it if authorized"""
    auth = (settings.RAZORPAY_KEY_ID, settings.RAZORPAY_SECRET)
    
    async with httpx.AsyncClient() as client:
        # 1. Fetch Payment Status
        verify_url = f"https://api.razorpay.com/v1/payments/{payment_id}"
        try:
            response = await client.get(verify_url, auth=auth, timeout=10.0)
        except Exception as e:
            logger.error(f"Failed to connect to Razorpay: {e}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to contact Razorpay payment gateway."
            )
            
        if response.status_code != 200:
            logger.error(f"Razorpay status check error: {response.text}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Razorpay payment ID."
            )
            
        payment_data = response.json()
        status_str = payment_data.get("status")
        
        # 2. Capture Payment if Authorized
        if status_str == "authorized":
            capture_url = f"https://api.razorpay.com/v1/payments/{payment_id}/capture"
            capture_data = {"amount": amount_paise, "currency": "INR"}
            
            try:
                capture_res = await client.post(capture_url, auth=auth, json=capture_data, timeout=10.0)
            except Exception as e:
                logger.error(f"Failed to capture Razorpay payment: {e}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Failed to capture payment on Razorpay."
                )
                
            if capture_res.status_code != 200:
                logger.error(f"Razorpay capture error: {capture_res.text}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Razorpay payment capture failed."
                )
                
            payment_data = capture_res.json()
            status_str = payment_data.get("status")
            
        if status_str != "captured":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Razorpay payment verification failed. Status: {status_str}"
            )
            
        return payment_data


@router.post("/verify")
async def verify_payment(
    request: PaymentVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify, capture Razorpay payment, and finalize booking or pass purchase"""
    
    # 1. Determine Amount and details based on type
    if request.reference_type == "booking":
        if not request.schedule_id:
            raise HTTPException(status_code=400, detail="schedule_id is required for booking payment.")
            
        booking_service = BookingService(db)
        # Compute total price on backend securely
        fare = booking_service._get_fare(request.schedule_id)
        num_seats = request.num_seats or 1
        total_price = fare * num_seats
        amount_paise = int(total_price * 100)
        description = f"Ticket Booking ({num_seats} seats)"
        
    elif request.reference_type == "pass":
        if not request.pass_type_id:
            raise HTTPException(status_code=400, detail="pass_type_id is required for pass payment.")
            
        pass_type = db.query(PassType).filter(PassType.id == request.pass_type_id).first()
        if not pass_type:
            raise HTTPException(status_code=404, detail="Pass type not found.")
            
        total_price = pass_type.price
        amount_paise = int(total_price * 100)
        description = f"Bus Pass: {pass_type.pass_name}"
        
    else:
        raise HTTPException(status_code=400, detail="Invalid reference_type.")
        
    # 2. Verify and Capture via Razorpay
    razorpay_data = await verify_and_capture_razorpay(request.payment_id, amount_paise)
    
    # 3. Complete the business action
    receipt_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../data/receipts"))
    os.makedirs(receipt_dir, exist_ok=True)
    
    if request.reference_type == "booking":
        try:
            journey_date = date.fromisoformat(request.journey_date) if request.journey_date else date.today()
        except ValueError:
            journey_date = date.today()
            
        booking_service = BookingService(db)
        booking = await booking_service.create_booking(
            user_id=current_user.id,
            schedule_id=request.schedule_id,
            journey_date=journey_date,
            num_seats=num_seats
        )
        
        # Save Payment
        payment = Payment(
            user_id=current_user.id,
            reference_type=ReferenceType.BOOKING,
            reference_id=booking.id,
            amount=total_price,
            payment_method="razorpay",
            payment_status=PaymentStatus.COMPLETED,
            transaction_id=request.payment_id,
            payment_gateway_response=razorpay_data
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)
        
        # Retrieve QR Code base64
        qr = db.query(QRCode).filter(QRCode.id == booking.qr_code_id).first()
        qr_base64 = qr.qr_code_data if qr else None
        
        # Generate PDF receipt
        from app.models.schedule import Schedule
        from app.models.route import Route
        sched = db.query(Schedule).filter(Schedule.id == booking.schedule_id).first()
        rt = db.query(Route).filter(Route.id == sched.route_id).first() if sched else None
        
        pdf_path = os.path.join(receipt_dir, f"receipt_{booking.id}.pdf")
        details_dict = {
            "Booking ID": str(booking.id).upper(),
            "Route Number": rt.route_number if rt else "N/A",
            "From Stop": rt.origin if rt else "N/A",
            "To Stop": rt.destination if rt else "N/A",
            "Departure": sched.departure_time.strftime("%H:%M") if sched else "N/A",
            "Journey Date": booking.journey_date.isoformat(),
            "Seats Booked": num_seats
        }
        
        generate_receipt_pdf(
            filename=pdf_path,
            title="PMPML Ticket Receipt",
            payment_id=request.payment_id,
            email=request.email,
            amount=float(total_price),
            description=description,
            details=details_dict,
            qr_base64=qr_base64
        )
        
        # Send SMTP Email
        email_body = f"""Dear Passenger,

Thank you for using the Smart Bus Pass System. Your payment was successful and your ticket booking is confirmed!

Booking Details:
- Ticket No: TKT-{str(booking.id)[:8].upper()}
- Route: {rt.route_number if rt else 'N/A'} ({rt.origin if rt else 'N/A'} -> {rt.destination if rt else 'N/A'})
- Journey Date: {booking.journey_date.isoformat()}
- Seats Booked: {num_seats}
- Amount Paid: INR {total_price:.2f}
- Razorpay Payment ID: {request.payment_id}

Please find your official PDF receipt and ticket attached to this email. Show the QR code in the receipt or in the app to the bus conductor.

Safe travels!
Smart Bus Pass System Team
"""
        send_receipt_email(
            to_email=request.email,
            subject="Your Ticket Booking Receipt - Smart Bus Pass System",
            body=email_body,
            attachment_path=pdf_path
        )
        
        return {
            "success": True,
            "reference_type": "booking",
            "id": str(booking.id),
            "payment_id": request.payment_id
        }
        
    elif request.reference_type == "pass":
        pass_service = PassService(db)
        bus_pass = await pass_service.create_pass(
            user_id=current_user.id,
            pass_type_id=request.pass_type_id
        )
        
        # Save Payment
        payment = Payment(
            user_id=current_user.id,
            reference_type=ReferenceType.PASS,
            reference_id=bus_pass.id,
            amount=total_price,
            payment_method="razorpay",
            payment_status=PaymentStatus.COMPLETED,
            transaction_id=request.payment_id,
            payment_gateway_response=razorpay_data
        )
        db.add(payment)
        
        # Save PDF url
        bus_pass.pdf_url = f"/api/v1/payments/receipt/{bus_pass.id}"
        db.commit()
        db.refresh(payment)
        
        # Retrieve QR Code base64
        qr = db.query(QRCode).filter(QRCode.id == bus_pass.qr_code_id).first()
        qr_base64 = qr.qr_code_data if qr else None
        
        # Generate PDF receipt
        pdf_path = os.path.join(receipt_dir, f"receipt_{bus_pass.id}.pdf")
        details_dict = {
            "Pass ID": str(bus_pass.id).upper(),
            "Pass Number": bus_pass.pass_number,
            "Pass Type": pass_type.pass_name,
            "Valid From": bus_pass.valid_from.isoformat(),
            "Valid To": bus_pass.valid_to.isoformat(),
            "Validity": f"{pass_type.validity_days} Days"
        }
        
        generate_receipt_pdf(
            filename=pdf_path,
            title="PMPML Bus Pass Receipt",
            payment_id=request.payment_id,
            email=request.email,
            amount=float(total_price),
            description=description,
            details=details_dict,
            qr_base64=qr_base64
        )
        
        # Send SMTP Email
        email_body = f"""Dear Passenger,

Thank you for using the Smart Bus Pass System. Your payment was successful and your digital bus pass is now active!

Pass Details:
- Pass No: {bus_pass.pass_number}
- Pass Name: {pass_type.pass_name}
- Valid From: {bus_pass.valid_from.isoformat()}
- Valid To: {bus_pass.valid_to.isoformat()}
- Amount Paid: INR {total_price:.2f}
- Razorpay Payment ID: {request.payment_id}

Please find your official PDF receipt and bus pass attached to this email. Show the QR code in the receipt or in the app to the bus conductor.

Safe travels!
Smart Bus Pass System Team
"""
        send_receipt_email(
            to_email=request.email,
            subject="Your Bus Pass Purchase Receipt - Smart Bus Pass System",
            body=email_body,
            attachment_path=pdf_path
        )
        
        return {
            "success": True,
            "reference_type": "pass",
            "id": str(bus_pass.id),
            "payment_id": request.payment_id
        }


@router.get("/receipt/{reference_id}")
async def download_receipt(
    reference_id: UUID,
    db: Session = Depends(get_db)
):
    """Retrieve generated PDF receipt by reference (booking or pass id)"""
    # Verify payment exists for this reference
    payment = db.query(Payment).filter(Payment.reference_id == reference_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment receipt not found for this reference ID."
        )
        
    receipt_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../data/receipts"))
    pdf_path = os.path.join(receipt_dir, f"receipt_{reference_id}.pdf")
    
    if not os.path.exists(pdf_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt PDF file was not found on server."
        )
        
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"receipt_{reference_id}.pdf"
    )
