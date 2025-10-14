import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";

/**
 * Hook to sync remote cursor positions from Firestore.
 * Listens to all cursors in the shared canvas and filters out current user.
 * Cursors are removed via cleanup in useCursorTracking when users disconnect.
 *
 * @returns {Array} Array of remote cursor objects
 */
export function useCursorSync() {
  const { currentUser } = useAuth();
  const [remoteCursors, setRemoteCursors] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    // Create query for cursors collection
    const cursorsRef = collection(db, "projects", "shared-canvas", "cursors");
    const cursorsQuery = query(cursorsRef);

    // Listen to cursor updates
    const unsubscribe = onSnapshot(
      cursorsQuery,
      (snapshot) => {
        const cursors = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          const userId = doc.id;

          // Filter out current user's cursor
          if (userId === currentUser.uid) {
            return;
          }

          cursors.push({
            userId,
            x: data.x,
            y: data.y,
            userName: data.userName,
            userColor: data.userColor,
            lastSeen: data.lastSeen,
          });
        });

        setRemoteCursors(cursors);
      },
      (error) => {
        console.error("Error syncing cursors:", error);
      }
    );

    // Cleanup subscription
    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  return remoteCursors;
}

export default useCursorSync;
