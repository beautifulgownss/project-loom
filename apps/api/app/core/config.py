"""Application configuration."""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings."""

    # API
    API_V1_PREFIX: str = "/v1"
    PROJECT_NAME: str = "Project Loom API"
    VERSION: str = "0.1.0"

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # Database
    DATABASE_URL: str

    # Auth
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # OpenAI
    OPENAI_API_KEY: str

    # Email APIs
    RESEND_API_KEY: Optional[str] = None
    GMAIL_CLIENT_ID: Optional[str] = None
    GMAIL_CLIENT_SECRET: Optional[str] = None

    # Redis/Queue
    REDIS_URL: str = "redis://localhost:6379"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
