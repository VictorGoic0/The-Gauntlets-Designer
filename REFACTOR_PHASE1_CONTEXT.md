# Refactor runbook — Phase 1 (linting) — session context

Use this file when continuing the **REFACTOR_RUNBOOK.md** work in a new chat or window. Phase 1 goal: zero linter errors with guardrails in place before Phase 2 (Cursor rules) and later phases.

---

## Status: Phase 1 — complete (including type-aware webapp lint)

**Webapp (`webapp/`):** `npm run lint` exits **0** with **0 errors and 0 warnings** (oxlint with `typeAware` + `typeCheck`, `@typescript-eslint/consistent-type-imports`: error).

**API (`api/`):** `ruff check app` (or `make lint` from `api/` when `ruff` is on `PATH`) exits **0**.

---

## What we did (summary)

### `webapp/.oxlintrc.json`

- **`options.typeAware`** and **`options.typeCheck`** are **`true`** (tsgolint + program diagnostics).
- **`@typescript-eslint/consistent-type-imports`** is **`error`** (enabled with type-aware lint).
- **`eslint-js/id-length`** exceptions: **`i`**, **`x`**, **`y`** only — coordinates and loop index stay short; everything else was fixed in code (no extra config exceptions).
- Inline **`<svg>`** rule: violations fixed by moving SVGs to **`webapp/src/components/icons/`** (dedicated components), per runbook.

### `webapp/jsconfig.json` + `webapp/src/vite-env.d.ts`

- **`jsconfig.json`** covers **`src/**/*`**, **`checkJs`: false**, **`strictNullChecks`: true** (so type-aware rules like `no-useless-default-assignment` behave without turning the whole JS codebase into thousands of `checkJs` errors).
- **`src/vite-env.d.ts`** references **`vite/client`** so **`import.meta.env`** is typed for oxlint/tsgolint.

### Webapp code

- Renamed short handler params (**`e` → `event`**, sort **`(a,b)` → `(left,right)`**, removed **`_`** destructuring in Zustand in favor of copy + `delete`).
- **`AuthContext`**: context **`value`** wrapped in **`useMemo`** (fixes `jsx-no-constructed-context-values`).
- Removed unused import (**`Group`** in `Rectangle.jsx`).
- New icon components under **`src/components/icons/`** (toolbar, zoom, header, Google mark, close X, password eyes, cursor pointer, presence chevron, button spinner, etc.).
- **Phase 1b (type-aware):** **`void`** on intentionally unhandled promises (**`navigate()`**, Firebase **`onDisconnect`**, store **`actions.*`**, async helpers in effects); **`aiService`** stream callbacks use **`??`** no-ops instead of useless destructuring defaults flagged under **`strictNullChecks`**.

### API

- **`api/ruff.toml`**: `line-length = 120`, **`extend-ignore = ["E501"]`** for this pass (long lines can be tightened later).
- **`api/Makefile`**: `lint` / `lint-fix` calling Ruff on `app/`.
- **`requirements.txt`**: **`ruff>=0.8.0`** (dev).
- Ruff auto-fix + small manual fixes: exception chaining (**B904**), **`warnings.warn(..., stacklevel=2)`** (**B028**), unused assignment in **`openai_service`**, import/typing cleanups from **`ruff check --fix`**.

---

## Next step

**Phase 2 — Cursor rules:** **done** — see **`.cursor/rules/`** (`linting`, `darth-vadar-quote-signoff`, `one-pr-at-a-time`, **`react-readability.mdc`** verbatim, **`react-patterns.mdc`** customized, **`api-patterns.mdc`** tailored for FastAPI). **`REFACTOR_RUNBOOK.md`** Phase 1d / 2f checkboxes updated. Manually confirm Darth Vader / one-PR behavior in a new chat.

**Phase 3 — Structured logging** (see **`REFACTOR_RUNBOOK.md`**): Python API uses `logging` today; runbook’s Pino stack is Node-oriented — choose **structlog** or deepen **`app/utils/logger.py`** + request middleware to match “every request produces a structured log entry.”

Phase 1 verification for both workspaces is satisfied: webapp type-aware lint is clean; API Ruff is clean.

---

## Commands (quick reference)

| Workspace | Command        |
|-----------|----------------|
| Webapp    | `cd webapp && npm run lint` |
| Webapp    | `cd webapp && npm run lint:fix` |
| API       | `cd api && make lint` or `./venv/bin/ruff check app` |

---

## Optional follow-ups (not blocking Phase 1 “regular” lint)

- **`api/`**: Revisit **`E501`** (remove from `extend-ignore` and wrap lines) when you want stricter formatting.
- **`webapp/`**: **`npm run build`** was run successfully after Phase 1b; keep it in CI when you add it.
