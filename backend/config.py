from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://scheduler_user:scheduler_password@localhost:5432/scheduler_db"
    REDIS_URL: str = "redis://localhost:6379"
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    CORS_ORIGINS: str = "http://localhost:3000"
    
    class Config:
        env_file = ".env"

settings = Settings()
