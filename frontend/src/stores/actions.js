import { collection, addDoc } from "firebase/firestore";
import { ref, set as dbSet, serverTimestamp } from "firebase/database";
import { db, realtimeDb } from "../lib/firebase";
import useLocalStore from "./localStore";
import useFirestoreStore from "./firestoreStore";
import usePresenceStore from "./presenceStore";
import {
  createRectangle,
  createCircle,
  createText,
  generateObjectId,
} from "../utils/objectUtils";

/**
 * Central action dispatcher for multi-store operations
 * Coordinates between Local Store, Firestore Store, and Presence Store
 * Implements optimistic update patterns for instant feedback
 */

// Canvas dimensions for constraint calculations
const CANVAS_WIDTH = 5000;
const CANVAS_HEIGHT = 5000;

/**
 * Create a new shape on the canvas
 * @param {number} x - X position in canvas coordinates
 * @param {number} y - Y position in canvas coordinates
 * @param {string} shapeType - Type of shape ('rectangle', 'circle', 'text')
 * @param {Object} currentUser - Current user object
 * @param {Object} options - Optional shape properties
 */
export const createShape = async (
  x,
  y,
  shapeType,
  currentUser,
  options = {}
) => {
  if (!currentUser) return;

  // Generate local ID for optimistic update
  const localId = generateObjectId();
  let shapeData;

  // Create shape data based on type
  switch (shapeType) {
    case "rectangle":
      shapeData = createRectangle(x, y, currentUser.uid, options);
      break;
    case "circle":
      shapeData = createCircle(x, y, currentUser.uid, options);
      break;
    case "text":
      shapeData = createText(x, y, currentUser.uid, options);
      break;
    default:
      return;
  }

  // Optimistic update: Add to Local Store immediately with isOptimistic flag
  useLocalStore.getState().addOptimisticObject(localId, shapeData);

  try {
    // Write to Firestore - addDoc returns the document reference
    const docRef = await addDoc(
      collection(db, "projects", "shared-canvas", "objects"),
      {
        ...shapeData,
      }
    );

    // Get the Firestore-generated ID
    const firestoreId = docRef.id;

    // Reconcile: swap local ID → Firestore ID in Local Store
    // The Firestore listener will pick up the object and add it to Firestore Store
    useLocalStore.getState().reconcileObjectId(localId, firestoreId);

    // PR #18: Write initial position to Realtime DB
    // This happens AFTER getting Firestore ID (can't write to Realtime DB without object ID)
    try {
      const positionRef = ref(realtimeDb, `objectPositions/${firestoreId}`);
      await dbSet(positionRef, {
        x,
        y,
        timestamp: serverTimestamp(),
      });
    } catch (positionError) {
      console.error(
        "Error writing initial position to Realtime DB:",
        positionError
      );
      // Non-fatal: Object still created in Firestore, will fall back to Firestore position
    }
  } catch (error) {
    console.error("Error creating shape:", error);
    // Remove optimistic object on error
    useLocalStore.getState().removeOptimisticObject(localId);
  }
};

/**
 * Start dragging an object
 * @param {string} objectId - ID of the object being dragged
 */
export const startDrag = (objectId) => {
  useLocalStore.getState().setDraggingObjectId(objectId);
};

/**
 * Move an object during drag (optimistic update)
 * @param {string} objectId - ID of the object being dragged
 * @param {Object} newPosition - New position {x, y}
 * @param {Object} objectSize - Object size for constraint calculations
 */
export const moveObject = async (objectId, newPosition, objectSize) => {
  // Constrain position within canvas bounds
  let constrainedX, constrainedY;

  if (objectSize.radius) {
    // For circles: x,y is center position, so constrain using radius
    const radius = objectSize.radius;
    constrainedX = Math.max(
      radius,
      Math.min(newPosition.x, CANVAS_WIDTH - radius)
    );
    constrainedY = Math.max(
      radius,
      Math.min(newPosition.y, CANVAS_HEIGHT - radius)
    );
  } else {
    // For rectangles/text: x,y is top-left corner, so constrain using width/height
    const width = objectSize.width || 0;
    const height = objectSize.height || 0;
    constrainedX = Math.max(0, Math.min(newPosition.x, CANVAS_WIDTH - width));
    constrainedY = Math.max(0, Math.min(newPosition.y, CANVAS_HEIGHT - height));
  }

  const constrainedPosition = { x: constrainedX, y: constrainedY };

  // Update local store immediately for instant feedback
  useLocalStore
    .getState()
    .setLocalObjectPosition(objectId, constrainedPosition);

  // PR #18: Write to Realtime DB for high-frequency updates
  // This allows other users to see real-time drag movement
  try {
    const positionRef = ref(realtimeDb, `objectPositions/${objectId}`);
    await dbSet(positionRef, {
      x: constrainedX,
      y: constrainedY,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating position in Realtime DB:", error);
    // Non-fatal: Local update still applied
  }
};

/**
 * Finish dragging an object
 * @param {string} objectId - ID of the object being dragged
 * @param {Object} finalPosition - Final position {x, y}
 * @param {Object} objectSize - Object size for constraint calculations
 * @param {Object} currentUser - Current user object
 */
export const finishDrag = async (
  objectId,
  finalPosition,
  objectSize,
  currentUser
) => {
  if (!currentUser) return;

  // Clear dragging state
  useLocalStore.getState().setDraggingObjectId(null);

  // Constrain final position within canvas bounds
  let constrainedX, constrainedY;

  if (objectSize.radius) {
    // For circles: x,y is center position, so constrain using radius
    const radius = objectSize.radius;
    constrainedX = Math.max(
      radius,
      Math.min(finalPosition.x, CANVAS_WIDTH - radius)
    );
    constrainedY = Math.max(
      radius,
      Math.min(finalPosition.y, CANVAS_HEIGHT - radius)
    );
  } else {
    // For rectangles/text: x,y is top-left corner, so constrain using width/height
    const width = objectSize.width || 0;
    const height = objectSize.height || 0;
    constrainedX = Math.max(0, Math.min(finalPosition.x, CANVAS_WIDTH - width));
    constrainedY = Math.max(
      0,
      Math.min(finalPosition.y, CANVAS_HEIGHT - height)
    );
  }

  // Check if object is still optimistic (not yet synced to Firestore)
  const isOptimistic = useLocalStore.getState().isObjectOptimistic(objectId);

  // PR #18: Write final position to Realtime DB ONLY (not Firestore)
  // Position is now exclusively managed by Realtime DB after initial creation
  if (!isOptimistic) {
    // Only write if object has been synced to Firestore (has Firestore ID)
    try {
      const positionRef = ref(realtimeDb, `objectPositions/${objectId}`);
      await dbSet(positionRef, {
        x: constrainedX,
        y: constrainedY,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error writing final position to Realtime DB:", error);
      // Non-fatal: Local update still applied
    }
  }
  // Note: For optimistic objects, position will be written to Realtime DB
  // after Firestore ID is generated in createShape()

  // Keep local position until remote update arrives and matches
  // Canvas useEffect will clear it when remote position matches local
};

/**
 * Start transforming an object (resize/rotate)
 * @param {string} objectId - ID of the object being transformed
 */
export const startTransform = (objectId) => {
  useLocalStore.getState().setTransformingObjectId(objectId);
};

/**
 * Transform an object (optimistic update)
 * @param {string} objectId - ID of the object being transformed
 * @param {Object} transformData - Transform data (x, y, width, height, rotation, etc.)
 */
export const transformObject = (objectId, transformData) => {
  // Track that this object is being transformed
  useLocalStore.getState().setTransformingObjectId(objectId);

  // Update local store immediately for responsive UX
  useLocalStore.getState().setLocalObjectTransform(objectId, transformData);
};

/**
 * Finish transforming an object
 * @param {string} objectId - ID of the object being transformed
 * @param {Object} transformData - Final transform data
 * @param {Object} currentUser - Current user object
 */
export const finishTransform = async (objectId, transformData, currentUser) => {
  if (!currentUser) return;

  // Clear transforming state
  useLocalStore.getState().setTransformingObjectId(null);

  // Check if object is still optimistic (not yet synced to Firestore)
  const isOptimistic = useLocalStore.getState().isObjectOptimistic(objectId);

  if (!isOptimistic) {
    // Only write to Firestore if object exists there
    // Optimistic objects will get their updates when they're created
    await useFirestoreStore
      .getState()
      .updateObjectInFirestore(objectId, transformData, currentUser.uid);
  }

  // Keep local transform until remote update arrives and matches
  // Canvas useEffect will clear it when remote transform matches local
};

/**
 * Delete selected objects
 * @param {string[]} objectIds - Array of object IDs to delete
 * @param {Object} currentUser - Current user object
 */
export const deleteObjects = async (objectIds, currentUser) => {
  if (!currentUser || !objectIds.length) return;

  // Optimistic update: Remove from Firestore Store immediately
  useFirestoreStore.getState().removeObjects(objectIds);

  // Clear selection
  useLocalStore.getState().clearSelection();

  try {
    // Delete from Firestore
    await useFirestoreStore.getState().deleteObjectsFromFirestore(objectIds);

    // PR #18: Clean up Realtime DB positions
    // Delete positions for all deleted objects
    for (const objectId of objectIds) {
      try {
        const positionRef = ref(realtimeDb, `objectPositions/${objectId}`);
        await dbSet(positionRef, null); // Delete by setting to null
      } catch (positionError) {
        console.error(
          `Error deleting position for ${objectId}:`,
          positionError
        );
        // Non-fatal: Object still deleted from Firestore
      }
    }
  } catch (error) {
    console.error("Error deleting objects:", error);
    // Could implement rollback here if needed
  }
};

/**
 * Update text content of a text object
 * @param {string} objectId - ID of the text object
 * @param {string} newText - New text content
 * @param {Object} currentUser - Current user object
 */
export const updateText = async (objectId, newText, currentUser) => {
  if (!currentUser) return;

  // Check if object is still optimistic (not yet synced to Firestore)
  const isOptimistic = useLocalStore.getState().isObjectOptimistic(objectId);

  if (!isOptimistic) {
    // Only write to Firestore if object exists there
    // Text component handles local state during editing
    await useFirestoreStore
      .getState()
      .updateObjectInFirestore(objectId, { text: newText }, currentUser.uid);
  }
  // For optimistic objects, text updates will be saved when the object is created in Firestore
};

/**
 * Select an object
 * @param {string} objectId - ID of the object to select
 */
export const selectObject = (objectId) => {
  useLocalStore.getState().selectObject(objectId);
};

/**
 * Add object to selection
 * @param {string} objectId - ID of the object to add to selection
 */
export const addToSelection = (objectId) => {
  useLocalStore.getState().addToSelection(objectId);
};

/**
 * Deselect an object
 * @param {string} objectId - ID of the object to deselect
 */
export const deselectObject = (objectId) => {
  useLocalStore.getState().deselectObject(objectId);
};

/**
 * Clear all selections
 */
export const clearSelection = () => {
  useLocalStore.getState().clearSelection();
};

/**
 * Update canvas view (pan/zoom)
 * @param {Object} stagePosition - New stage position {x, y}
 * @param {number} stageScale - New stage scale
 */
export const updateCanvasView = (stagePosition, stageScale) => {
  useLocalStore.getState().setStagePosition(stagePosition);
  useLocalStore.getState().setStageScale(stageScale);
};

/**
 * Set canvas mode (tool selection)
 * @param {string} mode - Canvas mode ('select', 'rectangle', 'circle', 'text')
 */
export const setCanvasMode = (mode) => {
  useLocalStore.getState().setCanvasMode(mode);
};

/**
 * Update cursor position
 * @param {Object} position - Cursor position {x, y}
 * @param {Object} currentUser - Current user object
 */
export const updateCursorPosition = async (position, currentUser) => {
  if (!currentUser) return;

  // Update local cursor position immediately
  usePresenceStore.getState().setLocalCursorPosition(position);

  // Throttle Firestore updates (this would be handled by the cursor tracking hook)
  // For now, just update the local position
};

/**
 * Initialize presence for a user
 * @param {Object} currentUser - Current user object
 */
export const initializePresence = async (currentUser) => {
  if (!currentUser) return;

  await usePresenceStore.getState().initializePresence(currentUser);
};

/**
 * Update presence for a user
 * @param {Object} currentUser - Current user object
 */
export const updatePresence = async (currentUser) => {
  if (!currentUser) return;

  await usePresenceStore.getState().updatePresence(currentUser);
};

/**
 * Remove presence for a user
 * @param {Object} currentUser - Current user object
 */
export const removePresence = async (currentUser) => {
  if (!currentUser) return;

  await usePresenceStore.getState().removePresence(currentUser);
};

/**
 * Remove cursor for a user
 * @param {Object} currentUser - Current user object
 */
export const removeCursor = async (currentUser) => {
  if (!currentUser) return;

  await usePresenceStore.getState().removeCursor(currentUser);
};

/**
 * Update selection in Realtime DB (PR #19)
 * @param {string} objectId - Object ID that is now selected
 * @param {Object} currentUser - Current user object
 */
export const updateSelection = async (objectId, currentUser) => {
  if (!currentUser) return;

  await usePresenceStore.getState().updateSelection(currentUser, objectId);
};

/**
 * Remove selection from Realtime DB (PR #19)
 * @param {Object} currentUser - Current user object
 */
export const removeSelection = async (currentUser) => {
  if (!currentUser) return;

  await usePresenceStore.getState().removeSelection(currentUser);
};

/**
 * Get active object IDs (for preventing remote updates during drag/transform)
 * @returns {Object} Object with active object IDs
 */
export const getActiveObjectIds = () => {
  return useLocalStore.getState().getActiveObjectIds();
};

/**
 * Clear all local state (for cleanup)
 */
export const clearAllLocalState = () => {
  useLocalStore.getState().clearAllLocalObjectPositions();
  useLocalStore.getState().clearAllLocalObjectTransforms();
  useLocalStore.getState().clearSelection();
};

/**
 * Clear all store state (for logout/cleanup)
 */
export const clearAllStores = () => {
  useLocalStore.getState().clearAll();
  useFirestoreStore.getState().clearAll();
  usePresenceStore.getState().clearAll();
};

// Export all actions as a single object for easier importing
export const actions = {
  // Object operations
  createShape,
  startDrag,
  moveObject,
  finishDrag,
  startTransform,
  transformObject,
  finishTransform,
  deleteObjects,
  updateText,

  // Selection operations
  selectObject,
  addToSelection,
  deselectObject,
  clearSelection,

  // Canvas operations
  updateCanvasView,
  setCanvasMode,

  // Presence operations
  updateCursorPosition,
  initializePresence,
  updatePresence,
  removePresence,
  removeCursor,

  // Selection tracking (PR #19)
  updateSelection,
  removeSelection,

  // Utility operations
  getActiveObjectIds,
  clearAllLocalState,
  clearAllStores,
};

export default actions;
