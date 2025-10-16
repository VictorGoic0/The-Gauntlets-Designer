import { useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { realtimeDb } from "../lib/firebase";
import { useAuth } from "./useAuth";
import usePresenceStore from "../stores/presenceStore";

/**
 * Hook to sync remote cursor positions from Realtime Database to Presence Store.
 * Listens to all cursors in the shared canvas and filters out current user.
 * Cursors are removed via cleanup in useCursorTracking when users disconnect.
 *
 * This hook sets up the Realtime Database listener and writes to Presence Store.
 * Components should read cursor data from usePresenceStore.
 */
export function useCursorSync() {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    // Create reference to cursors in Realtime Database
    const cursorsRef = ref(realtimeDb, "cursors");

    // Listen to cursor updates
    const unsubscribe = onValue(
      cursorsRef,
      (snapshot) => {
        const cursors = [];
        const data = snapshot.val();

        if (data) {
          // Iterate through all user cursors
          Object.entries(data).forEach(([userId, cursorData]) => {
            // Filter out current user's cursor
            if (userId === currentUser.uid) {
              return;
            }

            cursors.push({
              userId,
              x: cursorData.x,
              y: cursorData.y,
              userName: cursorData.userName,
              userColor: cursorData.userColor,
              lastSeen: cursorData.lastSeen,
            });
          });
        }

        // Write to Presence Store
        usePresenceStore.getState().setRemoteCursors(cursors);
      },
      (error) => {
        console.error("Error syncing cursors:", error);
        usePresenceStore.getState().setCursorsError(error);
      }
    );

    // Cleanup subscription
    return () => {
      unsubscribe();
    };
  }, [currentUser]);
}

export default useCursorSync;
