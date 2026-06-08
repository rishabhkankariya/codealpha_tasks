"""Application configuration"""

from typing import Optional, List
from pydantic_settings import BaseSettings
from pydantic import validator


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "Smart Bus Pass System"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database
    DATABASE_URL: str = "sqlite:///./smart_bus_pass.db"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 100
    USE_SQLITE: bool = False
    
    # Redis
    REDIS_URL: str
    REDIS_CACHE_TTL: int = 3600  # 1 hour
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 100
    
    # Seat Reservation
    SEAT_RESERVATION_TIMEOUT_MINUTES: int = 10
    
    # Pass Expiry
    PASS_EXPIRY_REMINDER_DAYS: int = 3
    
    # OpenAI
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4"
    
    # Azure Storage
    AZURE_STORAGE_CONNECTION_STRING: Optional[str] = None
    AZURE_STORAGE_CONTAINER_PDFS: str = "pdfs"
    AZURE_STORAGE_CONTAINER_ASSETS: str = "static-assets"
    
    # Azure Key Vault
    KEY_VAULT_URL: Optional[str] = None
    
    # Application Insights
    APPINSIGHTS_INSTRUMENTATION_KEY: Optional[str] = None
    
    # Celery
    CELERY_BROKER_URL: Optional[str] = None
    CELERY_RESULT_BACKEND: Optional[str] = None
    
    @validator("CELERY_BROKER_URL", pre=True)
    def set_celery_broker(cls, v, values):
        if v:
            return v
        return values.get("REDIS_URL")
    
    @validator("CELERY_RESULT_BACKEND", pre=True)
    def set_celery_backend(cls, v, values):
        if v:
            return v
        return values.get("REDIS_URL")
    
    @validator("CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: any) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["http://localhost:3000", "http://localhost:8000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
