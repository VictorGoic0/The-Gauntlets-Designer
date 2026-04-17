import { useState } from "react";
import usePresenceSync from "../../hooks/usePresenceSync";
import usePresenceStore from "../../stores/presenceStore";
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
  transitions,
} from "../../styles/tokens";
import PresenceChevronIcon from "../icons/PresenceChevronIcon";

// Static styles - defined outside component for performance
const containerStyle = {
  position: "absolute",
  top: spacing[2],
  right: spacing[2],
  zIndex: 50,
  backgroundColor: colors.neutral.darker,
  borderRadius: borderRadius.md,
  boxShadow: shadows.elevation[3],
  border: `1px solid ${colors.neutral.dark}`,
  pointerEvents: "auto",
  minWidth: "200px",
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: `${spacing[3]} ${spacing[4]}`,
  borderBottom: `1px solid ${colors.neutral.dark}`,
};

const headerContentStyle = {
  display: "flex",
  alignItems: "center",
  gap: spacing[2],
};

const statusDotStyle = {
  width: "8px",
  height: "8px",
  backgroundColor: colors.success.main,
  borderRadius: borderRadius.full,
  animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
};

const headerTextStyle = {
  color: colors.neutral.white,
  fontWeight: typography.fontWeight.semibold,
  fontSize: typography.fontSize.sm,
  fontFamily: typography.fontFamily.base,
};

const toggleButtonBaseStyle = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: spacing[1],
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: colors.neutral.lightBase,
  transition: `color ${transitions.duration.shorter} ${transitions.easing.easeInOut}, transform ${transitions.duration.shorter} ${transitions.easing.easeInOut}`,
};

const userListContainerStyle = {
  padding: spacing[2],
  maxHeight: "384px",
  overflowY: "auto",
};

const emptyStateStyle = {
  padding: `${spacing[6]} ${spacing[4]}`,
  textAlign: "center",
  color: colors.neutral.lightBase,
  fontSize: typography.fontSize.sm,
  fontFamily: typography.fontFamily.base,
};

const userListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: spacing[1],
};

const userItemBaseStyle = {
  display: "flex",
  alignItems: "center",
  gap: spacing[3],
  padding: `${spacing[2]} ${spacing[3]}`,
  borderRadius: borderRadius.base,
  transition: `background-color ${transitions.duration.shorter} ${transitions.easing.easeInOut}`,
  cursor: "default",
};

const avatarBaseStyle = {
  width: "32px",
  height: "32px",
  borderRadius: borderRadius.full,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: colors.neutral.white,
  fontSize: typography.fontSize.xs,
  fontWeight: typography.fontWeight.bold,
  flexShrink: 0,
  fontFamily: typography.fontFamily.base,
};

const userNameStyle = {
  color: colors.neutral.lightest,
  fontSize: typography.fontSize.sm,
  flex: 1,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontFamily: typography.fontFamily.base,
};

/**
 * PresencePanel component displays a list of online users.
 * Features:
 * - Shows user avatar/initials with their assigned color
 * - Displays user name
 * - Collapsible panel with toggle button
 * - Shows total count of online users
 */
export default function PresencePanel() {
  // Set up presence listener (writes to store)
  usePresenceSync();
  
  // Read online users from Presence Store
  const onlineUsers = usePresenceStore((state) => state.presence.onlineUsers);
  
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

  const onClickTogglePresencePanel = () =>
    setIsCollapsed((previousIsCollapsed) => !previousIsCollapsed);

  const onMouseEnterCollapseChevron = (event) => {
    event.currentTarget.style.color = colors.neutral.white;
  };

  const onMouseLeaveCollapseChevron = (event) => {
    event.currentTarget.style.color = colors.neutral.lightBase;
  };

  return (
    <>
      {/* Inject pulse animation */}
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
      
      <div style={containerStyle}>
        {/* Header with toggle button */}
        <div style={headerStyle}>
          <div style={headerContentStyle}>
            <div style={statusDotStyle}></div>
            <span style={headerTextStyle}>
              Online ({onlineUsers.length})
            </span>
          </div>
          <button
            onClick={onClickTogglePresencePanel}
            onMouseEnter={onMouseEnterCollapseChevron}
            onMouseLeave={onMouseLeaveCollapseChevron}
            style={{
              ...toggleButtonBaseStyle,
              transform: isCollapsed ? "rotate(180deg)" : "rotate(0deg)",
            }}
            title={isCollapsed ? "Expand" : "Collapse"}
            aria-label={isCollapsed ? "Expand user list" : "Collapse user list"}
          >
            <PresenceChevronIcon />
          </button>
        </div>

        {/* User list - hidden when collapsed */}
        {!isCollapsed && (
          <div style={userListContainerStyle}>
            {onlineUsers.length === 0 ? (
              <div style={emptyStateStyle}>
                No other users online
              </div>
            ) : (
              <div style={userListStyle}>
                {onlineUsers.map((user) => (
                  <UserItem
                    key={user.userId}
                    user={user}
                    getUserInitials={getUserInitials}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// Separate component for user item to handle hover state
function UserItem({ user, getUserInitials }) {
  const [isHovered, setIsHovered] = useState(false);

  const onMouseEnterUserRow = () => setIsHovered(true);

  const onMouseLeaveUserRow = () => setIsHovered(false);

  const userItemStyle = {
    ...userItemBaseStyle,
    backgroundColor: isHovered ? colors.neutral.mediumDark : "transparent",
  };

  const avatarStyle = {
    ...avatarBaseStyle,
    backgroundColor: user.userColor,
  };

  return (
    <div
      onMouseEnter={onMouseEnterUserRow}
      onMouseLeave={onMouseLeaveUserRow}
      style={userItemStyle}
    >
      {/* User avatar with initials */}
      <div
        style={avatarStyle}
        title={user.userEmail}
      >
        {getUserInitials(user.userName)}
      </div>

      {/* User name */}
      <span style={userNameStyle}>
        {user.userName || "Anonymous"}
      </span>
    </div>
  );
}

