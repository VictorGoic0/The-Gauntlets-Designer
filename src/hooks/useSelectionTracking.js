import { useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import useLocalStore from "../stores/localStore";
import usePresenceStore from "../stores/presenceStore";

/**
 * Hook to track the current user's primary selection and write it to Realtime DB.
 *
 * Usage:
 * - Call this hook in Canvas component or a parent component.
 * - Hook automatically tracks selection changes from localStore.
 * - Writes to Realtime DB path: /selections/{userId}
 * - Sets up onDisconnect().remove() for automatic cleanup.
 */
export default function useSelectionTracking() {
  const { currentUser } = useAuth();
  const updateSelection = usePresenceStore((state) => state.updateSelection);
  const removeSelection = usePresenceStore((state) => state.removeSelection);

  const lastSelectionRef = useRef(null);

  // Get the primary selected object (first in array)
  const selectedObjectIds = useLocalStore(
    (state) => state.selection.selectedObjectIds
  );
  const selectedObjectId = selectedObjectIds[0] || null;

  useEffect(() => {
    if (!currentUser) return;

    // Only write if selection changed
    if (selectedObjectId !== lastSelectionRef.current) {
      if (selectedObjectId) {
        // User selected an object - write to Realtime DB
        updateSelection(currentUser, selectedObjectId);
      } else {
        // User deselected - remove from Realtime DB
        removeSelection(currentUser);
      }
      lastSelectionRef.current = selectedObjectId;
    }

    // Cleanup on unmount or user logout
    return () => {
      if (currentUser && lastSelectionRef.current) {
        removeSelection(currentUser);
      }
    };
  }, [selectedObjectId, currentUser, updateSelection, removeSelection]);
}
