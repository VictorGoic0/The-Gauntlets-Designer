import { useEffect, useState, useRef } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";

/**
 * Hook to sync canvas objects from Firestore.
 * Listens to all objects in the shared canvas and returns them.
 * Handles create, update, and delete operations in real-time.
 * Implements last-write-wins conflict resolution based on server timestamps.
 *
 * Offline Support:
 * - Firestore offline persistence is enabled in firebase.js
 * - Writes are automatically queued when offline
 * - Queued writes sync automatically when connection is restored
 * - Reads come from local cache when offline
 *
 * @param {Object} draggingObjectIds - Set or object with IDs of currently dragging objects
 * @returns {Object} { objects: Array, loading: boolean } - Canvas objects and loading state
 */
export function useObjectSync(draggingObjectIds = {}) {
  const { currentUser } = useAuth();
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Store current objects and pending remote updates
  const currentObjectsMap = useRef({});
  const pendingUpdates = useRef({});

  useEffect(() => {
    if (!currentUser) return;

    // Reference to objects collection
    const objectsRef = collection(db, "projects", "shared-canvas", "objects");
    const objectsQuery = query(objectsRef);

    // Listen to object updates
    const unsubscribe = onSnapshot(
      objectsQuery,
      (snapshot) => {
        const objectsData = [];
        const draggingIds = Object.keys(draggingObjectIds);
        const newObjectsMap = {};

        snapshot.forEach((doc) => {
          const data = doc.data();
          const objectId = doc.id;

          // If this object is currently being dragged
          if (draggingIds.includes(objectId)) {
            // Store the remote update for later
            pendingUpdates.current[objectId] = {
              id: objectId,
              ...data,
            };

            // Keep using the current object data (don't override during drag)
            const currentObject = currentObjectsMap.current[objectId];
            if (currentObject) {
              objectsData.push(currentObject);
              newObjectsMap[objectId] = currentObject;
            } else {
              // First time seeing this object, use remote data
              const obj = { id: objectId, ...data };
              objectsData.push(obj);
              newObjectsMap[objectId] = obj;
            }
            return;
          }

          // Check if there's a pending update for this object (drag just ended)
          if (pendingUpdates.current[objectId]) {
            const pendingUpdate = pendingUpdates.current[objectId];
            const remoteTimestamp = data.lastModified?.toMillis() || 0;
            const pendingTimestamp =
              pendingUpdate.lastModified?.toMillis() || 0;

            // Last-write-wins: use the update with the most recent timestamp
            if (remoteTimestamp > pendingTimestamp) {
              delete pendingUpdates.current[objectId];
              const obj = { id: objectId, ...data };
              objectsData.push(obj);
              newObjectsMap[objectId] = obj;
            } else {
              objectsData.push(pendingUpdate);
              newObjectsMap[objectId] = pendingUpdate;
              delete pendingUpdates.current[objectId];
            }
          } else {
            const obj = { id: objectId, ...data };
            objectsData.push(obj);
            newObjectsMap[objectId] = obj;
          }
        });

        // Update the current objects map
        currentObjectsMap.current = newObjectsMap;

        // Sort by zIndex to maintain proper layering
        objectsData.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

        setObjects(objectsData);
        setLoading(false); // Data loaded successfully
      },
      (error) => {
        console.error("Error syncing objects:", error);
        setLoading(false); // Stop loading even on error
      }
    );

    // Cleanup subscription
    return () => {
      unsubscribe();
    };
  }, [currentUser, draggingObjectIds]);

  return { objects, loading };
}

export default useObjectSync;
