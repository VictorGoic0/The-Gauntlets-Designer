# Optimistic Updates Pattern

This document describes the optimistic updates pattern implemented in CollabCanvas for instant user feedback.

## Overview

Optimistic updates provide immediate visual feedback by updating local state first, then syncing to Firestore asynchronously. This creates a responsive UX where users see changes instantly, even before the server confirms them.

## Pattern Implementation

### 1. Drag Operations

**moveObject** (during drag):

```javascript
// Update local store immediately for instant feedback
useLocalStore.getState().setLocalObjectPosition(objectId, position);
```

**finishDrag** (drag end):

```javascript
// Write final position to Firestore
await useFirestoreStore
  .getState()
  .updateObjectInFirestore(objectId, position, userId);

// Keep local position until remote update arrives to prevent flicker
// The sync layer will clear it when remote position matches
```

### 2. Transform Operations

**transformObject** (during resize/rotate):

```javascript
// Track that this object is being transformed
useLocalStore.getState().setTransformingObjectId(objectId);

// Update local store immediately for responsive UX
useLocalStore.getState().setLocalObjectTransform(objectId, transformData);
```

**finishTransform** (transform end):

```javascript
// Clear transforming state
useLocalStore.getState().setTransformingObjectId(null);

// Write final transform to Firestore
await useFirestoreStore
  .getState()
  .updateObjectInFirestore(objectId, transformData, userId);

// Keep local transform until remote update arrives to prevent snap-back
// The sync layer will clear it when remote transform matches
```

### 3. Delete Operations

**deleteObjects**:

```javascript
// Optimistic update: Remove from Firestore Store immediately
useFirestoreStore.getState().removeObjects(objectIds);

// Clear selection
useLocalStore.getState().clearSelection();

try {
  // Delete from Firestore
  await useFirestoreStore.getState().deleteObjectsFromFirestore(objectIds);
} catch (error) {
  console.error("Error deleting objects:", error);
  // Could implement rollback here if needed
}
```

## Key Principles

### 1. **Immediate Local Update**

Always update the local store first for instant visual feedback.

### 2. **Asynchronous Firestore Write**

Write to Firestore after local update, don't wait for confirmation.

### 3. **No Rollback for MVP**

Assume Firestore writes always succeed. No rollback mechanism needed for MVP.

### 4. **Conflict Resolution via Sync**

Remote updates from other users will override local optimistic state when they arrive via sync listeners.

### 5. **Prevent Flicker**

Keep local state until remote update matches to prevent visual flickering:

- Local position cleared when remote position matches (within 1px tolerance)
- Local transform cleared when remote transform matches (within tolerance)

## Sync Reconciliation

The sync layer automatically reconciles local and remote state:

**Canvas.jsx cleanup effects**:

```javascript
// Clear local positions when remote updates match
useEffect(() => {
  Object.keys(currentLocalPositions).forEach((objectId) => {
    const remoteObject = objects.find((obj) => obj.id === objectId);
    if (remoteObject) {
      const localPos = currentLocalPositions[objectId];
      // If remote position matches local (within 1px tolerance), clear local
      if (
        Math.abs(remoteObject.x - localPos.x) < 1 &&
        Math.abs(remoteObject.y - localPos.y) < 1
      ) {
        store.clearLocalObjectPosition(objectId);
      }
    }
  });
}, [objects]);
```

## Active Object Protection

During drag/transform, prevent remote updates from overriding local state:

**activeObjectIds tracking**:

```javascript
const activeObjectIds = useMemo(() => {
  return {
    ...localObjectPositions, // Currently dragging
    ...Object.keys(localObjectTransforms).reduce((acc, id) => {
      acc[id] = true;
      return acc;
    }, {}), // Currently transforming
  };
}, [localObjectPositions, localObjectTransforms]);

// Pass to sync layer
useObjectSync(activeObjectIds);
```

**Firestore Store handling**:

```javascript
// If this object is currently being dragged
if (draggingIds.includes(objectId)) {
  // Store the remote update for later
  newPendingUpdates[objectId] = { id: objectId, ...data };

  // Keep using the current object data (don't override during drag)
  const currentObject = state.currentObjectsMap[objectId];
  if (currentObject) {
    objectsArray.push(currentObject);
  }
  return;
}
```

## Benefits

1. **Instant Feedback**: Users see changes immediately
2. **Perceived Performance**: App feels faster and more responsive
3. **Smooth UX**: No visual jumps or delays
4. **Conflict Prevention**: Active objects protected from remote updates
5. **Simple Mental Model**: Update local, write remote, sync reconciles

## Trade-offs

**Pros**:

- Excellent user experience
- Simple to implement and understand
- Works well at MVP scale

**Cons**:

- No rollback mechanism (assumes writes succeed)
- Could show incorrect state if write fails (low probability)
- Last-write-wins means concurrent edits have one winner

## Future Enhancements

For post-MVP, consider:

- Error handling with rollback for failed writes
- Operational Transforms (OT) for better conflict resolution
- CRDTs for true conflict-free collaboration
- Retry logic for failed Firestore writes
- User notification for sync conflicts
