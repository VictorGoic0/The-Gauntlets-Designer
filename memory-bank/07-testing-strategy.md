# Testing Strategy

## Testing Philosophy

- **Test behavior, not implementation**: Focus on what users experience
- **Unit tests for logic, integration tests for workflows**: Separate concerns
- **Manual testing for real-time features**: Some things are hard to mock (cursors, presence)
- **Continuous testing**: Always have 2 browsers open during development

## Testing Stack

### Test Runner

- **Vitest** 3.2.4 - Fast test runner with Vite integration

### React Testing

- **@testing-library/react** 16.3.0 - Component testing
- **@testing-library/jest-dom** 6.9.1 - DOM matchers
- **@testing-library/user-event** 14.6.1 - User interaction simulation

### Environment

- **jsdom** 27.0.0 - DOM implementation for Node

### Configuration

- **vitest.config.js** - Test configuration
- **src/test/setup.js** - Global test setup, Firebase mocks

## Test Commands

```bash
npm test              # Run tests in watch mode
npm run test:ui       # Run tests with Vitest UI
npm run test:coverage # Run tests with coverage report
```

## Test Coverage Status

### Unit Tests

#### ✅ Implemented

- **Auth Context** (`src/contexts/__tests__/AuthContext.test.jsx`)

  - AuthProvider renders children when authenticated
  - useAuth hook returns correct values
  - Mock Firebase auth functions

- **Firebase Auth** (`src/lib/__tests__/firebase.test.js`)

  - signInWithGoogle initiates Google sign-in flow
  - signOutUser signs out user
  - Mock Firebase calls

- **User Colors** (`src/utils/__tests__/userColors.test.js`)

  - 10 colors are defined
  - getUserColor returns one of 10 colors
  - Color is randomly assigned per user
  - Color format is valid hex

- **Canvas (Basic)** (`src/components/canvas/__tests__/Canvas.test.jsx`)

  - Stage position updates on drag
  - Pan is constrained to valid bounds
  - Zoom level updates on wheel event
  - Zoom is clamped between min/max
  - Zoom centers on mouse position

- **Canvas Context** (`src/contexts/__tests__/CanvasContext.test.jsx`)
  - Zoom/pan state management
  - Canvas mode switching

#### 🚧 Partially Implemented

- **Cursor Tracking** (`src/hooks/__tests__/useCursorTracking.test.js`)

  - Some tests exist but may be failing
  - Tests cursor throttling (100ms)
  - Tests cursor data structure
  - Tests onDisconnect cleanup

- **Cursor Sync** (`src/hooks/__tests__/useCursorSync.test.js`)
  - Some tests exist but may be failing
  - Tests filtering current user's cursor
  - Tests cursor interpolation

#### ❌ Not Implemented Yet

- **Object Sync** (`src/hooks/__tests__/useObjectSync.test.js`)

  - Test objects stored in state
  - Test create, update, delete operations
  - Test merging remote updates with local state
  - Test last-write-wins conflict resolution
  - Test optimistic deletion priority

- **Presence** (`src/hooks/__tests__/usePresence.test.js`)

  - Test presence data written on mount
  - Test lastSeen updates periodically (30s)
  - Test isOnline set to false on unmount
  - Test onDisconnect cleanup

- **Presence Sync** (`src/hooks/__tests__/usePresenceSync.test.js`)

  - Test filters users by isOnline status
  - Test filters users by recent lastSeen

- **Firestore Utils** (`src/utils/__tests__/firestoreUtils.test.js`)

  - Test updateObject uses 'shared-canvas' project ID
  - Test updateObject includes server timestamp
  - Test updateObject includes lastModifiedBy
  - Test deleteObject removes from Firestore

- **Canvas Utils** (`src/utils/__tests__/canvasUtils.test.js`)

  - Test screen to canvas coordinate conversion
  - Test coordinates correct at different zoom levels
  - Test coordinates correct with pan offset

- **Connection Status** (`src/components/ui/__tests__/ConnectionStatus.test.jsx`)
  - Test shows connected state
  - Test shows disconnected state
  - Mock Firestore connection listeners

### Integration Tests

#### ✅ Implemented

- **Login Flow** (`src/components/auth/__tests__/Login.integration.test.jsx`)
  - Google Sign-In button triggers auth flow
  - Error message display on failure
  - Mock Firebase Google auth responses

#### 🚧 Partially Implemented

- **Cursor Component** (`src/components/canvas/__tests__/Cursor.integration.test.jsx`)
  - Some tests may exist but incomplete
  - Test cursor renders at correct position
  - Test cursor displays user name
  - Test cursor uses correct color

#### ❌ Not Implemented Yet

- **Presence Panel** (`src/components/canvas/__tests__/PresencePanel.integration.test.jsx`)

  - Test displays list of online users
  - Test user count updates
  - Test panel is collapsible

- **Rectangle Component** (`src/components/canvas/shapes/__tests__/Rectangle.integration.test.jsx`)

  - Test renders with correct props
  - Test shows selection border when selected
  - Test click selects rectangle
  - Test drag behavior
  - Test drag updates local state immediately
  - Test drag end triggers Firestore update

- **Object Sync Integration** (`src/hooks/__tests__/useObjectSync.integration.test.js`)
  - Test objects persist after page reload
  - Test objects persist when all users disconnect
  - Use Firestore emulator for testing

### Manual Testing Scenarios

#### ✅ Tested and Working

1. **Two-Browser Cursor Sync**

   - Open app in 2 browsers with different Google accounts
   - Both cursors visible and moving smoothly
   - Cursors have unique colors from 10-color palette
   - Cursor names display correctly
   - <50ms perceived latency

2. **Shape Creation Sync**

   - Create rectangle in Browser A
   - Rectangle appears instantly in Browser B
   - Correct position and color

3. **Shape Movement Sync**

   - Drag rectangle in Browser A
   - Position updates in Browser B within 100ms
   - No jittering or snapping

4. **Presence Panel**

   - User appears when joining
   - User disappears when leaving
   - User count updates in real-time

5. **Pan and Zoom**

   - Can pan by dragging (spacebar or middle click)
   - Can zoom with scroll wheel
   - Zoom controls work
   - No performance issues

6. **Selection**

   - Can select/deselect rectangles
   - Selection state is visual only (not synced)

7. **Cursor Cleanup**
   - Cursors disappear when user closes browser
   - onDisconnect() working correctly

#### 🚧 Partially Tested

1. **State Persistence**

   - Objects persist after page reload (basic test)
   - Need to test: all users disconnect simultaneously

2. **Concurrent Editing**

   - Two users can move different objects simultaneously
   - Last write wins if two users move same object
   - Need more edge case testing

3. **Optimistic Deletion**
   - Delete key removes object immediately
   - Deletion takes priority over simultaneous moves
   - Need to test edge cases

#### ❌ Not Tested Yet

1. **Offline Mode**

   - App behavior when network disconnected
   - Queued updates when reconnected
   - Connection status indicator

2. **Multi-User Stress Test**

   - 3-5 users creating/moving objects simultaneously
   - FPS monitoring with many objects
   - No sync errors or state corruption

3. **Performance**

   - 200+ objects without FPS drops (tested locally, need production test)
   - 3+ concurrent users (tested locally, need production test)
   - Network latency simulation

4. **Error Scenarios**
   - Firebase connection drops during operation
   - Invalid Firestore data
   - Malformed cursor updates
   - Exceeding Firestore rate limits

## Mocking Strategy

### Firebase Mocking

```javascript
// src/test/setup.js
vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(),
  FieldValue: {
    serverTimestamp: vi.fn(() => "MOCK_TIMESTAMP"),
  },
}));
```

### Konva Mocking

```javascript
// Mock Konva for components that use Stage/Layer
vi.mock("react-konva", () => ({
  Stage: ({ children }) => <div>{children}</div>,
  Layer: ({ children }) => <div>{children}</div>,
  Rect: () => <div>Rectangle</div>,
  Circle: () => <div>Circle</div>,
  Text: () => <div>Text</div>,
}));
```

## Test Patterns

### Testing Contexts

```javascript
import { render, screen } from "@testing-library/react";
import { AuthProvider } from "../AuthContext";

test("provides auth context", () => {
  render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );
  // Assert on TestComponent behavior
});
```

### Testing Hooks

```javascript
import { renderHook, act } from "@testing-library/react";
import { useCanvas } from "../useCanvas";

test("updates canvas state", () => {
  const { result } = renderHook(() => useCanvas());

  act(() => {
    result.current.setStageScale(2);
  });

  expect(result.current.stageScale).toBe(2);
});
```

### Testing Async Operations

```javascript
import { waitFor } from "@testing-library/react";

test("loads data from Firebase", async () => {
  render(<Component />);

  await waitFor(() => {
    expect(screen.getByText("Data loaded")).toBeInTheDocument();
  });
});
```

### Testing User Interactions

```javascript
import userEvent from "@testing-library/user-event";

test("handles button click", async () => {
  const user = userEvent.setup();
  render(<Button onClick={mockFn} />);

  await user.click(screen.getByRole("button"));

  expect(mockFn).toHaveBeenCalled();
});
```

## Testing Challenges

### Challenge 1: Real-Time Listeners

**Problem**: onSnapshot listeners are async and fire callbacks.

**Solution**: Mock onSnapshot to call callback synchronously in tests.

```javascript
vi.mock("firebase/firestore", () => ({
  onSnapshot: vi.fn((ref, callback) => {
    callback({
      docs: [
        {
          id: "1",
          data: () => ({ x: 100, y: 200 }),
        },
      ],
    });
    return vi.fn(); // unsubscribe function
  }),
}));
```

### Challenge 2: Server Timestamps

**Problem**: FieldValue.serverTimestamp() doesn't return a value in tests.

**Solution**: Mock server timestamp as a string or number.

```javascript
FieldValue: {
  serverTimestamp: vi.fn(() => Date.now());
}
```

### Challenge 3: Throttling

**Problem**: Throttled functions don't fire immediately in tests.

**Solution**: Use fake timers or skip throttling in tests.

```javascript
import { vi } from "vitest";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});
```

### Challenge 4: Canvas Rendering

**Problem**: Konva requires browser Canvas API (not available in jsdom).

**Solution**: Mock Konva components or use headless browser (Playwright).

### Challenge 5: Multiple Users

**Problem**: Hard to simulate multiple users in unit tests.

**Solution**: Use integration tests or end-to-end tests (Playwright, Cypress).

## Future Testing Improvements

### Short-Term (Post-MVP)

1. Implement all missing unit tests
2. Complete integration test coverage
3. Add test coverage reports (aim for 80%+)
4. Fix failing cursor tests

### Medium-Term

1. Add E2E tests with Playwright
2. Test real-time sync with 2+ simulated users
3. Add performance regression tests
4. Add visual regression tests (Percy, Chromatic)

### Long-Term

1. Continuous integration with automated testing
2. Pre-merge test requirements
3. Load testing for Firebase limits
4. Monitoring and alerting for production errors
