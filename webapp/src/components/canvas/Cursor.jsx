import CursorPointerIcon from "../icons/CursorPointerIcon";

/**
 * Cursor component that displays a remote user's cursor as an HTML overlay.
 * Shows cursor pointer and user name label.
 *
 * @param {Object} props
 * @param {number} props.x - X position in screen-rendered coordinates (canvas coords converted to screen)
 * @param {number} props.y - Y position in screen-rendered coordinates (canvas coords converted to screen)
 * @param {string} props.userName - User's display name
 * @param {string} props.userColor - User's assigned color
 */
export default function Cursor({ x, y, userName, userColor }) {
  return (
    <div
      className="absolute pointer-events-none transition-all duration-75 ease-linear"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-2px, -2px)',
      }}
    >
      <CursorPointerIcon userColor={userColor} />

      {/* User name label */}
      <div
        className="mt-1 ml-3 px-2 py-1 rounded text-xs font-semibold text-white whitespace-nowrap"
        style={{
          backgroundColor: userColor,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        }}
      >
        {userName}
      </div>
    </div>
  );
}

