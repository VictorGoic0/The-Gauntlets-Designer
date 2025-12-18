import { useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { realtimeDb } from "../lib/firebase";
import usePresenceStore from "../stores/presenceStore";

/**
 * Hook to subscribe to remote users' selections from Realtime DB
 * and update the presence store.
 *
 * Usage:
 * - Call this hook in Canvas component or a parent component that needs remote selections.
 * - Hook automatically sets up a Realtime DB listener.
 * - Updates presenceStore with remote user selections.
 * - Filters out current user's own selection (handled by useSelectionTracking).
 */
export default function useSelectionSync() {
  const setRemoteSelections = usePresenceStore(
    (state) => state.setRemoteSelections
  );
  const setSelectionsLoading = usePresenceStore(
    (state) => state.setSelectionsLoading
  );
  const setSelectionsError = usePresenceStore(
    (state) => state.setSelectionsError
  );

  useEffect(() => {
    setSelectionsLoading(true);
    const selectionsRef = ref(realtimeDb, "selections");

    const unsubscribe = onValue(
      selectionsRef,
      (snapshot) => {
        const selectionsData = snapshot.val();
        const remoteSelections = [];

        if (selectionsData) {
          // Convert object to array of selections
          Object.entries(selectionsData).forEach(([userId, selection]) => {
            remoteSelections.push({
              userId,
              objectId: selection.objectId,
              userName: selection.userName,
              userColor: selection.userColor,
              timestamp: selection.timestamp,
            });
          });
        }

        setRemoteSelections(remoteSelections);
      },
      (error) => {
        console.error("Error syncing remote selections:", error);
        setSelectionsError(error);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [setRemoteSelections, setSelectionsLoading, setSelectionsError]);
}
