"""
System prompt and few-shot examples for the Canvas AI Agent.

This module contains the comprehensive system prompt that guides the AI agent
in creating professional UI components, along with few-shot examples that
demonstrate correct tool usage patterns.

Prompt Engineering Strategy:
- System prompt provides detailed design principles and component patterns
- Few-shot examples show concrete implementations (login form)
- Emphasis on modern UI styling (shadows, rounded corners, proper spacing)
- Clear instructions for handling multiple objects and ambiguous requests

To modify prompts for experimentation:
- Update SYSTEM_PROMPT constant for design principles
- Add new examples to FEW_SHOT_EXAMPLES list
- Test with different models to see prompt effectiveness

Note: This prompt is compatible with both direct OpenAI API calls and LangChain agents.
Few-shot examples store tool call arguments as Python dicts. These will be
converted to JSON strings when building messages for the OpenAI API.
"""

# System prompt matching Firebase Functions (LangChain compatible)
SYSTEM_PROMPT = """You are an AI assistant that helps users create and manipulate shapes on a 5000x5000 pixel canvas.

CRITICAL RULES FOR MULTIPLE OBJECTS:

1. When a user asks for MULTIPLE objects (e.g., "create 10 squares", "make 5 circles"), you MUST call the creation tool MULTIPLE TIMES - one call for EACH object.

2. Examples:
   - "Create 10 squares" → Call create_rectangle 10 times with different x,y positions
   - "Make 5 red circles" → Call create_circle 5 times with different x,y positions
   - "Create a rectangle, circle, and text" → Call create_rectangle, create_circle, create_text once each

3. POSITION STRATEGY for multiple objects:
   - Spread objects across the canvas (don't stack them)
   - Use a grid pattern: For N objects, calculate positions like:
     * Row 1: x=200, 400, 600, 800... (spacing ~200-250px)
     * Row 2: x=200, 400, 600, 800... (y increased by 200-250px)
   - Keep all objects within canvas bounds (0-5000 x, 0-5000 y)
   - For large numbers (20+), use tighter spacing or multi-row grids

4. IMPORTANT: Each tool call creates exactly ONE object. To create N objects, make N tool calls.

Available tools: create_rectangle, create_circle, create_text, move_object, resize_object, change_color, rotate_object"""


# Few-shot example: Multiple circles creation
# This demonstrates the correct pattern for creating multiple objects
# Arguments are stored as Python dicts and will be converted to JSON strings when used
FEW_SHOT_EXAMPLES = [
    {
        "role": "user",
        "content": "Create 3 blue circles"
    },
    {
        "role": "assistant",
        "content": None,
        "tool_calls": [
            {
                "id": "call_example1",
                "type": "function",
                "function": {
                    "name": "create_circle",
                    "arguments": {
                        "x": 200,
                        "y": 200,
                        "fill": "#0000FF"
                    }
                }
            },
            {
                "id": "call_example2",
                "type": "function",
                "function": {
                    "name": "create_circle",
                    "arguments": {
                        "x": 450,
                        "y": 200,
                        "fill": "#0000FF"
                    }
                }
            },
            {
                "id": "call_example3",
                "type": "function",
                "function": {
                    "name": "create_circle",
                    "arguments": {
                        "x": 700,
                        "y": 200,
                        "fill": "#0000FF"
                    }
                }
            }
        ]
    },
    {
        "role": "tool",
        "tool_call_id": "call_example1",
        "content": {"success": True, "objectId": "obj1"}
    },
    {
        "role": "tool",
        "tool_call_id": "call_example2",
        "content": {"success": True, "objectId": "obj2"}
    },
    {
        "role": "tool",
        "tool_call_id": "call_example3",
        "content": {"success": True, "objectId": "obj3"}
    }
]

# Approximate token counts (for monitoring and cost estimation)
# System prompt: ~300 tokens
# Few-shot examples: ~200 tokens
# Total: ~500 tokens per request (before user message)

