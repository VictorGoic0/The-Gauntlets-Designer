# CollabCanvas API — HTTP routes (canonical)

**Base URL (local):** `http://localhost:8000` (or the host/port where Uvicorn runs).  
**OpenAPI:** `GET /docs` (Swagger UI), `GET /redoc` — generated from FastAPI.

All paths below are **relative to the server root** (no global prefix beyond what each router sets).

---

## Authentication

| Mechanism | Where |
|-----------|--------|
| **Firebase ID token** | `Authorization: Bearer <firebase_id_token>` |

Token must come from the client (`firebase.auth().currentUser.getIdToken()`).

Routes that require auth use dependency **`get_current_user_uid`** (`app/middleware/auth.py`). If Firebase Admin is not initialized on the server, protected routes respond with **503** and a string `detail`.

---

## Health

### `GET /api/health`

**Auth:** None.

**Purpose:** Liveness / dependency checks for monitoring.

**Success — `200`**

JSON body:

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `"healthy"` if the process is up |
| `version` | string | API version (e.g. `"1.0.0"`) |
| `openai` | string | `"connected"` or `"disconnected"` |
| `firebase` | string | `"initialized"` or `"not_initialized"` |

**Errors:** Unusual failures may surface as `500` from the framework.

---

## Agent (AI)

Router prefix: **`/api/agent`**. All agent routes require **`Authorization: Bearer <token>`** unless noted.

### `POST /api/agent/chat`

**Auth:** Required (`get_current_user_uid`).

**Rate limits:** Upstash — global then per-user (see `app/services/rate_limit.py`).

**Request body — JSON (`ChatRequest`)**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | Natural language instruction for the canvas agent |
| `model` | string \| null | No | Optional model override (may be ignored by router) |

**Success — `200`**

JSON (`ChatResponse`):

| Field | Type | Description |
|-------|------|-------------|
| `response` | string | Assistant text |
| `actions` | array | Action payloads (often empty; tools may write to Firestore directly) |
| `toolCalls` | number | Count of tool invocations |
| `tokensUsed` | number | Token usage estimate |
| `model` | string | Model identifier used |

**Errors**

| Status | `detail` shape | When |
|--------|------------------|------|
| `400` | `{ "error": string, "detail": string }` | Empty or missing `message` |
| `401` | string or default FastAPI | Invalid / missing Bearer token |
| `429` | `{ "error", "detail", "retryAfter" }` | Rate limit (see `rate_limit.py`) |
| `500` | `{ "error": string, "detail": string }` | Agent or server failure |
| `503` | string | Firebase auth unavailable |

The web client (`webapp/src/services/aiService.js`) expects error JSON where `detail` is an object with a nested `detail` message when using the structured dict form.

---

### `POST /api/agent/chat-stream`

**Auth:** Required.

**Rate limits:** Same as `/chat`.

**Request body:** Same as `ChatRequest` for `/chat`.

**Success — `200`**

**Content-Type:** Server-Sent Events (SSE) via `EventSourceResponse` (`sse-starlette`).

Each SSE event:

- `event`: string — e.g. `tool_start`, `tool_end`, `message`, `complete`, `error`
- `data`: JSON string — payload varies by event type (see `app/agent/orchestrator.py` stream and `webapp/src/services/aiService.js` parsers)

**Errors**

| Status | Notes |
|--------|--------|
| `400` | Same validation as `/chat` |
| `401` / `429` / `503` | Same as `/chat` |
| `500` | Wrapper or stream failure; stream may also emit an `error` event |

---

## Change policy

1. **When you add, remove, or change a route, auth, request/response shape, or status codes — update this file in the same PR.**
2. **Agents:** Read this file before searching `api/app/api/routes/` (see `.cursor/rules/api-routes-reference.mdc`).

---

## Related modules

| Concern | Location |
|---------|----------|
| Route handlers | `api/app/api/routes/agent.py`, `api/app/api/routes/health.py` |
| Auth dependency | `api/app/middleware/auth.py` |
| Pydantic models | `api/app/models/requests.py`, `api/app/models/responses.py` |
| Rate limiting | `api/app/services/rate_limit.py` |
| Agent logic | `api/app/agent/` |
