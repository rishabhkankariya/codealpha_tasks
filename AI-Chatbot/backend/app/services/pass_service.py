"""Bus pass service"""

from datetime import date, timedelta
from typing import List, Optional
from uuid import UUID
import uuid as uuid_lib
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.pass_model import BusPass, PassType, PassStatus
from app.core.exceptions import NotFoundException
from app.services.qr_service import QRService


class PassService:
    def __init__(self, db: Session):
        self.db = db
        self.qr_service = QRService(db)

    async def create_pass(self, user_id: UUID, pass_type_id: UUID) -> BusPass:
        """Create a new bus pass with QR code"""
        pass_type = self.db.query(PassType).filter(PassType.id == pass_type_id).first()
        if not pass_type:
            raise NotFoundException("Pass type not found")

        today = date.today()
        valid_to = today + timedelta(days=pass_type.validity_days)

        # Generate unique pass number
        pass_number = f"PMPML-{str(uuid_lib.uuid4())[:8].upper()}"

        # Get a default route (first active route)
        from app.models.route import Route
        default_route = self.db.query(Route).filter(Route.is_active == True).first()
        route_id = default_route.id if default_route else uuid_lib.uuid4()

        bus_pass = BusPass(
            user_id=user_id,
            pass_type_id=pass_type_id,
            route_id=route_id,
            pass_number=pass_number,
            valid_from=today,
            valid_to=valid_to,
            pass_status=PassStatus.ACTIVE,
        )
        self.db.add(bus_pass)
        self.db.commit()
        self.db.refresh(bus_pass)

        # Generate QR code
        try:
            qr_code = await self.qr_service.generate_pass_qr(bus_pass.id)
            bus_pass.qr_code_id = qr_code.id
            self.db.commit()
            self.db.refresh(bus_pass)
        except Exception as e:
            print(f"QR generation warning: {e}")

        return bus_pass

    async def get_user_passes(self, user_id: UUID) -> List[BusPass]:
        return self.db.query(BusPass).filter(
            BusPass.user_id == user_id
        ).order_by(BusPass.created_at.desc()).all()

    async def get_pass(self, pass_id: UUID, user_id: UUID) -> Optional[BusPass]:
        return self.db.query(BusPass).filter(
            and_(BusPass.id == pass_id, BusPass.user_id == user_id)
        ).first()

    async def expire_passes(self):
        expired = self.db.query(BusPass).filter(
            and_(BusPass.pass_status == PassStatus.ACTIVE, BusPass.valid_to < date.today())
        ).all()
        for p in expired:
            p.pass_status = PassStatus.EXPIRED
        self.db.commit()
        return len(expired)
