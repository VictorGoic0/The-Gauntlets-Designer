# Key Patterns and Decisions

## Critical Design Decisions

### 1. Single Shared Canvas Model
**Decision**: Use a hardcoded project ID (`'shared-canvas'`) accessible to all authenticated users.

**Rationale:**
- MVP simplicity over multi-project complexity
- Faster development time
- Easy to test with multiple users
- Focus on real-time sync infrastructure

**Tradeoffs:**
- No project isolation
- No per-project permissions
- All users see same canvas
- Future refactor needed for multi-project support

**Future Path**: Add project collection with user permissions after MVP

---

### 2. Optimistic Updates with Server Reconciliation
**Decision**: Apply changes locally first, then sync to Firestore.

**Rationale:**
- Instant feedback for users (feels fast)
- Hides network latency
- Better UX than waiting for server round-trip

**Implementation:**
```javascript
// Optimistic update pattern
function moveObject(objectId, newPosition) {
  // 1. Update local state immediately
  updateObjectLocally(objectId, newPosition);
  
  // 2. Write to Firestore (async)
  updateObjectInFirestore(objectId, newPosition);
}
```

**Tradeoffs:**
- Potential for temporary inconsistencies
- Requires reconciliation logic
- More complex than server-first approach

---

### 3. Last-Write-Wins Conflict Resolution
**Decision**: Use server timestamps to determine which update wins.

**Rationale:**
- Simple and performant
- No complex OT (Operational Transform) or CRDT needed for MVP
- Firestore provides server timestamps automatically
- Most collaborative tools use this for MVP

**Implementation:**
```javascript
// Always use server timestamp
await updateDoc(docRef, {
  ...updates,
  lastModified: FieldValue.serverTimestamp()
});

// Client compares timestamps to accept/reject updates
if (remoteUpdate.lastModified > localObject.lastModified) {
  applyRemoteUpdate(remoteUpdate);
}
```

**Tradeoffs:**
- One user's work can be overwritten
- No intention preservation
- Not suitable for text editing
- Works well for object positioning

**Future Path**: Consider OT or CRDTs for text editing features

---

### 4. Optimistic Deletion Priority
**Decision**: Deletes take absolute priority over all concurrent operations.

**Rationale:**
- Prevents "ghost objects" that keep reappearing
- User expectation: delete should be immediate and permanent
- Avoids confusing UX of deleted objects coming back

**Implementation:**
```javascript
// Delete locally AND in Firestore immediately
function deleteObject(objectId) {
  // Local delete (optimistic)
  removeObjectLocally(objectId);
  
  // Firestore delete (no timestamp check)
  deleteDoc(doc(db, 'projects/shared-canvas/objects', objectId));
}

// In sync logic: ignore updates for deleted objects
if (localDeletedObjects.includes(objectId)) {
  return; // Don't apply remote update
}
```

**Tradeoffs:**
- Can't undo accidental deletes (no undo feature)
- Goes against pure LWW strategy
- Works well for MVP UX

**Future Path**: Add undo buffer before implementing this exception

---

### 5. Cursor Throttling (100ms) with Interpolation
**Decision**: Send cursor updates every 100ms, but interpolate on client for smooth display.

**Rationale:**
- Reduces Firestore write load (10 updates/sec vs 60)
- Achieves <50ms perceived latency target
- Balances performance and cost

**Implementation:**
```javascript
// Throttle cursor writes to 100ms
throttle(() => {
  writeCursorToFirebase(cursorPosition);
}, 100);

// Interpolate between positions for smooth display
function interpolateCursor(from, to, progress) {
  return {
    x: from.x + (to.x - from.x) * progress,
    y: from.y + (to.y - from.y) * progress
  };
}
```

**Performance:**
- Firestore writes: 10/sec per user (vs 60/sec without throttle)
- Perceived latency: <50ms (via interpolation)
- Network bandwidth: ~6x reduction

---

### 6. Firebase Realtime Database for Cursors/Presence
**Decision**: Use Realtime Database instead of Firestore for cursor and presence data.

**Rationale:**
- Realtime Database has `onDisconnect()` trigger for auto-cleanup
- Better for ephemeral data (cursors, presence)
- Lower latency for real-time updates
- Automatic cleanup reduces manual garbage collection

**Comparison:**
| Feature | Firestore | Realtime Database |
|---------|-----------|-------------------|
| Data Structure | Documents (flexible) | JSON tree (simple) |
| onDisconnect | ❌ Not available | ✅ Built-in |
| Query Flexibility | ✅ Excellent | ⚠️ Limited |
| Real-time Updates | ✅ Fast | ✅ Faster |
| Best For | Structured data, objects | Ephemeral data, presence |

**Our Usage:**
- **Realtime Database**: Cursors, presence
- **Firestore**: Canvas objects (shapes)

---

### 7. Google Sign-In Only (MVP)
**Decision**: No email/password auth, only Google Sign-In.

**Rationale:**
- Fastest to implement
- No password management
- No email verification flow
- Users already have Google accounts
- Display names automatically provided

**Tradeoffs:**
- Excludes users without Google accounts
- No guest mode
- Locked into Google ecosystem

**Future Path**: Add email/password, GitHub, or anonymous auth post-MVP

---

### 8. Konva for Canvas Rendering
**Decision**: Use Konva.js instead of raw HTML5 Canvas or SVG.

**Rationale:**
- Higher-level API (easier than raw Canvas)
- Built-in support for shapes, transformations, events
- React bindings available (`react-konva`)
- Good performance for MVP requirements
- Active community and documentation

**Alternatives Considered:**
- **Raw Canvas**: Too low-level, slower development
- **SVG**: Performance issues with many objects
- **Fabric.js**: Similar to Konva, but Konva has better React integration

---

### 9. Tailwind CSS for Styling
**Decision**: Use Tailwind utility classes instead of CSS modules or styled-components.

**Rationale:**
- Fast prototyping (no context switching)
- Small bundle size (unused classes purged)
- Consistent design system
- No naming conflicts
- Good for MVP speed

**Tradeoffs:**
- Verbose className attributes
- Less semantic HTML
- Steeper learning curve for some

---

### 10. No Object Locking (MVP)
**Decision**: Allow multiple users to edit same object simultaneously without locks.

**Rationale:**
- Simpler implementation
- Faster development
- Last-write-wins handles conflicts
- Good enough for MVP

**Tradeoffs:**
- One user's changes can be overwritten
- No visual indicator of concurrent editing
- Can be confusing for users

**Future Path**: Add visual indicators (e.g., "User X is editing this object")

---

## Code Organization Patterns

### Custom Hooks Pattern
**Decision**: Extract all stateful logic into custom hooks.

**Benefits:**
- Reusable across components
- Easier to test in isolation
- Separates concerns (logic vs UI)
- Clear dependencies

**Examples:**
- `useAuth()` - Auth state
- `useCanvas()` - Canvas state
- `useCursorTracking()` - Local cursor tracking
- `useCursorSync()` - Remote cursor sync
- `useObjectSync()` - Object synchronization
- `usePresence()` - User presence

---

### Context for Global State
**Decision**: Use React Context API for global state instead of Redux/Zustand.

**Rationale:**
- Built-in to React (no extra dependencies)
- Simple for MVP requirements
- Good enough for current scale
- Easy to understand

**Contexts:**
- `AuthContext` - User authentication
- `CanvasContext` - Canvas state (pan, zoom, selection, mode)

**Tradeoffs:**
- Can cause re-renders if not optimized
- No time-travel debugging
- Less tooling than Redux

**Future Path**: Consider Zustand or Redux if state becomes complex

---

### Flat Component Structure
**Decision**: Keep components flat (avoid deep nesting).

**Structure:**
```
src/components/
  auth/         # Auth-related components
  canvas/       # Canvas-related components
    shapes/     # Shape components
  ui/           # Reusable UI components
```

**Benefits:**
- Easy to find components
- Clear ownership
- Avoid deep import paths
- Scales well for MVP

---

### Co-located Tests
**Decision**: Place tests next to source files in `__tests__` folders.

**Benefits:**
- Easy to find tests for a component
- Tests move with components
- Clear what's tested
- Standard React pattern

---

## Performance Patterns

### Optimistic UI Updates
Always update local state before Firestore write.

### Throttling High-Frequency Events
Cursor updates throttled to 100ms.

### Server Timestamps for Ordering
Use Firestore server timestamps to avoid clock drift issues.

### Memoization (Future)
Plan to use React.memo, useMemo, useCallback for optimization.

---

## Security Patterns

### Environment Variables for Secrets
All Firebase config in `.env.local` (not committed).

### Firestore Security Rules
Only authenticated users can access shared canvas.

### Client-Side Validation (Future)
Plan to add validation before Firestore writes.

---

## Error Handling Patterns

### Console Logging (Current)
```javascript
catch (error) {
  console.error("Error:", error);
  throw error;
}
```

**Future Path**: Add user-facing error messages, toast notifications, error boundaries

---

## Documentation Patterns

### Inline Comments for Complex Logic
```javascript
// Use server timestamp to prevent stale updates
lastModified: FieldValue.serverTimestamp()
```

### README for Setup
Clear setup instructions for new developers.

### PRD and Tasks
Detailed planning documents for implementation.

