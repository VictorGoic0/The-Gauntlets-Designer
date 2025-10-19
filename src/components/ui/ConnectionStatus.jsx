import { useState, useEffect, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { realtimeDb } from "../../lib/firebase";
import { showSuccess, showWarning } from "../../utils/toast";
import {
  colors,
  spacing,
  borderRadius,
  typography,
  transitions,
} from "../../styles/tokens";

// Static styles - defined outside component for performance
const containerStyle = {
  display: "flex",
  alignItems: "center",
  gap: spacing[2],
};

const statusTextStyle = {
  fontSize: typography.fontSize.sm,
  fontWeight: typography.fontWeight.medium,
  color: colors.neutral.lightBase,
  fontFamily: typography.fontFamily.base,
  transition: `color ${transitions.duration.shorter} ${transitions.easing.easeInOut}`,
};

const statusDotBaseStyle = {
  width: "10px",
  height: "10px",
  borderRadius: borderRadius.full,
  transition: `background-color ${transitions.duration.shorter} ${transitions.easing.easeInOut}`,
};

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

  // Dynamic styles - depend on connection state
  const statusDotStyle = {
    ...statusDotBaseStyle,
    backgroundColor: isConnected ? colors.success.main : colors.error.main,
    ...(isConnected && {
      animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
    }),
  };

  return (
    <>
      {/* Inject pulse animation for connected state */}
      {isConnected && (
        <style>
          {`
            @keyframes pulse {
              0%, 100% {
                opacity: 1;
              }
              50% {
                opacity: 0.5;
              }
            }
          `}
        </style>
      )}
      
      <div style={containerStyle}>
        {/* Status text */}
        <span style={statusTextStyle}>
          {isConnected ? "Connected" : "Disconnected"}
        </span>
        
        {/* Status indicator dot */}
        <div style={statusDotStyle} />
      </div>
    </>
  );
}

