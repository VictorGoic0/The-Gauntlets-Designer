import { useAuth } from "../../hooks/useAuth";
import { signOutUser } from "../../lib/firebase";
import ConnectionStatus from "./ConnectionStatus";
import Button from "../design-system/Button";
import { colors, spacing, typography, shadows } from "../../styles/tokens";

export default function Header({ onOpenAI }) {
  const { currentUser } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const headerStyle = {
    backgroundColor: colors.neutral[800],
    borderBottom: `1px solid ${colors.neutral[700]}`,
    boxShadow: shadows.elevation[2],
  };

  const containerStyle = {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: `${spacing[4]} ${spacing[6]}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const titleStyle = {
    fontSize: typography.fontSize["2xl"],
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[0],
    margin: 0,
    fontFamily: typography.fontFamily.base,
  };

  const actionsStyle = {
    display: "flex",
    alignItems: "center",
    gap: spacing[4],
  };

  const welcomeTextStyle = {
    color: colors.neutral[300],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.base,
  };

  const iconContainerStyle = {
    display: "flex",
    alignItems: "center",
    gap: spacing[2],
  };

  const iconStyle = {
    width: spacing[4],
    height: spacing[4],
  };

  return (
    <header style={headerStyle}>
      <div style={containerStyle}>
        <h1 style={titleStyle}>Goico's Artist</h1>
        <div style={actionsStyle}>
          {/* AI Assistant Button */}
          <Button
            onClick={onOpenAI}
            variant="primary"
            size="sm"
            title="Open AI Assistant (Ctrl/Cmd + K)"
          >
            <span style={iconContainerStyle}>
              <svg
                style={iconStyle}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              AI Assistant
            </span>
          </Button>

          <ConnectionStatus />

          <span style={welcomeTextStyle}>
            Welcome, {currentUser?.displayName || "User"}
          </span>

          <Button onClick={handleSignOut} variant="outline" size="sm">
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
}

