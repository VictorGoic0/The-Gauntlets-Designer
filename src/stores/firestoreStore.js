import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  collection,
  onSnapshot,
  query,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";

const useFirestoreStore = create(
  devtools(
    (set, get) => ({
      // Firestore-synced state
      objects: {
        // Map of objectId -> object data
        data: {},
        // Array of objects sorted by zIndex
        sorted: [],
        // Loading state
        isLoading: true,
        // Last sync timestamp
        lastSyncTime: null,
        // Error state
        error: null,
      },

      // Connection state
      connection: {
        isConnected: true,
        isOffline: false,
      },

      // Pending updates (for conflict resolution)
      pendingUpdates: {},

      // Current objects map (for drag conflict resolution)
      currentObjectsMap: {},

      // Actions for objects
      setObjects: (objectsData, draggingObjectIds = {}) =>
        set(
          (state) => {
            const draggingIds = Object.keys(draggingObjectIds);
            const newObjectsMap = {};
            const objectsArray = [];

            objectsData.forEach((doc) => {
              const data = doc.data();
              const objectId = doc.id;

              // If this object is currently being dragged
              if (draggingIds.includes(objectId)) {
                // Store the remote update for later
                state.pendingUpdates[objectId] = {
                  id: objectId,
                  ...data,
                };

                // Keep using the current object data (don't override during drag)
                const currentObject = state.currentObjectsMap[objectId];
                if (currentObject) {
                  objectsArray.push(currentObject);
                  newObjectsMap[objectId] = currentObject;
                } else {
                  // First time seeing this object, use remote data
                  const obj = { id: objectId, ...data };
                  objectsArray.push(obj);
                  newObjectsMap[objectId] = obj;
                }
                return;
              }

              // Check if there's a pending update for this object (drag just ended)
              if (state.pendingUpdates[objectId]) {
                const pendingUpdate = state.pendingUpdates[objectId];
                const remoteTimestamp = data.lastModified?.toMillis() || 0;
                const pendingTimestamp =
                  pendingUpdate.lastModified?.toMillis() || 0;

                // Last-write-wins: use the update with the most recent timestamp
                if (remoteTimestamp > pendingTimestamp) {
                  delete state.pendingUpdates[objectId];
                  const obj = { id: objectId, ...data };
                  objectsArray.push(obj);
                  newObjectsMap[objectId] = obj;
                } else {
                  objectsArray.push(pendingUpdate);
                  newObjectsMap[objectId] = pendingUpdate;
                  delete state.pendingUpdates[objectId];
                }
              } else {
                const obj = { id: objectId, ...data };
                objectsArray.push(obj);
                newObjectsMap[objectId] = obj;
              }
            });

            // Sort by zIndex to maintain proper layering
            objectsArray.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

            return {
              objects: {
                ...state.objects,
                data: newObjectsMap,
                sorted: objectsArray,
                isLoading: false,
                lastSyncTime: new Date(),
                error: null,
              },
              currentObjectsMap: newObjectsMap,
            };
          },
          false,
          "setObjects"
        ),

      setObjectsLoading: (isLoading) =>
        set(
          (state) => ({
            objects: { ...state.objects, isLoading },
          }),
          false,
          "setObjectsLoading"
        ),

      setObjectsError: (error) =>
        set(
          (state) => ({
            objects: { ...state.objects, error, isLoading: false },
          }),
          false,
          "setObjectsError"
        ),

      // Add a single object (optimistic update)
      addObject: (objectId, objectData) =>
        set(
          (state) => {
            const newObjectsMap = {
              ...state.objects.data,
              [objectId]: { id: objectId, ...objectData },
            };

            const objectsArray = Object.values(newObjectsMap);
            objectsArray.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

            return {
              objects: {
                ...state.objects,
                data: newObjectsMap,
                sorted: objectsArray,
              },
              currentObjectsMap: newObjectsMap,
            };
          },
          false,
          "addObject"
        ),

      // Update a single object (optimistic update)
      updateObject: (objectId, updates) =>
        set(
          (state) => {
            const currentObject = state.objects.data[objectId];
            if (!currentObject) return state;

            const updatedObject = { ...currentObject, ...updates };
            const newObjectsMap = {
              ...state.objects.data,
              [objectId]: updatedObject,
            };

            const objectsArray = Object.values(newObjectsMap);
            objectsArray.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

            return {
              objects: {
                ...state.objects,
                data: newObjectsMap,
                sorted: objectsArray,
              },
              currentObjectsMap: newObjectsMap,
            };
          },
          false,
          "updateObject"
        ),

      // Remove a single object (optimistic update)
      removeObject: (objectId) =>
        set(
          (state) => {
            const newObjectsMap = { ...state.objects.data };
            delete newObjectsMap[objectId];

            const objectsArray = Object.values(newObjectsMap);
            objectsArray.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

            // Clean up pending updates and current objects map
            const newPendingUpdates = { ...state.pendingUpdates };
            delete newPendingUpdates[objectId];

            const newCurrentObjectsMap = { ...state.currentObjectsMap };
            delete newCurrentObjectsMap[objectId];

            return {
              objects: {
                ...state.objects,
                data: newObjectsMap,
                sorted: objectsArray,
              },
              pendingUpdates: newPendingUpdates,
              currentObjectsMap: newCurrentObjectsMap,
            };
          },
          false,
          "removeObject"
        ),

      // Remove multiple objects (optimistic update)
      removeObjects: (objectIds) =>
        set(
          (state) => {
            const newObjectsMap = { ...state.objects.data };
            objectIds.forEach((objectId) => {
              delete newObjectsMap[objectId];
            });

            const objectsArray = Object.values(newObjectsMap);
            objectsArray.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

            // Clean up pending updates and current objects map
            const newPendingUpdates = { ...state.pendingUpdates };
            const newCurrentObjectsMap = { ...state.currentObjectsMap };
            objectIds.forEach((objectId) => {
              delete newPendingUpdates[objectId];
              delete newCurrentObjectsMap[objectId];
            });

            return {
              objects: {
                ...state.objects,
                data: newObjectsMap,
                sorted: objectsArray,
              },
              pendingUpdates: newPendingUpdates,
              currentObjectsMap: newCurrentObjectsMap,
            };
          },
          false,
          "removeObjects"
        ),

      // Connection state actions
      setConnectionState: (isConnected, isOffline = false) =>
        set(
          (state) => ({
            connection: { isConnected, isOffline },
          }),
          false,
          "setConnectionState"
        ),

      // Firestore operations (async)
      updateObjectInFirestore: async (objectId, updates, userId) => {
        try {
          const objectRef = doc(
            db,
            "projects",
            "shared-canvas",
            "objects",
            objectId
          );
          await updateDoc(objectRef, {
            ...updates,
            lastModified: serverTimestamp(),
            lastModifiedBy: userId,
          });
        } catch (error) {
          console.error("Error updating object in Firestore:", error);
          // Could add error handling here if needed
        }
      },

      deleteObjectFromFirestore: async (objectId) => {
        try {
          const objectRef = doc(
            db,
            "projects",
            "shared-canvas",
            "objects",
            objectId
          );
          await deleteDoc(objectRef);
        } catch (error) {
          console.error("Error deleting object from Firestore:", error);
          // Could add error handling here if needed
        }
      },

      deleteObjectsFromFirestore: async (objectIds) => {
        try {
          const deletePromises = objectIds.map((objectId) =>
            get().deleteObjectFromFirestore(objectId)
          );
          await Promise.all(deletePromises);
        } catch (error) {
          console.error("Error deleting objects from Firestore:", error);
          // Could add error handling here if needed
        }
      },

      // Helper methods
      getObject: (objectId) => {
        const state = get();
        return state.objects.data[objectId] || null;
      },

      getObjectsArray: () => {
        const state = get();
        return state.objects.sorted;
      },

      isObjectLoading: () => {
        const state = get();
        return state.objects.isLoading;
      },

      getLastSyncTime: () => {
        const state = get();
        return state.objects.lastSyncTime;
      },

      // Clear all state (for cleanup)
      clearAll: () =>
        set(
          () => ({
            objects: {
              data: {},
              sorted: [],
              isLoading: true,
              lastSyncTime: null,
              error: null,
            },
            connection: {
              isConnected: true,
              isOffline: false,
            },
            pendingUpdates: {},
            currentObjectsMap: {},
          }),
          false,
          "clearAll"
        ),
    }),
    {
      name: "firestore-store",
    }
  )
);

export default useFirestoreStore;
