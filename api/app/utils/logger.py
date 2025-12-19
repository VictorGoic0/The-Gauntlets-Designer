"""Logging configuration for the application."""
import logging
import sys
import uuid
import time
from pathlib import Path
from contextvars import ContextVar
from typing import Optional

from app.config import settings

# Create logs directory if it doesn't exist
logs_dir = Path(__file__).parent.parent.parent / "logs"
logs_dir.mkdir(exist_ok=True)

# Configure logging format with request ID support
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - [%(request_id)s] - %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

# Context variable for request ID (thread-safe)
request_id_var: ContextVar[Optional[str]] = ContextVar('request_id', default=None)

# Get log level from settings
log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)


class RequestIDFilter(logging.Filter):
    """Filter to add request ID to log records."""
    
    def filter(self, record: logging.LogRecord) -> bool:
        """Add request ID to log record."""
        request_id = request_id_var.get()
        record.request_id = request_id if request_id else "no-request-id"
        return True


def setup_logger(name: str = "app") -> logging.Logger:
    """
    Set up and configure a logger instance.

    Args:
        name: Logger name (default: "app")

    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    logger.setLevel(log_level)

    # Avoid adding handlers multiple times
    if logger.handlers:
        return logger

    # Add request ID filter
    request_id_filter = RequestIDFilter()
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.addFilter(request_id_filter)
    console_formatter = logging.Formatter(LOG_FORMAT, datefmt=DATE_FORMAT)
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)

    # File handler
    log_file = logs_dir / "app.log"
    file_handler = logging.FileHandler(log_file)
    file_handler.setLevel(log_level)
    file_handler.addFilter(request_id_filter)
    file_formatter = logging.Formatter(LOG_FORMAT, datefmt=DATE_FORMAT)
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)

    return logger


def generate_request_id() -> str:
    """Generate a unique request ID."""
    return str(uuid.uuid4())[:8]


def set_request_id(request_id: Optional[str] = None) -> str:
    """
    Set request ID for current context.
    
    Args:
        request_id: Optional request ID (generates one if not provided)
        
    Returns:
        The request ID (newly generated or provided)
    """
    if request_id is None:
        request_id = generate_request_id()
    request_id_var.set(request_id)
    return request_id


def get_request_id() -> Optional[str]:
    """Get current request ID."""
    return request_id_var.get()


class TimingContext:
    """Context manager for timing operations."""
    
    def __init__(self, operation_name: str, logger_instance: Optional[logging.Logger] = None):
        """
        Initialize timing context.
        
        Args:
            operation_name: Name of the operation being timed
            logger_instance: Optional logger instance (uses default if not provided)
        """
        self.operation_name = operation_name
        self.logger = logger_instance or logger
        self.start_time: Optional[float] = None
        self.end_time: Optional[float] = None
    
    def __enter__(self):
        """Start timing."""
        self.start_time = time.time()
        self.logger.debug(f"Starting {self.operation_name}")
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """End timing and log duration."""
        self.end_time = time.time()
        duration = self.end_time - self.start_time if self.start_time else 0
        self.logger.info(
            f"Completed {self.operation_name} in {duration:.3f}s"
        )
        return False
    
    @property
    def duration(self) -> float:
        """Get duration in seconds."""
        if self.start_time is None:
            return 0.0
        end = self.end_time if self.end_time else time.time()
        return end - self.start_time


# Create root logger
logger = setup_logger("app")

