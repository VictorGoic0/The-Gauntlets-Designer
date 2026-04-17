import { useState } from "react";
import useLocalStore from "../../stores/localStore";
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  transitions,
} from "../../styles/tokens";
import {
  ToolbarCircleIcon,
  ToolbarRectangleIcon,
  ToolbarSelectIcon,
  ToolbarTextIcon,
} from "../icons/ToolbarIcons";

// Static styles - defined outside component for performance
const toolbarStyle = {
  position: "absolute",
  top: spacing[2],
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 50,
  backgroundColor: colors.neutral.darker,
  borderRadius: borderRadius.md,
  boxShadow: shadows.elevation[3],
  border: `1px solid ${colors.neutral.dark}`,
  padding: spacing[3],
  display: "flex",
  flexDirection: "row",
  gap: spacing[2],
  pointerEvents: "auto",
};

const buttonBaseStyle = {
  padding: spacing[4],
  borderRadius: borderRadius.base,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  border: "none",
  transition: `background-color ${transitions.duration.shorter} ${transitions.easing.easeInOut}, color ${transitions.duration.shorter} ${transitions.easing.easeInOut}`,
  outline: "none",
};

/**
 * Toolbar component for canvas tools
 * Features:
 * - Select, Rectangle, Circle, Text tools
 * - Visual indication of active tool
 * - Positioned at the top center of the canvas
 */
export default function Toolbar() {
  const canvasMode = useLocalStore((state) => state.canvas.mode);
  const setCanvasMode = useLocalStore((state) => state.setCanvasMode);
  const [hoveredTool, setHoveredTool] = useState(null);

  const tools = [
    {
      id: "select",
      name: "Select",
      icon: <ToolbarSelectIcon />,
    },
    {
      id: "rectangle",
      name: "Rectangle",
      icon: <ToolbarRectangleIcon />,
    },
    {
      id: "circle",
      name: "Circle",
      icon: <ToolbarCircleIcon />,
    },
    {
      id: "text",
      name: "Text",
      icon: <ToolbarTextIcon />,
    },
  ];

  // Dynamic styles - depend on component state
  const getButtonStyle = (toolId) => {
    const isActive = canvasMode === toolId;
    const isHovered = hoveredTool === toolId;

    return {
      ...buttonBaseStyle,
      backgroundColor: isActive
        ? colors.primary.base
        : isHovered
        ? colors.neutral.mediumDark
        : colors.neutral.dark,
      color: isActive
        ? colors.neutral.white
        : isHovered
        ? colors.neutral.white
        : colors.neutral.lightBase,
    };
  };

  const renderToolbarTool = (tool) => {
    const onClickSelectCanvasTool = () => setCanvasMode(tool.id);
    const onMouseEnterToolButton = () => setHoveredTool(tool.id);
    const onMouseLeaveToolButton = () => setHoveredTool(null);

    return (
      <button
        key={tool.id}
        onClick={onClickSelectCanvasTool}
        onMouseEnter={onMouseEnterToolButton}
        onMouseLeave={onMouseLeaveToolButton}
        style={getButtonStyle(tool.id)}
        title={tool.name}
        aria-label={tool.name}
      >
        {tool.icon}
      </button>
    );
  };

  return (
    <div style={toolbarStyle}>{tools.map(renderToolbarTool)}</div>
  );
}

