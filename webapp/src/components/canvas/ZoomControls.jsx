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
import ZoomInIcon from "../icons/ZoomInIcon";
import ZoomOutIcon from "../icons/ZoomOutIcon";

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

  const onClickZoomIn = () => {
    const newScale = Math.min(stageScale * 1.2, MAX_SCALE);
    setStageScale(newScale);
  };

  const onClickZoomOut = () => {
    const newScale = Math.max(stageScale / 1.2, MIN_SCALE);
    setStageScale(newScale);
  };

  const onClickResetZoom = () => {
    setStageScale(1);
    setStagePosition({ x: 0, y: 0 });
  };

  const onMouseLeaveZoomControl = () => setHoveredButton(null);

  const onMouseEnterZoomInButton = () => setHoveredButton("zoomIn");

  const onMouseEnterZoomOutButton = () => setHoveredButton("zoomOut");

  const onMouseEnterResetZoomButton = () => setHoveredButton("reset");

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
        onClick={onClickZoomIn}
        disabled={stageScale >= MAX_SCALE}
        onMouseEnter={onMouseEnterZoomInButton}
        onMouseLeave={onMouseLeaveZoomControl}
        style={getButtonStyle("zoomIn", stageScale >= MAX_SCALE)}
        title="Zoom In"
        aria-label="Zoom In"
      >
        <ZoomInIcon />
      </button>

      {/* Zoom Percentage Display */}
      <div style={percentageStyle}>
        {zoomPercentage}%
      </div>

      {/* Zoom Out Button */}
      <button
        onClick={onClickZoomOut}
        disabled={stageScale <= MIN_SCALE}
        onMouseEnter={onMouseEnterZoomOutButton}
        onMouseLeave={onMouseLeaveZoomControl}
        style={getButtonStyle("zoomOut", stageScale <= MIN_SCALE)}
        title="Zoom Out"
        aria-label="Zoom Out"
      >
        <ZoomOutIcon />
      </button>

      {/* Reset Zoom Button */}
      <button
        onClick={onClickResetZoom}
        onMouseEnter={onMouseEnterResetZoomButton}
        onMouseLeave={onMouseLeaveZoomControl}
        style={getResetButtonStyle()}
        title="Reset Zoom (100%)"
        aria-label="Reset Zoom to 100%"
      >
        Reset
      </button>
    </div>
  );
}

