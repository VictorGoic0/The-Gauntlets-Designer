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

    try {
      // Initialize OpenAI (API key will be set as secret later)
      // For now, this will be undefined but the structure is ready
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Performance timing
      const startTime = Date.now();

      // Call OpenAI with function calling
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Fast and cost-effective, good for function calling
        messages: [
          {
            role: "system",
            content: `You are an AI assistant that helps users create and manipulate shapes on a 5000x5000 pixel canvas.

CRITICAL RULES FOR MULTIPLE OBJECTS:

1. When a user asks for MULTIPLE objects (e.g., "create 10 squares", "make 5 circles"), you MUST call the creation tool MULTIPLE TIMES - one call for EACH object.

2. Examples:
   - "Create 10 squares" → Call createRectangle 10 times with different x,y positions
   - "Make 5 red circles" → Call createCircle 5 times with different x,y positions
   - "Create a rectangle, circle, and text" → Call createRectangle, createCircle, createText once each

3. POSITION STRATEGY for multiple objects:
   - Spread objects across the canvas (don't stack them)
   - Use a grid pattern: For N objects, calculate positions like:
     * Row 1: x=200, 400, 600, 800... (spacing ~200-250px)
     * Row 2: x=200, 400, 600, 800... (y increased by 200-250px)
   - Keep all objects within canvas bounds (0-5000 x, 0-5000 y)
   - For large numbers (20+), use tighter spacing or multi-row grids

4. IMPORTANT: Each tool call creates exactly ONE object. To create N objects, make N tool calls.

Available tools: createRectangle, createCircle, createText, moveObject, resizeObject, changeColor, rotateObject`,
          },
          // Few-shot learning example: Show GPT-4 correct behavior
          {
            role: "user",
            content: "Create 3 blue circles",
          },
          {
            role: "assistant",
            content: null,
            tool_calls: [
              {
                id: "call_example1",
                type: "function",
                function: {
                  name: "createCircle",
                  arguments: JSON.stringify({
                    x: 200,
                    y: 200,
                    fill: "#0000FF",
                  }),
                },
              },
              {
                id: "call_example2",
                type: "function",
                function: {
                  name: "createCircle",
                  arguments: JSON.stringify({
                    x: 450,
                    y: 200,
                    fill: "#0000FF",
                  }),
                },
              },
              {
                id: "call_example3",
                type: "function",
                function: {
                  name: "createCircle",
                  arguments: JSON.stringify({
                    x: 700,
                    y: 200,
                    fill: "#0000FF",
                  }),
                },
              },
            ],
          },
          {
            role: "tool",
            content: JSON.stringify({ success: true, objectId: "obj1" }),
            tool_call_id: "call_example1",
          },
          {
            role: "tool",
            content: JSON.stringify({ success: true, objectId: "obj2" }),
            tool_call_id: "call_example2",
          },
          {
            role: "tool",
            content: JSON.stringify({ success: true, objectId: "obj3" }),
            tool_call_id: "call_example3",
          },
          // Now the actual user command
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
      const openaiTime = Date.now() - startTime;
      // console.log(`⏱️ OpenAI generation time: ${openaiTime}ms`);

      // If OpenAI wants to call tools
      if (responseMessage.tool_calls) {
        const toolStartTime = Date.now();

        // Execute all tool calls in parallel for better performance
        const promises = responseMessage.tool_calls.map((toolCall) => {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);
          return executeTool(toolName, toolArgs, request.auth.uid);
        });

        // Use allSettled to handle partial failures gracefully
        const results = await Promise.allSettled(promises);
        const toolExecutionTime = Date.now() - toolStartTime;
        // console.log(
        //   `⏱️ Tool execution time (${promises.length} tools): ${toolExecutionTime}ms`
        // );

        // Count successes and failures
        const successCount = results.filter(
          (r) => r.status === "fulfilled"
        ).length;
        const failureCount = results.filter(
          (r) => r.status === "rejected"
        ).length;

        // Determine overall success (if ANY objects created)
        const overallSuccess = successCount > 0;

        // Build response message
        let message;
        if (failureCount === 0) {
          message = `✨ Created ${successCount} object(s) successfully`;
        } else if (successCount === 0) {
          message = `❌ Failed to create all ${failureCount} object(s)`;
        } else {
          message = `⚠️ Created ${successCount} of ${
            successCount + failureCount
          } objects (${failureCount} failed)`;
        }

        // Extract actual results for frontend (unwrap Promise.allSettled format)
        const formattedResults = results.map((result, index) => {
          if (result.status === "fulfilled") {
            return result.value; // Return the actual tool result
          } else {
            return {
              success: false,
              error: result.reason?.message || "Unknown error",
              index,
            };
          }
        });

        const totalTime = Date.now() - startTime;
        // console.log(`⏱️ Total request time: ${totalTime}ms`);

        return {
          success: overallSuccess,
          message,
          results: formattedResults, // Use formatted results instead of raw Promise.allSettled
          successCount,
          failureCount,
          timing: {
            openai: openaiTime,
            toolExecution: toolExecutionTime,
            total: totalTime,
          },
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
      // console.error("AI Agent error:", error);
      throw new HttpsError("internal", error.message);
    }
  }
);
