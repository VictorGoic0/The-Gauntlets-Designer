# CollabCanvas - Implementation Task List

## Overview

Each PR represents a complete, testable feature. PRs build on each other sequentially. Test thoroughly before merging each PR.

---

## PR #1: Project Setup & Initial Structure

**Goal**: Set up the foundational project with all dependencies and basic structure

### Subtasks

1. - [x] Create new Vite + React project
   - Run: `npm create vite@latest collabcanvas -- --template react`
   - Install dependencies: `npm install`

2. - [x] Install all required dependencies

   ```bash
   npm install firebase konva react-konva
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

3. - [x] Configure Tailwind CSS

   - Update `tailwind.config.js` with content paths
   - Add Tailwind directives to `src/index.css`

4. - [x] Create project file structure

   ```
   src/
   ├── components/
   │   ├── auth/
   │   ├── canvas/
   │   └── ui/
   ├── contexts/
   ├── hooks/
   ├── lib/
   │   └── firebase.js
   ├── utils/
   ├── App.jsx
   └── main.jsx
   ```

5. - [x] Set up Firebase project

   - Create new Firebase project in console
   - Enable Firestore Database
   - Enable Firebase Authentication
   - Copy Firebase config credentials

6. - [x] Create Firebase configuration file

   - File: `src/lib/firebase.js`
   - Initialize Firebase app
   - Export `auth`, `db` instances
   - Add `.env.local` for Firebase keys
   - Add `.env.local` to `.gitignore`

7. - [x] Create basic README

   - File: `README.md`
   - Setup instructions
   - Environment variables needed
   - How to run locally

8. - [x] Initial Git setup
   - Initialize git repo
   - Create `.gitignore` (include `.env.local`, `node_modules`, `dist`)
   - Initial commit

**Testing Setup:**

9. - [x] Install testing dependencies

   ```bash
   npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
   ```

10. - [x] Create Vitest config

    - File: `vitest.config.js`
    - Configure jsdom environment
    - Add test globals

11. - [x] Create test setup file

    - File: `src/test/setup.js`
    - Import @testing-library/jest-dom
    - Mock Firebase (avoid real Firebase calls in tests)

12. - [x] Add test scripts to package.json
    ```json
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
    ```

**Unit Tests:**

13. - [x] Test utility functions
    - File: `src/utils/__tests__/userColors.test.js`
    - Test color generation consistency
    - Test color uniqueness

**Files Created:**

- `src/lib/firebase.js`
- `tailwind.config.js`
- `.env.local`
- `README.md`
- `.gitignore`
- `vitest.config.js`
- `src/test/setup.js`

**Test Before Merge:**

- [x] `npm run dev` starts without errors
- [x] Tailwind classes work
- [x] No console errors
- [x] `npm test` passes

---

## PR #2: Firebase Authentication (Google Sign-In Only)

**Goal**: Implement Google Sign-In authentication

### Subtasks

1. - [x] Set up Firebase Authentication

   - Enable Google Sign-In provider in Firebase Console
   - Configure authorized domains

2. - [x] Create AuthContext

   - File: `src/contexts/AuthContext.jsx`
   - Manage auth state with `useState`
   - Create `AuthProvider` component
   - Export `useAuth` hook
   - Handle `onAuthStateChanged` listener

3. - [x] Create Login component

   - File: `src/components/auth/Login.jsx`
   - Simple landing page with "Sign in with Google" button
   - Use Google popup sign-in flow
   - Error message display
   - Use Tailwind for styling

4. - [x] Implement auth functions

   - File: `src/lib/firebase.js`
   - `signInWithGoogle()` - uses GoogleAuthProvider
   - `signOutUser()`
   - User display name comes from Google account automatically

5. - [x] Create ProtectedRoute component

   - File: `src/components/auth/ProtectedRoute.jsx`
   - Redirect to login if not authenticated
   - Show loading state while checking auth

6. - [x] Update App.jsx

   - Wrap app with `AuthProvider`
   - Add routing logic (login page vs canvas)
   - Show login page if not authenticated
   - Redirect to canvas after successful Google Sign-In

7. - [x] Add sign out button
   - File: `src/components/ui/Header.jsx`
   - Display current user name (from Google account)
   - Sign out button
   - Use Tailwind for styling

**Unit Tests:**

8. - [x] Test auth context

   - File: `src/contexts/__tests__/AuthContext.test.jsx`
   - Test AuthProvider renders children when authenticated
   - Test useAuth hook returns correct values
   - Mock Firebase auth functions

9. - [x] Test auth functions
   - File: `src/lib/__tests__/firebase.test.js`
   - Test signInWithGoogle initiates Google sign-in flow
   - Test signOutUser signs out user
   - Mock Firebase calls

**Integration Tests:**

10. - [x] Test login flow
    - File: `src/components/auth/__tests__/Login.integration.test.jsx`
    - Test Google Sign-In button triggers auth flow
    - Test error message display on failure
    - Mock Firebase Google auth responses

**Files Created:**

- `src/contexts/AuthContext.jsx`
- `src/components/auth/Login.jsx`
- `src/components/auth/ProtectedRoute.jsx`
- `src/components/ui/Header.jsx`
- `src/contexts/__tests__/AuthContext.test.jsx`
- `src/lib/__tests__/firebase.test.js`
- `src/components/auth/__tests__/Login.integration.test.jsx`

**Files Modified:**

- `src/lib/firebase.js`
- `src/App.jsx`

**Test Before Merge:**

- [x] Can sign in with Google account
- [x] Display name from Google account appears in header
- [x] Can sign out
- [x] Redirects work correctly (login page → canvas after sign-in)
- [x] `npm test` passes all auth tests

---

## PR #3: Basic Canvas Setup with Konva

**Goal**: Create a functional 5,000x5,000 canvas with pan and zoom

### Subtasks

1. - [x] Create Canvas component

   - File: `src/components/canvas/Canvas.jsx`
   - Import Konva: `Stage`, `Layer` from `react-konva`
   - Set stage size to window dimensions (viewport)
   - Canvas dimensions: 5,000 x 5,000 pixels (logical canvas size)
   - Add dark background

2. - [x] Implement pan functionality

   - Track mouse drag on stage
   - Update stage position with `useState`
   - Use `onMouseDown`, `onMouseMove`, `onMouseUp` events
   - Implement drag mode (spacebar or middle mouse button)

3. - [x] Implement zoom functionality

   - Listen to `onWheel` event on Stage
   - Update stage scale with `useState`
   - Zoom toward mouse cursor position
   - Clamp zoom level (min: 0.1, max: 5)

4. - [ ] Create CanvasProvider context

   - File: `src/contexts/CanvasContext.jsx`
   - Manage canvas state: zoom level, pan position, selected objects
   - Export `useCanvas` hook

5. - [ ] Add zoom controls UI

   - File: `src/components/canvas/ZoomControls.jsx`
   - Zoom in button
   - Zoom out button
   - Reset zoom button
   - Display current zoom percentage
   - Position in corner with Tailwind

6. - [ ] Create canvas page layout

   - File: `src/pages/CanvasPage.jsx`
   - Header with user info and sign out
   - Canvas component (full screen)
   - Zoom controls overlay

7. - [ ] Update App.jsx routing
   - Show CanvasPage after authentication

**Unit Tests:**

8. - [ ] Test pan functionality

   - File: `src/components/canvas/__tests__/Canvas.test.jsx`
   - Test stage position updates on drag
   - Test pan is constrained to valid bounds

9. - [ ] Test zoom functionality

   - File: `src/components/canvas/__tests__/Canvas.test.jsx`
   - Test zoom level updates on wheel event
   - Test zoom is clamped between min/max
   - Test zoom centers on mouse position

10. - [ ] Test CanvasContext
    - File: `src/contexts/__tests__/CanvasContext.test.jsx`
    - Test zoom/pan state management
    - Test canvas mode switching

**Files Created:**

- `src/components/canvas/Canvas.jsx`
- `src/components/canvas/ZoomControls.jsx`
- `src/contexts/CanvasContext.jsx`
- `src/pages/CanvasPage.jsx`
- `src/components/canvas/__tests__/Canvas.test.jsx`
- `src/contexts/__tests__/CanvasContext.test.jsx`

**Files Modified:**

- `src/App.jsx`

**Test Before Merge:**

- [ ] Canvas renders full screen
- [ ] Can pan by dragging (with spacebar or designated button)
- [ ] Can zoom with scroll wheel
- [ ] Zoom controls work
- [ ] No performance issues
- [ ] `npm test` passes all canvas tests

---

## PR #4: Multiplayer Cursors (CRITICAL)

**Goal**: Sync cursor positions across all connected users in real-time with <50ms perceived latency

### Subtasks

1. - [ ] Set up Firestore collections structure

   - Create collection: `/projects/shared-canvas/cursors/{userId}`
   - Hardcoded project ID: 'shared-canvas'
   - Add Firestore security rules in Firebase console (auth users can read/write)
   - Rule: `match /projects/shared-canvas/{document=**} { allow read, write: if request.auth != null; }`

2. - [ ] Define cursor color palette

   - File: `src/utils/userColors.js`
   - Define 10 predefined colors (vibrant, distinct colors)
   - Function to randomly assign one color per user: `getUserColor(userId)`
   - Store color assignment in component state or Firestore

3. - [ ] Create cursor tracking hook

   - File: `src/hooks/useCursorTracking.js`
   - Track local mouse position with `useState`
   - **Throttle cursor updates to 100ms** (10 updates/second)
   - Write cursor position to Firestore on mouse move
   - Include: `x`, `y`, `userName`, `userColor`, `lastSeen` (server timestamp)
   - Use `FieldValue.serverTimestamp()` for lastSeen

4. - [ ] Implement cursor cleanup with onDisconnect()

   - File: `src/hooks/useCursorTracking.js`
   - Set up Firebase `onDisconnect().remove()` for cursor document
   - Ensures cursor auto-deleted when user disconnects/closes browser
   - Clean up on component unmount as well

5. - [ ] Create cursor sync hook

   - File: `src/hooks/useCursorSync.js`
   - Listen to `/projects/shared-canvas/cursors` collection with `onSnapshot`
   - Store remote cursors in `useState`
   - Filter out current user's cursor
   - Implement cursor interpolation for smooth movement (target <50ms perceived latency)

6. - [ ] Create Cursor component

   - File: `src/components/canvas/Cursor.jsx`
   - Render SVG cursor shape with Konva `Group`
   - Display user name label
   - Use user's assigned color
   - Position based on cursor data

7. - [ ] Integrate cursors into Canvas
   - Update `src/components/canvas/Canvas.jsx`
   - Use `useCursorTracking` hook
   - Use `useCursorSync` hook
   - Render `Cursor` component for each remote user
   - Transform cursor positions based on canvas pan/zoom

**Unit Tests:**

8. - [ ] Test cursor throttling

   - File: `src/hooks/__tests__/useCursorTracking.test.js`
   - Test cursor updates are throttled to 100ms
   - Test cursor data includes x, y, userName, userColor, lastSeen
   - Test uses server timestamp for lastSeen
   - Mock Firestore writes

9. - [ ] Test cursor sync logic

   - File: `src/hooks/__tests__/useCursorSync.test.js`
   - Test filters out current user's cursor
   - Test cursor interpolation works
   - Mock Firestore onSnapshot

10. - [ ] Test user color assignment

    - File: `src/utils/__tests__/userColors.test.js`
    - Test 10 colors are defined
    - Test getUserColor returns one of the 10 colors
    - Test color is randomly assigned per user
    - Test color format is valid hex

11. - [ ] Test onDisconnect cleanup
    - File: `src/hooks/__tests__/useCursorTracking.test.js`
    - Test onDisconnect().remove() is called
    - Test cleanup on unmount
    - Mock Firebase onDisconnect

**Integration Tests:**

12. - [ ] Test cursor component rendering
    - File: `src/components/canvas/__tests__/Cursor.integration.test.jsx`
    - Test cursor renders at correct position
    - Test cursor displays user name
    - Test cursor uses correct color

**Files Created:**

- `src/hooks/useCursorTracking.js`
- `src/hooks/useCursorSync.js`
- `src/components/canvas/Cursor.jsx`
- `src/utils/userColors.js` (10 color palette + random assignment)
- `src/hooks/__tests__/useCursorTracking.test.js`
- `src/hooks/__tests__/useCursorSync.test.js`
- `src/utils/__tests__/userColors.test.js`
- `src/components/canvas/__tests__/Cursor.integration.test.jsx`

**Files Modified:**

- `src/components/canvas/Canvas.jsx`

**Test Before Merge:**

- [ ] Open app in 2 browsers (both signed in with different Google accounts)
- [ ] Both cursors visible and moving smoothly with interpolation
- [ ] Each cursor has one of the 10 predefined colors
- [ ] Cursor names from Google accounts display correctly
- [ ] **Perceived latency <50ms** (feels real-time despite 100ms throttle)
- [ ] Cursors disappear immediately when user closes browser (onDisconnect works)
- [ ] Pan/zoom doesn't break cursor positioning
- [ ] `npm test` passes all cursor tests

---

## PR #5: Presence System

**Goal**: Show who's currently online and connected

### Subtasks

1. - [ ] Create presence data structure in Firestore

   - Collection: `/projects/shared-canvas/presence/{userId}`
   - Hardcoded project ID: 'shared-canvas'
   - Fields: `userName`, `userEmail`, `userColor` (from PR #4), `isOnline`, `lastSeen` (server timestamp)

2. - [ ] Create usePresence hook

   - File: `src/hooks/usePresence.js`
   - Write user presence on mount to `/projects/shared-canvas/presence/{userId}`
   - Update `lastSeen` every 30 seconds using `FieldValue.serverTimestamp()`
   - Set `isOnline: false` on unmount
   - Use `onDisconnect()` to set `isOnline: false` and update `lastSeen`

3. - [ ] Create presence sync hook

   - File: `src/hooks/usePresenceSync.js`
   - Listen to presence collection with `onSnapshot`
   - Return list of online users
   - Filter users by `isOnline` status and recent `lastSeen`

4. - [ ] Create PresencePanel component

   - File: `src/components/canvas/PresencePanel.jsx`
   - Display list of online users
   - Show user avatar/initials with color
   - Show user name
   - Collapsible panel (toggle button)
   - Use Tailwind for styling

5. - [ ] Integrate presence panel
   - Update `src/pages/CanvasPage.jsx`
   - Add `PresencePanel` to layout
   - Position in top-right corner

**Unit Tests:**

6. - [ ] Test presence hook

   - File: `src/hooks/__tests__/usePresence.test.js`
   - Test presence data is written on mount
   - Test lastSeen updates periodically
   - Test isOnline set to false on unmount
   - Mock Firestore and onDisconnect

7. - [ ] Test presence sync
   - File: `src/hooks/__tests__/usePresenceSync.test.js`
   - Test filters users by isOnline status
   - Test filters users by recent lastSeen
   - Mock Firestore onSnapshot

**Integration Tests:**

8. - [ ] Test presence panel
   - File: `src/components/canvas/__tests__/PresencePanel.integration.test.jsx`
   - Test displays list of online users
   - Test user count updates
   - Test panel is collapsible

**Files Created:**

- `src/hooks/usePresenceSync.js`
- `src/components/canvas/PresencePanel.jsx`
- `src/hooks/__tests__/usePresence.test.js`
- `src/hooks/__tests__/usePresenceSync.test.js`
- `src/components/canvas/__tests__/PresencePanel.integration.test.jsx`

**Files Modified:**

- `src/hooks/usePresence.js`
- `src/pages/CanvasPage.jsx`

**Test Before Merge:**

- [ ] Presence panel shows current user
- [ ] Open second browser, both users appear
- [ ] User count updates in real-time
- [ ] User disappears when browser closes
- [ ] Panel is collapsible
- [ ] `npm test` passes all presence tests

---

## PR #6: Rectangle Creation & Selection (CRITICAL)

**Goal**: Create rectangles on shared canvas and sync across users

### Subtasks

1. - [ ] Set up objects collection in Firestore

   - Collection: `/projects/shared-canvas/objects/{objectId}`
   - Hardcoded project ID: 'shared-canvas'
   - Fields: `type`, `x`, `y`, `width`, `height`, `fill`, `rotation`, `zIndex`, `createdBy`, `lastModifiedBy`, `lastModified` (server timestamp)

2. - [ ] Create canvas mode state

   - Update `src/contexts/CanvasContext.jsx`
   - Add `canvasMode` state: 'select', 'rectangle', 'circle', 'text'
   - Add `setCanvasMode` function

3. - [ ] Create Toolbar component

   - File: `src/components/canvas/Toolbar.jsx`
   - Buttons for each tool: Select, Rectangle, Circle, Text
   - Highlight active tool
   - Position on left side with Tailwind

4. - [ ] Create Rectangle component

   - File: `src/components/canvas/shapes/Rectangle.jsx`
   - Render Konva `Rect` with props
   - Handle click for selection
   - Show selection border when selected

5. - [ ] Implement rectangle creation

   - Update `src/components/canvas/Canvas.jsx`
   - On stage click in 'rectangle' mode:
     - Create rectangle at click position
     - Generate unique ID
     - Set default size (100x100) and color
   - Write to Firestore immediately with `FieldValue.serverTimestamp()` for lastModified
   - Add to local state instantly (optimistic update)

6. - [ ] Create object sync hook

   - File: `src/hooks/useObjectSync.js`
   - Listen to `/projects/shared-canvas/objects` collection with `onSnapshot`
   - Store objects in `useState`
   - Merge remote updates with local state
   - Handle create, update, delete operations
   - Use server timestamp to prevent stale updates

7. - [ ] Render all rectangles

   - Update `src/components/canvas/Canvas.jsx`
   - Use `useObjectSync` hook
   - Map through objects array
   - Render `Rectangle` component for each object

8. - [ ] Implement selection
   - Update `src/contexts/CanvasContext.jsx`
   - Add `selectedObjectIds` state (array for multi-select)
   - Add `selectObject`, `deselectObject`, `clearSelection` functions
   - Handle click on background to deselect

**Unit Tests:**

9. - [ ] Test object sync hook

   - File: `src/hooks/__tests__/useObjectSync.test.js`
   - Test objects are stored in state
   - Test handles create, update, delete operations
   - Test merges remote updates with local state
   - Mock Firestore onSnapshot

10. - [ ] Test rectangle creation

    - File: `src/components/canvas/__tests__/Canvas.test.jsx`
    - Test clicking in rectangle mode creates rectangle
    - Test rectangle has unique ID
    - Test rectangle has default properties (size, color)

11. - [ ] Test selection logic
    - File: `src/contexts/__tests__/CanvasContext.test.jsx`
    - Test selectObject adds to selectedObjectIds
    - Test deselectObject removes from selectedObjectIds
    - Test clearSelection empties selectedObjectIds

**Integration Tests:**

12. - [ ] Test rectangle component
    - File: `src/components/canvas/shapes/__tests__/Rectangle.integration.test.jsx`
    - Test renders with correct props
    - Test shows selection border when selected
    - Test click selects rectangle

**Files Created:**

- `src/components/canvas/Toolbar.jsx`
- `src/components/canvas/shapes/Rectangle.jsx`
- `src/hooks/useObjectSync.js`
- `src/hooks/__tests__/useObjectSync.test.js`
- `src/components/canvas/shapes/__tests__/Rectangle.integration.test.jsx`

**Files Modified:**

- `src/contexts/CanvasContext.jsx`
- `src/components/canvas/Canvas.jsx`
- `src/contexts/__tests__/CanvasContext.test.jsx`
- `src/components/canvas/__tests__/Canvas.test.jsx`

**Test Before Merge:**

- [ ] Can create rectangles by clicking
- [ ] Rectangles appear in both browsers instantly
- [ ] Can select/deselect rectangles
- [ ] Selection state is visual only (not synced yet)
- [ ] Multiple rectangles render without lag
- [ ] `npm test` passes all object tests

---

## PR #7: Drag & Move Objects with Sync (CRITICAL)

**Goal**: Move objects by dragging and sync positions across users

### Subtasks

1. - [ ] Add drag handlers to Rectangle

   - Update `src/components/canvas/shapes/Rectangle.jsx`
   - Make `draggable={true}` when selected
   - Add `onDragStart` handler
   - Add `onDragMove` handler (optional for smooth preview)
   - Add `onDragEnd` handler

2. - [ ] Implement optimistic updates

   - On drag start: update local state immediately
   - On drag move: update local position (no Firestore write yet)
   - On drag end: write final position to Firestore

3. - [ ] Create object update utility

   - File: `src/utils/firestoreUtils.js`
   - Function: `updateObject(objectId, updates)` - uses hardcoded 'shared-canvas' project ID
   - Function: `deleteObject(objectId)` - uses hardcoded 'shared-canvas' project ID
   - Updates Firestore document
   - Includes `lastModified: FieldValue.serverTimestamp()`
   - Includes `lastModifiedBy` userId

4. - [ ] Implement optimistic deletion

   - File: `src/utils/firestoreUtils.js`
   - Delete from local state immediately
   - Delete from Firestore immediately
   - Deletion takes priority over any other operations (last-write-wins exception)

5. - [ ] Handle remote updates during drag

   - Update `src/hooks/useObjectSync.js`
   - Don't override local object if currently being dragged
   - Apply remote updates after drag ends
   - Implement last-write-wins for conflicts (except deletes)
   - Use server timestamp to determine which update is newer

6. - [ ] Add visual feedback during drag

   - Show semi-transparent version while dragging
   - Snap back if drag is invalid
   - Disable drag when not in 'select' mode

7. - [ ] Transform coordinates for pan/zoom
   - Update drag handlers to account for canvas transform
   - Convert screen coordinates to canvas coordinates
   - Ensure objects stay in correct position across zoom levels

**Unit Tests:**

8. - [ ] Test Firestore update utility

   - File: `src/utils/__tests__/firestoreUtils.test.js`
   - Test updateObject uses hardcoded 'shared-canvas' project ID
   - Test updateObject includes server timestamp for lastModified
   - Test updateObject includes lastModifiedBy userId
   - Test deleteObject removes from Firestore immediately
   - Mock Firestore updateDoc and deleteDoc

9. - [ ] Test optimistic updates

   - File: `src/hooks/__tests__/useObjectSync.test.js`
   - Test local object not overridden during drag
   - Test remote updates applied after drag ends
   - Test last-write-wins conflict resolution (using server timestamps)
   - Test optimistic deletion takes priority over all other operations

10. - [ ] Test coordinate transformation
    - File: `src/utils/__tests__/canvasUtils.test.js`
    - Test screen to canvas coordinate conversion
    - Test coordinates correct at different zoom levels
    - Test coordinates correct with pan offset

**Integration Tests:**

11. - [ ] Test drag behavior
    - File: `src/components/canvas/shapes/__tests__/Rectangle.integration.test.jsx`
    - Test rectangle moves on drag
    - Test drag updates local state immediately
    - Test drag end triggers Firestore update

**Files Created:**

- `src/utils/firestoreUtils.js`
- `src/utils/__tests__/firestoreUtils.test.js`
- `src/utils/__tests__/canvasUtils.test.js`

**Files Modified:**

- `src/components/canvas/shapes/Rectangle.jsx`
- `src/hooks/useObjectSync.js`
- `src/hooks/__tests__/useObjectSync.test.js`
- `src/components/canvas/shapes/__tests__/Rectangle.integration.test.jsx`

**Test Before Merge:**

- [ ] Can drag rectangles smoothly
- [ ] Position updates in second browser within 100ms
- [ ] No jittering or snapping
- [ ] Works correctly at different zoom levels
- [ ] Multiple users can move different objects simultaneously
- [ ] Last write wins if two users move same object (based on server timestamp)
- [ ] Delete key removes object immediately for all users (optimistic deletion)
- [ ] Deletion takes priority over simultaneous moves
- [ ] `npm test` passes all drag tests

---

## PR #8: State Persistence & Reconnection

**Goal**: Canvas state persists across page reloads and disconnects

### Subtasks

1. - [ ] Implement Firestore persistence

   - Already handled by Firestore `onSnapshot` listeners
   - Verify objects persist when all users disconnect

2. - [ ] Add loading state

   - File: `src/components/canvas/LoadingState.jsx`
   - Show spinner while loading canvas data
   - Display "Loading canvas..." message

3. - [ ] Create connection status indicator

   - File: `src/components/ui/ConnectionStatus.jsx`
   - Listen to Firestore connection state
   - Display indicator: Connected (green) / Disconnected (red)
   - Position in header with Tailwind

4. - [ ] Handle offline mode

   - Update `src/hooks/useObjectSync.js`
   - Queue updates when offline
   - Sync queued updates when reconnected
   - Use Firestore offline persistence: `enableIndexedDbPersistence(db)`

5. - [ ] Add reconnection logic

   - Automatically handled by Firestore
   - Test by disconnecting network and reconnecting

6. - [ ] Test state persistence scenarios
   - Create objects, refresh page → objects still there
   - Two users create objects, both leave, both return → objects still there
   - Create object while offline, reconnect → object syncs

**Unit Tests:**

7. - [ ] Test offline queue logic

   - File: `src/hooks/__tests__/useObjectSync.test.js`
   - Test updates queued when offline
   - Test queued updates sync when reconnected
   - Mock Firestore connection state

8. - [ ] Test connection status
   - File: `src/components/ui/__tests__/ConnectionStatus.test.jsx`
   - Test shows connected state
   - Test shows disconnected state
   - Mock Firestore connection listeners

**Integration Tests:**

9. - [ ] Test state persistence
   - File: `src/hooks/__tests__/useObjectSync.integration.test.js`
   - Test objects persist after page reload
   - Test objects persist when all users disconnect
   - Use Firestore emulator for testing

**Files Created:**

- `src/components/canvas/LoadingState.jsx`
- `src/components/ui/ConnectionStatus.jsx`
- `src/components/ui/__tests__/ConnectionStatus.test.jsx`
- `src/hooks/__tests__/useObjectSync.integration.test.js`

**Files Modified:**

- `src/hooks/useObjectSync.js`
- `src/lib/firebase.js`
- `src/pages/CanvasPage.jsx`
- `src/hooks/__tests__/useObjectSync.test.js`

**Test Before Merge:**

- [ ] Canvas loads with existing objects after refresh
- [ ] Works offline (queues updates)
- [ ] Syncs queued updates when reconnected
- [ ] Connection status indicator works
- [ ] No data loss on disconnect
- [ ] `npm test` passes all persistence tests

---

## PR #9: Deploy MVP to Netlify

**Goal**: Get app publicly accessible for 24-hour MVP checkpoint

### Subtasks

1. - [ ] Configure build for production

   - Update `vite.config.js` if needed
   - Test production build locally: `npm run build` && `npm run preview`

2. - [ ] Set up Netlify

   - Create Netlify account
   - Connect GitHub repository
   - Configure build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`

3. - [ ] Add environment variables to Netlify

   - Add all Firebase config variables
   - Variables: `VITE_FIREBASE_API_KEY`, etc.

4. - [ ] Configure redirects for SPA

   - File: `public/_redirects`
   - Add: `/* /index.html 200`

5. - [ ] Deploy and test

   - Push to main branch to trigger deploy
   - Test authentication on deployed URL
   - Test multiplayer with 2 devices/browsers

6. - [ ] Update README
   - Add deployed URL
   - Add screenshots
   - Verify setup instructions

**Files Created:**

- `public/_redirects`

**Files Modified:**

- `README.md`

**Test Before Merge:**

- [ ] Deployed URL is accessible
- [ ] Can sign up and sign in
- [ ] Cursors sync across devices
- [ ] Can create and move rectangles
- [ ] State persists across page reloads

**🎯 MVP CHECKPOINT - ALL REQUIREMENTS MET**

---

## PR #10: Circle & Text Shapes

**Goal**: Add additional shape types to canvas

### Subtasks

1. - [ ] Create Circle component

   - File: `src/components/canvas/shapes/Circle.jsx`
   - Render Konva `Circle` with props
   - Same selection and drag behavior as Rectangle
   - Default radius: 50px

2. - [ ] Create Text component

   - File: `src/components/canvas/shapes/Text.jsx`
   - Render Konva `Text` with props
   - Add basic text editing on double-click
   - Default text: "Double-click to edit"
   - Default fontSize: 16

3. - [ ] Update Toolbar

   - Update `src/components/canvas/Toolbar.jsx`
   - Add Circle tool button
   - Add Text tool button

4. - [ ] Update Canvas to handle all shapes

   - Update `src/components/canvas/Canvas.jsx`
   - Handle circle creation on click
   - Handle text creation on click
   - Render different components based on object type
   - Update `useObjectSync` to handle all types

5. - [ ] Add shape-specific properties
   - Update Firestore data model to include:
     - `radius` for circles
     - `text`, `fontSize`, `fontFamily` for text
   - Update creation functions

**Files Created:**

- `src/components/canvas/shapes/Circle.jsx`
- `src/components/canvas/shapes/Text.jsx`

**Files Modified:**

- `src/components/canvas/Toolbar.jsx`
- `src/components/canvas/Canvas.jsx`
- `src/hooks/useObjectSync.js`

**Test Before Merge:**

- [ ] Can create circles
- [ ] Can create text layers
- [ ] All shapes sync across users
- [ ] Can move all shape types
- [ ] Can edit text by double-clicking

---

## PR #11: Resize & Rotate Transformations

**Goal**: Add transform handles for resizing and rotating objects

### Subtasks

1. - [ ] Install Konva Transformer

   - Already included with `react-konva`

2. - [ ] Create TransformWrapper component

   - File: `src/components/canvas/TransformWrapper.jsx`
   - Wraps selected shape with Konva `Transformer`
   - Shows resize handles (corners and edges)
   - Shows rotation handle

3. - [ ] Add transform handlers

   - Update shape components (Rectangle, Circle, Text)
   - Add `onTransform` handler
   - Add `onTransformEnd` handler
   - Update local state during transform
   - Write to Firestore on transform end

4. - [ ] Update object data structure

   - Add `rotation` field (already in data model)
   - Add `scaleX`, `scaleY` fields
   - Update Firestore on transform end

5. - [ ] Handle rotation sync

   - Update `useObjectSync` to apply rotation
   - Render shapes with rotation applied

6. - [ ] Handle resize sync

   - Update dimensions on resize
   - Maintain aspect ratio option (shift key)

7. - [ ] Add keyboard shortcuts
   - Delete key: delete selected objects
   - Escape key: deselect all

**Unit Tests:**

8. - [ ] Test transform calculations

   - File: `src/components/canvas/__tests__/TransformWrapper.test.jsx`
   - Test resize calculations are correct
   - Test rotation calculations are correct
   - Test aspect ratio lock works

9. - [ ] Test keyboard shortcuts
   - File: `src/components/canvas/__tests__/Canvas.test.jsx`
   - Test Delete key deletes selected objects
   - Test Escape key deselects all

**Integration Tests:**

10. - [ ] Test transform sync
    - File: `src/components/canvas/__tests__/TransformWrapper.integration.test.jsx`
    - Test resize syncs to Firestore
    - Test rotation syncs to Firestore
    - Test transforms applied correctly on remote clients

**Files Created:**

- `src/components/canvas/TransformWrapper.jsx`
- `src/components/canvas/__tests__/TransformWrapper.test.jsx`
- `src/components/canvas/__tests__/TransformWrapper.integration.test.jsx`

**Files Modified:**

- `src/components/canvas/shapes/Rectangle.jsx`
- `src/components/canvas/shapes/Circle.jsx`
- `src/components/canvas/shapes/Text.jsx`
- `src/hooks/useObjectSync.js`
- `src/components/canvas/Canvas.jsx`
- `src/components/canvas/__tests__/Canvas.test.jsx`

**Test Before Merge:**

- [ ] Resize handles appear on selection
- [ ] Can resize shapes
- [ ] Can rotate shapes
- [ ] Transforms sync across
