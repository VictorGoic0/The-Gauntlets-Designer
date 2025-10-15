import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { realtimeDb } from "../lib/firebase";
import { useAuth } from "./useAuth";

/**
 * Hook to sync user presence from Realtime Database.
 * Listens to all presence data and returns list of online users.
 * Automatically filters out users who disconnect (removed by onDisconnect).
 *
 * @returns {Array} Array of online user presence objects
 */
export function usePresenceSync() {
  const { currentUser } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState([]);

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

        if (data) {
          Object.keys(data).forEach((userId) => {
            const userData = data[userId];

            // Skip if no data or not online
            if (!userData || !userData.isOnline) {
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
