/**
 * AI Service - Handles communication with the AI Agent (FastAPI backend with SSE streaming)
 */

// FastAPI backend URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Execute an AI command on the canvas (non-streaming)
 * @param {string} command - Natural language command from the user
 * @returns {Promise<Object>} Response from the AI agent
 * @deprecated Use executeAICommandStream for better UX with real-time updates
 */
export async function executeAICommand(command) {
  if (!command || command.trim().length === 0) {
    throw new Error("Command cannot be empty");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/agent/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: command.trim(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("AI Service error:", error);
    throw new Error(
      error.message || "Failed to execute AI command. Please try again."
    );
  }
}

/**
 * Execute an AI command with streaming (SSE)
 * @param {string} command - Natural language command from the user
 * @param {Object} callbacks - Callback functions for streaming events
 * @param {Function} callbacks.onToolStart - Called when a tool starts executing
 * @param {Function} callbacks.onToolEnd - Called when a tool finishes executing
 * @param {Function} callbacks.onMessage - Called when a message chunk is received
 * @param {Function} callbacks.onComplete - Called when processing is complete
 * @param {Function} callbacks.onError - Called when an error occurs
 * @returns {Function} Cleanup function to close the stream
 */
export function executeAICommandStream(command, callbacks = {}) {
  if (!command || command.trim().length === 0) {
    throw new Error("Command cannot be empty");
  }

  const {
    onMessage = () => {},
    onComplete = () => {},
    onError = () => {},
  } = callbacks;

  const controller = new AbortController();

  try {
    const url = `${API_BASE_URL}/api/agent/chat-stream`;

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: command.trim(),
      }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          // Decode chunk and add to buffer
          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE messages
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith("event:")) {
              // Skip event type line (we use event field in data JSON instead)
              continue;
            }

            if (line.startsWith("data:")) {
              const data = line.substring(5).trim();

              if (data) {
                try {
                  const event = JSON.parse(data);

                  switch (event.event) {
                    case "progress":
                      // Tool execution progress
                      onMessage(event.message);
                      break;
                    case "complete":
                      // Final completion with message
                      if (event.message) {
                        onMessage(event.message);
                      }
                      onComplete(event.toolCalls);
                      break;
                    case "error":
                      onError(new Error(event.message));
                      break;
                  }
                } catch (parseError) {
                  console.error("Error parsing SSE data:", parseError);
                }
              }
            }
          }
        }
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Streaming error:", error);
          onError(error);
        }
      });

    // Return cleanup function
    return () => {
      controller.abort();
    };
  } catch (error) {
    console.error("AI Service streaming error:", error);
    onError(error);
    return () => {}; // No-op cleanup
  }
}

/**
 * Check if the AI service is available (user is authenticated)
 * @param {Object} user - Current user object from auth
 * @returns {boolean} Whether AI service can be used
 */
export function isAIServiceAvailable(user) {
  return !!user;
}
