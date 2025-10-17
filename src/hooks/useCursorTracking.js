import { useEffect, useRef } from "react";
import { ref, set, onDisconnect, serverTimestamp } from "firebase/database";
import { realtimeDb } from "../lib/firebase";
import { useAuth } from "./useAuth";
import { getUserColor } from "../utils/userColors";

/**
 * Hook to track local cursor position and sync to Realtime Database.
 * Converts screen coordinates to canvas coordinates before storing.
 * Throttles updates to 45ms (~22 updates/second) for performance
 * while maintaining <50ms perceived latency.
 * Automatically cleans up cursor on unmount and browser close.
 *
 * @param {boolean} enabled - Whether cursor tracking is enabled
 * @param {Object} stagePosition - Stage position {x, y} for coordinate conversion
 * @param {number} stageScale - Stage scale for coordinate conversion
 * @param {Object} containerOffset - Container offset {x, y} from viewport
 */
export function useCursorTracking(
  enabled = true,
  stagePosition = { x: 0, y: 0 },
  stageScale = 1,
  containerOffset = { x: 0, y: 0 }
) {
  const { currentUser } = useAuth();
  const lastUpdateRef = useRef(0);
  const cursorPositionRef = useRef({ x: 0, y: 0 });
  const THROTTLE_MS = 45; // ~22 updates per second for <50ms perceived latency

  useEffect(() => {
    if (!enabled || !currentUser) return;

    const userColor = getUserColor(currentUser.uid);
    const cursorRef = ref(realtimeDb, `cursors/${currentUser.uid}`);

    // Set up automatic cleanup on disconnect
    onDisconnect(cursorRef).remove();

    const handleMouseMove = async (e) => {
      const now = Date.now();

      // Convert screen coordinates to canvas coordinates
      // Account for: container offset from viewport, stage pan, and scale
      const canvasX =
        (e.clientX - containerOffset.x - stagePosition.x) / stageScale;
      const canvasY =
        (e.clientY - containerOffset.y - stagePosition.y) / stageScale;

      // Store cursor position (in canvas coordinates)
      cursorPositionRef.current = {
        x: canvasX,
        y: canvasY,
      };

      // Throttle: only update if enough time has passed
      if (now - lastUpdateRef.current < THROTTLE_MS) {
        return;
      }

      lastUpdateRef.current = now;

      try {
        // Write cursor position (in canvas coordinates) to Realtime Database
        await set(cursorRef, {
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

      // Remove cursor from Realtime Database
      set(cursorRef, null).catch((error) => {
        console.error("Error removing cursor:", error);
      });
    };
  }, [enabled, currentUser, stagePosition, stageScale, containerOffset]);
}

export default useCursorTracking;
