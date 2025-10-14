import { useEffect, useRef } from "react";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";
import { getUserColor } from "../utils/userColors";

/**
 * Hook to manage user presence in Firestore.
 * - Writes presence data on mount
 * - Updates lastSeen every 30 seconds
 * - Sets isOnline to false on unmount
 * - Cleanup handled via unmount and lastSeen timestamp filtering
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
    const presenceRef = doc(
      db,
      "projects",
      "shared-canvas",
      "presence",
      currentUser.uid
    );

    // Initialize presence data on mount
    const initializePresence = async () => {
      try {
        await setDoc(presenceRef, {
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
        await updateDoc(presenceRef, {
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

      // Mark user as offline
      updateDoc(presenceRef, {
        isOnline: false,
        lastSeen: serverTimestamp(),
      }).catch((error) => {
        console.error("Error marking user offline:", error);
      });
    };
  }, [enabled, currentUser]);
}

export default usePresence;
