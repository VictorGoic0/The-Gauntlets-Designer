import { useEffect, useRef } from "react";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";
import { getUserColor } from "../utils/userColors";

/**
 * Hook to track local cursor position and sync to Firestore.
 * Throttles updates to 45ms (~22 updates/second) for performance
 * while maintaining <50ms perceived latency.
 * Automatically cleans up cursor on unmount and browser close.
 *
 * @param {boolean} enabled - Whether cursor tracking is enabled
 */
export function useCursorTracking(enabled = true) {
  const { currentUser } = useAuth();
  const lastUpdateRef = useRef(0);
  const cursorPositionRef = useRef({ x: 0, y: 0 });
  const THROTTLE_MS = 45; // ~22 updates per second for <50ms perceived latency

  useEffect(() => {
    if (!enabled || !currentUser) return;

    const userColor = getUserColor(currentUser.uid);
    const cursorRef = doc(
      db,
      "projects",
      "shared-canvas",
      "cursors",
      currentUser.uid
    );

    const handleMouseMove = async (e) => {
      const now = Date.now();

      // Store cursor position
      cursorPositionRef.current = {
        x: e.clientX,
        y: e.clientY,
      };

      // Throttle: only update if enough time has passed
      if (now - lastUpdateRef.current < THROTTLE_MS) {
        return;
      }

      lastUpdateRef.current = now;

      try {
        // Write cursor position to Firestore
        await setDoc(cursorRef, {
          x: cursorPositionRef.current.x,
          y: cursorPositionRef.current.y,
          userName: currentUser.displayName || "Anonymous",
          userColor: userColor,
          lastSeen: serverTimestamp(),
        });
      } catch (error) {
        console.error("Error updating cursor position:", error);
      }
    };

    // Add event listener
    window.addEventListener("mousemove", handleMouseMove);

    // Cleanup on unmount or when user logs out
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);

      // Remove cursor document from Firestore
      deleteDoc(cursorRef).catch((error) => {
        console.error("Error removing cursor:", error);
      });
    };
  }, [enabled, currentUser]);
}

export default useCursorTracking;
