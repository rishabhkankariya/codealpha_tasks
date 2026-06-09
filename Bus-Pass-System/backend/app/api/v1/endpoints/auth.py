"""Authentication endpoints"""

from fastapi import APIRouter, Depends, status, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse, TokenRefresh
from app.services.auth_service import AuthService
from app.services.user_service import UserService

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user and login automatically
    
    - **email**: Valid email address
    - **password**: Minimum 8 characters with uppercase, lowercase, digit, and special character
    - **first_name**: User's first name
    - **last_name**: User's last name
    - **phone**: Optional phone number
    - **role**: User role (passenger, admin, conductor)
    """
    user_service = UserService(db)
    user = await user_service.create(user_data)
    
    # Auto-login: authenticate and return tokens
    auth_service = AuthService(db)
    from app.schemas.user import UserLogin
    credentials = UserLogin(email=user_data.email, password=user_data.password)
    tokens = await auth_service.authenticate(credentials)
    return tokens


@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Login with email and password (OAuth2 compatible)
    
    Returns JWT access token and refresh token
    
    - **username**: User's email address
    - **password**: User's password
    """
    # Convert OAuth2 form to UserLogin schema
    credentials = UserLogin(email=form_data.username, password=form_data.password)
    
    auth_service = AuthService(db)
    try:
        tokens = await auth_service.authenticate(credentials)
        return tokens
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    token_data: TokenRefresh,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token
    
    - **refresh_token**: Valid refresh token
    """
    auth_service = AuthService(db)
    tokens = await auth_service.refresh_access_token(token_data.refresh_token)
    return tokens


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout():
    """
    Logout user
    
    Note: Since we're using stateless JWT tokens, logout is handled client-side
    by removing the tokens. This endpoint is provided for API completeness.
    """
    return None
