from pydantic import BaseSettings
from typing import List
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    # Base settings
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "EncoderGroup"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")
    
    # Server settings
    PORT: int = int(os.getenv("PORT", "5000"))
    
    # CORS settings
    CORS_ORIGINS: List[str] = [
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:80",
        "http://client:80",
        "http://127.0.0.1",
        "http://127.0.0.1:80",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    # MongoDB settings
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://mongo:27017/encodergroup")
    
    # JWT settings
    JWT_SECRET: str = os.getenv("JWT_SECRET", "your_jwt_secret_key_changeme")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days
    
    # SMTP settings for sending emails via cPanel
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "465"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_SSL: bool = os.getenv("SMTP_SSL", "True").lower() in ("true", "1", "t")
    SMTP_VERIFY_SSL: bool = os.getenv("SMTP_VERIFY_SSL", "True").lower() in ("true", "1", "t")
    
    # Legacy SendGrid settings (kept for backwards compatibility)
    SENDGRID_API_KEY: str = os.getenv("SENDGRID_API_KEY", "")
    EMAIL_SENDER: str = os.getenv("EMAIL_SENDER", "")
    
    # Client URL for password reset
    CLIENT_URL: str = os.getenv("CLIENT_URL", "http://localhost")
    
    class Config:
        case_sensitive = True

settings = Settings()