import { Group, Path, Text, Rect } from "react-konva";

/**
 * Cursor component that displays a remote user's cursor on the canvas.
 * Shows cursor pointer and user name label.
 * 
 * @param {Object} props
 * @param {number} props.x - X position
 * @param {number} props.y - Y position
 * @param {string} props.userName - User's display name
 * @param {string} props.userColor - User's assigned color
 */
export default function Cursor({ x, y, userName, userColor }) {
  // SVG path data for cursor pointer (standard arrow cursor shape)
  const cursorPath = "M0,0 L0,16 L4,12 L7,19 L9,18 L6,11 L11,11 Z";

  return (
    <Group x={x} y={y}>
      {/* Cursor pointer */}
      <Path
        data={cursorPath}
        fill={userColor}
        stroke="#FFFFFF"
        strokeWidth={1}
        shadowColor="rgba(0, 0, 0, 0.3)"
        shadowBlur={2}
        shadowOffset={{ x: 1, y: 1 }}
      />

      {/* User name label background */}
      <Rect
        x={12}
        y={12}
        width={userName.length * 7 + 8}
        height={20}
        fill={userColor}
        cornerRadius={4}
        shadowColor="rgba(0, 0, 0, 0.2)"
        shadowBlur={2}
      />

      {/* User name text */}
      <Text
        x={16}
        y={15}
        text={userName}
        fontSize={12}
        fontFamily="Arial, sans-serif"
        fill="#FFFFFF"
        fontStyle="bold"
      />
    </Group>
  );
}

