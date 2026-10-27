import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    ENVIRONMENT: str = "development"
    INTERNAL_SERVICE_TOKEN: str = "zeroleak_dev_internal_token_secure_sandbox"
    MAX_UPLOAD_MB: int = 15
    TESSERACT_CMD: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
