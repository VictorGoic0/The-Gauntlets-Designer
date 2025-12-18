"""Configuration management for the FastAPI application."""
import os
import warnings
from pathlib import Path

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings:
    """Application settings loaded from environment variables."""

    def __init__(self):
        """Initialize settings from environment variables."""
        # Required environment variables (with defaults for development)
        self.OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
        self.FIREBASE_CREDENTIALS_PATH: str = os.getenv(
            "FIREBASE_CREDENTIALS_PATH", "./serviceAccountKey.json"
        )

        # Hardcoded for testing (as per requirements)
        self.DEFAULT_MODEL: str = "gpt-4-turbo"
        self.ENABLE_RETRY: bool = True
        self.MAX_RETRIES: int = 3
        self.LOG_LEVEL: str = "INFO"

    def validate_firebase_credentials(self) -> bool:
        """Validate that Firebase credentials file exists."""
        creds_path = Path(self.FIREBASE_CREDENTIALS_PATH)
        if not creds_path.exists():
            raise FileNotFoundError(
                f"Firebase credentials file not found at: {self.FIREBASE_CREDENTIALS_PATH}"
            )
        return True

    def get_firebase_credentials_path(self) -> str:
        """Get absolute path to Firebase credentials file."""
        creds_path = Path(self.FIREBASE_CREDENTIALS_PATH)
        if creds_path.is_absolute():
            return str(creds_path)
        # Resolve relative to project root (backend/)
        project_root = Path(__file__).parent.parent
        return str(project_root / creds_path)


# Global settings instance
settings = Settings()

# Validate required settings (warn if missing, but don't crash on import)
if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "your_key_here":
    warnings.warn(
        "OPENAI_API_KEY must be set in environment variables or .env file",
        UserWarning
    )

# Validate Firebase credentials (warn if not found, but don't crash)
try:
    settings.validate_firebase_credentials()
except FileNotFoundError as e:
    warnings.warn(f"Firebase credentials validation: {e}", UserWarning)

