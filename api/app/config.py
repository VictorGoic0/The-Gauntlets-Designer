"""
Application configuration — single module for environment variables.

CURSOR AGENT INSTRUCTION:
Do not call os.environ, os.getenv, or load_dotenv outside this file.
Import `settings` from `app.config` wherever configuration values are needed.
"""

from __future__ import annotations

import os
import warnings
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


def _read_str(key: str, default: str = "") -> str:
    """Read a string env var (only gateway to os.environ for string values)."""
    v = os.environ.get(key)
    if v is None:
        return default
    return v


def _read_int(key: str, default: int) -> int:
    raw = _read_str(key, str(default))
    try:
        return int(raw.strip())
    except ValueError:
        return default


def _read_bool_flag(key: str) -> bool:
    return _read_str(key, "").strip().lower() in ("1", "true", "yes")


@dataclass(frozen=True)
class Settings:
    """Immutable settings loaded once at import time."""

    OPENAI_API_KEY: str
    GROK_API_KEY: str
    FIREBASE_CREDENTIALS_PATH: str
    FIREBASE_CREDENTIALS_JSON: str
    UPSTASH_REDIS_REST_URL: str
    UPSTASH_REDIS_REST_TOKEN: str
    REASONING_MODEL: str
    FAST_MODEL: str
    DEFAULT_MODEL: str
    GROK_BASE_URL: str
    ENABLE_RETRY: bool
    MAX_RETRIES: int
    LOG_LEVEL: str
    LOG_JSON: bool
    APP_ENV: str
    PORT: int

    def validate_firebase_credentials(self) -> bool:
        """Validate that Firebase credentials file exists."""
        creds_path = Path(self.FIREBASE_CREDENTIALS_PATH)
        if not creds_path.exists():
            raise FileNotFoundError(
                f"Firebase credentials file not found at: {self.FIREBASE_CREDENTIALS_PATH}"
            )
        return True

    def get_firebase_credentials_path(self) -> str:
        """Absolute path to the Firebase service account JSON file."""
        creds_path = Path(self.FIREBASE_CREDENTIALS_PATH)
        if creds_path.is_absolute():
            return str(creds_path)
        project_root = Path(__file__).parent.parent
        return str(project_root / creds_path)

    @classmethod
    def from_environment(cls) -> Settings:
        _raw_app = _read_str("APP_ENV", "development").strip().lower()
        app_env = _raw_app if _raw_app else "development"
        log_json = _read_bool_flag("LOG_JSON") or app_env == "production"
        fast_model = "grok-4-1-fast-non-reasoning"
        return cls(
            OPENAI_API_KEY=_read_str("OPENAI_API_KEY", ""),
            GROK_API_KEY=_read_str("GROK_API_KEY", ""),
            FIREBASE_CREDENTIALS_PATH=_read_str(
                "FIREBASE_CREDENTIALS_PATH", "./serviceAccountKey.json"
            ),
            FIREBASE_CREDENTIALS_JSON=_read_str("FIREBASE_CREDENTIALS_JSON", ""),
            UPSTASH_REDIS_REST_URL=_read_str("UPSTASH_REDIS_REST_URL", ""),
            UPSTASH_REDIS_REST_TOKEN=_read_str("UPSTASH_REDIS_REST_TOKEN", ""),
            REASONING_MODEL="gpt-5-mini-2025-08-07",
            FAST_MODEL=fast_model,
            DEFAULT_MODEL=fast_model,
            GROK_BASE_URL="https://api.x.ai/v1",
            ENABLE_RETRY=True,
            MAX_RETRIES=3,
            LOG_LEVEL=_read_str("LOG_LEVEL", "INFO"),
            LOG_JSON=log_json,
            APP_ENV=app_env,
            PORT=_read_int("PORT", 8000),
        )


settings = Settings.from_environment()

if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "your_key_here":
    warnings.warn(
        "OPENAI_API_KEY must be set in environment variables or .env file",
        UserWarning,
        stacklevel=2,
    )

if not settings.GROK_API_KEY or settings.GROK_API_KEY == "your_key_here":
    warnings.warn(
        "GROK_API_KEY must be set in environment variables or .env file",
        UserWarning,
        stacklevel=2,
    )

try:
    settings.validate_firebase_credentials()
except FileNotFoundError as e:
    warnings.warn(
        f"Firebase credentials validation: {e}", UserWarning, stacklevel=2
    )
