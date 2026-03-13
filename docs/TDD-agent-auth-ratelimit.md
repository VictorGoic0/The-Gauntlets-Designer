# TDD: Agent Auth & Rate Limiting

**Project**: black-canvas  
**Date**: March 2026  
**Scope**: `api/app/` — FastAPI agent backend

---

## Overview

We are migrating the AI agent from expired fellowship-provided OpenAI keys to our own keys, adding dual-model routing (fast vs. reasoning), securing the agent endpoint with Firebase auth, and gating requests with per-user and global rate limits via Upstash Redis.

---

## Part 1: Dual-Model Routing — ✅ COMPLETE

### Goal
Route each agent request to the cheapest model that can handle it. Default to fast/cheap; upgrade to reasoning only when the prompt requires compositional UI layout decisions.

### Models
| Tier | Provider | Model | Use case |
|------|----------|-------|----------|
| `fast` | xAI (Grok) | `grok-4-1-fast-non-reasoning` | Simple/repetitive shape requests |
| `reasoning` | OpenAI | `gpt-5-mini-2025-08-07` | Compositional UI patterns |

**Default**: `fast` — err on the side of cost.

### Environment Variables Added
```env
OPENAI_API_KEY=sk-...        # for gpt-5-mini reasoning model
GROK_API_KEY=xai-...         # for Grok fast model
```

### Files Implemented

#### `api/app/config.py`
- Added `GROK_API_KEY` from env
- Added `REASONING_MODEL = "gpt-5-mini-2025-08-07"`
- Added `FAST_MODEL = "grok-4-1-fast-non-reasoning"`
- Added `DEFAULT_MODEL = FAST_MODEL` (alias, used by `main.py` logging)
- Added `GROK_BASE_URL = "https://api.x.ai/v1"`

#### `api/app/agent/model_router.py` (new)
- `classify_complexity(message: str) -> Literal["fast", "reasoning"]`
  - Checks message against `_REASONING_KEYWORDS` frozenset (form, login, dashboard, modal, etc.)
  - Falls back to primitive-shape regex check (`r"\b(\d+)\s+(squares?|rectangles?|...)\b"`)
  - Default: `"fast"`
- `get_model_client(tier) -> Tuple[OpenAI, str]`
  - Returns OpenAI-compatible client + model name
  - Grok uses same OpenAI SDK with `base_url=GROK_BASE_URL`
- `route(message) -> Tuple[OpenAI, str, ModelTier]`
  - Convenience wrapper: classify + get client in one call

#### `api/app/agent/orchestrator.py`
- `_build_agent(tier)` — builds a `ChatOpenAI`-backed LangChain agent per tier
- `_AGENT_CACHE: Dict[ModelTier, Any]` — module-level cache, one agent per tier
- `CanvasAgent.__init__` — eagerly warms both tier agents at startup
- `process_message(user_message)` — calls `route()`, picks cached agent, returns `tier` in response
- `stream_message(user_message)` — same routing, emits `tier` + `model` in `complete` event
- Removed `model` parameter from both methods (routing is internal)

#### `api/app/api/routes/agent.py`
- Removed `model_key` validation and `model=` passing from both `/chat` and `/chat-stream`
- Removed `validate_model` / `AVAILABLE_MODELS` imports (no longer relevant)

---

## Part 2: Firebase Auth on Agent Endpoint — ✅ COMPLETE

### Goal
Verify that the caller is a legitimate authenticated user before processing any agent request. Identity is extracted from a Firebase ID token sent by the frontend — this token is unforgeable and ties directly to a Firebase UID which we'll use as the rate limit key.

### How it works
1. Frontend sends `Authorization: Bearer <Firebase ID token>` header with every agent request
2. Backend calls `firebase_admin.auth.verify_id_token(token)` — we already have Firebase Admin initialized
3. Decoded token contains `uid` (e.g. `"abc123"`) — this is the canonical user identity
4. `uid` is passed downstream to the rate limiter
5. If no token or invalid token → `401 Unauthorized`

### Files to Create/Modify

#### `api/app/middleware/auth.py` (new)
```python
# FastAPI dependency — inject into route handlers
async def get_current_user(authorization: str = Header(...)) -> str:
    """
    Verify Firebase ID token from Authorization header.
    Returns verified uid or raises 401.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing or invalid Authorization header")
    token = authorization.removeprefix("Bearer ").strip()
    try:
        decoded = firebase_admin.auth.verify_id_token(token)
        return decoded["uid"]
    except firebase_admin.auth.InvalidIdTokenError:
        raise HTTPException(401, "Invalid or expired Firebase token")
    except firebase_admin.auth.ExpiredIdTokenError:
        raise HTTPException(401, "Firebase token has expired")
```

#### `api/app/api/routes/agent.py`
- Add `uid: str = Depends(get_current_user)` to both `chat` and `chat_stream` route handlers
- Pass `uid` to rate limit check (Part 3)
- Log `uid` alongside `request_id` in existing log lines

### Frontend Contract
The frontend must send:
```
Authorization: Bearer <token>
```
Where `<token>` is obtained from:
```js
const token = await firebase.auth().currentUser.getIdToken();
```
Firebase ID tokens expire after 1 hour — the frontend should refresh before sending.

---

## Part 3: Rate Limiting — ✅ COMPLETE

### Goal
Prevent abuse. Rate limits apply at the **endpoint level** — one agent call counts as one request regardless of how many tool steps or LLM calls it triggers internally.

### Limits
| Scope | Limit | Window | Redis key pattern |
|-------|-------|--------|-------------------|
| Per user | 10 requests | 24 hours | `rate:user:black-canvas:{uid}` |
| Global | 100 requests | 24 hours | `rate:global:black-canvas` |

### Dependencies to Install
```bash
pip install upstash-redis upstash-ratelimit
```
Add to `requirements.txt`.

### Environment Variables Required
Already present in `.env`:
```env
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```
`Redis.from_env()` auto-reads these — no config changes needed.

### Files to Create/Modify

#### `api/app/services/rate_limit.py` (new)
```python
from upstash_redis import Redis
from upstash_ratelimit import Ratelimit, FixedWindow

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
```

#### `api/app/api/routes/agent.py`
- After auth dependency resolves `uid`, call `await check_rate_limits(uid)`
- On `429` from either limiter, return:
  ```json
  {
    "error": "RateLimitExceeded",
    "detail": "You have reached your daily request limit (10/day).",
    "retryAfter": <seconds until window resets>
  }
  ```
- Include `X-RateLimit-Remaining` and `X-RateLimit-Reset` headers in successful responses (nice to have)

### Ordering in Request Handler
```
1. verify Firebase token         → uid        (401 if invalid)
2. check global rate limit       → pass/fail  (429 if exceeded)
3. check per-user rate limit     → pass/fail  (429 if exceeded)
4. process agent request         → response
```
Global is checked first so a single bad actor doesn't starve the global pool before we catch them per-user.

---

## Implementation Order

| Step | Description | Status |
|------|-------------|--------|
| 1 | Dual-model routing (`model_router.py`, `orchestrator.py`) | ✅ Done |
| 2 | Add env vars (`OPENAI_API_KEY`, `GROK_API_KEY`) | ✅ Done |
| 3 | Firebase auth middleware (`auth.py`) | ✅ Done |
| 4 | Wire auth `Depends` into both agent routes | ✅ Done |
| 5 | `pip install upstash-redis upstash-ratelimit`, update `requirements.txt` | ✅ Done |
| 6 | Rate limit service (`rate_limit.py`) | ✅ Done |
| 7 | Wire rate limit checks into both agent routes | ✅ Done |
| 8 | Frontend: send `Authorization` header with Firebase token | ✅ Done |

---

## Open Questions

- **Token refresh**: Frontend should proactively refresh tokens before they expire. Does the existing frontend auth flow handle `getIdToken(/* forceRefresh */ true)` on 401s?
- **Rate limit headers**: Do we want `X-RateLimit-Remaining` / `X-RateLimit-Reset` headers in responses for frontend UX (e.g. showing a "X requests remaining today" counter)?
- **Limit values**: 10/user/day and 100/global/day are starting points for local dev. These should be revisited before production.
