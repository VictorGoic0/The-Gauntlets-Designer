import { useEffect, useRef } from "react";
import { ref, set, onDisconnect, serverTimestamp } from "firebase/database";
import { realtimeDb } from "../lib/firebase";
import { useAuth } from "./useAuth";
import { getUserColor } from "../utils/userColors";

/**
 * Hook to manage user presence in Realtime Database.
 * - Writes presence data on mount
 * - Uses onDisconnect() to automatically remove presence when browser closes
 * - Updates lastSeen timestamp periodically for activity tracking
 *
 * @param {boolean} enabled - Whether presence tracking is enabled
 */
export function usePresence(enabled = true) {
  const { currentUser } = useAuth();
  const intervalRef = useRef(null);
  const UPDATE_INTERVAL_MS = 30000; // 30 seconds

  useEffect(() => {
    if (!enabled || !currentUser) return;

    const userColor = getUserColor(currentUser.uid);
    const presenceRef = ref(realtimeDb, `presence/${currentUser.uid}`);

    // Initialize presence data on mount
    const initializePresence = async () => {
      try {
        // Set up onDisconnect to remove presence when user disconnects
        await onDisconnect(presenceRef).remove();

        // Write presence data
        await set(presenceRef, {
          userName: currentUser.displayName || "Anonymous",
          userEmail: currentUser.email || "",
          userColor: userColor,
          isOnline: true,
          lastSeen: serverTimestamp(),
        });
      } catch (error) {
        console.error("Error initializing presence:", error);
      }
    };

    // Update lastSeen timestamp periodically
    const updatePresence = async () => {
      try {
        await set(presenceRef, {
          userName: currentUser.displayName || "Anonymous",
          userEmail: currentUser.email || "",
          userColor: userColor,
          isOnline: true,
          lastSeen: serverTimestamp(),
        });
      } catch (error) {
        console.error("Error updating presence:", error);
      }
    };

    // Initialize presence
    initializePresence();

    // Set up periodic updates
    intervalRef.current = setInterval(updatePresence, UPDATE_INTERVAL_MS);

    // Cleanup on unmount
    return () => {
      // Clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Remove presence (onDisconnect will also handle this automatically)
      set(presenceRef, null).catch((error) => {
        console.error("Error removing presence:", error);
      });
    };
  }, [enabled, currentUser]);
}

export default usePresence;
