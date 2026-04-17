"""
Rate limiting for agent endpoints via Upstash Redis.

Per-user: 30 requests / 24h (identifier = uid).
Global: 1000 requests / 24h (identifier = "app").

If UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are unset, limits are skipped
(one warning logged) so local dev can run without Redis.
"""
import time

from fastapi import HTTPException, status
from upstash_ratelimit import FixedWindow, Ratelimit
from upstash_redis import Redis

from app.config import settings
from app.utils.logger import logger

_user_limiter: Ratelimit | None = None
_global_limiter: Ratelimit | None = None
_upstash_skip_logged = False


def _ensure_limiters() -> tuple[Ratelimit, Ratelimit] | None:
    """Build Upstash limiters from config once; return None if not configured."""
    global _user_limiter, _global_limiter
    if _user_limiter is not None and _global_limiter is not None:
        return _user_limiter, _global_limiter

    url = (settings.UPSTASH_REDIS_REST_URL or "").strip()
    token = (settings.UPSTASH_REDIS_REST_TOKEN or "").strip()
    if not url or not token:
        return None

    redis = Redis(url=url, token=token)
    _user_limiter = Ratelimit(
        redis=redis,
        limiter=FixedWindow(max_requests=30, window=86400),
        prefix="rate:user:black-canvas",
    )
    _global_limiter = Ratelimit(
        redis=redis,
        limiter=FixedWindow(max_requests=1000, window=86400),
        prefix="rate:global:black-canvas",
    )
    return _user_limiter, _global_limiter


async def check_rate_limits(uid: str) -> None:
    """
    Check per-user and global rate limits.
    Raises HTTP 429 if either limit is exceeded.
    Order: check global first (cheaper), then per-user.
    """
    global _upstash_skip_logged

    lims = _ensure_limiters()
    if lims is None:
        if not _upstash_skip_logged:
            logger.warning(
                "rate_limits_disabled",
                reason="UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN unset",
            )
            _upstash_skip_logged = True
        return

    global_limiter, user_limiter = lims

    global_res = global_limiter.limit("app")
    if not global_res.allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "RateLimitExceeded",
                "detail": "App global daily request limit reached (1000/day).",
                "retryAfter": max(0, int(global_res.reset - time.time())),
            },
        )

    user_res = user_limiter.limit(uid)
    if not user_res.allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "RateLimitExceeded",
                "detail": "You have reached your daily request limit (30/day).",
                "retryAfter": max(0, int(user_res.reset - time.time())),
            },
        )
