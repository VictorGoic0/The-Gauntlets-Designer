"""
CURSOR AGENT INSTRUCTION:
Apply `check_rate_limit` (or the FastAPI dependency `RateLimitDep`) to every
route that calls an AI provider (OpenAI, Grok, Anthropic).

Three limiters run in order on every request:
  1. Burst guard    — 10 req / 10 min per user  (sliding window)
  2. Per-user       — 30 req / 24 h per user     (fixed window)
  3. Per-app global — 1000 req / 24 h            (fixed window)

Order: global → burst → per-user.
Global is checked first so a saturated app fails fast before hitting Redis
for user-level keys.

Redis key structure (upstash-ratelimit appends the identifier after the prefix):
  rate:global:{PROJECT_SLUG}          — single key, all users share it
  rate:burst:{PROJECT_SLUG}:{uid}     — one key per user
  rate:user:{PROJECT_SLUG}:{uid}      — one key per user

Set PROJECT_SLUG to a short unique kebab-case name for this app,
e.g. 'recipe-gen', 'portfolio-chat'. It must be unique across your portfolio
so per-app counters don't collide in the shared Redis instance.

Dependencies:
  pip install upstash-redis upstash-ratelimit

For FastAPI auth, this file assumes a `verify_firebase_token` dependency that
returns a decoded token dict with at minimum a 'uid' key. Swap in your own
auth dependency if you use a different provider.
"""

import math
import time
from typing import Annotated

from fastapi import Depends, HTTPException, Request
from upstash_ratelimit import FixedWindow, Ratelimit, SlidingWindow
from upstash_redis import Redis

from config import config  # your centralised config module — never import os.environ directly

# ─── Config ───────────────────────────────────────────────────────────────────

PROJECT_SLUG = "REPLACE_ME"  # e.g. "recipe-gen" — must be unique across your portfolio

RATE_LIMIT_BURST_REQUESTS = 10
RATE_LIMIT_BURST_WINDOW = "600s"  # 10 minutes in seconds for upstash-ratelimit

RATE_LIMIT_USER_PER_DAY = 30
RATE_LIMIT_GLOBAL_PER_DAY = 1000

# ─── Redis client ─────────────────────────────────────────────────────────────

redis = Redis(
    url=config.upstash_redis_url,
    token=config.upstash_redis_token,
)

# ─── Limiters ─────────────────────────────────────────────────────────────────

global_limiter = Ratelimit(
    redis=redis,
    limiter=FixedWindow(max_requests=RATE_LIMIT_GLOBAL_PER_DAY, window="86400s"),  # 24h
    prefix=f"rate:global:{PROJECT_SLUG}",
)

burst_limiter = Ratelimit(
    redis=redis,
    limiter=SlidingWindow(max_requests=RATE_LIMIT_BURST_REQUESTS, window=RATE_LIMIT_BURST_WINDOW),
    prefix=f"rate:burst:{PROJECT_SLUG}",
)

user_limiter = Ratelimit(
    redis=redis,
    limiter=FixedWindow(max_requests=RATE_LIMIT_USER_PER_DAY, window="86400s"),  # 24h
    prefix=f"rate:user:{PROJECT_SLUG}",
)

# ─── Helpers ──────────────────────────────────────────────────────────────────

def _retry_after_seconds(reset_ms: int) -> int:
    """Convert a Unix-ms reset timestamp to whole seconds from now."""
    return max(0, math.ceil((reset_ms - time.time() * 1000) / 1000))


def _rate_limit_error(detail: str, retry_after: int) -> HTTPException:
    return HTTPException(
        status_code=429,
        detail={
            "error": "RateLimitExceeded",
            "detail": detail,
            "retryAfter": retry_after,
        },
        headers={"Retry-After": str(retry_after)},
    )

# ─── Core check ───────────────────────────────────────────────────────────────

async def check_rate_limit(uid: str) -> None:
    """
    Runs all three rate limit checks for a given uid.
    Raises HTTP 429 if any limit is exceeded.
    Call order: global → burst → per-user.
    """
    global_res = global_limiter.limit("app")
    if not global_res.allowed:
        raise _rate_limit_error(
            f"This app has reached its daily request limit ({RATE_LIMIT_GLOBAL_PER_DAY}/day). "
            "Try again tomorrow.",
            _retry_after_seconds(global_res.reset),
        )

    burst_res = burst_limiter.limit(uid)
    if not burst_res.allowed:
        raise _rate_limit_error(
            "Too many requests in a short period. Please wait a moment before trying again.",
            _retry_after_seconds(burst_res.reset),
        )

    user_res = user_limiter.limit(uid)
    if not user_res.allowed:
        raise _rate_limit_error(
            f"You have reached your daily request limit ({RATE_LIMIT_USER_PER_DAY}/day). "
            "Try again tomorrow.",
            _retry_after_seconds(user_res.reset),
        )

# ─── FastAPI dependency ───────────────────────────────────────────────────────

async def rate_limit_dep(
    request: Request,
    # Swap this import for your actual auth dependency:
    token: Annotated[dict, Depends("verify_firebase_token")],
) -> None:
    """
    FastAPI dependency that enforces all three rate limits.
    Requires a prior auth dependency that returns a dict with a 'uid' key.

    Usage:
        @router.post("/generate", dependencies=[Depends(rate_limit_dep)])
        async def generate_handler(request: Request): ...

    Or if you need the uid downstream:
        @router.post("/generate")
        async def generate_handler(
            request: Request,
            _: Annotated[None, Depends(rate_limit_dep)],
            user: Annotated[dict, Depends(verify_firebase_token)],
        ): ...
    """
    uid: str | None = token.get("uid")
    if not uid:
        raise HTTPException(status_code=401, detail="Unauthorized: no uid in token.")
    await check_rate_limit(uid)


# Type alias for cleaner route signatures
RateLimitDep = Annotated[None, Depends(rate_limit_dep)]
