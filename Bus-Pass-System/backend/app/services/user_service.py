"""User service"""

from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash
from app.core.exceptions import ConflictException, NotFoundException


class UserService:
    """User service for business logic"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        """Get user by ID"""
        return self.db.query(User).filter(User.id == user_id).first()
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return self.db.query(User).filter(User.email == email).first()
    
    async def create(self, user_data: UserCreate) -> User:
        """Create a new user"""
        # Check if email already exists
        existing_user = await self.get_by_email(user_data.email)
        if existing_user:
            raise ConflictException("Email already registered")
        
        # Create user
        user = User(
            email=user_data.email,
            password_hash=get_password_hash(user_data.password),
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            phone=user_data.phone,
            role=user_data.role
        )
        
        try:
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
            return user
        except IntegrityError:
            self.db.rollback()
            raise ConflictException("Email already registered")
    
    async def update(self, user_id: UUID, user_data: UserUpdate) -> User:
        """Update user"""
        user = await self.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        
        # Update fields
        if user_data.first_name is not None:
            user.first_name = user_data.first_name
        if user_data.last_name is not None:
            user.last_name = user_data.last_name
        if user_data.phone is not None:
            user.phone = user_data.phone
        
        self.db.commit()
        self.db.refresh(user)
        return user
    
    async def delete(self, user_id: UUID) -> bool:
        """Delete user (soft delete by deactivating)"""
        user = await self.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        
        user.is_active = False
        self.db.commit()
        return True
    
    async def verify_email(self, user_id: UUID) -> User:
        """Verify user email"""
        user = await self.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        
        user.email_verified = True
        self.db.commit()
        self.db.refresh(user)
        return user
