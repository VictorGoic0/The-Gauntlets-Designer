# Refactor Runbook

> **How to use this runbook**
> Copy `/runbook-docs/` and this file into the project root before starting. Work through phases in order — each phase builds on the last. Feed this file to your Cursor agent at the start of each session and instruct it to execute one phase at a time. Do not proceed to the next phase until the current one is complete and verified.

---

## Project Overview

**CollabCanvas** is a collaborative drawing canvas (Konva/React) with Firebase (Auth, Firestore, Realtime DB) and a **FastAPI** backend for the AI agent (LangChain + OpenAI, SSE).

**Stack:** React 19 (Vite) + Python FastAPI + Firebase + LangChain/OpenAI  
**Monorepo:** Yes (`webapp/`, `api/`)  
**Has Docker already:** No dedicated `infra/` compose in-repo yet (Phase 3 optional)  
**Client-facing repo:** Portfolio-style app (treat AI keys / rate limits per runbook portfolio notes if applicable)

### Refactor progress (checkpoint)

| Phase | Status |
|-------|--------|
| 1 — Linting | **Done** |
| 2 — Cursor rules + React webapp alignment | **Done** |
| 3 — Structured logging | **Done** _(structlog; no Loki/Grafana)_ |
| 4 — Environment config module | **Next** |
| 5 — Portfolio: AI keys + rate limiter | Optional |

---

## Definition of Done

This project is considered refactored when:

- [x] Linter passes with zero errors on both `/api` and `/webapp` (if present)
- [x] All Cursor rules are in place _(Phase 2 complete: `react-readability.mdc` verbatim from runbook; `react-patterns.mdc` leaves `[IMMUTABLE — DO NOT MODIFY]` unchanged and only `[PROJECT — CUSTOMIZE]` edited). **Manual check:** agent responses end with a Darth Vader quote (`darth-vadar-quote-signoff.mdc`) once Cursor has indexed `.cursor/rules/`_
- [x] Structured logging is in place per Phase 3 (Node: `pino` + `pino-http`; **this repo:** FastAPI + **`structlog`** — console in dev, JSON when `LOG_JSON=1` or `APP_ENV=production`); every HTTP request produces a structured log entry (`http_request` via middleware)
- [x] Local logs are visible: **readable terminal output** (structlog `ConsoleRenderer` in dev). **Not used:** Grafana/Loki (explicit project choice)
- [ ] No `process.env` (Node) or `os.environ` (Python) accessed outside the config module
- [ ] All top-level folders match the standard structure below
- [ ] README reflects current state of the project
- [ ] _(Portfolio only)_ AI provider keys are personal keys, not institutional ones
- [ ] _(Portfolio only)_ Upstash rate limiter is in place with per-project and global limits

---

## Standard File Structure

The following top-level structure is **required**. If the project deviates, restructuring is the first step of Phase 1 before any other work begins.

```
/
├── REFACTOR_RUNBOOK.md         ← this file (do not move)
├── README.md                   ← do not move
├── .env.example                ← do not move
├── .gitignore                  ← do not move
├── .cursor/
│   └── rules/                  ← all Cursor rules live here
├── runbook-docs/
│   ├── oxlint/
│   │   ├── api.oxlintrc.json
│   │   └── webapp.oxlintrc.json
│   ├── infra/                  ← optional Loki stack: docker-compose.loki.yaml + observability/ (Phase 3)
│   ├── project-rules/
│   │   ├── linting.mdc
│   │   ├── darth-vadar-quote-signoff.mdc
│   │   ├── one-pr-at-a-time.mdc
│   │   ├── react-readability.mdc      ← verbatim; see Phase 2
│   │   ├── react-patterns.mdc         ← customize only [PROJECT] sections; see Phase 2
│   │   ├── api-routes-reference.mdc   ← optional; see Phase 2
│   │   └── api-patterns.mdc
│   └── portfolio/                      ← optional, portfolio projects only
│       └── ai-rate-limiter.ts          ← Upstash rate limiter reference impl
├── api/                        ← Express or Python backend (rename if needed)
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── config/
│   │   └── lib/
│   └── ...
├── webapp/                     ← React frontend (rename if needed)
│   └── src/
│       └── ...
├── mobile-app/                 ← React Native, if present
│   └── ...
└── infra/                      ← Docker, Compose, Loki/Promtail/Grafana (observability), deployment scripts
    ├── docker-compose.loki.yaml  ← optional; Phase 3 / copy from runbook-docs/infra/
    ├── observability/            ← Loki, Promtail, Grafana provisioning (runbook-docs/infra/observability/)
    └── ...
```

### Do not move
`README.md`, `.env.example`, `.gitignore`, `.cursor/`, `REFACTOR_RUNBOOK.md`

### Disambiguation rules
- `docker-compose.yml` and the optional Loki stack file (`docker-compose.loki.yaml`) live in `/infra/`, not at root
- Shared TypeScript types (if monorepo) live in `/shared/` or `/packages/` — pick one and document it in the Project Overview above
- `.env.example` stays at root; the actual `.env` files can mirror this per-workspace if needed

---

## Pre-flight Checklist

Before starting any phase:

- [ ] Confirm the top-level structure matches the standard above, or rename/move folders now _(partial: `api/` + `webapp/` present; full `infra/` layout optional until Phase 3)_
- [x] Confirm `runbook-docs/` has been copied into the project root
- [x] Confirm `.cursor/rules/` exists (create it if not)
- [ ] Confirm you are on a clean git branch named `refactor/standards` _(use your active refactor branch if different)_
- [ ] Note the current Node/Python version in use: ___________

---

## Phase 1 — Linting

**Goal:** Zero linter errors. The linter should be the first guardrail that runs after every agent change.

### 1a. Copy config files

Copy the relevant config(s) from `runbook-docs/oxlint/` into the correct workspace root:

- `api.oxlintrc.json` → `api/.oxlintrc.json`
- `webapp.oxlintrc.json` → `webapp/.oxlintrc.json`

Reference files: `runbook-docs/oxlint/api.oxlintrc.json`, `runbook-docs/oxlint/webapp.oxlintrc.json`

> **Node/Express note:** The `api.oxlintrc.json` includes the `no-process-env` rule. This will immediately flag all raw `process.env` access. Do **not** fix these now — they will be resolved in Phase 4 when the config module is in place.

> **Python note:** Use Ruff instead of oxlint. Add a `ruff.toml` or `[tool.ruff]` section in `pyproject.toml`. For `os.environ` enforcement, add a Bandit check or a pre-commit grep hook — Ruff does not have a direct equivalent to `no-process-env`.

### 1b. Add lint scripts

Add the following to the relevant `package.json`(s):

```json
"scripts": {
  "lint": "oxlint .",
  "lint:fix": "oxlint --fix --fix-suggestions --fix-dangerously"
}
```

For Python, add to `Makefile` or `pyproject.toml`:

```
lint: ruff check .
lint:fix: ruff check --fix .
```

### 1c. Run and triage

```bash
# Node
npm run lint

# Python
ruff check .
```

Fix all errors **except** `no-process-env` violations — those are deferred to Phase 4. Commit with message: `refactor: phase 1 — linting setup`.

### 1d. Verification

- [x] `npm run lint` (or `ruff check .`) exits with 0 errors (excluding `no-process-env` if Phase 4 is pending)
- [x] Scripts are present in `package.json` / `Makefile`

---

## Phase 2 — Cursor Rules

**Goal:** All project rules are active and the agent is demonstrably using them (Darth Vader sign-offs confirm this).

### 2a. Copy rules (shared)

Copy these from `runbook-docs/project-rules/` into `.cursor/rules/`:

```
.cursor/rules/linting.mdc
.cursor/rules/darth-vadar-quote-signoff.mdc
.cursor/rules/one-pr-at-a-time.mdc
.cursor/rules/api-patterns.mdc         ← skip if no backend
```

**Optional — API routes doc discipline:** If this project keeps a **canonical markdown file** for HTTP routes (paths, request/response shapes, auth), copy `runbook-docs/project-rules/api-routes-reference.mdc` → `.cursor/rules/api-routes-reference.mdc`. The template assumes that file lives at `docs/api-routes.md` and is **`alwaysApply: true`** so the agent checks the doc before spelunking the codebase. If your routes doc lives elsewhere (e.g. `documentation/api.md`), **edit the rule** to point at that path — this is expected customization, not a verbatim copy. Skip this file if you do not maintain such a doc.

Reference: `runbook-docs/project-rules/*.mdc`

### 2b. React frontend — `react-readability.mdc` (verbatim only)

**If the project has no React frontend, skip 2b and 2c entirely.**

1. Copy `runbook-docs/project-rules/react-readability.mdc` → `.cursor/rules/react-readability.mdc`.
2. **Do not modify this file.** Same wording, same structure, same frontmatter, same sections — character-for-character as the runbook source. No “small tweaks,” no path substitutions, no merging with other rules.
3. **Agents:** Treat `react-readability.mdc` as read-only after copy. If something in the project appears to conflict with it, flag that to the human; do not edit the rule to match the codebase.

To verify: `diff runbook-docs/project-rules/react-readability.mdc .cursor/rules/react-readability.mdc` should produce **no output** (or only newline/encoding differences if your OS normalizes line endings).

### 2c. React frontend — `react-patterns.mdc` (immutable blocks + project customization)

**Skip if no React frontend.**

1. Copy `runbook-docs/project-rules/react-patterns.mdc` → `.cursor/rules/react-patterns.mdc`.
2. **Never edit** any section labeled **`[IMMUTABLE — DO NOT MODIFY]`** in the file body. That block includes **all useEffect rules** and their examples — those bullets and code samples stay exactly as shipped.
3. **Must edit** every section labeled **`[PROJECT — CUSTOMIZE]`** so they describe **this** repo: real paths (`webapp/src`, `apps/web`, …), where pages/components/hooks/utils live, the `globs:` line in the YAML frontmatter if your `.tsx` files are not under `webapp/src/`, and example entity names if you replace the sample `Students`-style names.
4. **Do not** move immutable content into project sections or vice versa. **Do not** “summarize” or shorten the useEffect section.

If you are unsure whether a line is immutable or project-specific, default to **leave it unchanged** and ask a human — do not guess by rewriting the rule.

### 2d. Review and customise (non-React rules)

For **`api-patterns.mdc`**: open the file and adjust project-specific references (route, service, middleware paths, naming). Replace the **`PROJECT_NAME_HERE`** placeholder in the frontmatter `description` and in the logging `service` example with this project’s name / slug.

For **`api-routes-reference.mdc`** (if copied): ensure the paths inside the rule match where the routes documentation actually lives.

**Do not** apply the old “edit every rule for project fit” habit to **`react-readability.mdc`** (forbidden) or to **`[IMMUTABLE]`** portions of **`react-patterns.mdc`** (forbidden).

### 2e. Verify rule injection

Send the agent a trivial task (e.g. "add a comment to `README.md`"). Confirm the response ends with a Darth Vader quote. If it does not, the rules are not being picked up — check that the `.mdc` files are in `.cursor/rules/` and that Cursor has indexed them.

### 2f. Verification

- [ ] Agent responses end with a Darth Vader quote _(confirm in a fresh agent chat; rules are installed)_
- [ ] Agent refuses to implement more than one PR worth of changes without explicit instruction _(confirm in chat)_
- [x] All required rule files are present in `.cursor/rules/` (including both React files when a frontend exists; **`api-routes-reference.mdc`** + canonical **`docs/api-routes.md`**)
- [x] **`react-readability.mdc`** is byte-identical to `runbook-docs/project-rules/react-readability.mdc` (when frontend exists)
- [x] **`react-patterns.mdc`**: `[IMMUTABLE — DO NOT MODIFY]` sections still match the runbook source; only `[PROJECT — CUSTOMIZE]` sections were edited (when frontend exists)

### 2g. Codebase alignment (React frontend)

After rules are installed, apply them across the webapp (without editing the rule files):

- [x] **`react-patterns.mdc`**: Full webapp pass (handlers, effects, keyboard shortcuts, etc.). Config files under `webapp/` excluded from mechanical edits.
- [x] **`react-readability.mdc`**: Full webapp pass (named handlers in JSX, `previous*` in `setState` updaters, `props` destructuring, etc.). Config files and `webapp/src/components/icons/` (SVGs) excluded.

**Verify:** `cd webapp && npm run lint` exits with 0 errors.

---

## Phase 3 — Structured logging (Pino)

**Goal:** Every HTTP request produces a structured Pino log entry.

For **Express** (and similar HTTP servers), use **`pino` together with `pino-http`**: `pino` is the logger; `pino-http` middleware binds a child logger per request and records method, URL, status, and duration automatically (see 3c). Do not rely on `pino` alone for request-level visibility.

**Pick one local logging path** — you do **not** need Pino Pretty and Grafana/Loki at the same time, and you do **not** have to start with Loki. Match the choice to the project’s phase and what you want to optimize for:

| Path | Best when |
|------|-----------|
| **Pino Pretty** (terminal) | You want the fastest feedback: colored, human-readable logs in the dev console. Fine for early refactors and smaller APIs. |
| **Grafana + Loki** (local stack) | You want queryable logs, labels, and Grafana Explore — closer to production-style observability. More moving parts (Docker, Promtail, file sink). |

Production should always emit **JSON** (stdout for hosts like Railway, or your platform’s log collector). Only the **local dev** transport differs between the two paths above.

> **Node/Express:** examples below use Pino. **Python:** substitute with `structlog` (JSON output); the Docker stack under `runbook-docs/infra/` is the same for Loki/Grafana.

### 3a. Install dependencies

```bash
# In /api — pino-http is required with pino for automatic per-request HTTP logging
npm install pino pino-http
npm install --save-dev pino-pretty
```

`pino-pretty` is dev-only formatting. **`pino-http` is a runtime dependency** whenever you serve HTTP with Express: install it alongside `pino`, not as an optional add-on.

For the **Grafana/Loki** path you also use Pino’s built-in file transport (`pino/file`) — no extra package beyond the above.

### 3b. Create the logger module — choose **one** style

Create `api/src/lib/logger.ts` (or `logger.js`). In every case:

- Export a single Pino instance (or a factory used once).
- Include a **CURSOR AGENT INSTRUCTION** (or equivalent) comment: always import `logger` from this module; never call `pino()` elsewhere; use `logger.info` / `warn` / `error` / `debug`; HTTP logging via `pino-http` in `app.ts`.

#### Option A — Pino Pretty (development console)

Use `pino-pretty` in development so logs are readable in the terminal. Output plain JSON in production (no Pretty transport).

Document the **log shape**, **levels**, and **PII rules** in file-level comments so the agent and humans stay consistent — for example:

```ts
import pino from "pino";

const isDev = true;
// const isDev = process.env["NODE_ENV"] !== "production"; enable pino-pretty for prod until gmail ingestion is stable

/**
 * Global structured logger. Import `logger` everywhere under `api/` — never use console.*.
 *
 * Log shape (every line):
 *   time        ISO 8601 timestamp (pino built-in)
 *   level       info | warn | error | debug
 *   service     constant; useful for filtering in log aggregators (Loki/Grafana)
 *   msg         Human-readable event name
 *   ...context  Spread domain fields alongside the message — see convention in api-patterns.mdc
 *
 * Levels:
 *   debug  — dev-only fine-grained internals (activate with LOG_LEVEL=debug)
 *   info   — normal operational events
 *   warn   — degraded but non-fatal
 *   error  — failures requiring attention
 *
 * PII rules (enforced by convention — the logger does not scrub automatically):
 *   ✗  Never log email addresses in full — use masked form if needed
 *   ✗  Never log message body, subject, or sensitive content
 *   ✗  Never log Authorization headers, tokens, or secret env fragments
 *   ✓  OK to log: user ids, request ids, message ids, durations
 */
const logger = pino({
  level: process.env["LOG_LEVEL"] ?? (isDev ? "debug" : "info"),
  base: { service: "your-api-service-name" },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(isDev && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:HH:MM:ss",
        ignore: "pid,hostname,service",
      },
    },
  }),
});

export default logger;
```

Adjust `service`, env detection, and the `isDev` comment to match the project.

#### Option B — Grafana + Loki (JSON file locally, JSON stdout in production)

Use this when you want Promtail to tail a log file into Loki and view logs in Grafana. **Reference implementation** lives in the runbook bundle:

- **`runbook-docs/infra/docker-compose.loki.yaml`** — Loki, Promtail, Grafana (and ports).
- **`runbook-docs/infra/observability/`** — infra-side configs: `loki-config.yml`, `promtail-config.yml`, Grafana datasource provisioning under `observability/grafana/provisioning/`. Treat this folder as **infra + observability within infra**: copy or merge into your project’s `infra/` and align paths.

Typical pattern: **production** → JSON to stdout for the host; **non-production** → append JSON lines to a file (e.g. `api/logs/dev.log` or a path you mount into Promtail). Keep comments explicit so anyone knows how to run the stack:

```ts
import pino from "pino";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const isProduction = process.env["NODE_ENV"] === "production";
const level = isProduction ? "info" : "debug";

/**
 * Application-wide pino logger.
 *
 * Production:     JSON to stdout — Railway/host aggregates as-is.
 * Non-production: Raw JSON written to api/logs/dev.log (path must match Promtail volume).
 *                 Promtail tails that file → Loki → Grafana (e.g. http://localhost:3001).
 *                 Run `docker compose -f infra/docker-compose.loki.yaml up -d` from repo root.
 *
 * Usage convention:
 *  - Import `logger` in services/clients; in route/middleware context prefer `req.log` (pino-http).
 *  - Create a child per operation: `const log = logger.child({ shipmentId })` and pass it down.
 *  - `console.*` is banned by the linter; use logger methods.
 */
const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_FILE = join(__dirname, "../../logs/dev.log");

function createLogger(): pino.Logger {
  if (isProduction) {
    return pino({ level });
  }

  mkdirSync(join(__dirname, "../../logs"), { recursive: true });

  return pino({
    level,
    formatters: {
      level: (label) => ({ level: label }),
    },
    transport: {
      target: "pino/file",
      options: { destination: LOG_FILE },
    },
  });
}

export const logger: pino.Logger = createLogger();
```

**Important:** Promtail’s `__path__` and the Compose volume for `/logs` must point at the **same** file(s) your app writes. Update `runbook-docs/infra/observability/promtail-config.yml` (job name, labels, path) when you copy it into the project.

### 3c. Wire up pino-http middleware

In `api/src/app.ts` (or `index.ts`), register `pino-http` as the first middleware so every request is logged automatically:

```ts
import pinoHttp from 'pino-http';
import { logger } from './lib/logger';

app.use(pinoHttp({ logger }));
```

### 3d. Grafana + Loki (only if you chose option B)

Copy from **`runbook-docs/infra/`** into your repo’s `infra/`:

- `docker-compose.loki.yaml`
- The entire **`observability/`** subtree (Loki, Promtail, Grafana provisioning)

**If the project already has a compose file:** merge these services or run this file alongside.

```bash
# From repository root (after files are in infra/)
docker compose -f infra/docker-compose.loki.yaml up -d
```

In the reference compose file, Grafana is exposed at **`http://localhost:3001`** (mapped from container port 3000). Loki listens on `3100`. The datasource provisioning under `observability/grafana/provisioning/` wires Loki automatically when using the bundled configs.

### 3e. Verification

**Always:**

- [x] A test request to any route produces a structured log entry _(CollabCanvas: `http_request` with `http_method`, `http_path`, `status_code`, `duration_ms`, `request_id`; Express uses `pino-http` per-request fields)_

**CollabCanvas (FastAPI + structlog) — done:**

- [x] `structlog` in `api/app/utils/logger.py`; `RequestLoggingMiddleware` in `api/app/middleware/request_logging.py`
- [x] Dev: colored console (`ConsoleRenderer`). Production-style: `LOG_JSON=1` or `APP_ENV=production` → JSON lines on stdout
- [x] **Skipped:** Grafana + Loki (not used)

**If you chose Pino Pretty (Node):**

- [ ] `npm run dev` shows formatted, readable logs in the terminal

**If you chose Grafana + Loki (Node):**

- [ ] `docker compose -f infra/docker-compose.loki.yaml up -d` starts without errors
- [ ] Grafana at `http://localhost:3001` shows logs from the running app (after Promtail ingests the log file)

---

## Phase 4 — Environment Config Module

**Goal:** All environment variable access is centralised in a single config module. No raw `process.env` or `os.environ` access anywhere else in the codebase.

> This phase must run **after Phase 1** is complete. The `no-process-env` linter rule will actively flag violations as you work, which is the intended behaviour — let it guide the cleanup.

### 4a. Create the config module

**Node/Express** — create `api/src/config/index.ts`:

The module should:
- Read all expected environment variables in one place
- Throw a descriptive error at startup if any required variable is missing
- Export a single frozen config object
- Never re-export `process.env` directly

Example shape (adapt to this project):

```ts
/**
 * CURSOR AGENT INSTRUCTION:
 * Never access process.env outside this file.
 * Import `config` from this module wherever env values are needed.
 * The oxlint no-process-env rule will flag any violations automatically.
 */

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

export const config = Object.freeze({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: required('DATABASE_URL'),
  // add all other variables here
});
```

**Python** — create `api/config.py` or `api/src/config.py`:

```python
"""
CURSOR AGENT INSTRUCTION:
Never access os.environ outside this module.
Import `config` from here wherever env values are needed.
"""

import os
from dataclasses import dataclass

def _required(key: str) -> str:
    value = os.environ.get(key)
    if not value:
        raise EnvironmentError(f"Missing required environment variable: {key}")
    return value

@dataclass(frozen=True)
class Config:
    port: int = int(os.environ.get("PORT", 3000))
    env: str = os.environ.get("APP_ENV", "development")
    database_url: str = _required("DATABASE_URL")

config = Config()
```

### 4b. Replace all raw env access

Run the linter — it will surface every remaining `process.env` / `os.environ` reference:

```bash
npm run lint        # Node
ruff check .        # Python
```

Replace each flagged reference with an import from the config module. Do not suppress linter warnings — fix them.

### 4c. Update .env.example

Ensure every variable referenced in the config module has a corresponding entry in `.env.example` with a placeholder value and a one-line comment describing it.

### 4d. Verification

- [ ] `npm run lint` (or `ruff check .`) exits with 0 errors including `no-process-env`
- [ ] App starts and throws a clear error if a required variable is missing
- [ ] `.env.example` is up to date

---

## Phase 5 (Optional — Portfolio Projects Only) — AI Keys + Rate Limiter

> **Skip this phase entirely for client projects.**
> This phase replaces any institutional or school-issued AI keys with personal keys, and adds a shared Upstash Redis rate limiter so all portfolio projects draw from a single usage pool.

### 5a. Swap AI provider keys

In `api/src/config/index.ts` (or the Python equivalent), ensure the following variables are present and sourced from your personal accounts — not any institutional or school credentials:

```ts
export const config = Object.freeze({
  // ... existing config ...
  openAiApiKey: required('OPENAI_API_KEY'),     // platform.openai.com
  grokApiKey: required('GROK_API_KEY'),          // console.x.ai
  // anthropicApiKey: required('ANTHROPIC_API_KEY'),  // uncomment when ready
});
```

Update `.env.example`:

```bash
# AI providers — use personal keys only, never institutional ones
OPENAI_API_KEY=sk-...
GROK_API_KEY=xai-...
# ANTHROPIC_API_KEY=sk-ant-...
```

> The `no-process-env` linter rule is already in place from Phase 1/4, so any raw `process.env.OPENAI_API_KEY` access elsewhere will be flagged automatically.

### 5b. Install Upstash rate limiter

```bash
npm install @upstash/ratelimit @upstash/redis
```

Add the Upstash connection variables to your config module and `.env.example`:

```ts
// In config/index.ts
upstashRedisUrl: required('UPSTASH_REDIS_REST_URL'),
upstashRedisToken: required('UPSTASH_REDIS_REST_TOKEN'),
```

```bash
# .env.example
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

### 5c. Implement the rate limiter middleware

Reference file: `runbook-docs/portfolio/ai-rate-limiter.ts`

Copy to `api/src/middleware/aiRateLimiter.ts` and wire it into any route that calls an AI provider.

The reference implementation enforces three limits using a single Upstash Redis instance. All limits are scoped per-app — there is no cross-project shared pool, so one project going viral cannot affect another.

- **Burst guard:** 10 requests / 10 min per user (sliding window) — stops scripts and rapid-fire abuse
- **Per-user:** 30 requests / 24 h (fixed window) — daily budget per Firebase uid
- **Per-app global:** 1000 requests / 24 h (fixed window) — ceiling across all users for this app

Checks run in order: global → burst → per-user. The `429` response body identifies which limit fired and includes a `retryAfter` value in seconds.

```ts
// Reference shape — full impl in runbook-docs/portfolio/ai-rate-limiter.ts

/**
 * CURSOR AGENT INSTRUCTION:
 * Apply this middleware to any route that calls an AI provider (OpenAI, Grok, Anthropic).
 * Do not call AI provider APIs from routes not protected by this middleware.
 * Set PROJECT_SLUG to a unique kebab-case name for this app before deploying.
 */

const PROJECT_SLUG = 'REPLACE_ME'; // e.g. 'recipe-gen' — unique per app

// Global per-app ceiling
const globalLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(1000, '24 h'),
  prefix: `rate:global:${PROJECT_SLUG}`,
});

// Burst guard per user
const burstLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 m'),
  prefix: `rate:burst:${PROJECT_SLUG}`,
});

// Daily cap per user
const userLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(30, '24 h'),
  prefix: `rate:user:${PROJECT_SLUG}`,
});
```

Set `PROJECT_SLUG` to a short unique kebab-case name for this app (e.g. `portfolio-chat`, `recipe-gen`). It namespaces all three Redis counters — it must not be reused across projects.

### 5d. Apply middleware to AI routes

In your Express router, apply `aiRateLimiter` before any handler that calls an AI provider. The middleware expects `res.locals.uid` to be set by a prior auth middleware (e.g. Firebase token verification):

```ts
import { aiRateLimiter } from '../middleware/aiRateLimiter';
import { verifyFirebaseToken } from '../middleware/auth';

router.post('/generate', verifyFirebaseToken, aiRateLimiter, generateHandler);
router.post('/chat', verifyFirebaseToken, aiRateLimiter, chatHandler);
```

For non-Express handlers (serverless, Remix, Next.js route handlers), use the `authenticate` convenience function from the reference file instead — it combines Firebase verification and all three rate limit checks in one call.

### 5e. Update .env.example and README

The README should include a note explaining that this project uses a shared rate limiter, what the daily limits are, and where to get the Upstash credentials.

### 5f. Verification

- [ ] `config` module includes `openAiApiKey`, `grokApiKey`, and Upstash vars
- [ ] `.env.example` has all five new variables with placeholder values
- [ ] `PROJECT_SLUG` is set to a unique kebab-case name for this app
- [ ] AI routes return `429` when the burst limit (10 req / 10 min) is hit
- [ ] AI routes return `429` when the per-user daily limit (30/day) is exceeded
- [ ] AI routes return `429` when the per-app global limit (1000/day) is exceeded
- [ ] `429` response body includes `error`, `detail`, and `retryAfter` fields
- [ ] No raw `process.env` access for any AI or Upstash key — linter passes clean

---

## Post-Refactor Checklist

Run through this after all phases are complete:

- [ ] `npm run lint` passes with 0 errors on all workspaces
- [ ] Agent is producing Darth Vader sign-offs — rules are active
- [ ] A curl to any route produces a Pino log entry (terminal with Pino Pretty, or your chosen file/Grafana path)
- [ ] If using Loki: Grafana at `http://localhost:3001` shows live logs from the app (per `runbook-docs/infra/docker-compose.loki.yaml`)
- [ ] Starting the app without a required env var throws a clear, named error
- [ ] All top-level folders match the standard structure
- [ ] `README.md` has been updated to reflect current setup (how to run, required env vars, how you view logs — Pino Pretty and/or the optional Loki stack)
- [ ] _(Portfolio only)_ Personal AI keys in place, no institutional keys remaining
- [ ] _(Portfolio only)_ Upstash rate limiter active on all AI routes; `PROJECT_NAME` is set and unique
- [ ] Branch `refactor/standards` is ready for PR

---

## Agent Instructions (paste at the start of each Cursor session)

```
You are working through a structured refactor using REFACTOR_RUNBOOK.md in this project root.

Rules:
1. Work one phase at a time. Do not begin the next phase until I confirm the current one is complete.
2. After every file change, run `npm run lint` (or `ruff check .` for Python) and fix all errors before moving on.
3. Never access process.env outside api/src/config/index.ts.
4. Prisma queries go in /services. Routes stay in /routes. Middleware goes in /middleware.
5. End every response with a Darth Vader quote.
6. React rules (Phase 2): never edit `.cursor/rules/react-readability.mdc`. Never edit `[IMMUTABLE — DO NOT MODIFY]` in `react-patterns.mdc` (including all useEffect rules). Edit only `[PROJECT — CUSTOMIZE]` in `react-patterns.mdc` for this repo’s paths and globs.

Current phase: Phase 4 — Environment config module (centralise env access in `api/app/config.py`; align with Phase 4 verification)
```
