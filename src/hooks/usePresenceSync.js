import { useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { realtimeDb } from "../lib/firebase";
import { useAuth } from "./useAuth";
import usePresenceStore from "../stores/presenceStore";

/**
 * Hook to sync user presence from Realtime Database to Presence Store.
 * Listens to all presence data and writes to store.
 *
 * Users are filtered out if:
 * 1. Browser closes/disconnects (removed automatically by onDisconnect)
 * 2. Inactive for 60+ seconds (lastSeen timestamp check)
 *
 * This hook sets up the Realtime Database listener and writes to Presence Store.
 * Components should read presence data from usePresenceStore.
 */
export function usePresenceSync() {
  const { currentUser } = useAuth();

  // Consider users online if lastSeen is within the last 60 seconds
  // (2x the update interval of 30s to account for network delays)
  const ONLINE_THRESHOLD_MS = 60000;

  useEffect(() => {
    if (!currentUser) return;

    // Reference to presence collection
    const presenceRef = ref(realtimeDb, "presence");

    // Listen to presence updates
    const unsubscribe = onValue(
      presenceRef,
      (snapshot) => {
        const users = [];
        const data = snapshot.val();
        const now = Date.now();

        if (data) {
          Object.keys(data).forEach((userId) => {
            const userData = data[userId];

            // Skip if no data or not online
            if (!userData || !userData.isOnline) {
              return;
            }

            // Check if lastSeen is recent (within threshold)
            // lastSeen is a timestamp in milliseconds
            const lastSeenTime = userData.lastSeen || 0;
            const isRecent = now - lastSeenTime < ONLINE_THRESHOLD_MS;

            if (!isRecent) {
              return;
            }

            users.push({
              userId,
              userName: userData.userName,
              userEmail: userData.userEmail,
              userColor: userData.userColor,
              isOnline: userData.isOnline,
              lastSeen: userData.lastSeen,
            });
          });
        }

        // Write to Presence Store
        usePresenceStore.getState().setOnlineUsers(users);
      },
      (error) => {
        console.error("Error syncing presence:", error);
        usePresenceStore.getState().setPresenceError(error);
      }
    );

    // Cleanup subscription
    return () => {
      unsubscribe();
    };
  }, [currentUser]);
}

export default usePresenceSync;
