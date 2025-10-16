import { useEffect } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";
import useFirestoreStore from "../stores/firestoreStore";

/**
 * Hook to sync canvas objects from Firestore to Firestore Store.
 * Listens to all objects in the shared canvas and writes to store.
 * Handles create, update, and delete operations in real-time.
 * Implements last-write-wins conflict resolution based on server timestamps.
 *
 * Offline Support:
 * - Firestore offline persistence is enabled in firebase.js
 * - Writes are automatically queued when offline
 * - Queued writes sync automatically when connection is restored
 * - Reads come from local cache when offline
 *
 * This hook sets up the Firestore listener and writes to Firestore Store.
 * Components should read object data from useFirestoreStore.
 *
 * @param {Object} draggingObjectIds - Set or object with IDs of currently dragging objects
 */
export function useObjectSync(draggingObjectIds = {}) {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    // Reference to objects collection
    const objectsRef = collection(db, "projects", "shared-canvas", "objects");
    const objectsQuery = query(objectsRef);

    // Listen to object updates
    const unsubscribe = onSnapshot(
      objectsQuery,
      (snapshot) => {
        // Write to Firestore Store
        // The store handles all the complex logic (drag conflicts, sorting, etc.)
        useFirestoreStore
          .getState()
          .setObjects(snapshot.docs, draggingObjectIds);
      },
      (error) => {
        console.error("Error syncing objects:", error);
        useFirestoreStore.getState().setObjectsError(error);
      }
    );

    // Cleanup subscription
    return () => {
      unsubscribe();
    };
  }, [currentUser, draggingObjectIds]);
}

export default useObjectSync;
