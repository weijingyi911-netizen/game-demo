from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache


class Settings(BaseSettings):
    APP_NAME: str = "AI Business Decision System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    DATABASE_URL: str = "sqlite+aiosqlite:///./business_ai.db"
    REDIS_URL: str = "redis://localhost:6379"
    
    JWT_SECRET: str = "your-super-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440
    
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4"
    
    QWEN_API_KEY: Optional[str] = None
    QWEN_MODEL: str = "qwen-max"
    
    ERNIE_API_KEY: Optional[str] = None
    ERNIE_SECRET_KEY: Optional[str] = None
    
    LLM_DEFAULT_PROVIDER: str = "openai"
    LLM_TEMPERATURE: float = 0.7
    LLM_MAX_TOKENS: int = 2000
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
