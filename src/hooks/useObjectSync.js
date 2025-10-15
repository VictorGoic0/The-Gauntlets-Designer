import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";

/**
 * Hook to sync canvas objects from Firestore.
 * Listens to all objects in the shared canvas and returns them.
 * Handles create, update, and delete operations in real-time.
 *
 * @returns {Array} Array of canvas object data
 */
export function useObjectSync() {
  const { currentUser } = useAuth();
  const [objects, setObjects] = useState([]);

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

        snapshot.forEach((doc) => {
          const data = doc.data();

          objectsData.push({
            id: doc.id,
            ...data,
          });
        });

        // Sort by zIndex to maintain proper layering
        objectsData.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

        setObjects(objectsData);
      },
      (error) => {
        console.error("Error syncing objects:", error);
      }
    );

    // Cleanup subscription
    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  return objects;
}

export default useObjectSync;
