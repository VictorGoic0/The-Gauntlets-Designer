# Firebase Data Model

## Project Structure

**MVP uses a single hardcoded project ID**: `'shared-canvas'`
All authenticated users have access to this shared canvas.

## Firestore Collections

### `/projects/shared-canvas` (Document)

Root document for the shared canvas project.

**Fields:**

- `name`: string - "Shared Canvas"
- `createdAt`: timestamp - Project creation time
- `lastModified`: timestamp - Last modification (server timestamp)

### `/projects/shared-canvas/objects/{objectId}` (Collection)

All canvas objects (shapes) stored here.

**Fields:**

- `type`: string - Shape type: `'rectangle'` | `'circle'` | `'line'` | `'text'`
- `x`: number - X coordinate on canvas
- `y`: number - Y coordinate on canvas
- `width`: number - Object width (for rectangles)
- `height`: number - Object height (for rectangles)
- `radius`: number - Radius (for circles)
- `rotation`: number - Rotation angle in degrees
- `fill`: string - Fill color (hex or rgba)
- `stroke`: string - Stroke color (hex or rgba)
- `text`: string - Text content (for text objects)
- `fontSize`: number - Font size (for text objects)
- `fontFamily`: string - Font family (for text objects)
- `zIndex`: number - Layer order (stacking)
- `createdBy`: string - User ID of creator
- `lastModifiedBy`: string - User ID of last modifier
- `lastModified`: timestamp - Last modification time (**FieldValue.serverTimestamp()**)

**Key Notes:**

- `objectId` is generated client-side (unique ID)
- `lastModified` uses **server timestamp** for conflict resolution
- Server timestamp determines which update wins in conflicts
- Deletes take priority over all other operations

### `/projects/shared-canvas/cursors/{userId}` (Collection)

Real-time cursor positions for all connected users.

**Storage**: Firebase Realtime Database (not Firestore)

**Fields:**

- `x`: number - Cursor X coordinate
- `y`: number - Cursor Y coordinate
- `userName`: string - User's display name (from Google account)
- `userColor`: string - Assigned color (from 10-color palette)
- `lastSeen`: timestamp - Last update time (server timestamp)

**Key Notes:**

- Updates throttled to **100ms per user** (10 updates/second)
- **Auto-deleted via `onDisconnect()`** when user disconnects
- Cursor interpolation on client side for smooth <50ms perceived latency
- Color randomly assigned from 10 predefined colors

### `/projects/shared-canvas/presence/{userId}` (Collection)

User presence tracking (who's online).

**Storage**: Firebase Realtime Database (not Firestore)

**Fields:**

- `userName`: string - User's display name
- `userEmail`: string - User's email
- `userColor`: string - User's assigned color (same as cursor)
- `isOnline`: boolean - Online status
- `lastSeen`: timestamp - Last seen time (server timestamp)

**Key Notes:**

- `lastSeen` updated every **30 seconds** via heartbeat
- `onDisconnect()` sets `isOnline: false` and updates `lastSeen`
- Filtered by `isOnline` status and recent `lastSeen` to show active users

## Firestore vs Realtime Database Usage

### Firestore (Document Database)

- **Canvas Objects** - Structured documents with rich queries
- Best for: Complex data structures, queries, offline support

### Realtime Database (Key-Value Store)

- **Cursors** - High-frequency updates, auto-cleanup
- **Presence** - Connection state, onDisconnect triggers
- Best for: Real-time presence, connection state, auto-cleanup

## Data Sync Patterns

### Object Creation

```javascript
// Client generates ID
const objectId = generateUniqueId();

// Optimistic update (local state)
addObjectLocally(objectId, objectData);

// Write to Firestore
await setDoc(doc(db, "projects/shared-canvas/objects", objectId), {
  ...objectData,
  createdBy: userId,
  lastModifiedBy: userId,
  lastModified: FieldValue.serverTimestamp(),
});
```

### Object Update (Move/Resize/Rotate)

```javascript
// Optimistic update (local state)
updateObjectLocally(objectId, updates);

// Write to Firestore on drag end
await updateDoc(doc(db, "projects/shared-canvas/objects", objectId), {
  ...updates,
  lastModifiedBy: userId,
  lastModified: FieldValue.serverTimestamp(),
});
```

### Object Deletion

```javascript
// Optimistic deletion (local state)
deleteObjectLocally(objectId);

// Immediate Firestore deletion
await deleteDoc(doc(db, "projects/shared-canvas/objects", objectId));

// Deletion takes priority over any concurrent operations
```

### Cursor Update (Throttled)

```javascript
// Throttled to 100ms
throttle(() => {
  const cursorRef = ref(realtimeDb, `cursors/shared-canvas/${userId}`);
  set(cursorRef, {
    x: cursorX,
    y: cursorY,
    userName: user.displayName,
    userColor: userColor,
    lastSeen: serverTimestamp(),
  });
}, 100);

// Auto-cleanup on disconnect
onDisconnect(cursorRef).remove();
```

### Presence Update

```javascript
// On mount
const presenceRef = ref(realtimeDb, `presence/shared-canvas/${userId}`);
set(presenceRef, {
  userName: user.displayName,
  userEmail: user.email,
  userColor: userColor,
  isOnline: true,
  lastSeen: serverTimestamp(),
});

// Heartbeat every 30 seconds
setInterval(() => {
  update(presenceRef, { lastSeen: serverTimestamp() });
}, 30000);

// Auto-cleanup on disconnect
onDisconnect(presenceRef).update({
  isOnline: false,
  lastSeen: serverTimestamp(),
});
```

## Firestore Security Rules

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

**Current Rules:**

- Any authenticated user can read/write to shared canvas
- No granular permissions (MVP simplicity)
- No validation rules (trust clients for MVP)

**Future Considerations:**

- Per-project permissions
- Validate data structure on write
- Rate limiting
- User roles (owner, editor, viewer)

## Realtime Database Security Rules

```json
{
  "rules": {
    "cursors": {
      "shared-canvas": {
        "$userId": {
          ".read": "auth != null",
          ".write": "$userId === auth.uid"
        }
      }
    },
    "presence": {
      "shared-canvas": {
        "$userId": {
          ".read": "auth != null",
          ".write": "$userId === auth.uid"
        }
      }
    }
  }
}
```

**Current Rules:**

- Users can only write their own cursor/presence data
- All authenticated users can read all cursors/presence
- Prevents malicious cursor updates from other users

## Conflict Resolution Strategy

### Last-Write-Wins (LWW)

- Uses **server timestamps** to determine order
- Most recent `lastModified` timestamp wins
- Simple and performant for MVP

### Optimistic Deletion Priority

- Deletes take **absolute priority** over concurrent operations
- If User A deletes while User B moves, delete wins
- Prevents "ghost objects" that keep reappearing

### No Locking Mechanism

- MVP does not implement object locking
- Multiple users can edit same object simultaneously
- Last user to finish editing wins
- Future: Could add visual indicators for concurrent editing

## Performance Considerations

### Firestore Limits

- 1 write/second per document (for sustained writes)
- 10,000 writes/day on free tier
- 50,000 reads/day on free tier

### Realtime Database Limits

- 100 concurrent connections on free tier
- 1GB data storage on free tier
- 10GB/month download on free tier

### Optimization Strategies

- Cursor throttling (100ms) reduces write load
- Server timestamps prevent clock drift issues
- Optimistic updates hide network latency
- onDisconnect() reduces stale data cleanup burden
