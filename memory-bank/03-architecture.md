# System Architecture

## Architecture Pattern

**Client-side state management** with **Firebase real-time sync**

### Core Principles

1. **Optimistic Updates**: Local changes applied instantly, then synced to server
2. **Server Reconciliation**: Firestore is source of truth
3. **Last-Write-Wins**: For conflict resolution (except deletes)
4. **Optimistic Deletion**: Deletes take absolute priority over all other operations

## Data Flow

### Client → Server

1. User performs action (create, move, delete shape)
2. Local state updated immediately (optimistic)
3. Action written to Firestore with server timestamp
4. Server timestamp determines operation order

### Server → Client

1. Firestore sends updates via `onSnapshot` listeners
2. Client receives changes from all users
3. Local state reconciled with server state
4. UI updates to reflect changes

## Component Architecture

### Context Providers (Global State)

- **AuthContext** - Google user authentication state
- **CanvasContext** - Canvas state (pan, zoom, selection, mode)

### Page Components

- **CanvasPage** - Main canvas view with header and controls

### Feature Components

#### Auth

- **Login** - Google Sign-In page
- **ProtectedRoute** - Route guard for authenticated users

#### Canvas

- **Canvas** - Main Konva Stage with pan/zoom (5,000 x 5,000px)
- **Toolbar** - Shape tools (select, rectangle, circle, text)
- **ZoomControls** - Zoom in/out/reset buttons
- **PresencePanel** - Online users list
- **Cursor** - Remote user cursor display

#### Shapes

- **Rectangle** - Rectangle shape component
- (Future: Circle, Text)

#### UI

- **Header** - User info and sign out button

### Custom Hooks

#### Authentication

- **useAuth** - Access auth context

#### Canvas State

- **useCanvas** - Access canvas context

#### Real-Time Sync

- **useCursorTracking** - Track and send local cursor (100ms throttle)
- **useCursorSync** - Listen to remote cursors with interpolation
- **usePresence** - Manage user presence (online/offline)
- **usePresenceSync** - Listen to presence updates
- **useObjectSync** - Sync canvas objects (shapes) with Firestore

### Utilities

- **userColors.js** - 10-color palette and random color assignment
- **firestoreUtils.js** - Firestore update/delete operations
- **objectUtils.js** - Canvas object helpers

## State Management Strategy

### Local State (React useState)

- Canvas pan position
- Canvas zoom scale
- Selected object IDs
- Canvas mode (select, rectangle, circle, text)
- Cursor positions (local + remote)
- Canvas objects (shapes)
- User presence list

### Persisted State (Firestore)

- Canvas objects (shapes)
- User cursors (auto-deleted on disconnect)
- User presence (auto-cleaned on disconnect)

### Transient State (Not Synced)

- Selection state (local only)
- Canvas mode (local only)
- Pan/zoom state (local only)

## Real-Time Sync Strategy

### Cursor Sync

- **Throttle**: 100ms per user (10 updates/second)
- **Target Latency**: <50ms perceived (achieved via interpolation)
- **Cleanup**: Auto-deleted via Firebase Realtime Database `onDisconnect()`
- **Color**: Randomly assigned from 10 predefined colors

### Object Sync

- **Create**: Optimistic local + immediate Firestore write
- **Update**: Optimistic local + Firestore write on drag end
- **Delete**: Optimistic local + immediate Firestore write (priority)
- **Conflict Resolution**: Last-write-wins based on server timestamp
- **Exception**: Deletes override any concurrent operations

### Presence Sync

- **Update Frequency**: Every 30 seconds
- **Cleanup**: `onDisconnect()` sets `isOnline: false`
- **Status**: Based on `isOnline` flag and recent `lastSeen` timestamp

## Performance Optimizations

### Rendering

- Konva Stage/Layer for efficient canvas rendering
- Object culling (future: don't render off-screen objects)
- Layer caching (future optimization)

### Network

- Throttled cursor updates (100ms)
- Cursor interpolation for smooth display
- Server timestamps to prevent stale updates
- Optimistic updates to hide network latency

### Data Structure

- Flat object collection (no deep nesting)
- Server timestamps for all time-based logic
- Indexed queries (future: Firestore indexes)

## Security Model

### Firebase Security Rules

```javascript
// Single shared canvas accessible to all authenticated users
match /projects/shared-canvas/{document=**} {
  allow read, write: if request.auth != null;
}
```

### Authentication

- Google Sign-In only (MVP)
- No role-based access control
- Single shared canvas for all users
- Hardcoded project ID: `'shared-canvas'`

## Scalability Considerations

### Current MVP Limits

- Single shared canvas (hardcoded project ID)
- All authenticated users have full access
- No per-project permissions
- No batch operations

### Future Improvements (Post-MVP)

- Multi-project support
- Per-project permissions
- Project sharing and invites
- Batched write operations
- Operational transforms (OT) or CRDTs for better conflict resolution
- More granular security rules
