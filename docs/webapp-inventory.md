# Webapp file inventory (non-config)

**Purpose:** Every path under `webapp/` that is **not** tooling/config/env/build output. Config excluded: `package.json`, `package-lock.json`, `vite.config.js`, `jsconfig.json`, `.oxlintrc.json`, Vitest/PostCSS/Tailwind config, `.env*`, `node_modules/`, `dist/`.

## Root (webapp/)

| File |
|------|
| `index.html` |

## Public assets (`webapp/public/`)

| File |
|------|
| `public/favicon.svg` |
| `public/_redirects` |

## Source (`webapp/src/`)

### Entry & app shell

| File |
|------|
| `src/main.jsx` |
| `src/App.jsx` |
| `src/App.css` |
| `src/index.css` |

### Assets

| File |
|------|
| `src/assets/react.svg` |

### TypeScript (env shim — not a React component)

| File |
|------|
| `src/vite-env.d.ts` |

### Contexts

| File |
|------|
| `src/contexts/AuthContext.jsx` |

### Hooks (`webapp/src/hooks/`)

| File |
|------|
| `src/hooks/useAuth.js` |
| `src/hooks/useCanvasLocalOptimisticPrune.js` |
| `src/hooks/useConnectionState.js` |
| `src/hooks/useCursorSync.js` |
| `src/hooks/useCursorTracking.js` |
| `src/hooks/useObjectPositions.js` |
| `src/hooks/useObjectSync.js` |
| `src/hooks/usePresence.js` |
| `src/hooks/usePresenceSync.js` |
| `src/hooks/useRtdbConnectionStatus.js` |
| `src/hooks/useSelectionSync.js` |
| `src/hooks/useSelectionTracking.js` |

### Lib & services

| File |
|------|
| `src/lib/firebase.js` |
| `src/services/aiService.js` |

### Pages

| File |
|------|
| `src/pages/CanvasPage.jsx` |

### Stores

| File |
|------|
| `src/stores/actions.js` |
| `src/stores/firestoreStore.js` |
| `src/stores/localStore.js` |
| `src/stores/presenceStore.js` |

### Styles

| File |
|------|
| `src/styles/tokens.js` |

### Utils

| File |
|------|
| `src/utils/objectUtils.js` |
| `src/utils/toast.js` |
| `src/utils/userColors.js` |

### Test

| File |
|------|
| `src/test/setup.js` |

### Components — `auth/`

| File |
|------|
| `src/components/auth/Login.jsx` |
| `src/components/auth/ProtectedRoute.jsx` |
| `src/components/auth/SignUp.jsx` |

### Components — `ai/`

| File |
|------|
| `src/components/ai/AIInput.jsx` |
| `src/components/ai/AIPanel.jsx` |

### Components — `canvas/`

| File |
|------|
| `src/components/canvas/Canvas.jsx` |
| `src/components/canvas/Cursor.jsx` |
| `src/components/canvas/LoadingState.jsx` |
| `src/components/canvas/PresencePanel.jsx` |
| `src/components/canvas/Toolbar.jsx` |
| `src/components/canvas/ZoomControls.jsx` |
| `src/components/canvas/shapes/Circle.jsx` |
| `src/components/canvas/shapes/Rectangle.jsx` |
| `src/components/canvas/shapes/Text.jsx` |

### Components — `design-system/`

| File |
|------|
| `src/components/design-system/Button.jsx` |
| `src/components/design-system/Card.jsx` |
| `src/components/design-system/Input.jsx` |
| `src/components/design-system/README.md` |

### Components — `icons/` (all `.jsx`)

| File |
|------|
| `src/components/icons/ButtonSpinnerIcon.jsx` |
| `src/components/icons/CloseXIcon.jsx` |
| `src/components/icons/CursorPointerIcon.jsx` |
| `src/components/icons/GoogleMarkIcon.jsx` |
| `src/components/icons/HeaderBoltIcon.jsx` |
| `src/components/icons/HeaderLogoIcon.jsx` |
| `src/components/icons/PasswordEyeIcon.jsx` |
| `src/components/icons/PasswordEyeOffIcon.jsx` |
| `src/components/icons/PresenceChevronIcon.jsx` |
| `src/components/icons/ToolbarIcons.jsx` |
| `src/components/icons/ZoomInIcon.jsx` |
| `src/components/icons/ZoomOutIcon.jsx` |

### Components — `ui/`

| File |
|------|
| `src/components/ui/ConnectionStatus.jsx` |
| `src/components/ui/Header.jsx` |

---

**Total `src/` files above:** 63 (includes `vite-env.d.ts`, `design-system/README.md`, and `test/setup.js`).

**React component / module files (typical `react-patterns` scope):** all `*.jsx` and `*.js` under `src/` except `src/test/setup.js` if you scope tests separately — **60** such files plus `tokens.js` / `toast.js` etc. as shared modules.

Update this file when adding routes, pages, or major folders.
