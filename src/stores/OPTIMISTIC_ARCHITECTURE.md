# Optimistic Objects Architecture

This document describes how CollabCanvas handles optimistic object creation with automatic ID reconciliation.

## Architecture Overview

**Local Store** - Client-side state with optimistic objects
**Firestore Store** - Pure reflection of Firestore (updated ONLY by listeners)
**Actions** - Business logic that writes to Firestore and Local Store

## The Three Stores

### Local Store (`localStore.js`)

- Canvas view (zoom, pan)
- Selection state
- Dragging overlays (optimistic positions)
- Transform overlays (optimistic transforms)
- **Optimistic objects** (not yet synced to Firestore)

### Firestore Store (`firestoreStore.js`)

- Objects from Firestore (synced)
- Updated ONLY by `useObjectSync` listener
- Never manually updated by actions

### Presence Store (`presenceStore.js`)

- Online users
- Remote cursors
- Connection status

## Object Creation Flow

### 1. User Creates Object

```javascript
actions.createShape(x, y, "rectangle", currentUser);
```

### 2. Generate Local ID & Add to Local Store

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

### 3. Write to Firestore & Get ID Back

```javascript
const docRef = await addDoc(collection(db, "..."), shapeData);
const firestoreId = docRef.id; // "aBc123XyZ" ← Firestore-generated ID
```

**Result**: Firestore creates document with its own ID

### 4. Reconcile IDs

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

### 5. Listener Picks Up Object

```javascript
// useObjectSync listener receives the new object
onSnapshot(query, (snapshot) => {
  useFirestoreStore.getState().setObjects(snapshot.docs);
  // Object is now in Firestore Store with Firestore ID
});
```

**Result**: Object moves from Local Store → Firestore Store

## Manipulating Optimistic Objects

### Before Reconciliation (Local ID)

User can drag, resize, rotate the object immediately:

```javascript
// User drags object with local ID
actions.moveObject("obj_1760650554461_abc123", { x: 150, y: 200 });

// Updates Local Store dragging overlay
useLocalStore.getState().setLocalObjectPosition(localId, { x, y });
```

### Firestore Writes Blocked

```javascript
// When drag ends
actions.finishDrag(localId, finalPosition, currentUser);

// Check if optimistic
const isOptimistic = useLocalStore.getState().isObjectOptimistic(localId);

if (!isOptimistic) {
  // Write to Firestore
  await updateObjectInFirestore(...);
} else {
  // Skip - object doesn't exist in Firestore yet
  console.log("Skipping Firestore write - optimistic object");
}
```

**Result**: Local changes are instant, but don't write to Firestore yet

### After Reconciliation (Firestore ID)

```javascript
// reconcileObjectId() was called, now using Firestore ID

// User drags again
actions.finishDrag("aBc123XyZ", finalPosition, currentUser);

// Check if optimistic
const isOptimistic = useLocalStore.getState().isObjectOptimistic("aBc123XyZ");
// → false (no longer in optimisticObjects)

// Write to Firestore
await updateObjectInFirestore("aBc123XyZ", { x, y }, userId);
```

**Result**: Changes now persist to Firestore

## Rendering Objects

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

Then apply dragging/transform overlays as before:

```javascript
const finalPosition = localObjectPositions[obj.id] || { x: obj.x, y: obj.y };
const finalTransform = localObjectTransforms[obj.id] || obj;
```

## Key Benefits

1. **Instant Feedback**: Objects appear immediately
2. **Full Manipulation**: Can drag/resize before Firestore confirms
3. **Automatic Reconciliation**: ID swap handled by `addDoc()` return value
4. **Simple Flag**: `isOptimistic` check prevents premature Firestore writes
5. **Clean Architecture**: Firestore Store never manually updated
6. **No Complex Queuing**: Simple boolean check, no event queues needed

## The `isOptimistic` Flag

This boolean flag is the key to the architecture:

```javascript
// In addOptimisticObject
{
  id: localId,
  type: "rectangle",
  x: 100, y: 100,
  isOptimistic: true  // ← Set on creation
}

// In all update actions
const isOptimistic = useLocalStore.getState().isObjectOptimistic(objectId);

if (!isOptimistic) {
  // Write to Firestore
  await updateObjectInFirestore(...);
}
// else: skip Firestore write
```

Once `reconcileObjectId()` is called, the object is removed from `optimisticObjects` and `isObjectOptimistic()` returns `false`.

## Update Actions That Check `isOptimistic`

All these actions check before writing to Firestore:

- `finishDrag()` - Drag end position
- `finishTransform()` - Resize/rotate end
- `updateText()` - Text content changes

Creation action (`createShape`) is the only one that doesn't check, because it's creating the object.

## State Flow Diagram

```
1. User Creates Object
   ↓
2. [Local ID in Local Store + isOptimistic: true]
   ↓
3. Object visible & draggable immediately
   ↓
4. User manipulates → Local Store updates (no Firestore writes)
   ↓
5. addDoc() writes to Firestore
   ↓
6. Returns Firestore ID
   ↓
7. reconcileObjectId(localId, firestoreId)
   ↓
8. [Firestore ID everywhere + removed from optimisticObjects]
   ↓
9. Listener adds object to Firestore Store
   ↓
10. User manipulates → Writes to Firestore ✅
```

## Error Handling

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

The object disappears from the canvas if creation fails.

## Why This Architecture Works

1. **Firestore Store is Pure**: Only updated by listeners, never by actions
2. **Local Store Owns Optimistic State**: Temporary objects live there
3. **Simple Reconciliation**: `addDoc()` returns the ID immediately
4. **No Complex Matching**: No need to match by timestamps or properties
5. **Single Boolean Check**: `isOptimistic` prevents premature writes
6. **Clear Separation**: Optimistic vs. Synced objects are in different stores
