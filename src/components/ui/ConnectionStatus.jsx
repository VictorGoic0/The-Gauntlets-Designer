import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { realtimeDb } from "../../lib/firebase";

export default function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Firebase Realtime Database provides a special location to check connection status
    const connectedRef = ref(realtimeDb, ".info/connected");

    // Listen to connection state changes
    const unsubscribe = onValue(connectedRef, (snapshot) => {
      const connected = snapshot.val();
      setIsConnected(connected === true);
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

