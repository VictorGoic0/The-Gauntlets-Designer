"""ASGI middleware: one structured log line per HTTP request + request correlation."""

import time
import uuid

import structlog
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.utils.logger import (
    SERVICE_NAME,
    clear_request_context,
    logger,
    set_request_id,
)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Binds request_id (from X-Request-ID or generated), logs method/path/status/duration,
    and echoes X-Request-ID on the response.
    """

    async def dispatch(self, request: Request, call_next):
        raw = request.headers.get("X-Request-ID")
        request_id = (raw.strip() if raw else None) or str(uuid.uuid4())[:8]

        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            request_id=request_id,
            service=SERVICE_NAME,
            http_method=request.method,
            http_path=request.url.path,
        )
        set_request_id(request_id)

        start = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            logger.exception(
                "http_request",
                duration_ms=duration_ms,
                status_code=500,
            )
            raise
        else:
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            logger.info(
                "http_request",
                duration_ms=duration_ms,
                status_code=response.status_code,
            )
            response.headers["X-Request-ID"] = request_id
            return response
        finally:
            clear_request_context()
