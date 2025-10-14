import { useState } from "react";
import { usePresenceSync } from "../../hooks/usePresenceSync";

/**
 * PresencePanel component displays a list of online users.
 * Features:
 * - Shows user avatar/initials with their assigned color
 * - Displays user name
 * - Collapsible panel with toggle button
 * - Shows total count of online users
 */
export default function PresencePanel() {
  const onlineUsers = usePresenceSync();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Get user initials from name
  const getUserInitials = (userName) => {
    if (!userName) return "?";
    const names = userName.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return userName.substring(0, 2).toUpperCase();
  };

  return (
    <div className="absolute top-6 right-6 z-50 bg-gray-800 rounded-lg shadow-lg border border-gray-700 pointer-events-auto">
      {/* Header with toggle button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-white font-medium">
            Online ({onlineUsers.length})
          </span>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-400 hover:text-white transition-colors"
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 transition-transform ${
              isCollapsed ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* User list - hidden when collapsed */}
      {!isCollapsed && (
        <div className="p-2 max-h-96 overflow-y-auto">
          {onlineUsers.length === 0 ? (
            <div className="px-4 py-6 text-center text-gray-400 text-sm">
              No other users online
            </div>
          ) : (
            <div className="space-y-1">
              {onlineUsers.map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  {/* User avatar with initials */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: user.userColor }}
                    title={user.userEmail}
                  >
                    {getUserInitials(user.userName)}
                  </div>

                  {/* User name */}
                  <span className="text-gray-200 text-sm truncate flex-1">
                    {user.userName || "Anonymous"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

