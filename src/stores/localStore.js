import { create } from "zustand";
import { devtools } from "zustand/middleware";

// Zoom constraints
const MIN_SCALE = 0.1;
const MAX_SCALE = 5;

const useLocalStore = create(
  devtools(
    (set, get) => ({
      // Canvas view state
      canvas: {
        // Pan state
        stagePosition: { x: 0, y: 0 },
        // Zoom state
        stageScale: 1,
        MIN_SCALE,
        MAX_SCALE,
        // Canvas mode: 'select', 'rectangle', 'circle', 'text'
        mode: "select",
      },

      // Selection state
      selection: {
        selectedObjectIds: [],
      },

      // Dragging state (optimistic updates)
      dragging: {
        // Local object positions during drag
        localObjectPositions: {},
        // Currently dragging object ID for visual feedback
        draggingObjectId: null,
      },

      // Transform state (optimistic updates)
      transforms: {
        // Local object transforms during resize/rotate
        localObjectTransforms: {},
        // Currently transforming object ID for visual feedback
        transformingObjectId: null,
      },

      // Optimistic objects (not yet synced to Firestore)
      optimisticObjects: {
        // Map of localId -> { ...objectData, isOptimistic: true }
        data: {},
      },

      // UI state
      ui: {
        // Additional UI state can be added here as needed
        // For now, keeping it minimal
      },

      // Canvas view actions
      setStagePosition: (position) =>
        set(
          (state) => ({
            canvas: { ...state.canvas, stagePosition: position },
          }),
          false,
          "setStagePosition"
        ),

      setStageScale: (scale) =>
        set(
          (state) => ({
            canvas: {
              ...state.canvas,
              stageScale: Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale)),
            },
          }),
          false,
          "setStageScale"
        ),

      setCanvasMode: (mode) =>
        set(
          (state) => ({
            canvas: { ...state.canvas, mode },
          }),
          false,
          "setCanvasMode"
        ),

      // Selection actions
      selectObject: (objectId) =>
        set(
          () => ({
            selection: { selectedObjectIds: [objectId] },
          }),
          false,
          "selectObject"
        ),

      addToSelection: (objectId) =>
        set(
          (state) => {
            if (!state.selection.selectedObjectIds.includes(objectId)) {
              return {
                selection: {
                  selectedObjectIds: [
                    ...state.selection.selectedObjectIds,
                    objectId,
                  ],
                },
              };
            }
            return state;
          },
          false,
          "addToSelection"
        ),

      deselectObject: (objectId) =>
        set(
          (state) => ({
            selection: {
              selectedObjectIds: state.selection.selectedObjectIds.filter(
                (id) => id !== objectId
              ),
            },
          }),
          false,
          "deselectObject"
        ),

      clearSelection: () =>
        set(
          () => ({
            selection: { selectedObjectIds: [] },
          }),
          false,
          "clearSelection"
        ),

      isSelected: (objectId) => {
        const state = get();
        return state.selection.selectedObjectIds.includes(objectId);
      },

      // Dragging actions
      setLocalObjectPosition: (objectId, position) =>
        set(
          (state) => ({
            dragging: {
              ...state.dragging,
              localObjectPositions: {
                ...state.dragging.localObjectPositions,
                [objectId]: position,
              },
            },
          }),
          false,
          "setLocalObjectPosition"
        ),

      setDraggingObjectId: (objectId) =>
        set(
          (state) => ({
            dragging: { ...state.dragging, draggingObjectId: objectId },
          }),
          false,
          "setDraggingObjectId"
        ),

      clearLocalObjectPosition: (objectId) =>
        set(
          (state) => {
            const newPositions = { ...state.dragging.localObjectPositions };
            delete newPositions[objectId];
            return {
              dragging: {
                ...state.dragging,
                localObjectPositions: newPositions,
              },
            };
          },
          false,
          "clearLocalObjectPosition"
        ),

      clearAllLocalObjectPositions: () =>
        set(
          (state) => ({
            dragging: {
              ...state.dragging,
              localObjectPositions: {},
              draggingObjectId: null,
            },
          }),
          false,
          "clearAllLocalObjectPositions"
        ),

      // Transform actions
      setLocalObjectTransform: (objectId, transformData) =>
        set(
          (state) => ({
            transforms: {
              ...state.transforms,
              localObjectTransforms: {
                ...state.transforms.localObjectTransforms,
                [objectId]: transformData,
              },
            },
          }),
          false,
          "setLocalObjectTransform"
        ),

      setTransformingObjectId: (objectId) =>
        set(
          (state) => ({
            transforms: { ...state.transforms, transformingObjectId: objectId },
          }),
          false,
          "setTransformingObjectId"
        ),

      clearLocalObjectTransform: (objectId) =>
        set(
          (state) => {
            const newTransforms = { ...state.transforms.localObjectTransforms };
            delete newTransforms[objectId];
            return {
              transforms: {
                ...state.transforms,
                localObjectTransforms: newTransforms,
              },
            };
          },
          false,
          "clearLocalObjectTransform"
        ),

      clearAllLocalObjectTransforms: () =>
        set(
          (state) => ({
            transforms: {
              ...state.transforms,
              localObjectTransforms: {},
              transformingObjectId: null,
            },
          }),
          false,
          "clearAllLocalObjectTransforms"
        ),

      // Optimistic objects actions
      addOptimisticObject: (localId, objectData) =>
        set(
          (state) => ({
            optimisticObjects: {
              data: {
                ...state.optimisticObjects.data,
                [localId]: {
                  ...objectData,
                  id: localId,
                  isOptimistic: true,
                },
              },
            },
          }),
          false,
          "addOptimisticObject"
        ),

      removeOptimisticObject: (localId) =>
        set(
          (state) => {
            const { [localId]: _, ...remainingObjects } =
              state.optimisticObjects.data;
            return {
              optimisticObjects: {
                data: remainingObjects,
              },
            };
          },
          false,
          "removeOptimisticObject"
        ),

      reconcileObjectId: (localId, firestoreId) =>
        set(
          (state) => {
            // Remove from optimistic objects
            const { [localId]: _, ...remainingOptimistic } =
              state.optimisticObjects.data;

            // Update dragging positions
            const newDraggingPositions = {
              ...state.dragging.localObjectPositions,
            };
            if (newDraggingPositions[localId]) {
              newDraggingPositions[firestoreId] = newDraggingPositions[localId];
              delete newDraggingPositions[localId];
            }

            // Update transforms
            const newTransforms = { ...state.transforms.localObjectTransforms };
            if (newTransforms[localId]) {
              newTransforms[firestoreId] = newTransforms[localId];
              delete newTransforms[localId];
            }

            // Update dragging ID
            const newDraggingId =
              state.dragging.draggingObjectId === localId
                ? firestoreId
                : state.dragging.draggingObjectId;

            // Update transforming ID
            const newTransformingId =
              state.transforms.transformingObjectId === localId
                ? firestoreId
                : state.transforms.transformingObjectId;

            // Update selection
            const newSelection = state.selection.selectedObjectIds.map((id) =>
              id === localId ? firestoreId : id
            );

            return {
              optimisticObjects: {
                data: remainingOptimistic,
              },
              dragging: {
                ...state.dragging,
                localObjectPositions: newDraggingPositions,
                draggingObjectId: newDraggingId,
              },
              transforms: {
                ...state.transforms,
                localObjectTransforms: newTransforms,
                transformingObjectId: newTransformingId,
              },
              selection: {
                selectedObjectIds: newSelection,
              },
            };
          },
          false,
          "reconcileObjectId"
        ),

      isObjectOptimistic: (objectId) => {
        const state = get();
        return !!state.optimisticObjects.data[objectId]?.isOptimistic;
      },

      // Helper to get active object IDs (for preventing remote updates during drag/transform)
      getActiveObjectIds: () => {
        const state = get();
        return {
          ...state.dragging.localObjectPositions,
          ...Object.keys(state.transforms.localObjectTransforms).reduce(
            (acc, id) => {
              acc[id] = true;
              return acc;
            },
            {}
          ),
        };
      },
    }),
    {
      name: "local-store",
    }
  )
);

export default useLocalStore;
