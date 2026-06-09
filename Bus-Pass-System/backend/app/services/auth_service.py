"""Authentication service"""

from datetime import timedelta
from typing import Optional
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserLogin, TokenResponse
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token
from app.core.config import settings
from app.core.exceptions import UnauthorizedException
from app.services.user_service import UserService


class AuthService:
    """Authentication service"""
    
    def __init__(self, db: Session):
        self.db = db
        self.user_service = UserService(db)
    
    async def authenticate(self, credentials: UserLogin) -> TokenResponse:
        """Authenticate user and return tokens"""
        # Get user by email
        user = await self.user_service.get_by_email(credentials.email)
        
        # Verify user exists and password is correct
        if not user or not verify_password(credentials.password, user.password_hash):
            raise UnauthorizedException("Invalid email or password")
        
        # Check if user is active
        if not user.is_active:
            raise UnauthorizedException("User account is inactive")
        
        # Generate tokens
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email, "role": user.role.value}
        )
        refresh_token = create_refresh_token(
            data={"sub": str(user.id)}
        )
        
        # Create user response
        from app.schemas.user import UserResponse
        user_response = UserResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            phone=user.phone,
            role=user.role,
            is_active=user.is_active,
            email_verified=user.email_verified,
            created_at=user.created_at,
            full_name=user.full_name
        )
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=user_response
        )
    
    async def refresh_access_token(self, refresh_token: str) -> TokenResponse:
        """Refresh access token using refresh token"""
        try:
            payload = decode_token(refresh_token)
            
            # Verify it's a refresh token
            if payload.get("type") != "refresh":
                raise UnauthorizedException("Invalid token type")
            
            user_id = payload.get("sub")
            if not user_id:
                raise UnauthorizedException("Invalid token")
            
            # Get user
            user = await self.user_service.get_by_id(user_id)
            if not user or not user.is_active:
                raise UnauthorizedException("User not found or inactive")
            
            # Generate new tokens
            access_token = create_access_token(
                data={"sub": str(user.id), "email": user.email, "role": user.role.value}
            )
            new_refresh_token = create_refresh_token(
                data={"sub": str(user.id)}
            )
            
            return TokenResponse(
                access_token=access_token,
                refresh_token=new_refresh_token,
                expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
            )
        except Exception:
            raise UnauthorizedException("Invalid or expired refresh token")
    
    async def verify_token(self, token: str) -> Optional[User]:
        """Verify access token and return user"""
        try:
            payload = decode_token(token)
            user_id = payload.get("sub")
            
            if not user_id:
                return None
            
            user = await self.user_service.get_by_id(user_id)
            return user if user and user.is_active else None
        except Exception:
            return None
