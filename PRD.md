# CollabCanvas - Product Requirements Document

## Executive Summary

CollabCanvas is a real-time collaborative design tool inspired by Figma, enabling multiple users to design together on a shared canvas with live cursor tracking and instant synchronization. This MVP focuses on building rock-solid multiplayer infrastructure with basic shape manipulation.

**Project Timeline**: 7-day sprint with hard MVP checkpoint at 24 hours

---

## Product Vision

Build the foundational infrastructure for real-time collaborative design, proving that multiple users can create, edit, and manipulate design elements simultaneously without conflicts or performance degradation.

---

## Tech Stack

### Frontend

- **Framework**: React 18+
- **Build Tool**: Vite (development and build)
- **Canvas Library**: Konva.js + react-konva
- **Deployment**: Netlify
- **Styling**: Tailwind CSS
- **UI Components**: Tailwind component library (shadcn/ui, Headless UI, or similar)
- **Design Priority**: Functionality over aesthetics for MVP

### Backend & Real-Time

- **Platform**: Firebase
  - **Firestore**: Real-time database for canvas state and object sync
  - **Firebase Auth**: Google Sign-In and Email/Password authentication
  - **Firebase Hosting**: Optional alternative to Netlify
- **Real-time Sync**: Firestore listeners (onSnapshot)
- **Development**: Direct against live Firebase (no emulator for MVP)

### Architecture Pattern

- **Client-side state management**: React hooks (useState + Context API when needed)
- **Sync strategy**: Optimistic updates with server reconciliation
- **Conflict resolution**: Last-write-wins with optimistic deletion (deletes take priority)
- **Project Model**: Single shared canvas (hardcoded project ID) for entire application
- **Canvas Dimensions**: 5,000 x 5,000 pixels
- **Cursor Update Throttle**: 45ms (~22 updates/second per user for <50ms perceived latency)

---

## MVP Requirements (24-Hour Checkpoint)

### Core Functionality

✅ **Canvas Operations**

- Pan and zoom functionality
- Large workspace (doesn't need to be infinite, but spacious)

✅ **Shape Support**

- At least one shape type: rectangle, circle, OR text
- Create shapes on click/drag
- Move shapes via drag-and-drop

✅ **Real-Time Collaboration**

- Sync between 2+ users in real-time
- Multiplayer cursors with name labels
- Presence awareness (show who's online)

✅ **User System**

- Google Sign-In authentication (primary)
- Email/password authentication (secondary)
- Users have display names from Google account or custom names
- Single shared canvas accessible to all authenticated users

✅ **Deployment**

- Publicly accessible URL
- Works in multiple browsers simultaneously

### MVP Success Criteria

- Two users can see each other's cursors moving in real-time
- Creating/moving a shape appears instantly for both users
- Canvas state persists if users disconnect and reconnect
- No crashes or broken sync during basic usage

---

## Full Canvas Feature Requirements

### Canvas Features

**Workspace**

- Canvas dimensions: 5,000 x 5,000 pixels
- Smooth pan (click-drag or spacebar + drag)
- Smooth zoom (scroll wheel)
- 30 FPS minimum during all interactions

**Supported Shapes**

- **Rectangles**: Solid fill colors
- **Circles**: Solid fill colors
- **Lines**: Solid stroke colors
- **Text Layers**: Basic formatting (font size, color)

**Object Transformations**

- Move: Click and drag
- Resize: Corner/edge handles
- Rotate: Rotation handle or input
- Lock aspect ratio option for resize

**Selection System**

- Single selection: Click object
- Multi-selection: Shift+click or drag-to-select box
- Visual selection indicators (bounding box, handles)

**Layer Management**

- Layer stack (z-index ordering)
- Bring forward / Send backward
- Delete selected objects (Delete/Backspace key)
- Duplicate selected objects (Cmd/Ctrl+D)

### Real-Time Collaboration Features

**Multiplayer Cursors**

- Show all connected users' cursor positions
- Throttled updates: 45ms (~22 updates/second per user)
- Update cursor position <50ms perceived latency with interpolation
- Display user name label near cursor
- Unique color per user (randomly assigned from 10 predefined colors)
- Smooth cursor interpolation (no jittering)
- Auto-cleanup on disconnect via Firebase onDisconnect()

**Live Object Sync**

- Object creation syncs across all users instantly
- Object modifications (move, resize, rotate, delete) sync in <100ms
- All users see identical canvas state

**Presence System**

- Show list of currently connected users
- Display user avatars/initials and names
- Show connection status (online/offline indicators)
- Handle graceful disconnects

**Conflict Resolution**

- **Strategy**: Last-write-wins with optimistic deletion
- **Deletion Priority**: Deletes take absolute priority over other operations
- **Implementation**: Delete locally immediately + remove from Firestore
- **Timestamps**: Use Firestore server timestamps to prevent stale updates
- Document this choice in README
- No lock mechanism for MVP

**State Persistence**

- Canvas state saves to Firestore automatically
- All objects persist across sessions
- Users can leave and return to find their work intact
- Handle edge cases: all users disconnect simultaneously

---

## Performance Targets

### MVP Performance (30 FPS)

- ✅ 30 FPS during pan, zoom, and object manipulation
- ✅ Support 200+ simple objects without FPS drops
- ✅ Support 3+ concurrent users without degradation
- ✅ Cursor sync: <50ms perceived latency (100ms throttle with interpolation)
- ✅ Object sync: <100ms latency

### Stretch Performance (Post-MVP)

- 60 FPS target
- 500+ objects support
- 5+ concurrent users

---

## Testing Requirements

### Manual Testing Scenarios

**Scenario 1: Basic Collaboration**

1. Open app in two different browsers
2. Sign in as two different users
3. Verify both cursors are visible and synced
4. Create a shape in Browser A → appears in Browser B instantly
5. Move shape in Browser B → updates in Browser A instantly

**Scenario 2: State Persistence**

1. User A creates 3 shapes
2. User A refreshes the page mid-edit
3. Verify all 3 shapes still exist after reload
4. User B should still see all shapes without issues

**Scenario 3: Rapid Sync**

1. Two users create shapes rapidly (5+ shapes in 10 seconds)
2. Two users move the same shape simultaneously
3. Verify no shapes disappear, duplicate, or become unresponsive
4. Verify canvas stays in sync

**Scenario 4: Multi-user Stress Test**

1. Open app in 3-5 browser windows
2. All users create and move objects simultaneously
3. Monitor FPS (should stay above 30)
4. Verify no sync errors or state corruption

---

## Firebase Data Model

### Collections Structure

**Note**: MVP uses a single hardcoded project ID (`'shared-canvas'`) accessible to all authenticated users.

```
/projects/shared-canvas
  - name: "Shared Canvas"
  - createdAt: timestamp
  - lastModified: timestamp (server timestamp)

/projects/shared-canvas/objects/{objectId}
  - type: 'rectangle' | 'circle' | 'line' | 'text'
  - x: number
  - y: number
  - width: number
  - height: number
  - rotation: number
  - fill: string (color)
  - stroke: string (color)
  - text: string (for text objects)
  - fontSize: number (for text objects)
  - zIndex: number
  - createdBy: userId
  - lastModifiedBy: userId
  - lastModified: timestamp (server timestamp - FieldValue.serverTimestamp())

/projects/shared-canvas/cursors/{userId}
  - x: number
  - y: number
  - userName: string
  - userColor: string
  - lastSeen: timestamp (server timestamp)
  - Auto-deleted via onDisconnect()

/projects/shared-canvas/presence/{userId}
  - userName: string
  - userEmail: string
  - userColor: string
  - isOnline: boolean
  - lastSeen: timestamp (server timestamp)
  - Auto-cleaned via onDisconnect()
```

### Firestore Rules (MVP)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Single shared canvas accessible to all authenticated users
    match /projects/shared-canvas/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Future Considerations (Post-MVP)

- Multi-project support with per-project permissions
- Project sharing and invites
- Batched write operations for multi-object operations
- More granular security rules

---

## User Stories

### As a Designer (User A)

- I can sign in with Google and immediately access the shared canvas
- I can create shapes on the canvas so that I can start designing
- I can move and resize shapes so that I can arrange my design
- I can see other designers' cursors so that I know where they're working
- I can see when others join or leave so that I know who's collaborating
- When I delete an object, it's removed immediately for everyone

### As a Collaborator (User B)

- I can sign in with Google and see all existing shapes on the shared canvas
- I can make edits that appear instantly for all other users
- I can see what User A is working on in real-time
- I can work on different parts of the canvas without conflicts

### As a Returning User

- I can reload the page and see the current state of the shared canvas
- I can leave and come back hours later to find everyone's work intact
- I can see the current state even if all other users have disconnected

---

## Build Strategy & Timeline

### Phase 1: Foundation (Hours 0-8) - Priority: CRITICAL ✅ COMPLETED

**Goal**: Get multiplayer cursors syncing

- [x] Set up React + Vite project
- [x] Set up Firebase project (Auth + Firestore)
- [x] Configure Firestore security rules for shared canvas (auth required)
- [x] Implement Google Sign-In authentication only
- [x] Create simple landing page with Google Sign-In button
- [x] Create basic 5,000x5,000px canvas with Konva.js
- [x] Implement cursor tracking locally
- [x] Sync cursor positions to Firestore (throttled to 45ms for <50ms perceived latency)
- [x] Implement cursor cleanup with Firebase onDisconnect()
- [x] Display multiplayer cursors with names and unique colors
- [x] Deploy to Netlify

**Checkpoint**: ✅ Two cursors moving in real-time across two browsers with <50ms perceived latency

---

### Phase 2: Object Sync (Hours 8-16) - Priority: CRITICAL ✅ COMPLETED

**Goal**: Get shape creation and movement syncing

- [x] Add rectangle creation to canvas
- [x] Save rectangles to Firestore with server timestamps on creation
- [x] Listen to shared canvas objects collection and render all rectangles
- [x] Implement drag-to-move with Konva
- [x] Update Firestore on object position changes with server timestamps
- [x] Add optimistic updates (local changes instant)
- [x] Implement optimistic deletion (delete locally + Firestore immediately)
- [x] Handle create/update/delete operations with last-write-wins

**Checkpoint**: ✅ Two users can create, move, and delete rectangles; both see updates instantly

---

### Phase 3: MVP Feature Complete (Hours 16-24) - Priority: HIGH ✅ COMPLETED

**Goal**: Meet all MVP requirements

- [x] Add presence system with onDisconnect() cleanup
- [x] Add pan and zoom controls for 5,000x5,000 canvas
- [x] Implement state persistence (reload test on shared canvas)
- [x] Verify conflict resolution working (last-write-wins + deletion priority)
- [x] Handle disconnects gracefully with Firebase onDisconnect()
- [x] Performance testing (30 FPS check with 200+ objects, <50ms cursor latency)
- [x] Bug fixes and polish
- [x] Final MVP deployment and multi-browser testing

**Checkpoint**: ✅ Submit MVP - all hard requirements met

---

### Phase 4: Additional Shapes (Days 2-3) - Priority: MEDIUM ✅ COMPLETED

**Goal**: Support multiple shape types

- [x] Add circle shape
- [x] Add text layers with basic formatting
- [x] Implement shape-specific properties (stroke, fill)
- [x] Test sync with mixed shape types
- [ ] Add line/path shape (deferred)

---

### Phase 5: Transformations (Days 3-4) - Priority: MEDIUM ✅ COMPLETED

**Goal**: Full object manipulation

- [x] Add resize handles to shapes
- [x] Add rotation handles
- [x] Add delete and duplicate commands
- [x] Add keyboard shortcuts (Delete/Escape)
- [ ] Implement multi-select (Shift+click) (deferred)
- [ ] Implement drag-to-select box (deferred)

---

### Phase 6: Layer Management (Days 4-5) - Priority: LOW

**Goal**: Control object stacking

- [ ] Implement z-index/layer order
- [ ] Add "bring forward" / "send backward" controls
- [ ] Show layer list panel
- [ ] Allow reordering in layer panel
- [ ] Sync layer changes across users

---

### Phase 7: Critical Bug Fixes (Current) - Priority: HIGH

**Goal**: Fix remaining collaboration bugs and edge cases

- [ ] Fix simultaneous drag conflict resolution
- [ ] Fix text rotation issue for new text objects
- [ ] Add email/password authentication (completed)
- [ ] Fix text editing race conditions (completed)
- [ ] Fix transform snap-back issues (completed)
- [ ] Fix Konva NaN warnings (completed)

---

### Phase 8: State Management Refactor - Priority: HIGH ✅ COMPLETED

**Goal**: Refactor state management into centralized store pattern

**Status**: ✅ COMPLETE - All phases implemented and tested

**Architecture**: Three separate Zustand stores with clear boundaries

#### Store Structure

**1. Firestore State Store** - Source of truth for persisted data

- Canvas objects (rectangles, circles, text)
- All data that needs to sync across users
- Server timestamps for conflict resolution
- Pending updates for drag conflicts
- Structure:

```javascript
{
  objects: {
    data: {
      [objectId]: {
        id: string,
        type: 'rectangle' | 'circle' | 'text',
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number, // for circles
        rotation: number,
        fill: string,
        text: string, // for text objects
        fontSize: number, // for text objects
        fontFamily: string, // for text objects
        zIndex: number,
        createdBy: string,
        createdAt: timestamp, // Set once at creation, never changes
        lastEditedBy: string,
        lastEditedAt: timestamp // Updates on every edit (not creation/deletion)
      }
    },
    sorted: Array, // Objects sorted by zIndex
    isLoading: boolean,
    lastSyncTime: timestamp,
    error: string | null
  },
  pendingUpdates: {
    [objectId]: object // Stores remote updates during active drag/transform
  },
  currentObjectsMap: {
    [objectId]: object // Current state for conflict resolution
  },
  connection: {
    isConnected: boolean,
    isOffline: boolean
  }
}
```

**2. Presence State Store** - Real-time user presence data

- Online users list
- User cursors
- Connection status
- Auto-cleanup via onDisconnect()
- Structure:

```javascript
{
  onlineUsers: {
    [userId]: {
      userName: string,
      userEmail: string,
      userColor: string,
      isOnline: boolean,
      lastSeen: timestamp
    }
  },
  remoteCursors: {
    [userId]: {
      x: number,
      y: number,
      userName: string,
      userColor: string,
      lastSeen: timestamp
    }
  },
  connectionStatus: 'connected' | 'disconnected' | 'connecting'
}
```

**3. Local State Store** - Client-side immediate state

- Canvas view state (zoom, pan, mode)
- Selection state (selected objects)
- Active operations (dragging, transforming)
- Local overlays for optimistic updates
- Optimistic objects not yet synced to Firestore
- Structure:

```javascript
{
  canvas: {
    mode: 'select' | 'rectangle' | 'circle' | 'text',
    stageScale: number,
    stagePosition: { x: number, y: number },
    MIN_SCALE: 0.1,
    MAX_SCALE: 5
  },
  selection: {
    selectedObjectIds: string[]
  },
  dragging: {
    draggingObjectId: string | null, // Currently dragging object
    localObjectPositions: {
      [objectId]: { x: number, y: number } // Local overlay during and after drag
    }
  },
  transforms: {
    transformingObjectId: string | null, // Currently transforming object
    localObjectTransforms: {
      [objectId]: { // Local overlay during and after transform
        x?: number,
        y?: number,
        width?: number,
        height?: number,
        radius?: number,
        rotation?: number,
        fontSize?: number
      }
    }
  },
  optimisticObjects: {
    data: {
      [localId]: {
        id: string, // Local generated ID
        isOptimistic: true, // Flag to prevent Firestore writes
        ...objectData
      }
    }
  }
}
```

#### Store Communication Pattern

**Multi-Store Action Pattern**: Actions can affect multiple stores directly

- Each store has its own actions/methods
- Actions are dispatched through a central action dispatcher
- One action can update multiple stores when appropriate
- Optimistic updates for immediate user feedback

**Action Flow Example**:

```javascript
// Central action dispatcher
const actions = {
  moveObject: (objectId, newPosition) => {
    // 1. Update local state immediately (optimistic update)
    useLocalStore.getState().setObjectPosition(objectId, newPosition);

    // 2. Mark as actively dragging
    useLocalStore.getState().setActiveDrag(objectId);

    // 3. Queue Firestore update
    useFirestoreStore.getState().queueUpdate(objectId, {
      x: newPosition.x,
      y: newPosition.y,
      lastModified: FieldValue.serverTimestamp(),
    });
  },

  finishDrag: (objectId) => {
    // 1. Clear active drag state
    useLocalStore.getState().clearActiveDrag();

    // 2. Commit final position to Firestore
    const finalPosition = useLocalStore.getState().getObjectPosition(objectId);
    useFirestoreStore.getState().commitUpdate(objectId, finalPosition);
  },
};
```

**Optimistic Updates Strategy**:

- Local state updates immediately for instant user feedback
- Firestore writes are queued and executed asynchronously
- Assumes Firestore writes always succeed (no rollback for MVP)
- Remote updates from other users override local optimistic state when they arrive

#### Store Access Pattern

**Direct Store Subscription**: Components subscribe to specific stores directly

- Each component subscribes only to the stores it needs
- Clear separation of concerns - no hooks combining data from multiple stores
- Simple and predictable data flow
- Easy to debug which store a component depends on

**Example Component Usage**:

```javascript
// Canvas component subscribes to both stores
const Canvas = () => {
  const { objects } = useFirestoreStore(); // Get synced objects
  const { canvas, ui } = useLocalStore(); // Get local state

  return (
    <Stage>
      {objects.map((obj) => (
        <Shape key={obj.id} {...obj} />
      ))}
    </Stage>
  );
};

// Toolbar component only needs local state
const Toolbar = () => {
  const { canvas } = useLocalStore(); // Only local state
  const { setMode } = useLocalStore();

  return (
    <div>
      <button onClick={() => setMode("rectangle")}>Rectangle</button>
    </div>
  );
};

// Presence panel only needs presence state
const PresencePanel = () => {
  const { onlineUsers } = usePresenceStore(); // Only presence state

  return (
    <div>
      {onlineUsers.map((user) => (
        <UserAvatar key={user.id} {...user} />
      ))}
    </div>
  );
};
```

**Benefits**:

- Clear dependencies - you know exactly which stores each component uses
- No complex data combining logic
- Easy to optimize - components only re-render when their specific stores change
- Simple to test - mock only the stores the component actually uses

#### Component State Strategy

**Hybrid Approach**: Mostly zero local state with minimal exceptions

**Zero Local State Components** (Write directly to stores):

- `Canvas.jsx` - All canvas interactions go to stores
- `Toolbar.jsx` - Tool selection goes to Local Store
- `Rectangle.jsx` - Drag/transform actions go to stores
- `Circle.jsx` - Drag/transform actions go to stores
- `Cursor.jsx` - Cursor rendering from Presence Store
- `PresencePanel.jsx` - User list from Presence Store
- `ZoomControls.jsx` - Zoom actions go to Local Store
- `Header.jsx` - User info from Auth context

**Minimal Local State Components** (Specific UX requirements):

- `Text.jsx` - Local state for text input while typing, store on save
- `Login.jsx` - Form validation states
- `SignUp.jsx` - Form validation states
- Any future modal/tooltip components - Temporary UI states

**State Flow Pattern**:

```javascript
// Zero local state component
const Canvas = () => {
  const { objects } = useFirestoreStore();
  const { canvas } = useLocalStore();

  const handleDrag = (id, pos) => {
    actions.moveObject(id, pos); // Direct to stores
  };

  return (
    <Stage>
      {objects.map((obj) => (
        <Shape key={obj.id} {...obj} />
      ))}
    </Stage>
  );
};

// Minimal local state component
const TextEditor = () => {
  const [localText, setLocalText] = useState(""); // Only for typing
  const { text, updateText } = useFirestoreStore();

  const handleSave = () => {
    updateText(localText); // Write to store on save
    setLocalText(""); // Clear local state
  };

  return <textarea value={localText} onChange={setLocalText} />;
};
```

**Benefits**:

- Cleaner architecture - most state in stores
- Better debugging - centralized state management
- Simpler components - just read and call actions
- Flexibility - add local state only when UX requires it

#### Implementation Plan

- [x] Choose state management approach (Zustand selected)
- [x] Create Local State Store (canvas mode, zoom, pan, selection, dragging, transforms, optimistic objects)
- [x] Create Firestore State Store (objects with conflict resolution)
- [x] Create Presence State Store (online users, cursors, connection)
- [x] Migrate all canvas state to centralized stores
- [x] Implement unified sync logic via hooks
- [x] Remove old context providers (CanvasContext) and scattered state management
- [x] Add store DevTools and debugging capabilities (Redux DevTools enabled)
- [x] **Implement conflict resolution with timestamps:**
  - [x] Added `createdAt` timestamp (set once, never changes)
  - [x] Added `lastEditedAt` timestamp (updates on every edit)
  - [x] Implemented last-write-wins strategy based on `lastEditedAt`
  - [x] Optimistic deletion (deletes always win)
  - [x] Pending updates only for actively dragging/transforming objects
- [x] **Fixed state management bugs:**
  - [x] Fixed infinite pending update loop
  - [x] Fixed flicker on drag/transform release
  - [x] Ensured remote updates persist correctly
  - [x] Implemented "wait for remote match" pattern for smooth UX

#### Conflict Resolution Implementation

**Timestamp Strategy:**

- `createdAt`: Set once with `serverTimestamp()` at creation, immutable
- `lastEditedAt`: Updates with `serverTimestamp()` on every edit (drag, transform, text change)
- Epoch/Unix milliseconds format for easy comparison

**Last-Write-Wins:**

- When remote update arrives for actively dragging/transforming object → stored as pending
- When drag/transform ends → compare `lastEditedAt` timestamps
- Update with later timestamp wins, earlier timestamp discarded
- Falls back to `createdAt` if `lastEditedAt` doesn't exist

**Active vs Pending:**

- `activeObjectIds`: Only includes objects CURRENTLY being dragged/transformed
- Remote updates for active objects → stored in `pendingUpdates`
- Remote updates for inactive objects → apply immediately to Firestore store
- Local overlays persist until remote matches (prevents flicker)

**Key Fix:**

- Previously: All objects with local overlays were marked "active" → infinite pending loop
- Now: Only currently dragging/transforming object marked "active" → clean state transitions

#### Optimistic Objects System

**ID Reconciliation:**

- New objects created with local generated ID (`obj_${timestamp}_${random}`)
- Marked `isOptimistic: true` in Local Store
- Immediately rendered for instant user feedback
- Written to Firestore with `addDoc()` which returns Firestore ID
- Local ID reconciled with Firestore ID upon successful write
- All references updated (selection, dragging, transforms)
- `isOptimistic` flag removed, object moves to Firestore Store

**Benefits:**

- Instant object creation (no network delay)
- Prevents premature Firestore updates (no writes until object exists in Firestore)
- Clean separation: local optimistic state vs synced Firestore state

---

### Phase 9: Polish & Performance (Days 5-7) - Priority: MEDIUM

**Goal**: Optimize and stabilize

- [ ] Optimize Firestore queries (use indexes)
- [ ] Further optimize cursor interpolation for smoother display
- [ ] Add loading states and error handling
- [ ] Improve UX (tooltips, hints, onboarding)
- [ ] Stress test with 5 users and 200+ objects
- [ ] Fix any remaining bugs
- [ ] Final deployment and testing

---

## Known Risks & Mitigation

### Risk 1: Real-time sync is complex

**Mitigation**: Start simple with cursor sync first. Use Firestore's built-in real-time listeners. Test continuously with 2 browsers open.

### Risk 2: Performance degradation with many objects

**Mitigation**: Start with 30 FPS target instead of 60. Use Konva's layering and caching. Implement object culling (don't render off-screen objects).

### Risk 3: Race conditions during simultaneous edits

**Mitigation**: Accept last-write-wins for MVP. Document behavior. Consider operational transforms (OT) or CRDTs only if time permits.

### Risk 4: Firestore costs with high traffic

**Mitigation**: Throttle cursor updates. Use Firestore local cache. Monitor usage in Firebase console.

### Risk 5: Firebase connection drops

**Mitigation**: Implement reconnection logic. Show connection status to users. Queue updates locally and sync when reconnected.

---

## Questions Resolved

- ✅ **User authentication method**: Google Sign-In (primary) + Email/Password (secondary)
- ✅ **Project model**: Single shared canvas accessible to all authenticated users (hardcoded project ID: 'shared-canvas')
- ✅ **Landing page**: Login/signup pages with Google Sign-In and email/password options → redirect to canvas
- ✅ **Canvas dimensions**: 5,000 x 5,000 pixels
- ✅ **Cursor colors**: 10 predefined colors assigned randomly per user
- ✅ **Cursor throttle**: 45ms updates with <50ms perceived latency via interpolation
- ✅ **Conflict resolution**: Last-write-wins based on `lastEditedAt` timestamps with optimistic deletion (deletes take priority)
- ✅ **Development environment**: Direct against live Firebase (no emulator for MVP)
- ✅ **State management**: Zustand centralized stores (Local, Firestore, Presence) with optimistic updates and conflict resolution

---

## Current Status (Updated)

**MVP Status**: ✅ COMPLETED - All core requirements met

**Completed Features**:

- ✅ Multiplayer cursors with <50ms perceived latency
- ✅ Real-time object sync (rectangles, circles, text)
- ✅ Pan and zoom functionality
- ✅ Object transformations (move, resize, rotate)
- ✅ Presence system
- ✅ State persistence
- ✅ Google Sign-In and Email/Password authentication
- ✅ Deployed and publicly accessible

**Current Focus**: Bug fixes and state management refactor

- PR #13: Remaining bug fixes (simultaneous drag conflicts, text rotation)
- PR #14: State management refactor (centralized store pattern)

**Next Priorities**:

- Fix remaining collaboration edge cases
- Implement centralized state management
- Add multi-select and advanced selection features
- Layer management system

---

## Notes

- **Focus on multiplayer first**: A simple canvas with perfect sync beats a feature-rich canvas with broken collaboration
- **Test continuously**: Always have 2 browser windows open while developing
- **Deploy early**: Deploy after Phase 1 to catch deployment issues early
- **Document decisions**: Especially conflict resolution strategy
- **Performance monitoring**: Keep DevTools open, watch FPS counter
