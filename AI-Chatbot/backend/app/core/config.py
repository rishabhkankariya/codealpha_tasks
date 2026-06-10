import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Chatbot Platform"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super_secret_jwt_key_for_chatbot_platform_123456")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # SQLite Database URL
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///c:/Users/Rishabh Kankariya/Desktop/codealpha_tasks/AI-Chatbot/backend/data/chatbot.db"
    )
    
    # Hugging Face Model Name
    HF_MODEL_NAME: str = "all-MiniLM-L6-v2"
    
    # Confidence threshold for intent match (80%)
    INTENT_CONFIDENCE_THRESHOLD: float = 0.80

    class Config:
        case_sensitive = True

settings = Settings()
