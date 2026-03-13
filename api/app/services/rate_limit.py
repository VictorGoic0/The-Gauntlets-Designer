"""
Rate limiting for agent endpoints via Upstash Redis.

Per-user: 10 requests / 24h (identifier = uid).
Global: 100 requests / 24h (identifier = "app").
"""
import time

from fastapi import HTTPException, status
from upstash_ratelimit import Ratelimit, FixedWindow
from upstash_redis import Redis

redis = Redis.from_env()

user_limiter = Ratelimit(
    redis=redis,
    limiter=FixedWindow(max_requests=10, window=86400),
    prefix="rate:user:black-canvas",
)

global_limiter = Ratelimit(
    redis=redis,
    limiter=FixedWindow(max_requests=100, window=86400),
    prefix="rate:global:black-canvas",
)


async def check_rate_limits(uid: str) -> None:
    """
    Check per-user and global rate limits.
    Raises HTTP 429 if either limit is exceeded.
    Order: check global first (cheaper), then per-user.
    """
    # Global first
    global_res = global_limiter.limit("app")
    if not global_res.allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "RateLimitExceeded",
                "detail": "App daily request limit reached (100/day).",
                "retryAfter": max(0, int(global_res.reset - time.time())),
            },
        )

    # Per-user
    user_res = user_limiter.limit(uid)
    if not user_res.allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "RateLimitExceeded",
                "detail": "You have reached your daily request limit (10/day).",
                "retryAfter": max(0, int(user_res.reset - time.time())),
            },
        )
