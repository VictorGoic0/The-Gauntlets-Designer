# Code Reference - Quick Lookup

## File Structure Overview

```
src/
├── components/
│   ├── auth/
│   │   ├── Login.jsx                  # Google Sign-In page
│   │   ├── ProtectedRoute.jsx         # Auth route guard
│   │   └── __tests__/
│   ├── canvas/
│   │   ├── Canvas.jsx                 # Main Konva Stage (5,000x5,000px)
│   │   ├── Cursor.jsx                 # Remote user cursor display
│   │   ├── PresencePanel.jsx          # Online users list
│   │   ├── Toolbar.jsx                # Shape tool buttons
│   │   ├── ZoomControls.jsx           # Zoom in/out/reset UI
│   │   ├── shapes/
│   │   │   └── Rectangle.jsx          # Rectangle shape component
│   │   └── __tests__/
│   └── ui/
│       └── Header.jsx                 # User info and sign out
├── contexts/
│   ├── AuthContext.jsx                # Auth state (Google user)
│   ├── CanvasContext.jsx              # Canvas state (pan, zoom, selection, mode)
│   └── __tests__/
├── hooks/
│   ├── useAuth.js                     # Access auth context
│   ├── useCanvas.js                   # Access canvas context
│   ├── useCursorSync.js               # Listen to remote cursors
│   ├── useCursorTracking.js           # Track and send local cursor
│   ├── useObjectSync.js               # Sync canvas objects with Firestore
│   ├── usePresence.js                 # Manage user presence
│   ├── usePresenceSync.js             # Listen to presence updates
│   └── __tests__/
├── lib/
│   └── firebase.js                    # Firebase config and auth functions
├── pages/
│   └── CanvasPage.jsx                 # Main canvas page layout
├── utils/
│   ├── firestoreUtils.js              # Firestore update/delete helpers
│   ├── objectUtils.js                 # Canvas object utilities
│   ├── userColors.js                  # 10-color palette
│   └── __tests__/
├── App.jsx                            # Root component with routing
├── main.jsx                           # App entry point
└── index.css                          # Global styles
```

---

## Custom Hooks

### useAuth()

**File**: `src/hooks/useAuth.js`

**Purpose**: Access authentication state

**Returns:**

```javascript
{
  currentUser: User | null,    // Firebase user object
  loading: boolean             // Auth state loading
}
```

**Usage:**

```javascript
import { useAuth } from "../hooks/useAuth";

function MyComponent() {
  const { currentUser, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!currentUser) return <div>Not signed in</div>;

  return <div>Hello {currentUser.displayName}</div>;
}
```

---

### useCanvas()

**File**: `src/hooks/useCanvas.js`

**Purpose**: Access canvas state and controls

**Returns:**

```javascript
{
  // Pan state
  stagePosition: { x: number, y: number },
  setStagePosition: (pos) => void,

  // Zoom state
  stageScale: number,
  setStageScale: (scale) => void,
  MIN_SCALE: 0.1,
  MAX_SCALE: 5,

  // Selection state
  selectedObjectIds: string[],
  selectObject: (id) => void,
  addToSelection: (id) => void,
  deselectObject: (id) => void,
  clearSelection: () => void,
  isSelected: (id) => boolean,

  // Canvas mode
  canvasMode: 'select' | 'rectangle' | 'circle' | 'text',
  setCanvasMode: (mode) => void
}
```

**Usage:**

```javascript
import { useCanvas } from "../hooks/useCanvas";

function ZoomControls() {
  const { stageScale, setStageScale, MIN_SCALE, MAX_SCALE } = useCanvas();

  const zoomIn = () => setStageScale(Math.min(stageScale * 1.2, MAX_SCALE));
  const zoomOut = () => setStageScale(Math.max(stageScale / 1.2, MIN_SCALE));

  return (
    <div>
      <button onClick={zoomIn}>+</button>
      <span>{Math.round(stageScale * 100)}%</span>
      <button onClick={zoomOut}>-</button>
    </div>
  );
}
```

---

### useCursorTracking()

**File**: `src/hooks/useCursorTracking.js`

**Purpose**: Track local mouse position and send to Firebase

**Parameters:**

- `stageRef`: React ref to Konva Stage
- `stagePosition`: Current pan position
- `stageScale`: Current zoom scale

**Internal Behavior:**

- Tracks mouse move events on Stage
- Throttles updates to 100ms (10 updates/sec)
- Writes to Firebase Realtime Database: `cursors/shared-canvas/{userId}`
- Sets up `onDisconnect()` to auto-delete cursor
- Includes user name, color, position, timestamp

**Data Written:**

```javascript
{
  x: number,
  y: number,
  userName: string,
  userColor: string,
  lastSeen: timestamp
}
```

**Usage:**

```javascript
import { useCursorTracking } from "../hooks/useCursorTracking";

function Canvas() {
  const stageRef = useRef(null);
  const { stagePosition, stageScale } = useCanvas();

  // Hook automatically tracks cursor and sends to Firebase
  useCursorTracking(stageRef, stagePosition, stageScale);

  return <Stage ref={stageRef}>...</Stage>;
}
```

---

### useCursorSync()

**File**: `src/hooks/useCursorSync.js`

**Purpose**: Listen to remote cursors from Firebase

**Returns:**

```javascript
{
  remoteCursors: Array<{
    userId: string,
    x: number,
    y: number,
    userName: string,
    userColor: string,
    lastSeen: timestamp
  }>
}
```

**Internal Behavior:**

- Listens to Firebase Realtime Database: `cursors/shared-canvas/`
- Filters out current user's cursor
- Applies cursor interpolation for smooth movement (<50ms perceived latency)
- Auto-updates when cursors added/removed

**Usage:**

```javascript
import { useCursorSync } from "../hooks/useCursorSync";

function Canvas() {
  const { remoteCursors } = useCursorSync();

  return (
    <Layer>
      {remoteCursors.map((cursor) => (
        <Cursor
          key={cursor.userId}
          x={cursor.x}
          y={cursor.y}
          userName={cursor.userName}
          userColor={cursor.userColor}
        />
      ))}
    </Layer>
  );
}
```

---

### useObjectSync()

**File**: `src/hooks/useObjectSync.js`

**Purpose**: Sync canvas objects (shapes) with Firestore

**Returns:**

```javascript
{
  objects: Array<{
    id: string,
    type: 'rectangle' | 'circle' | 'text',
    x: number,
    y: number,
    width: number,
    height: number,
    fill: string,
    rotation: number,
    // ... other shape-specific fields
  }>,
  addObject: (object) => void,
  updateObject: (id, updates) => void,
  deleteObject: (id) => void
}
```

**Internal Behavior:**

- Listens to Firestore: `/projects/shared-canvas/objects`
- Optimistic updates (local state updated immediately)
- Writes to Firestore on create/update/delete
- Uses server timestamps for conflict resolution
- Last-write-wins strategy (except deletes)
- Deletes take absolute priority

**Usage:**

```javascript
import { useObjectSync } from "../hooks/useObjectSync";

function Canvas() {
  const { objects, addObject, updateObject, deleteObject } = useObjectSync();

  const handleClick = (e) => {
    const { x, y } = e.target.getStage().getPointerPosition();
    addObject({
      type: "rectangle",
      x,
      y,
      width: 100,
      height: 100,
      fill: "#3B82F6",
    });
  };

  return (
    <Layer>
      {objects.map((obj) => (
        <Rectangle
          key={obj.id}
          {...obj}
          onDragEnd={(e) => {
            updateObject(obj.id, { x: e.target.x(), y: e.target.y() });
          }}
        />
      ))}
    </Layer>
  );
}
```

---

### usePresence()

**File**: `src/hooks/usePresence.js`

**Purpose**: Manage current user's presence status

**Internal Behavior:**

- Writes to Firebase Realtime Database: `presence/shared-canvas/{userId}`
- Sets `isOnline: true` on mount
- Updates `lastSeen` every 30 seconds (heartbeat)
- Sets `isOnline: false` on unmount
- Sets up `onDisconnect()` to set `isOnline: false`

**Data Written:**

```javascript
{
  userName: string,
  userEmail: string,
  userColor: string,
  isOnline: boolean,
  lastSeen: timestamp
}
```

**Usage:**

```javascript
import { usePresence } from "../hooks/usePresence";

function CanvasPage() {
  // Hook automatically manages presence
  usePresence();

  return <Canvas />;
}
```

---

### usePresenceSync()

**File**: `src/hooks/usePresenceSync.js`

**Purpose**: Listen to all users' presence status

**Returns:**

```javascript
{
  onlineUsers: Array<{
    userId: string,
    userName: string,
    userEmail: string,
    userColor: string,
    isOnline: boolean,
    lastSeen: timestamp
  }>
}
```

**Internal Behavior:**

- Listens to Firebase Realtime Database: `presence/shared-canvas/`
- Filters by `isOnline: true` and recent `lastSeen`
- Excludes current user (optional)

**Usage:**

```javascript
import { usePresenceSync } from "../hooks/usePresenceSync";

function PresencePanel() {
  const { onlineUsers } = usePresenceSync();

  return (
    <div>
      <h3>{onlineUsers.length} users online</h3>
      {onlineUsers.map((user) => (
        <div key={user.userId}>
          <span style={{ color: user.userColor }}>●</span>
          {user.userName}
        </div>
      ))}
    </div>
  );
}
```

---

## Utility Functions

### getUserColor(userId)

**File**: `src/utils/userColors.js`

**Purpose**: Get consistent color for a user

**Parameters:**

- `userId`: string - Firebase user ID

**Returns:** string - Hex color from 10-color palette

**Color Palette:**

```javascript
const COLORS = [
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#10B981", // Green
  "#F59E0B", // Amber
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#14B8A6", // Teal
  "#F97316", // Orange
  "#6366F1", // Indigo
  "#84CC16", // Lime
];
```

**Usage:**

```javascript
import { getUserColor } from "../utils/userColors";

const userColor = getUserColor(user.uid);
```

---

### updateObject(objectId, updates)

**File**: `src/utils/firestoreUtils.js`

**Purpose**: Update canvas object in Firestore

**Parameters:**

- `objectId`: string - Object ID
- `updates`: object - Fields to update

**Behavior:**

- Updates document in Firestore: `/projects/shared-canvas/objects/{objectId}`
- Adds `lastModified: FieldValue.serverTimestamp()`
- Adds `lastModifiedBy: userId`

**Usage:**

```javascript
import { updateObject } from "../utils/firestoreUtils";

updateObject("rect-123", { x: 100, y: 200 });
```

---

### deleteObject(objectId)

**File**: `src/utils/firestoreUtils.js`

**Purpose**: Delete canvas object from Firestore

**Parameters:**

- `objectId`: string - Object ID

**Behavior:**

- Deletes document from Firestore: `/projects/shared-canvas/objects/{objectId}`
- Deletion takes priority (optimistic deletion)

**Usage:**

```javascript
import { deleteObject } from "../utils/firestoreUtils";

deleteObject("rect-123");
```

---

## Firebase Functions

### signInWithGoogle()

**File**: `src/lib/firebase.js`

**Purpose**: Sign in user with Google popup

**Returns:** Promise<User>

**Usage:**

```javascript
import { signInWithGoogle } from "../lib/firebase";

async function handleSignIn() {
  try {
    const user = await signInWithGoogle();
    console.log("Signed in:", user.displayName);
  } catch (error) {
    console.error("Sign in failed:", error);
  }
}
```

---

### signOutUser()

**File**: `src/lib/firebase.js`

**Purpose**: Sign out current user

**Behavior:**

- Removes presence from Realtime Database
- Signs out from Firebase Auth

**Usage:**

```javascript
import { signOutUser } from "../lib/firebase";

async function handleSignOut() {
  try {
    await signOutUser();
    console.log("Signed out");
  } catch (error) {
    console.error("Sign out failed:", error);
  }
}
```

---

## Key Constants

### Canvas Dimensions

```javascript
const CANVAS_WIDTH = 5000; // pixels
const CANVAS_HEIGHT = 5000; // pixels
```

### Zoom Limits

```javascript
const MIN_SCALE = 0.1; // 10% zoom
const MAX_SCALE = 5; // 500% zoom
```

### Cursor Throttle

```javascript
const CURSOR_THROTTLE_MS = 100; // 10 updates per second
```

### Presence Heartbeat

```javascript
const PRESENCE_HEARTBEAT_MS = 30000; // Update every 30 seconds
```

### Project ID

```javascript
const PROJECT_ID = "shared-canvas"; // Hardcoded for MVP
```

---

## Common Patterns

### Optimistic Update Pattern

```javascript
// 1. Update local state immediately
updateObjectLocally(objectId, updates);

// 2. Write to Firestore (async)
await updateObjectInFirestore(objectId, {
  ...updates,
  lastModified: FieldValue.serverTimestamp(),
  lastModifiedBy: userId,
});
```

### Server Timestamp Pattern

```javascript
import { FieldValue } from "firebase/firestore";

await setDoc(docRef, {
  // ... other fields
  lastModified: FieldValue.serverTimestamp(),
});
```

### onDisconnect Pattern

```javascript
import { ref, onDisconnect, set } from "firebase/database";

const presenceRef = ref(realtimeDb, `presence/shared-canvas/${userId}`);

// Set up auto-cleanup
onDisconnect(presenceRef).update({
  isOnline: false,
  lastSeen: serverTimestamp(),
});
```

### Throttle Pattern

```javascript
import { throttle } from "lodash"; // or custom implementation

const throttledUpdate = throttle((data) => {
  writeToFirebase(data);
}, 100); // 100ms throttle

// Call freely, only executes every 100ms
throttledUpdate(cursorPosition);
```

---

## Environment Variables

```env
# Firebase Config
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
VITE_FIREBASE_DATABASE_URL=...
```

**Access in code:**

```javascript
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
```
