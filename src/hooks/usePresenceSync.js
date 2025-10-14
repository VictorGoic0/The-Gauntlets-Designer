import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";

/**
 * Hook to sync user presence from Firestore.
 * Listens to all presence documents and returns list of online users.
 * Filters users by isOnline status and recent lastSeen timestamp.
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

    // Create query for presence collection
    const presenceRef = collection(db, "projects", "shared-canvas", "presence");
    const presenceQuery = query(presenceRef);

    // Listen to presence updates
    const unsubscribe = onSnapshot(
      presenceQuery,
      (snapshot) => {
        const users = [];
        const now = Date.now();

        snapshot.forEach((doc) => {
          const data = doc.data();
          const userId = doc.id;

          // Check if user is marked as online
          if (!data.isOnline) {
            return;
          }

          // Check if lastSeen is recent (within threshold)
          // lastSeen is a Firestore Timestamp object
          const lastSeenTime = data.lastSeen?.toMillis?.() || 0;
          const isRecent = now - lastSeenTime < ONLINE_THRESHOLD_MS;

          if (!isRecent) {
            return;
          }

          users.push({
            userId,
            userName: data.userName,
            userEmail: data.userEmail,
            userColor: data.userColor,
            isOnline: data.isOnline,
            lastSeen: data.lastSeen,
          });
        });

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
