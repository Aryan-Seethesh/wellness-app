from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "wellness_db"
    SECRET_KEY: str = "change-this-secret-key-in-production-must-be-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    AI_API_KEY: str = ""
    AI_API_ENDPOINT: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
