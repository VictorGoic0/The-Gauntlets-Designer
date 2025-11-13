import { useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { realtimeDb } from "../lib/firebase";
import usePresenceStore from "../stores/presenceStore";

/**
 * Hook to sync object positions from Realtime Database
 * Subscribes to all object positions and updates Presence Store
 *
 * Used in: Canvas.jsx
 *
 * PR #18: Real-Time Object Positions
 */
export default function useObjectPositions() {
  const setObjectPositions = usePresenceStore(
    (state) => state.setObjectPositions
  );
  const setPositionsLoading = usePresenceStore(
    (state) => state.setPositionsLoading
  );
  const setPositionsError = usePresenceStore(
    (state) => state.setPositionsError
  );

  useEffect(() => {
    setPositionsLoading(true);

    // Subscribe to all object positions in Realtime DB
    const positionsRef = ref(realtimeDb, "objectPositions");

    const unsubscribe = onValue(
      positionsRef,
      (snapshot) => {
        const positions = snapshot.val() || {};
        // positions = { "aBc123": { x: 100, y: 200, timestamp: 1697... }, ... }
        setObjectPositions(positions);
        setPositionsLoading(false);
      },
      (error) => {
        console.error("Error syncing object positions:", error);
        setPositionsError(error);
        setPositionsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [setObjectPositions, setPositionsLoading, setPositionsError]);
}
