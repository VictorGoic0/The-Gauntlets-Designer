import { useState, useEffect, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { realtimeDb } from "../lib/firebase";
import { showSuccess, showWarning } from "../utils/toast";

/**
 * Subscribes to Firebase Realtime Database `.info/connected` and returns whether the client
 * is connected. Shows toast on reconnect / disconnect after the first successful connection.
 */
export function useRtdbConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const isInitialized = useRef(false);
  const previousConnectionState = useRef(null);

  useEffect(() => {
    const connectedRef = ref(realtimeDb, ".info/connected");

    const unsubscribe = onValue(connectedRef, (snapshot) => {
      const firebaseConnectionStatus = snapshot.val() === true;

      if (firebaseConnectionStatus && !isInitialized.current) {
        isInitialized.current = true;
        previousConnectionState.current = firebaseConnectionStatus;
        setIsConnected(firebaseConnectionStatus);
        return;
      }

      if (isInitialized.current) {
        if (previousConnectionState.current !== firebaseConnectionStatus) {
          if (firebaseConnectionStatus) {
            showSuccess("Connection restored");
          } else {
            showWarning("Connection lost. Attempting to reconnect...");
          }
          previousConnectionState.current = firebaseConnectionStatus;
        }
        setIsConnected(firebaseConnectionStatus);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return isConnected;
}
