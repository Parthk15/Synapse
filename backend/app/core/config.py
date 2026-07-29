import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "Synapse AI Research Workspace"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql+psycopg://postgres:1531@localhost:5432/synapse"
    )
    
    # JWT
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "synapse_secret_key_change_in_production_321987")
    JWT_REFRESH_SECRET_KEY: str = os.getenv("JWT_REFRESH_SECRET_KEY", "synapse_refresh_secret_key_change_in_production_987321")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Storage
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    
    # AI / Embeddings
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", None)
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2") # Local fallback or OpenAI text-embedding-3-small
    EMBEDDING_DIM: int = 384  # Default 384 for all-MiniLM-L6-v2 (1536 for OpenAI small)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()