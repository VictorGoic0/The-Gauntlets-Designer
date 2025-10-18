/**
 * AIInput Component - Text input field for AI commands
 */

import { useState } from "react";
import Button from "../design-system/Button";
import {
  colors,
  typography,
  spacing,
  borderRadius,
  transitions,
} from "../../styles/tokens";

export default function AIInput({ onSubmit, isLoading }) {
  const [command, setCommand] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (command.trim().length === 0) return;

    onSubmit(command);
    setCommand(""); // Clear input after submit
  };

  const handleKeyDown = (e) => {
    // Submit on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Textarea styles using design tokens
  const textareaStyles = {
    width: "100%",
    padding: `${spacing[3]} ${spacing[4]}`,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.base,
    lineHeight: typography.lineHeight.normal,
    color: colors.text.primary,
    backgroundColor: isLoading
      ? colors.action.disabledBackground
      : colors.background.paper,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: isFocused ? colors.primary[500] : colors.neutral[300],
    borderRadius: borderRadius.base,
    outline: "none",
    transition: `border-color ${transitions.duration.short} ${transitions.easing.easeInOut}, box-shadow ${transitions.duration.short} ${transitions.easing.easeInOut}`,
    cursor: isLoading ? "not-allowed" : "text",
    resize: "none",
    boxSizing: "border-box",
    ...(isFocused && {
      boxShadow: `0 0 0 3px ${colors.primary[500]}1A`,
    }),
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: spacing[3] }}>
      <textarea
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Describe what you want to create... (e.g., 'Create a red rectangle')"
        disabled={isLoading}
        rows={3}
        style={textareaStyles}
        aria-label="AI command input"
      />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: spacing[3] }}>
        {command.length > 0 && (
          <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
            {command.length} character{command.length !== 1 ? "s" : ""}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          disabled={isLoading || command.trim().length === 0}
          style={{ minWidth: "100px" }}
        >
          {isLoading ? "Sending..." : "Send"}
        </Button>
      </div>

    </form>
  );
}

