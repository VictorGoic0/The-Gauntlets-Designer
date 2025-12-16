import { useAuth } from "../../hooks/useAuth";
import { signOutUser } from "../../lib/firebase";
import ConnectionStatus from "./ConnectionStatus";
import Button from "../design-system/Button";
import {
  colors,
  spacing,
  typography,
  shadows,
  borderRadius,
} from "../../styles/tokens";

// Static styles - defined outside component for performance
const headerStyle = {
  background: `linear-gradient(135deg, ${colors.neutral.darker} 0%, ${colors.neutral.darkest} 100%)`,
  borderBottom: `1px solid ${colors.neutral.dark}`,
  boxShadow: shadows.elevation[3],
  position: "relative",
};

const containerStyle = {
  maxWidth: "1280px",
  margin: "0 auto",
  padding: `${spacing[5]} ${spacing[6]}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: spacing[6],
};

const brandingStyle = {
  display: "flex",
  alignItems: "center",
  gap: spacing[3],
};

const logoPlaceholderStyle = {
  width: "40px",
  height: "40px",
  borderRadius: borderRadius.base,
  background: `linear-gradient(135deg, ${colors.primary.base} 0%, ${colors.primary.dark} 100%)`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: `0 0 20px rgba(33, 150, 243, 0.3), ${shadows.elevation[2]}`,
  flexShrink: 0,
};

const logoIconStyle = {
  width: "24px",
  height: "24px",
  color: colors.neutral.white,
};

const titleContainerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: spacing[1],
};

const titleStyle = {
  fontSize: typography.fontSize["2xl"],
  fontWeight: typography.fontWeight.bold,
  background: `linear-gradient(135deg, ${colors.neutral.white} 0%, ${colors.neutral.lightBase} 100%)`,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  margin: 0,
  fontFamily: typography.fontFamily.base,
  lineHeight: 1,
};

const subtitleStyle = {
  fontSize: typography.fontSize.xs,
  color: colors.neutral.base,
  fontWeight: typography.fontWeight.medium,
  fontFamily: typography.fontFamily.base,
  letterSpacing: "0.5px",
};

const actionsStyle = {
  display: "flex",
  alignItems: "center",
  gap: spacing[5],
};

const infoGroupStyle = {
  display: "flex",
  alignItems: "center",
  gap: spacing[3],
  padding: `${spacing[2]} ${spacing[4]}`,
  backgroundColor: colors.neutral.darkest,
  borderRadius: borderRadius.lg,
  border: `1px solid ${colors.neutral.dark}`,
};

const dividerStyle = {
  width: "1px",
  height: "24px",
  backgroundColor: colors.neutral.dark,
};

const userNameStyle = {
  color: colors.neutral.white,
  fontSize: typography.fontSize.sm,
  fontWeight: typography.fontWeight.semibold,
  fontFamily: typography.fontFamily.base,
};

const buttonGroupStyle = {
  display: "flex",
  alignItems: "center",
  gap: spacing[3],
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

export default function Header({ onOpenAI }) {
  const { currentUser } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header style={headerStyle}>
      <div style={containerStyle}>
        {/* Left: Branding */}
        <div style={brandingStyle}>
          {/* Logo Placeholder */}
          <div style={logoPlaceholderStyle}>
            <svg
              style={logoIconStyle}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
              />
            </svg>
          </div>

          {/* Title */}
          <div style={titleContainerStyle}>
            <h1 style={titleStyle}>Black Canvas</h1>
            <span style={subtitleStyle}>Collaborative Canvas</span>
          </div>
        </div>

        {/* Right: Actions */}
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

          {/* Info Group: Connection + User */}
          <div style={infoGroupStyle}>
            <ConnectionStatus />

            <div style={dividerStyle} />

            <span style={userNameStyle}>
              {currentUser?.displayName || "User"}
            </span>
          </div>

          {/* Button Group */}
          <div style={buttonGroupStyle}>
            <Button onClick={handleSignOut} variant="outline" size="sm">
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
