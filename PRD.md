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
  - **Firestore**: Persistent storage for object properties
  - **Realtime Database**: High-frequency updates (cursors, object positions)
  - **Firebase Auth**: Google Sign-In and Email/Password authentication
  - **Firebase Cloud Functions**: Backend for AI agent (v2 API)
  - **Firebase Hosting**: Optional alternative to Netlify
- **Real-time Sync**: Firestore listeners (onSnapshot) + Realtime DB listeners (onValue)
- **Development**: Direct against live Firebase (no emulator for MVP)

### Architecture Pattern

- **Client-side state management**: Zustand centralized stores (Local, Firestore, Presence)
- **Sync strategy**: Optimistic updates with server reconciliation
- **Conflict resolution**: Last-write-wins with `lastEditedAt` timestamps (deletes take priority)
- **Project Model**: Single shared canvas (hardcoded project ID) for entire application
- **Canvas Dimensions**: 5,000 x 5,000 pixels
- **Cursor Update Throttle**: 45ms (~22 updates/second per user for <50ms perceived latency)
- **Data Storage Strategy**: Hybrid approach
  - **Realtime Database**: High-frequency updates (cursors, object positions)
  - **Firestore**: Persistent properties (object type, size, color, etc.)

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

### Hybrid Storage Strategy

**Note**: MVP uses a single hardcoded project ID (`'shared-canvas'`) accessible to all authenticated users.

**Architecture**: Hybrid data storage for optimal performance

- **Firestore**: Persistent object properties (infrequent updates)
- **Realtime Database**: High-frequency position updates (cursors, dragging)

---

### Firestore Collections

```
/projects/shared-canvas
  - name: "Shared Canvas"
  - createdAt: timestamp
  - lastModified: timestamp (server timestamp)

/projects/shared-canvas/objects/{objectId}
  - type: 'rectangle' | 'circle' | 'line' | 'text'
  - x: number (initial position / fallback)
  - y: number (initial position / fallback)
  - width: number
  - height: number
  - radius: number (for circles)
  - rotation: number
  - fill: string (color)
  - stroke: string (color)
  - text: string (for text objects)
  - fontSize: number (for text objects)
  - fontFamily: string (for text objects)
  - zIndex: number
  - createdBy: userId
  - createdAt: timestamp (set once, immutable)
  - lastEditedBy: userId
  - lastEditedAt: timestamp (updates on every edit)

/projects/shared-canvas/presence/{userId}
  - userName: string
  - userEmail: string
  - userColor: string
  - isOnline: boolean
  - lastSeen: timestamp (server timestamp)
  - Auto-cleaned via onDisconnect()
```

---

### Realtime Database Paths

```
/projects/shared-canvas/cursors/{userId}
  - x: number (canvas coordinates)
  - y: number (canvas coordinates)
  - userName: string
  - userColor: string
  - lastSeen: timestamp (server timestamp)
  - Auto-deleted via onDisconnect()

/objectPositions/{objectId} (PR #18 - Planned)
  - x: number (real-time position)
  - y: number (real-time position)
  - timestamp: number (optional)
  - NOTE: Overlays Firestore position; fallback to Firestore if missing

/selections/{userId} (PR #19 - Planned)
  - objectId: string | null (null if nothing selected)
  - userName: string
  - userColor: string (from user's cursor color)
  - timestamp: number (server timestamp)
  - Auto-deleted via onDisconnect()
  - NOTE: Tracks what object each user currently has selected
```

---

### Data Access Pattern

**Object Rendering:**

1. Read object properties from Firestore (type, size, color, etc.)
2. Read position from Realtime DB (x, y)
3. Merge: `{ ...firestoreObject, x: realtimeX ?? firestoreX, y: realtimeY ?? firestoreY }`
4. Realtime DB position takes priority; Firestore is fallback

**Object Updates:**

- **Position changes (drag)**: Write to Realtime DB only (high frequency)
- **Property changes (resize, rotate, color)**: Write to Firestore only
- **Creation**: Write properties to Firestore + initial position to both
- **Deletion**: Delete from both Firestore and Realtime DB

**Benefits:**

- Real-time dragging visibility (like cursors)
- Reduced Firestore writes (position updates don't touch Firestore)
- Persistent fallback (Firestore still has last known position)
- Zero breaking changes (x, y kept in Firestore for creation)

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

### Phase 7: Critical Bug Fixes - Priority: HIGH ✅ COMPLETED

**Goal**: Fix remaining collaboration bugs and edge cases

- [x] Fix simultaneous drag conflict resolution
- [x] Fix text rotation issue for new text objects
- [x] Add email/password authentication
- [x] Fix text editing race conditions
- [x] Fix transform snap-back issues
- [x] Fix Konva NaN warnings

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

**Architecture Overview:**

- **Local Store**: Client-side state with optimistic objects
- **Firestore Store**: Pure reflection of Firestore (updated ONLY by listeners)
- **Actions**: Business logic that writes to Firestore and Local Store

**Object Creation Flow:**

1. **User Creates Object**

   ```javascript
   actions.createShape(x, y, "rectangle", currentUser);
   ```

2. **Generate Local ID & Add to Local Store**

   ```javascript
   const localId = generateObjectId(); // "obj_1760650554461_abc123"

   useLocalStore.getState().addOptimisticObject(localId, {
     type: "rectangle",
     x,
     y,
     createdBy: currentUser.uid,
     isOptimistic: true, // ← Flag: not yet synced
   });
   ```

   **Result**: Object is immediately visible with local ID

3. **Write to Firestore & Get ID Back**

   ```javascript
   const docRef = await addDoc(collection(db, "..."), shapeData);
   const firestoreId = docRef.id; // "aBc123XyZ" ← Firestore-generated ID
   ```

   **Result**: Firestore creates document with its own ID

4. **Reconcile IDs**

   ```javascript
   useLocalStore.getState().reconcileObjectId(localId, firestoreId);
   ```

   This function:

   - Removes object from `optimisticObjects`
   - Updates all references: local ID → Firestore ID
     - Dragging positions
     - Transform states
     - Selection
     - Currently dragging/transforming IDs

   **Result**: All local state now uses Firestore ID

5. **Listener Picks Up Object**
   ```javascript
   // useObjectSync listener receives the new object
   onSnapshot(query, (snapshot) => {
     useFirestoreStore.getState().setObjects(snapshot.docs);
     // Object is now in Firestore Store with Firestore ID
   });
   ```
   **Result**: Object moves from Local Store → Firestore Store

**Manipulating Optimistic Objects:**

**Before Reconciliation (Local ID):**

- User can drag, resize, rotate the object immediately
- Updates Local Store dragging overlay
- Firestore writes are blocked:
  ```javascript
  const isOptimistic = useLocalStore.getState().isObjectOptimistic(objectId);
  if (!isOptimistic) {
    // Write to Firestore
    await updateObjectInFirestore(...);
  } else {
    // Skip - object doesn't exist in Firestore yet
  }
  ```

**After Reconciliation (Firestore ID):**

- Object no longer in `optimisticObjects`
- `isObjectOptimistic()` returns `false`
- Changes now persist to Firestore

**Rendering Objects:**

Canvas combines both sources:

```javascript
// Read from Firestore Store (synced objects)
const firestoreObjects = useFirestoreStore((state) => state.objects.sorted);

// Read from Local Store (optimistic objects)
const optimisticObjects = useLocalStore((state) =>
  Object.values(state.optimisticObjects.data)
);

// Combine for rendering
const allObjects = [...firestoreObjects, ...optimisticObjects];
```

**Error Handling:**

If Firestore write fails:

```javascript
try {
  const docRef = await addDoc(...);
  const firestoreId = docRef.id;
  useLocalStore.getState().reconcileObjectId(localId, firestoreId);
} catch (error) {
  console.error("Error creating shape:", error);
  // Remove optimistic object - creation failed
  useLocalStore.getState().removeOptimisticObject(localId);
}
```

**Key Benefits:**

1. **Instant Feedback**: Objects appear immediately
2. **Full Manipulation**: Can drag/resize before Firestore confirms
3. **Automatic Reconciliation**: ID swap handled by `addDoc()` return value
4. **Simple Flag**: `isOptimistic` check prevents premature Firestore writes
5. **Clean Architecture**: Firestore Store never manually updated
6. **No Complex Queuing**: Simple boolean check, no event queues needed

**Update Actions That Check `isOptimistic`:**

All these actions check before writing to Firestore:

- `finishDrag()` - Drag end position
- `finishTransform()` - Resize/rotate end
- `updateText()` - Text content changes

Creation action (`createShape`) is the only one that doesn't check, because it's creating the object.

---

### Phase 9: Design System Component Library - Priority: HIGH ✅ COMPLETED

**Goal**: Build a reusable design system for consistent UI patterns

**Status**: ✅ COMPLETE - All components built and integrated

#### Phase I: Building Design System

- [x] Create design tokens (colors, typography, spacing, shadows)
- [x] Create Card component (elevated, outlined, flat variants)
- [x] Create Input component (with labels, error/success states, password toggle, icons)
- [x] Create Button component (primary, secondary, outline, ghost variants with loading states)
- [x] Setup React Hot Toast for notifications
- [x] Create comprehensive documentation

#### Phase II: Integration

- [x] Integrate Toast notifications (login, signup, connection status)
- [x] Integrate Card component into Login/SignUp pages
- [x] Integrate Button component into Login/SignUp/Header
- [x] Integrate Input component into Login/SignUp pages

**Benefits**:

- Material-UI inspired modern aesthetic
- Consistent styling across entire application
- Full accessibility (ARIA labels, keyboard navigation)
- Password visibility toggle on password inputs
- Loading states on buttons
- Connection status toast notifications

**Files Created**:

- `src/styles/tokens.js`
- `src/components/design-system/Card.jsx`
- `src/components/design-system/Input.jsx`
- `src/components/design-system/Button.jsx`
- `src/utils/toast.js`
- `src/components/design-system/README.md`

**Files Modified**:

- `src/App.jsx` (added Toaster)
- `src/components/auth/Login.jsx`
- `src/components/auth/SignUp.jsx`
- `src/components/ui/Header.jsx`
- `src/components/ui/ConnectionStatus.jsx`

---

### Phase 10: AI Agent Integration - Priority: HIGH (Week MVP Final Feature)

**Goal**: Add AI-powered natural language canvas manipulation

**Status**: ✅ Core Complete (PR #16) / 🔄 Advanced Features In Progress (PR #17)

**Target Rubric Score**: Good-to-Excellent (18-25 points out of 25)

**PR #16 Status** (✅ Complete):

- ✅ Firebase Functions backend with OpenAI GPT-4
- ✅ 7 core tools (3 creation + 4 manipulation)
- ✅ Frontend AI chat interface
- ✅ Secure API key management
- ✅ Authentication and error handling

**PR #17 Status** (🔄 Planned):

- [ ] 4 additional tools (2 layout + 2 complex)
- [ ] Full function calling flow testing
- [ ] Conversation memory
- [ ] Performance optimization
- [ ] Rubric validation

---

#### Architecture: Firebase Functions Backend with OpenAI

**Security-First Approach** (**API Keys NOT Exposed**)

- ✅ OpenAI API key stored securely on Firebase servers (NEVER in frontend code)
- ✅ Firebase Cloud Functions (serverless) handles all OpenAI API calls
- ✅ Frontend authenticated via existing Firebase Auth
- ✅ Users cannot directly access or abuse API quota

**Technology Stack:**

- **Backend**: Firebase Cloud Functions (Node.js serverless)
- **AI Model**: OpenAI GPT-4 (or GPT-3.5-turbo for speed)
- **Pattern**: OpenAI Function Calling (not LangChain for MVP simplicity)
- **Authentication**: Firebase Auth (existing system)
- **Sync**: Firestore real-time listeners (existing infrastructure)

**System Flow:**

```
User: "Create 5 blue circles in a row"
    ↓
Frontend (React) → Firebase Function: aiAgent()
    ↓ [Authenticated request with command]
Firebase Function → OpenAI API (server-side, key secure)
    ↓ [Tools definition + user command]
OpenAI GPT-4 → Analyzes & Returns Tool Calls
    ↓ [5× createShape with calculated positions]
Firebase Function → Executes Tools
    ↓ [Writes 5 circle objects to Firestore]
Firestore → Real-time Sync (existing system)
    ↓
All Users → See shapes appear instantly
```

---

#### Command Implementation (11 Commands - Exceeds "Excellent")

**Creation Commands (3)** - Required: 2+

1. `createRectangle` - "Create a red rectangle at position 100, 200"
2. `createCircle` - "Add a blue circle"
3. `createText` - "Make a text layer that says 'Hello World'"

**Manipulation Commands (4)** - Required: 2+ 4. `moveObject` - "Move the circle to the center" 5. `resizeObject` - "Make the rectangle twice as big" 6. `changeColor` - "Change the text to red" 7. `rotateObject` - "Rotate it 45 degrees"

**Layout Commands (2)** - Required: 1+ 8. `arrangeInGrid` - "Arrange these shapes in a 3x3 grid" 9. `distributeHorizontally` - "Space these shapes evenly"

**Complex Commands (2)** - Required: 1+ 10. `createLoginForm` - "Create a login form with username and password fields" 11. `createNavBar` - "Make a navigation bar with 4 menu items"

**Rubric Score**: 11 commands → **Excellent (9-10 points)**

**Complex Command Example:**

```
User: "Create a login form"

AI Execution Plan:
1. Create title text: "Login"
2. Create username label + input rectangle
3. Create password label + input rectangle
4. Create submit button (rectangle + text)
5. Calculate vertical positions with spacing
6. Center align all elements

Result: 7+ objects properly arranged → Excellent (7-8 points)
```

---

#### Performance Targets (Rubric Requirements)

**Response Time:**

- **Target**: 2-3 seconds → Good (4-5 points)
- **Stretch**: Sub-2 seconds → Excellent (6-7 points)

**Breakdown:**

- Firebase Function cold start: 1-2s (first call only)
- Firebase Function warm: ~200ms
- OpenAI API response: 1-2s
- Tool execution (Firestore writes): 100-500ms
- **Total**: 2-3s average, ~1.5s when warm

**Accuracy**: 80%+ (Good), 90%+ (Excellent)

**Multi-User Support:**

- ✅ Multiple users can use AI simultaneously
- ✅ All changes sync via existing Firestore
- ✅ No conflicts (AI acts like any authenticated user)

---

#### Implementation Phases

**Phase 1: Firebase Functions Setup**

- [ ] Initialize Firebase Functions: `firebase init functions`
- [ ] Install OpenAI SDK in functions directory
- [ ] Set up secure API key: `firebase functions:config:set openai.key="sk-..."`
- [ ] Deploy test function to verify setup

**Phase 2: Core Tool Definitions**

- [ ] Define 11 OpenAI tool schemas (JSON format)
- [ ] Implement tool execution logic in Firebase Function
- [ ] Test each tool individually
- [ ] Verify Firestore writes sync correctly

**Phase 3: AI Agent Function**

- [ ] Create main `aiAgent` Firebase Function
- [ ] Integrate OpenAI API with function calling
- [ ] Handle tool call parsing and execution
- [ ] Add error handling, retries, and logging

**Phase 4: Frontend Integration**

- [ ] Create AI chat panel (side drawer or modal)
- [ ] Build input/output UI components
- [ ] Implement Firebase Function calls from frontend
- [ ] Add loading states and visual feedback

**Phase 5: Complex Commands**

- [ ] Implement `createLoginForm` multi-step logic
- [ ] Implement `createNavBar` with spacing calculations
- [ ] Test complex command execution
- [ ] Verify proper object positioning and arrangement

**Phase 6: Testing & Polish**

- [ ] Test all 11 command types
- [ ] Verify 80%+ accuracy rate
- [ ] Test multi-user AI usage simultaneously
- [ ] Add conversation memory (message history)
- [ ] Final rubric requirements checklist

---

#### File Structure

```
project-root/
├── src/                          # Frontend (existing)
│   ├── components/
│   │   └── ai/
│   │       ├── AIPanel.jsx       # Chat interface UI
│   │       └── AIInput.jsx       # Command input field
│   └── services/
│       └── aiService.js          # Frontend → Firebase Function calls
│
├── functions/                    # Backend (NEW)
│   ├── index.js                  # Main aiAgent function
│   ├── tools.js                  # Tool definitions & execution
│   ├── schemas.js                # OpenAI tool schemas
│   └── package.json              # Backend dependencies (openai)
│
├── firebase.json                 # Firebase configuration
└── .firebaserc                   # Firebase project ID
```

---

#### Security & API Key Management

**OpenAI API Key (100% Secure - NOT Exposed):**

```bash
# Store secret on Firebase servers (encrypted, never in code)
firebase functions:config:set openai.key="sk-your-actual-key-here"

# Optional: backup key
firebase functions:config:set openai.backup_key="sk-backup-key"

# View stored configuration
firebase functions:config:get
```

**Firebase Function with Authentication:**

```javascript
// functions/index.js
const functions = require("firebase-functions");

exports.aiAgent = functions.https.onCall(async (data, context) => {
  // Automatic authentication check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be logged in to use AI"
    );
  }

  // Access API key securely (frontend NEVER sees this)
  const apiKey = functions.config().openai.key;

  // Make OpenAI call server-side
  // ... (key is secure on backend)
});
```

**Key Security Guarantees:**

- ✅ API key stored on Firebase servers (encrypted)
- ✅ Key NEVER appears in frontend code or DevTools
- ✅ Only authenticated Firebase Functions can access key
- ✅ Frontend only calls the Firebase Function (requires auth)

---

#### Cost Estimates

**Firebase Functions Free Tier:**

- 2M invocations/month
- 400K GB-seconds compute time
- **Sufficient for MVP development and testing**

**OpenAI Costs:**

- GPT-4: ~$0.03 per 1K tokens
- Average command: ~500 tokens
- Cost per command: ~$0.015
- **$5 credit ≈ 330 test commands**

**Total MVP Development Cost:** ~$5-10

---

#### Why These Architecture Choices

**Firebase Functions over other backends:**

- ✅ Already using Firebase ecosystem (Auth, Firestore, Realtime DB)
- ✅ Serverless - zero server management
- ✅ Automatic scaling
- ✅ Built-in authentication integration
- ✅ Simple deployment: `firebase deploy --only functions`
- ✅ Free tier adequate for MVP

**OpenAI Function Calling over LangChain:**

- ✅ Simpler implementation (less abstraction)
- ✅ Faster development (tight timeline)
- ✅ Direct control over tool execution
- ✅ Adequate for 11 tools
- ✅ Can upgrade to LangChain post-MVP if needed

**GPT-4 over GPT-3.5-turbo:**

- ✅ Better at complex multi-step commands
- ✅ More reliable tool calling
- ✅ Higher accuracy for rubric requirements
- ✅ Worth extra cost for better score
- ✅ Can A/B test both models

---

#### Success Criteria (Rubric Alignment)

**Command Breadth (Target: 9-10 points)**

- ✅ 11 distinct command types implemented
- ✅ All categories covered: creation, manipulation, layout, complex
- ✅ Commands are diverse and meaningful

**Complex Command Execution (Target: 7-8 points)**

- ✅ "Create login form" produces 7+ properly arranged elements
- ✅ Smart positioning with calculated spacing
- ✅ Multi-step plans execute correctly
- ✅ Handles ambiguity well

**Performance & Reliability (Target: 5-7 points)**

- ✅ 2-3 second average response time
- ✅ 80%+ command accuracy
- ✅ Natural UX with loading feedback
- ✅ Shared state works flawlessly
- ✅ Multi-user AI works simultaneously

**Total Target Score**: 21-25 points out of 25 (Good to Excellent)

---

### Phase 11: Real-Time Object Positions (PR #18) - Priority: HIGH ✅ COMPLETED

**Goal**: Enable real-time visibility of dragging objects across users

**Status**: ✅ COMPLETE - All phases implemented and tested

**Motivation**: Users now see objects moving in real-time as others drag them (similar to cursor visibility), not just final positions after drag ends.

**Architecture**: Hybrid storage - positions in Realtime DB, properties in Firestore

#### Hybrid Data Storage Strategy

**Key Principle**: Split position data (high-frequency updates) from object properties (infrequent updates)

- **Firestore**: All object properties (type, width, height, fill, rotation, etc.) + initial x, y
- **Realtime Database**: Live position data (x, y only)
- **Merge Pattern**: Realtime DB position overrides Firestore position when present

**Benefits:**

- Real-time dragging visibility (like cursors)
- Reduced Firestore writes (position updates don't touch Firestore)
- Persistent fallback (Firestore still has last known position)
- Zero breaking changes (x, y kept in Firestore for creation and fallback)

#### Data Structures

**Firestore (Persistent Object Properties):**

```javascript
// Path: /projects/shared-canvas/objects/{objectId}
{
  // Identity
  id: "aBc123XyZ",           // Firestore-generated ID
  type: "rectangle",          // "rectangle" | "circle" | "text"

  // Position (FALLBACK - used if no Realtime DB position exists)
  x: 100,
  y: 200,

  // Dimensions & Appearance
  width: 150,
  height: 100,
  radius: 50,                 // For circles only
  fill: "#ff0000",
  rotation: 0,
  zIndex: 1,

  // Text-specific
  text: "Hello World",        // For text objects only
  fontSize: 16,

  // Metadata
  createdBy: "user123",
  createdAt: timestamp,       // Set once, immutable
  lastEditedBy: "user456",
  lastEditedAt: timestamp     // Updates on edits
}
```

**Realtime Database (Live Positions):**

```javascript
// Path: /objectPositions/{objectId}
{
  "aBc123XyZ": {
    x: 150,                    // Current x position
    y: 250,                    // Current y position
    timestamp: 1697123456789   // Last update time (optional)
  }
}
```

**Key Design Decision**: Realtime DB stores ONLY position (x, y). All other properties remain in Firestore.

#### Object Creation Flow

1. **User Creates Object**

   ```javascript
   actions.createShape(x, y, "rectangle", currentUser);
   ```

2. **Add Optimistic Object to Local Store (with local ID)**

   ```javascript
   const localId = generateObjectId(); // "obj_1760650554461_abc123"
   useLocalStore.getState().addOptimisticObject(localId, {
     type: "rectangle",
     x,
     y, // Initial position
     width: 100,
     height: 100,
     fill: "#3B82F6",
     isOptimistic: true,
   });
   ```

3. **Write to Firestore (includes initial x, y)**

   ```javascript
   const docRef = await addDoc(
     collection(db, "projects/shared-canvas/objects"),
     {
       type: "rectangle",
       x,
       y, // ← Initial position stored in Firestore
       width: 100,
       height: 100,
       // ...other properties
     }
   );
   ```

4. **Get Firestore-Generated ID**

   ```javascript
   const firestoreId = docRef.id; // "aBc123XyZ"
   ```

5. **Reconcile IDs in Local Store**

   ```javascript
   useLocalStore.getState().reconcileObjectId(localId, firestoreId);
   ```

6. **Write Initial Position to Realtime DB**

   **IMPORTANT**: This happens AFTER getting the Firestore ID.

   ```javascript
   const positionRef = ref(realtimeDb, `objectPositions/${firestoreId}`);
   await set(positionRef, {
     x,
     y,
     timestamp: serverTimestamp(), // Realtime DB server timestamp
   });
   ```

**Why this order?**

- Need Firestore ID first (can't write to Realtime DB without object ID)
- Optimistic object uses local ID initially
- After reconciliation, both stores use Firestore ID

#### Position Update Flow (Dragging)

**During Drag:**

```javascript
// User drags object
onDragMove(objectId, newX, newY);

// 1. Update Local Store immediately (optimistic)
useLocalStore.getState().setLocalObjectPosition(objectId, { x: newX, y: newY });

// 2. Write to Realtime DB (high-frequency updates)
const positionRef = ref(realtimeDb, `objectPositions/${objectId}`);
await set(positionRef, {
  x: newX,
  y: newY,
  timestamp: serverTimestamp(),
});

// 3. DO NOT write to Firestore yet (wait for drag end)
```

**On Drag End:**

```javascript
// User releases drag
onDragEnd(objectId, finalX, finalY);

// 1. Update Local Store
useLocalStore
  .getState()
  .setLocalObjectPosition(objectId, { x: finalX, y: finalY });

// 2. Write final position to Realtime DB ONLY
const positionRef = ref(realtimeDb, `objectPositions/${objectId}`);
await set(positionRef, {
  x: finalX,
  y: finalY,
  timestamp: serverTimestamp(),
});

// 3. DO NOT write to Firestore
// Position is now exclusively managed by Realtime DB
```

**Key Change**: After this PR, object positions are NEVER written to Firestore after initial creation. All position updates go to Realtime DB only.

#### Position Merge Strategy

**Reading Objects for Rendering:**

```javascript
// Canvas.jsx

// 1. Read objects from Firestore Store (has all properties except live position)
const firestoreObjects = useFirestoreStore((state) => state.objects.sorted);

// 2. Read positions from Presence Store (via useObjectPositions hook)
const objectPositions = usePresenceStore((state) => state.objectPositions.data);

// 3. Merge: Realtime position overrides Firestore position
const mergedObjects = firestoreObjects.map((obj) => ({
  ...obj,
  x: objectPositions[obj.id]?.x ?? obj.x, // Realtime DB first, fallback to Firestore
  y: objectPositions[obj.id]?.y ?? obj.y,
}));

// 4. Apply local drag/transform overlays (existing logic)
const finalObjects = mergedObjects.map((obj) => {
  const dragOverlay = localObjectPositions[obj.id];
  const transformOverlay = localObjectTransforms[obj.id];

  return {
    ...obj,
    ...(dragOverlay && { x: dragOverlay.x, y: dragOverlay.y }),
    ...(transformOverlay && {
      width: transformOverlay.width,
      height: transformOverlay.height,
      rotation: transformOverlay.rotation,
    }),
  };
});
```

**Priority Order (Highest to Lowest):**

1. **Local Overlay** (actively dragging/transforming) → Highest priority
2. **Realtime DB Position** (live position from other users or self)
3. **Firestore Position** (initial position, fallback) → Lowest priority

#### Realtime DB Position Subscription

**New Hook: `useObjectPositions.js`**

```javascript
import { useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { realtimeDb } from "../lib/firebase";
import usePresenceStore from "../stores/presenceStore";

export default function useObjectPositions() {
  const setObjectPositions = usePresenceStore(
    (state) => state.setObjectPositions
  );
  const setPositionsLoading = usePresenceStore(
    (state) => state.setPositionsLoading
  );
  const setPositionsError = usePresenceStore(
    (state) => state.setPositionsError
  );

  useEffect(() => {
    setPositionsLoading(true);

    // Subscribe to all object positions
    const positionsRef = ref(realtimeDb, "objectPositions");

    const unsubscribe = onValue(
      positionsRef,
      (snapshot) => {
        const positions = snapshot.val() || {};
        // positions = { "aBc123": { x: 100, y: 200 }, "dEf456": { x: 300, y: 400 } }
        setObjectPositions(positions);
        setPositionsLoading(false);
      },
      (error) => {
        console.error("Error syncing object positions:", error);
        setPositionsError(error);
        setPositionsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [setObjectPositions, setPositionsLoading, setPositionsError]);
}
```

**Called in Canvas.jsx**: `useObjectPositions();`

#### Presence Store Updates

**Added to `presenceStore.js`:**

```javascript
// Add to store state
objectPositions: {
  data: {},           // { objectId: { x, y, timestamp } }
  isLoading: true,
  error: null,
  lastSyncTime: null
}

// Add actions
setObjectPositions: (positions) => set(
  (state) => ({
    objectPositions: {
      ...state.objectPositions,
      data: positions,
      isLoading: false,
      lastSyncTime: Date.now()
    }
  }),
  false,
  "setObjectPositions"
),

setPositionsLoading: (isLoading) => set(
  (state) => ({
    objectPositions: { ...state.objectPositions, isLoading }
  }),
  false,
  "setPositionsLoading"
),

setPositionsError: (error) => set(
  (state) => ({
    objectPositions: { ...state.objectPositions, error, isLoading: false }
  }),
  false,
  "setPositionsError"
)
```

#### Object Deletion Flow

When deleting an object, clean up BOTH databases:

```javascript
// actions.deleteObjects(objectIds, currentUser)

// 1. Remove from Firestore (existing)
for (const id of objectIds) {
  await deleteDoc(doc(db, "projects/shared-canvas/objects", id));
}

// 2. Remove from Realtime DB (NEW)
for (const id of objectIds) {
  const positionRef = ref(realtimeDb, `objectPositions/${id}`);
  await set(positionRef, null); // Delete by setting to null
}

// 3. Remove from Local Store optimistic objects
useLocalStore.getState().deleteSelectedObjects();
```

#### Firebase Realtime Database Security Rules

Apply these rules in Firebase Console (Realtime Database → Rules):

```json
{
  "rules": {
    ".read": "auth != null",
    "cursors": {
      "$userId": {
        ".write": "auth != null && auth.uid == $userId"
      }
    },
    "presence": {
      "$userId": {
        ".write": "auth != null && auth.uid == $userId"
      }
    },
    "selections": {
      "$userId": {
        ".write": "auth != null && auth.uid == $userId"
      }
    },
    "objectPositions": {
      "$objectId": {
        ".write": "auth != null"
      }
    }
  }
}
```

**Key Differences:**

- `cursors`, `presence`, `selections`: Users can only write their own data (path includes userId)
- `objectPositions`: Any authenticated user can write any object's position (collaborative editing)

#### Migration Strategy

**Existing Objects:** Objects created before this PR have positions in Firestore but not Realtime DB.

**Automatic Fallback:**

```javascript
// If Realtime DB position doesn't exist, use Firestore position
x: objectPositions[obj.id]?.x ?? obj.x; // ✅ Falls back automatically
```

**Optional Migration Script** (can run once):

```javascript
async function migrateAllPositions() {
  // 1. Read all objects from Firestore
  const objectsSnapshot = await getDocs(
    collection(db, "projects/shared-canvas/objects")
  );

  // 2. For each object, copy position to Realtime DB
  for (const doc of objectsSnapshot.docs) {
    const obj = doc.data();
    const positionRef = ref(realtimeDb, `objectPositions/${doc.id}`);

    await set(positionRef, {
      x: obj.x,
      y: obj.y,
      timestamp: Date.now(),
    });
  }

  console.log("✅ Migrated all positions to Realtime DB");
}
```

**Decision**: Migration script is **optional**. The fallback pattern handles old objects gracefully.

#### Performance Characteristics

**Before PR #18 (Firestore Only):**

- Position updates: Firestore writes (~50-200ms latency)
- Real-time sync: Via `onSnapshot` WebSocket
- Frequency: Limited to avoid Firestore write costs

**After PR #18 (Hybrid):**

- Position updates: Realtime DB writes (~10-50ms latency)
- Real-time sync: Via `onValue` WebSocket
- Frequency: Can update at cursor speed (22 times/second)

**Result**: 4-20x faster position updates, smoother drag visibility

#### Edge Cases Handled

1. **Object exists in Firestore but not Realtime DB**

   - ✅ Use Firestore position (fallback)
   - Common for objects created before this PR

2. **Object exists in Realtime DB but not Firestore**

   - ✅ Ignore orphan position (Firestore is source of truth for objects)
   - Clean up orphan positions periodically (optional)

3. **Network issues**

   - ✅ Firestore offline persistence continues to work
   - ✅ Realtime DB reconnects automatically
   - ✅ Fall back to Firestore position if Realtime DB unavailable

4. **User disconnects during drag**

   - ⚠️ Position persists in Realtime DB (unlike cursors)
   - ✅ This is correct behavior (objects should stay where they are)
   - ✅ No `onDisconnect()` cleanup needed for positions

5. **Multiple users drag same object**

   - ✅ Last write wins (existing behavior)
   - ✅ Conflict resolution via `lastEditedAt` timestamp (existing)

6. **Optimistic objects (local ID)**

   - ⚠️ Can't write to Realtime DB until Firestore ID exists
   - ✅ Local overlay handles position during optimistic phase
   - ✅ After reconciliation, position written to Realtime DB

7. **Flicker on page load**
   - ✅ Canvas waits for both Firestore and Realtime DB to load before rendering shapes
   - ✅ Prevents objects from rendering with Firestore position, then jumping to Realtime DB position

#### Implementation Complete

**Phase 1: Realtime DB Position Layer** ✅

- [x] Added `objectPositions` state to Presence Store
- [x] Created `useObjectPositions` hook
- [x] Updated `actions.createShape` to write position to Realtime DB after Firestore ID
- [x] Updated Canvas.jsx to merge Realtime DB positions with Firestore objects

**Phase 2: Update Drag Logic** ✅

- [x] Updated `actions.moveObject` to write to Realtime DB during drag
- [x] Updated `actions.finishDrag` to write to Realtime DB ONLY (not Firestore)
- [x] Removed Firestore position writes from drag handlers

**Phase 3: Cleanup & Edge Cases** ✅

- [x] Updated `actions.deleteObjects` to clean up Realtime DB positions
- [x] Fallback behavior working (old objects use Firestore position)
- [x] Optimistic objects working (position overlay during optimistic phase)
- [x] Flicker on page load fixed (conditional rendering)

**Phase 4: Testing** ✅

- [x] Real-time drag visibility tested and working
- [x] Fallback behavior tested (old objects use Firestore position)
- [x] Network disconnect/reconnect tested
- [x] Object deletion cleanup verified (both databases)

**Files Created:**

- ✅ `src/hooks/useObjectPositions.js` - Realtime DB position subscription
- ✅ `src/stores/REALTIME_POSITIONS.md` - Architecture documentation

**Files Modified:**

- ✅ `src/stores/presenceStore.js` - Added objectPositions state
- ✅ `src/stores/actions.js` - Updated createShape, moveObject, finishDrag, deleteObjects
- ✅ `src/components/canvas/Canvas.jsx` - Position merge logic + conditional rendering

**Actual Time**: ~1 hour

**Key Achievements:**

- Zero breaking changes to existing code
- Real-time dragging visibility (like cursors)
- Reduced Firestore writes (cost savings)
- Automatic fallback for old objects
- No performance regression

---

### Phase 11.5: Selection Tracking (PR #19) - Priority: MEDIUM ✅ COMPLETED

**Goal**: Show what objects other users are currently selecting with colored borders

**Status**: ✅ COMPLETE - All phases implemented and tested

**Motivation**: Users can now see what collaborators are focusing on in real-time, improving coordination and reducing conflicts

**Architecture**: Realtime Database for user selections + visual border overlays

#### Selection Data Model

**Realtime Database Path:**

```
/selections/{userId}
  - objectId: string | null (null if nothing selected)
  - userName: string
  - userColor: string (from user's cursor color)
  - timestamp: number (server timestamp)
  - Auto-deleted via onDisconnect()
```

#### Visual Design

- Each remote user's selection shows as a colored border (3px thick)
- Border color matches that user's cursor color
- Border appears outside the object (not inside or interfering with transform handles)
- Only show borders for _other_ users' selections (not your own)
- Your own selection uses existing selection highlight (blue, different visual style)
- Multiple users selecting same object: Nested borders with 3px offset per user

#### Implementation Complete

**Phase 1: Realtime DB Selection Tracking** ✅

- [x] Created Realtime DB selection schema at `/selections/{userId}`
- [x] Created `useSelectionTracking` hook to write current user's selection
- [x] Created `useSelectionSync` hook to subscribe to remote users' selections
- [x] Updated Presence Store to store remote selections
- [x] Selection updates written immediately (no throttling needed for single selection)
- [x] Set up `onDisconnect().remove()` for cleanup

**Phase 2: Visual Indicators** ✅

- [x] Added selection border rendering logic in Canvas
- [x] Updated shape components (Rectangle, Circle, Text) to render colored borders
- [x] Handle multiple users selecting same object (nested borders with 3px offset)
- [x] Borders appear with 80% opacity for subtle appearance
- [x] Ensured borders don't interfere with transform handles (separate layer, listening: false)

**Phase 3: Integration & UX** ✅

- [x] Integrated selection tracking into Canvas component
- [x] Updated selection actions to trigger Realtime DB writes
- [x] Track primary selected object only for MVP (first in selectedObjectIds array)
- [x] Handle deselection (clear from Realtime DB)

**Phase 4: Testing & Edge Cases** ✅

- [x] Handle disconnects (onDisconnect cleanup working)
- [x] Handle deleted objects (stale selections cleared gracefully)
- [x] Tested multi-user scenarios (2-3+ users selecting same/different objects)
- [x] Performance testing (10+ users selecting objects, no FPS drops)
- [x] Sign out cleanup (selection removed from Realtime DB)
- [x] Network reconnection (instant selection updates via `useConnectionState` hook)

**Additional Features:**

- [x] **`useConnectionState` hook**: Monitors Firebase Realtime DB connection state
  - Enables instant reconnection detection for all Realtime DB features
  - Cursor and presence update immediately on network reconnect (no 5-30 second delay)
  - Selections update immediately on reconnect

**Key Design Decisions:**

- ✅ Track only primary selected object for MVP (not full multi-select)
- ✅ Selection updates written immediately (no throttling needed - single write per selection change)
- ✅ Auto-cleanup with onDisconnect() when user leaves
- ✅ Visual indicator: nested borders with user's cursor color (80% opacity)
- ✅ Multiple users selecting same object: Each user gets their own border at 3px offset

**Files Created:**

- ✅ `src/hooks/useSelectionTracking.js` - Track current user's selection
- ✅ `src/hooks/useSelectionSync.js` - Subscribe to remote selections
- ✅ `src/hooks/useConnectionState.js` - Monitor Firebase connection state for instant reconnection

**Files Modified:**

- ✅ `src/stores/presenceStore.js` - Added remoteSelections state + selection operations
- ✅ `src/stores/actions.js` - Integrated selection tracking actions
- ✅ `src/components/canvas/Canvas.jsx` - Integrated hooks and render logic
- ✅ `src/components/canvas/shapes/Rectangle.jsx` - Render selection borders
- ✅ `src/components/canvas/shapes/Circle.jsx` - Render selection borders
- ✅ `src/components/canvas/shapes/Text.jsx` - Render selection borders
- ✅ `src/lib/firebase.js` - Added selection cleanup on signout
- ✅ `src/hooks/usePresence.js` - Added reconnection detection for instant updates
- ✅ `src/hooks/useCursorTracking.js` - Added reconnection detection for instant updates

**Actual Time**: ~30 minutes

**Key Achievements:**

- Figma-like collaborative selection awareness
- Improved collaboration coordination
- Reduced conflicts (users see what others are working on)
- Instant network reconnection (no delay for cursor/presence/selections)
- Nested borders for multiple users selecting same object
- Comprehensive edge case handling

**Benefits:**

- Improved collaboration awareness
- Reduced conflicts (users see what others are working on)
- Better coordination for simultaneous editing
- Figma-like collaborative UX
- Instant reconnection after network issues

---

### Phase 11.75: UI Modernization (PR #20) - Priority: MEDIUM ✅ COMPLETED

**Goal**: Modernize canvas UI components to follow the design system

**Status**: ✅ COMPLETE

**Motivation**: Apply design system tokens (colors, typography, spacing) to create a cohesive, professional look across the entire canvas interface

**Scope**: Header, Toolbar, PresencePanel, ZoomControls, ConnectionStatus

#### Components Modernized

1. ✅ **Header** - Significantly enhanced with gradient effects, logo placeholder, subtitle
2. ✅ **Toolbar** - Design system colors, modern tool buttons, hover/active states
3. ✅ **PresencePanel** - Card-like styling, modern user display, smooth animations
4. ✅ **ZoomControls** - Design system colors, modern buttons, consistent layout
5. ✅ **ConnectionStatus** - Design system colors for status indicators

#### Performance Optimizations Applied

**Static Style Extraction** - All components optimized for render performance:

- ✅ Moved static styles outside components (created once at module load)
- ✅ Kept dynamic styles inside (depend on state/props)
- ✅ Split mixed objects into static base + dynamic override pattern
- ✅ Reduced render allocations by ~80% (100+ → 15-20 object allocations per render)

**Optimization Pattern:**

```javascript
// Static styles - outside component
const staticStyle = { color: "blue", padding: "10px" };

// Dynamic styles - inside component
const dynamicStyle = {
  ...staticBaseStyle,
  backgroundColor: isHovered ? "red" : "blue",
};
```

#### Design Tokens Applied

- ✅ **Colors**: Primary, neutral, semantic colors from design system
- ✅ **Typography**: Font sizes, weights, line heights
- ✅ **Spacing**: Consistent padding, margins, gaps
- ✅ **Border Radius**: Consistent rounded corners
- ✅ **Shadows**: Elevation system for depth
- ✅ **Transitions**: Smooth animations for interactions

#### Implementation Complete

**Phase 1: Header Modernization** ✅

- ✅ Added gradient background (neutral.darker → neutral.darkest)
- ✅ Added logo placeholder with primary gradient + glow effect
- ✅ Added gradient text effect on title
- ✅ Added subtitle: "Collaborative Canvas"
- ✅ Improved visual grouping (info card for connection + username)
- ✅ Enhanced spacing and hierarchy
- ✅ Upgraded shadow (elevation[2] → elevation[3])

**Phase 2: Toolbar Modernization** ✅

- ✅ Refactored with design system colors
- ✅ Modern tool buttons with hover/active states
- ✅ Smooth transitions and visual feedback
- ✅ Static styles extracted for performance

**Phase 3: PresencePanel Modernization** ✅

- ✅ Card-like styling with proper elevation
- ✅ Modern user list display with avatars/initials
- ✅ Smooth expand/collapse animation
- ✅ Static styles extracted for performance

**Phase 4: ZoomControls Modernization** ✅

- ✅ Design system colors applied
- ✅ Modern zoom buttons with consistent styling
- ✅ Improved zoom percentage display
- ✅ Static styles extracted for performance

**Phase 5: Polish & Consistency** ✅

- ✅ ConnectionStatus modernized
- ✅ Consistent spacing across all components
- ✅ Smooth transitions on interactive elements
- ✅ No linter errors
- ✅ All tests passing

**Key Achievements:**

1. **Performance Optimization**:

   - Reduced render allocations by ~80%
   - Established pattern for future components
   - All static styles extracted

2. **Visual Modernization**:

   - Header significantly enhanced
   - All components use consistent design tokens
   - Professional, modern aesthetic

3. **Code Quality**:
   - Clear separation of static vs dynamic styles
   - Consistent patterns across all components
   - Ready for production

**Files Modified:**

- ✅ `src/components/ui/Header.jsx` (13 style objects optimized)
- ✅ `src/components/canvas/Toolbar.jsx` (3 style objects optimized)
- ✅ `src/components/canvas/PresencePanel.jsx` (11 style objects optimized)
- ✅ `src/components/canvas/ZoomControls.jsx` (4 style objects optimized)
- ✅ `src/components/ui/ConnectionStatus.jsx` (3 style objects optimized)

**Actual Time**: ~4 hours

**Benefits Achieved:**

- ✅ Cohesive visual design across entire app
- ✅ Professional, modern aesthetic
- ✅ Consistent user experience
- ✅ Matches Login/SignUp page styling
- ✅ 80% reduction in render allocations
- ✅ Foundation for future design system component library

---

### Phase 12: Polish & Performance - Priority: MEDIUM

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

- ✅ Multiplayer cursors with <50ms perceived latency (Realtime DB)
- ✅ Real-time object sync (rectangles, circles, text)
- ✅ Pan and zoom functionality
- ✅ Object transformations (move, resize, rotate)
- ✅ Presence system
- ✅ State persistence (hybrid Firestore + Realtime DB)
- ✅ Google Sign-In and Email/Password authentication
- ✅ Zustand centralized state management with conflict resolution
- ✅ Design System Component Library
- ✅ AI Agent Core Integration (7 tools)
- ✅ Real-time object positions (PR #18) - Realtime DB for dragging visibility
- ✅ Selection tracking (PR #19) - Colored borders showing what others are selecting
- ✅ UI Modernization (PR #20) - Design system applied to all canvas components
- ✅ Deployed and publicly accessible

**Current Work**:

- **PR #16: AI Agent Integration** ✅ CORE COMPLETE

  - ✅ Firebase Functions backend with OpenAI GPT-4
  - ✅ 7 core tools (3 creation + 4 manipulation)
  - ✅ Frontend AI chat interface
  - ✅ Secure API key management
  - ✅ Ready for merge

- **PR #17: AI Advanced Features** 🔄 PLANNED

  - [ ] 4 additional tools (2 layout + 2 complex)
  - [ ] Full function calling flow testing
  - [ ] Conversation memory
  - [ ] Rubric validation (target: 21-25 points)

- **PR #18: Real-Time Object Positions** ✅ COMPLETE

  - [x] Migrated object positions to Realtime DB
  - [x] Real-time dragging visibility (like cursors)
  - [x] Hybrid storage (positions in Realtime DB, properties in Firestore)
  - [x] Zero breaking changes (automatic fallback pattern)
  - [x] Fixed flicker on page load (conditional rendering)
  - [x] 4-20x faster position updates

- **PR #19: Selection Tracking** ✅ COMPLETE

  - [x] Tracked user selections in Realtime DB
  - [x] Show colored borders on objects selected by others
  - [x] Improved collaboration awareness
  - [x] Figma-like collaborative UX
  - [x] Instant network reconnection (useConnectionState hook)
  - [x] Nested borders for multiple users selecting same object

- **PR #20: UI Modernization** ✅ COMPLETE
  - [x] Applied design system to all canvas UI components
  - [x] Modernized Header with gradient effects, logo placeholder, subtitle
  - [x] Modernized Toolbar, PresencePanel, ZoomControls, ConnectionStatus
  - [x] Performance optimization: extracted all static styles (80% reduction in allocations)
  - [x] Created cohesive visual design across entire app
  - [x] Established optimization pattern for future components

**Architecture Highlights**:

- **Hybrid Data Storage**: Firestore (persistent properties) + Realtime DB (high-frequency updates)
- **State Management**: Zustand stores (Local, Firestore, Presence) with optimistic updates
- **Conflict Resolution**: Last-write-wins with `lastEditedAt` timestamps
- **AI Backend**: Firebase Cloud Functions (v2 API) with secure OpenAI integration
- **Security**: API keys stored server-side only (never exposed to frontend)

**Next Priorities**:

- Complete PR #17 (AI advanced features + rubric validation)
- Implement PR #18 (real-time object dragging)
- Implement PR #19 (selection tracking with colored borders)
- Add multi-select and advanced selection features
- Layer management system
- Final performance optimization and polish

---

## Notes

- **Focus on multiplayer first**: A simple canvas with perfect sync beats a feature-rich canvas with broken collaboration
- **Test continuously**: Always have 2 browser windows open while developing
- **Deploy early**: Deploy after Phase 1 to catch deployment issues early
- **Document decisions**: Especially conflict resolution strategy
- **Performance monitoring**: Keep DevTools open, watch FPS counter
