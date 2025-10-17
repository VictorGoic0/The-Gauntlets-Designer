import { useState, useEffect, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { realtimeDb } from "../../lib/firebase";
import { showSuccess, showWarning } from "../../utils/toast";

export default function ConnectionStatus() {
  // UI state - what we display to the user
  const [isConnected, setIsConnected] = useState(false);
  
  // Track initialization - only true once Firebase has reported connected at least once
  const isInitialized = useRef(false);
  
  // Track previous state for change detection (only after initialization)
  const previousConnectionState = useRef(null);

  useEffect(() => {
    // Firebase Realtime Database provides a special location to check connection status
    const connectedRef = ref(realtimeDb, ".info/connected");

    // Listen to connection state changes
    const unsubscribe = onValue(connectedRef, (snapshot) => {
      const firebaseConnectionStatus = snapshot.val() === true;
      
      // If Firebase reports connected and we're not initialized yet, mark as initialized
      if (firebaseConnectionStatus && !isInitialized.current) {
        isInitialized.current = true;
        previousConnectionState.current = firebaseConnectionStatus;
        setIsConnected(firebaseConnectionStatus);
        return;
      }
      
      // After initialization, track changes and show toasts
      if (isInitialized.current) {
        // Check if state actually changed
        if (previousConnectionState.current !== firebaseConnectionStatus) {
          // Show appropriate toast
          if (firebaseConnectionStatus) {
            showSuccess("Connection restored");
          } else {
            showWarning("Connection lost. Attempting to reconnect...");
          }
          
          // Update previous state
          previousConnectionState.current = firebaseConnectionStatus;
        }
        
        // Update UI state
        setIsConnected(firebaseConnectionStatus);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="flex items-center" style={{ gap: '0.5rem' }}>
      {/* Status text */}
      <span className="text-sm font-medium text-gray-300">
        {isConnected ? "Connected" : "Disconnected"}
      </span>
      
      {/* Status indicator dot */}
      <div
        style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: isConnected ? '#22c55e' : '#ef4444'
        }}
      />
    </div>
  );
}

