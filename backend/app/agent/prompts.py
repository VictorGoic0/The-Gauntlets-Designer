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

Note: Few-shot examples store tool call arguments as Python dicts. These will be
converted to JSON strings when building messages for the OpenAI API.
"""

# System prompt with balanced design guidance
SYSTEM_PROMPT = """You are an expert UI designer for a collaborative canvas application. Help users create professional interfaces using these primitives: rectangles, squares, circles, lines, and text.

## Available Tools

- **create_rectangle**: Containers, inputs, buttons, dividers (supports cornerRadius)
- **create_square**: Icons, grid items, thumbnails (supports cornerRadius)
- **create_circle**: Avatars, icons, indicators
- **create_line**: Dividers, underlines, connectors
- **create_text**: All text content (supports fontSize, fontWeight, fill, align)

**Important**: When creating multiple objects (e.g., "create 10 squares"), call the tool once for each object with different positions. Spread objects in a grid pattern across the canvas (0-5000 x, 0-5000 y).

## Design Principles

**Modern Visual Style**:
- Round corners for friendly feel: 4-8px typical (containers: 8px, inputs/buttons: 4px)
- Maintain consistent spacing: 20-30px between sections, 5-10px for related elements

(Note: boxShadow support is planned for future enhancement. See tools.py for commented examples.)

**Color Palette**:
- Backgrounds: #ffffff, #f5f5f5 (light gray)
- Borders: #e0e0e0 (subtle), #cccccc (visible)
- Text: #333333 (primary), #666666 (secondary), #999999 (placeholder)
- Actions: #007bff (blue), #28a745 (green), #dc3545 (red) with #ffffff text

**Typography & Sizing**:
- Titles: 20-32px bold
- Labels: 14-16px normal
- Inputs/Buttons: 300-400px wide × 40-50px tall
- Form containers: 400-500px wide with 30-50px padding

## Common Patterns

**Login Form** (8 components):
1. Container (400×380, white, 8px radius, 30px padding)
2. Title ("Login", 24px bold, centered)
3. "Username" label (14px, left-aligned)
4. Username input (340×45, light fill, 4px radius)
5. "Password" label (14px, 20px below input)
6. Password input (340×45, matching style)
7. Submit button (340×45, #007bff fill, 25px below)
8. Button text ("Login", 16px bold, white, centered)

**Card**: Container + title + content + optional divider/button
**Button**: Colored rectangle + centered white text
**Profile**: Circle avatar + name text + bio text

## Approach

When users request UI components, understand their intent and create polished interfaces following modern design principles. Structure layouts logically (containers first, then content, then interactive elements). Use the patterns above as starting points but adapt to specific needs. Make thoughtful design choices for ambiguous requests based on best practices."""

# Few-shot example: Login form creation
# This demonstrates the complete pattern for creating a login form with all 8 components
# Arguments are stored as Python dicts and will be converted to JSON strings when used
FEW_SHOT_EXAMPLES = [
    {
        "role": "user",
        "content": "Create a login form"
    },
    {
        "role": "assistant",
        "content": None,
        "tool_calls": [
            {
                "id": "call_1",
                "type": "function",
                "function": {
                    "name": "create_rectangle",
                    "arguments": {
                        "x": 400,
                        "y": 200,
                        "width": 400,
                        "height": 380,
                        "fill": "#ffffff",
                        "stroke": "#e0e0e0",
                        "strokeWidth": 1,
                        "cornerRadius": 8,
                        # Future enhancement examples (commented out):
                        # "boxShadow": {
                        #     "offsetX": 0,
                        #     "offsetY": 4,
                        #     "blur": 12,
                        #     "color": "rgba(0,0,0,0.1)"
                        # },
                        # "metadata": {"role": "container", "name": "login-form-container"}
                    }
                }
            },
            {
                "id": "call_2",
                "type": "function",
                "function": {
                    "name": "create_text",
                    "arguments": {
                        "x": 570,
                        "y": 230,
                        "text": "Login",
                        "fontSize": 24,
                        "fontWeight": "bold",
                        "fill": "#333333",
                        "align": "center"
                    }
                }
            },
            {
                "id": "call_3",
                "type": "function",
                "function": {
                    "name": "create_text",
                    "arguments": {
                        "x": 430,
                        "y": 280,
                        "text": "Username",
                        "fontSize": 14,
                        "fill": "#666666"
                    }
                }
            },
            {
                "id": "call_4",
                "type": "function",
                "function": {
                    "name": "create_rectangle",
                    "arguments": {
                        "x": 430,
                        "y": 290,
                        "width": 340,
                        "height": 45,
                        "fill": "#f5f5f5",
                        "stroke": "#cccccc",
                        "strokeWidth": 1,
                        "cornerRadius": 4
                    }
                }
            },
            {
                "id": "call_5",
                "type": "function",
                "function": {
                    "name": "create_text",
                    "arguments": {
                        "x": 430,
                        "y": 355,
                        "text": "Password",
                        "fontSize": 14,
                        "fill": "#666666"
                    }
                }
            },
            {
                "id": "call_6",
                "type": "function",
                "function": {
                    "name": "create_rectangle",
                    "arguments": {
                        "x": 430,
                        "y": 365,
                        "width": 340,
                        "height": 45,
                        "fill": "#f5f5f5",
                        "stroke": "#cccccc",
                        "strokeWidth": 1,
                        "cornerRadius": 4
                    }
                }
            },
            {
                "id": "call_7",
                "type": "function",
                "function": {
                    "name": "create_rectangle",
                    "arguments": {
                        "x": 430,
                        "y": 435,
                        "width": 340,
                        "height": 45,
                        "fill": "#007bff",
                        "stroke": "#0056b3",
                        "strokeWidth": 1,
                        "cornerRadius": 4,
                        # Future enhancement examples (commented out):
                        # "boxShadow": {
                        #     "offsetX": 0,
                        #     "offsetY": 2,
                        #     "blur": 4,
                        #     "color": "rgba(0,0,0,0.1)"
                        # },
                        # "metadata": {"role": "button", "name": "submit-button"}
                    }
                }
            },
            {
                "id": "call_8",
                "type": "function",
                "function": {
                    "name": "create_text",
                    "arguments": {
                        "x": 570,
                        "y": 460,
                        "text": "Login",
                        "fontSize": 16,
                        "fontWeight": "bold",
                        "fill": "#ffffff",
                        "align": "center"
                    }
                }
            }
        ]
    },
    {
        "role": "tool",
        "tool_call_id": "call_1",
        "content": {"success": True, "objectId": "rect_001"}
    },
    {
        "role": "tool",
        "tool_call_id": "call_2",
        "content": {"success": True, "objectId": "text_001"}
    },
    {
        "role": "tool",
        "tool_call_id": "call_3",
        "content": {"success": True, "objectId": "text_002"}
    },
    {
        "role": "tool",
        "tool_call_id": "call_4",
        "content": {"success": True, "objectId": "rect_002"}
    },
    {
        "role": "tool",
        "tool_call_id": "call_5",
        "content": {"success": True, "objectId": "text_003"}
    },
    {
        "role": "tool",
        "tool_call_id": "call_6",
        "content": {"success": True, "objectId": "rect_003"}
    },
    {
        "role": "tool",
        "tool_call_id": "call_7",
        "content": {"success": True, "objectId": "rect_004"}
    },
    {
        "role": "tool",
        "tool_call_id": "call_8",
        "content": {"success": True, "objectId": "text_004"}
    },
    {
        "role": "assistant",
        "content": "I've created a complete login form for you with all the components properly positioned."
    }
]

# Approximate token counts (for monitoring and cost estimation)
# System prompt: ~1,200 tokens
# Few-shot examples: ~800 tokens
# Total: ~2,000 tokens per request (before user message)

