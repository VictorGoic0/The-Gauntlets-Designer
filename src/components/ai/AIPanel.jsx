/**
 * AIPanel Component - Compact floating card for AI assistant interaction
 */

import { useState } from "react";
import Card from "../design-system/Card";
import AIInput from "./AIInput";
import { executeAICommand } from "../../services/aiService";
import toast from "react-hot-toast";
import { colors, typography, spacing } from "../../styles/tokens";

export default function AIPanel({ isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (command) => {
    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      type: "user",
      content: command,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    setIsLoading(true);

    try {
      // Execute AI command
      const result = await executeAICommand(command);

      // Add AI response to chat
      const aiMessage = {
        id: Date.now() + 1,
        type: "ai",
        content: result.message || "Command executed successfully",
        results: result.results,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Show success toast
      if (result.results && result.results.length > 0) {
        toast.success(`✨ Created ${result.results.length} object(s)`);
      } else {
        toast.success("✨ Command executed");
      }
    } catch (error) {
      console.error("AI command failed:", error);

      // Add error message to chat
      const errorMessage = {
        id: Date.now() + 1,
        type: "error",
        content: error.message || "Failed to execute command",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);

      toast.error(`❌ ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    toast.success("Conversation cleared");
  };

  if (!isOpen) return null;

  // Panel positioning styles (centered on screen)
  const panelContainerStyles = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    animation: "fadeIn 0.2s ease-out",
  };

  // Backdrop styles
  const backdropStyles = {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  };

  // Card wrapper styles (similar to login card dimensions)
  const cardWrapperStyles = {
    position: "relative",
    width: "90%",
    maxWidth: "450px",
    maxHeight: "80vh",
    display: "flex",
    flexDirection: "column",
    animation: "scaleIn 0.2s ease-out",
  };

  return (
    <>
      {/* Keyframe animations */}
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>

      <div style={panelContainerStyles}>
        {/* Backdrop */}
        <div style={backdropStyles} onClick={onClose} />

      {/* AI Panel Card */}
      <div style={cardWrapperStyles}>
        <Card variant="elevated" padding="none">
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: spacing[6],
              borderBottom: `1px solid ${colors.divider}`,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.text.primary,
                  marginBottom: spacing[1],
                }}
              >
                AI Assistant
              </h2>
              <p
                style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary,
                }}
              >
                Describe what you want to create
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: spacing[2],
                color: colors.text.secondary,
                display: "flex",
                alignItems: "center",
              }}
              aria-label="Close AI panel"
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = colors.text.primary)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = colors.text.secondary)
              }
            >
              <svg
                style={{ width: "1.5rem", height: "1.5rem" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: spacing[6],
              minHeight: "200px",
              maxHeight: "400px",
            }}
          >
            {messages.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: colors.text.secondary,
                  marginTop: spacing[8],
                }}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: spacing[4] }}>
                  ✨
                </div>
                <p
                  style={{
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.medium,
                    marginBottom: spacing[2],
                  }}
                >
                  Start creating with AI
                </p>
                <p style={{ fontSize: typography.fontSize.sm }}>
                  Type a command below to get started
                </p>
                <div
                  style={{
                    marginTop: spacing[6],
                    textAlign: "left",
                    backgroundColor: colors.background.default,
                    borderRadius: "8px",
                    padding: spacing[4],
                  }}
                >
                  <p
                    style={{
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.text.secondary,
                      textTransform: "uppercase",
                      marginBottom: spacing[2],
                    }}
                  >
                    Example commands:
                  </p>
                  <ul
                    style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.text.primary,
                      listStyle: "none",
                      padding: 0,
                    }}
                  >
                    <li style={{ marginBottom: spacing[1] }}>
                      • "Create a red rectangle"
                    </li>
                    <li style={{ marginBottom: spacing[1] }}>
                      • "Add three blue circles"
                    </li>
                    <li style={{ marginBottom: spacing[1] }}>
                      • "Make text that says Welcome"
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: spacing[4] }}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems:
                        message.type === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "85%",
                        borderRadius: "8px",
                        padding: `${spacing[2]} ${spacing[4]}`,
                        backgroundColor:
                          message.type === "user"
                            ? colors.primary[600]
                            : message.type === "error"
                            ? colors.error.main
                            : colors.background.default,
                        color:
                          message.type === "user" || message.type === "error"
                            ? "#ffffff"
                            : colors.text.primary,
                      }}
                    >
                      <p
                        style={{
                          fontSize: typography.fontSize.sm,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {message.content}
                      </p>
                      {message.results && message.results.length > 0 && (
                        <div
                          style={{
                            marginTop: spacing[2],
                            fontSize: typography.fontSize.xs,
                            opacity: 0.75,
                          }}
                        >
                          {message.results.map((result, idx) => (
                            <div key={idx}>• {result.message}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: typography.fontSize.xs,
                        color: colors.text.secondary,
                        marginTop: spacing[1],
                      }}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div style={{ display: "flex", alignItems: "flex-start" }}>
                    <div
                      style={{
                        backgroundColor: colors.background.default,
                        color: colors.text.primary,
                        borderRadius: "8px",
                        padding: `${spacing[2]} ${spacing[4]}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: spacing[2],
                        }}
                      >
                        <div style={{ display: "flex", gap: "4px" }}>
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              backgroundColor: colors.text.secondary,
                              borderRadius: "50%",
                              animation: "bounce 1s infinite",
                            }}
                          />
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              backgroundColor: colors.text.secondary,
                              borderRadius: "50%",
                              animation: "bounce 1s infinite",
                              animationDelay: "0.1s",
                            }}
                          />
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              backgroundColor: colors.text.secondary,
                              borderRadius: "50%",
                              animation: "bounce 1s infinite",
                              animationDelay: "0.2s",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: typography.fontSize.sm }}>
                          AI is thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input Area */}
          <div
            style={{
              borderTop: `1px solid ${colors.divider}`,
              padding: spacing[6],
            }}
          >
            {messages.length > 0 && (
              <button
                onClick={handleClear}
                style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.text.secondary,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  marginBottom: spacing[3],
                  padding: 0,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = colors.text.primary)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = colors.text.secondary)
                }
              >
                Clear conversation
              </button>
            )}
            <AIInput onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
        </Card>
      </div>
    </div>
    </>
  );
}

