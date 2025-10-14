/**
 * Cursor component that displays a remote user's cursor as an HTML overlay.
 * Shows cursor pointer and user name label.
 * 
 * @param {Object} props
 * @param {number} props.x - X position in screen coordinates
 * @param {number} props.y - Y position in screen coordinates
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
      {/* Cursor SVG */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))',
        }}
      >
        <path
          d="M5.65376 12.3673L5 5L12.3664 5.65373L8.92866 9.09147L12.1289 12.2917L10.3534 14.0672L7.15318 10.867L5.65376 12.3673Z"
          fill={userColor}
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

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

