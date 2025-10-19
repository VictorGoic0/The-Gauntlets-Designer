import { useState } from "react";
import useLocalStore from "../../stores/localStore";
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
  transitions,
} from "../../styles/tokens";

// Static styles - defined outside component for performance
const containerStyle = {
  position: "absolute",
  top: spacing[2],
  left: spacing[2],
  zIndex: 50,
  backgroundColor: colors.neutral.darker,
  borderRadius: borderRadius.md,
  boxShadow: shadows.elevation[3],
  border: `1px solid ${colors.neutral.dark}`,
  padding: spacing[3],
  display: "flex",
  flexDirection: "column",
  gap: spacing[2],
  pointerEvents: "auto",
};

const buttonBaseStyle = {
  padding: `${spacing[2]} ${spacing[4]}`,
  borderRadius: borderRadius.base,
  border: "none",
  transition: `background-color ${transitions.duration.shorter} ${transitions.easing.easeInOut}`,
  fontWeight: typography.fontWeight.medium,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  outline: "none",
};

const percentageStyle = {
  padding: `${spacing[1]} ${spacing[3]}`,
  backgroundColor: colors.neutral.darkest,
  color: colors.neutral.white,
  textAlign: "center",
  borderRadius: borderRadius.base,
  fontFamily: typography.fontFamily.mono,
  fontSize: typography.fontSize.sm,
  fontWeight: typography.fontWeight.medium,
};

const resetButtonBaseStyle = {
  padding: `${spacing[2]} ${spacing[4]}`,
  borderRadius: borderRadius.base,
  border: "none",
  transition: `background-color ${transitions.duration.shorter} ${transitions.easing.easeInOut}`,
  fontWeight: typography.fontWeight.medium,
  fontSize: typography.fontSize.xs,
  fontFamily: typography.fontFamily.base,
  outline: "none",
  cursor: "pointer",
};

export default function ZoomControls() {
  const stageScale = useLocalStore((state) => state.canvas.stageScale);
  const MIN_SCALE = useLocalStore((state) => state.canvas.MIN_SCALE);
  const MAX_SCALE = useLocalStore((state) => state.canvas.MAX_SCALE);
  const setStageScale = useLocalStore((state) => state.setStageScale);
  const setStagePosition = useLocalStore((state) => state.setStagePosition);
  
  const [hoveredButton, setHoveredButton] = useState(null);

  // Calculate zoom percentage
  const zoomPercentage = Math.round(stageScale * 100);

  // Zoom in by 20%
  const handleZoomIn = () => {
    const newScale = Math.min(stageScale * 1.2, MAX_SCALE);
    setStageScale(newScale);
  };

  // Zoom out by 20%
  const handleZoomOut = () => {
    const newScale = Math.max(stageScale / 1.2, MIN_SCALE);
    setStageScale(newScale);
  };

  // Reset zoom to 100%
  const handleResetZoom = () => {
    setStageScale(1);
    setStagePosition({ x: 0, y: 0 });
  };

  // Dynamic styles - depend on component state
  const getButtonStyle = (buttonId, disabled = false) => {
    const isHovered = hoveredButton === buttonId;
    
    return {
      ...buttonBaseStyle,
      backgroundColor: disabled
        ? colors.neutral.darkest
        : isHovered
        ? colors.neutral.mediumDark
        : colors.neutral.dark,
      color: disabled ? colors.neutral.base : colors.neutral.white,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
    };
  };

  const getResetButtonStyle = () => {
    const isHovered = hoveredButton === "reset";
    
    return {
      ...resetButtonBaseStyle,
      backgroundColor: isHovered ? colors.neutral.mediumDark : colors.neutral.dark,
      color: colors.neutral.white,
    };
  };

  return (
    <div style={containerStyle}>
      {/* Zoom In Button */}
      <button
        onClick={handleZoomIn}
        disabled={stageScale >= MAX_SCALE}
        onMouseEnter={() => setHoveredButton("zoomIn")}
        onMouseLeave={() => setHoveredButton(null)}
        style={getButtonStyle("zoomIn", stageScale >= MAX_SCALE)}
        title="Zoom In"
        aria-label="Zoom In"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      {/* Zoom Percentage Display */}
      <div style={percentageStyle}>
        {zoomPercentage}%
      </div>

      {/* Zoom Out Button */}
      <button
        onClick={handleZoomOut}
        disabled={stageScale <= MIN_SCALE}
        onMouseEnter={() => setHoveredButton("zoomOut")}
        onMouseLeave={() => setHoveredButton(null)}
        style={getButtonStyle("zoomOut", stageScale <= MIN_SCALE)}
        title="Zoom Out"
        aria-label="Zoom Out"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 12H4"
          />
        </svg>
      </button>

      {/* Reset Zoom Button */}
      <button
        onClick={handleResetZoom}
        onMouseEnter={() => setHoveredButton("reset")}
        onMouseLeave={() => setHoveredButton(null)}
        style={getResetButtonStyle()}
        title="Reset Zoom (100%)"
        aria-label="Reset Zoom to 100%"
      >
        Reset
      </button>
    </div>
  );
}

