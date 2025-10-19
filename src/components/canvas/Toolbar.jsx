import { useState } from "react";
import useLocalStore from "../../stores/localStore";
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  transitions,
} from "../../styles/tokens";

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
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          style={{ width: "24px", height: "24px" }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
          />
        </svg>
      ),
    },
    {
      id: "rectangle",
      name: "Rectangle",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          style={{ width: "24px", height: "24px" }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z"
          />
        </svg>
      ),
    },
    {
      id: "circle",
      name: "Circle",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          style={{ width: "24px", height: "24px" }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: "text",
      name: "Text",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          style={{ width: "24px", height: "24px" }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16m-7 6h7"
          />
        </svg>
      ),
    },
  ];

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

  const getButtonStyle = (toolId) => {
    const isActive = canvasMode === toolId;
    const isHovered = hoveredTool === toolId;

    return {
      padding: spacing[4],
      borderRadius: borderRadius.base,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      border: "none",
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
      transition: `background-color ${transitions.duration.shorter} ${transitions.easing.easeInOut}, color ${transitions.duration.shorter} ${transitions.easing.easeInOut}`,
      outline: "none",
    };
  };

  return (
    <div style={toolbarStyle}>
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => setCanvasMode(tool.id)}
          onMouseEnter={() => setHoveredTool(tool.id)}
          onMouseLeave={() => setHoveredTool(null)}
          style={getButtonStyle(tool.id)}
          title={tool.name}
          aria-label={tool.name}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  );
}

