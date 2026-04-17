/**
 * Remote user cursor pointer (Konva overlay uses HTML; icon only).
 */
export default function CursorPointerIcon({ userColor, style }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={
        style ?? {
          filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))",
        }
      }
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
  );
}
