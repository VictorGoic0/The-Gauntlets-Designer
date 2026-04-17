"""
Structured logging via structlog.

- Development (default): human-readable console output.
- Production-style: set LOG_JSON=1 or APP_ENV=production for one JSON object per line on stdout.

CURSOR AGENT INSTRUCTION:
Import `logger` from this module only; do not call structlog.configure elsewhere.
Bind per-request fields in middleware; use logger.info("event_name", key=value) for domain logs.
"""

from __future__ import annotations

import logging
import sys
import time
import uuid
from contextvars import ContextVar

import structlog

from app.config import settings

SERVICE_NAME = "collabcanvas-api"

request_id_var: ContextVar[str | None] = ContextVar("request_id", default=None)

_logging_configured = False


def configure_logging() -> None:
    """Configure structlog and the stdlib root logger. Safe to call once at startup."""
    global _logging_configured
    if _logging_configured:
        return

    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    json_logs = settings.LOG_JSON

    shared_processors: list = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
    ]

    structlog.configure(
        processors=shared_processors
        + [
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    renderer = (
        structlog.processors.JSONRenderer()
        if json_logs
        else structlog.dev.ConsoleRenderer()
    )

    formatter = structlog.stdlib.ProcessorFormatter(
        processor=renderer,
        foreign_pre_chain=shared_processors,
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(log_level)

    for name in ("uvicorn", "uvicorn.error", "uvicorn.access", "fastapi"):
        lg = logging.getLogger(name)
        lg.handlers.clear()
        lg.propagate = True
        lg.setLevel(log_level)

    _logging_configured = True


configure_logging()

logger = structlog.get_logger(SERVICE_NAME)


def generate_request_id() -> str:
    """Generate a short request id (8 hex chars)."""
    return str(uuid.uuid4())[:8]


def set_request_id(request_id: str | None = None) -> str:
    """Set request id for this async context and structlog contextvars."""
    if request_id is None:
        request_id = generate_request_id()
    request_id_var.set(request_id)
    structlog.contextvars.bind_contextvars(request_id=request_id)
    return request_id


def get_request_id() -> str | None:
    """Return the current request id, if any."""
    return request_id_var.get()


def ensure_request_id() -> str:
    """Return existing request id from middleware, or create one if missing."""
    existing = get_request_id()
    if existing:
        structlog.contextvars.bind_contextvars(request_id=existing)
        return existing
    return set_request_id()


def clear_request_context() -> None:
    """Clear structlog contextvars and request id (e.g. end of HTTP middleware)."""
    structlog.contextvars.clear_contextvars()
    request_id_var.set(None)


class TimingContext:
    """Context manager that logs duration for an operation."""

    def __init__(self, operation_name: str, logger_instance: object | None = None):
        self.operation_name = operation_name
        self._log = logger_instance or logger
        self.start_time: float | None = None
        self.end_time: float | None = None

    def __enter__(self):
        self.start_time = time.time()
        self._log.debug("timing_start", operation=self.operation_name)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        end = time.time()
        self.end_time = end
        start = self.start_time or end
        duration = end - start
        self._log.info(
            "timing_complete",
            operation=self.operation_name,
            duration_s=round(duration, 3),
        )
        return False

    @property
    def duration(self) -> float:
        if self.start_time is None:
            return 0.0
        end = self.end_time if self.end_time else time.time()
        return end - self.start_time
