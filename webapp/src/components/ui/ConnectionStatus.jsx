import {
  colors,
  spacing,
  borderRadius,
  typography,
  transitions,
} from "../../styles/tokens";
import { useRtdbConnectionStatus } from "../../hooks/useRtdbConnectionStatus";

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
  const isConnected = useRtdbConnectionStatus();

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

