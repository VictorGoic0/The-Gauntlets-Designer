import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { realtimeDb } from "../lib/firebase";
import { useAuth } from "./useAuth";

/**
 * Hook to sync user presence from Realtime Database.
 * Listens to all presence data and returns list of online users.
 *
 * Users are filtered out if:
 * 1. Browser closes/disconnects (removed automatically by onDisconnect)
 * 2. Inactive for 60+ seconds (lastSeen timestamp check)
 *
 * @returns {Array} Array of online user presence objects
 */
export function usePresenceSync() {
  const { currentUser } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Consider users online if lastSeen is within the last 60 seconds
  // (2x the update interval of 30s to account for network delays)
  const ONLINE_THRESHOLD_MS = 60000;

  useEffect(() => {
    if (!currentUser) return;

    // Reference to presence collection
    const presenceRef = ref(realtimeDb, "presence/shared-canvas");

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

        setOnlineUsers(users);
      },
      (error) => {
        console.error("Error syncing presence:", error);
      }
    );

    // Cleanup subscription
    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  return onlineUsers;
}

export default usePresenceSync;
