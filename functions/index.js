const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { toolSchemas, executeTool } = require("./tools");
const OpenAI = require("openai");

/**
 * AI Agent Function - Main entry point for AI-powered canvas commands
 */
exports.aiAgent = onCall(
  {
    secrets: ["OPENAI_API_KEY"], // Grant access to the secret
  },
  async (request) => {
    console.log("=== AI AGENT CALLED ===");

    // Verify user is authenticated
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "User must be authenticated to use the AI agent."
      );
    }

    const { command } = request.data;

    if (!command) {
      throw new HttpsError("invalid-argument", "Command is required.");
    }

    console.log(`User ${request.auth.uid} command: "${command}"`);

    try {
      // Initialize OpenAI (API key will be set as secret later)
      // For now, this will be undefined but the structure is ready
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Call OpenAI with function calling
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are an AI assistant that helps users create and manipulate shapes on a 5000x5000 pixel canvas.\n\nIMPORTANT: When a user asks for multiple shapes (e.g., 'create a rectangle, circle, and text'), you MUST call multiple tools in parallel - one tool for EACH shape requested. Do NOT create multiple shapes with a single tool call.\n\nFor example:\n- 'Create a red rectangle and blue circle' → Call createRectangle AND createCircle\n- 'Make three shapes' → Call 3 separate tools\n- Always call the appropriate tool for each individual shape.",
          },
          {
            role: "user",
            content: command,
          },
        ],
        tools: toolSchemas,
        tool_choice: "auto",
        parallel_tool_calls: true, // Enable parallel tool calling
      });

      const responseMessage = completion.choices[0].message;

      console.log(
        `OpenAI returned ${responseMessage.tool_calls?.length || 0} tool calls`
      );

      // If OpenAI wants to call tools
      if (responseMessage.tool_calls) {
        const results = [];

        // Execute each tool call
        for (const toolCall of responseMessage.tool_calls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);

          console.log(
            `Executing tool ${results.length + 1}/${
              responseMessage.tool_calls.length
            }: ${toolName}`,
            toolArgs
          );

          const result = await executeTool(
            toolName,
            toolArgs,
            request.auth.uid
          );

          results.push(result);
        }

        return {
          success: true,
          message: `Command executed successfully - created ${results.length} object(s)`,
          results,
          timestamp: new Date().toISOString(),
        };
      }

      // If no tools were called, return the text response
      return {
        success: true,
        message: responseMessage.content || "Command processed",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("AI Agent error:", error);
      throw new HttpsError("internal", error.message);
    }
  }
);

// /**
//  * Test function - v2 API (auth test only for now)
//  * COMMENTED OUT - Replaced by aiAgent function
//  */
// exports.testFunction = onCall((request) => {
//   console.log("=== TEST FUNCTION CALLED (v2) ===");
//   console.log("Has auth?", !!request.auth);
//
//   if (!request.auth) {
//     console.error("ERROR: No auth context!");
//     throw new HttpsError(
//       "unauthenticated",
//       "User must be authenticated to call this function."
//     );
//   }
//
//   console.log("Authenticated user:", request.auth.uid);
//
//   return {
//     success: true,
//     message: "Firebase Functions v2 is working correctly!",
//     user: {
//       uid: request.auth.uid,
//       email: request.auth.token.email || "N/A",
//     },
//     timestamp: new Date().toISOString(),
//   };
// });
