Great clarifications! Let me update the TDD with your specifications.

---

# **Technical Design Document: Canvas AI Agent Migration**

## **1. Executive Summary**

**Objective:** Migrate the Canvas AI agent from Firebase Functions (JavaScript) to a FastAPI backend (Python) to enable faster iteration, better LLM code generation, and improved agent performance.

**Current State:**
- Agent runs in Firebase Functions (JavaScript)
- Slow testing cycle (deploy to test changes)
- Limited tool set (circle, square, text)
- Poor understanding of complex UI patterns (login forms, containers)

**Target State:**
- FastAPI backend with OpenAI agent
- Local development/testing environment
- Enhanced tool set with visual styling options
- Comprehensive system prompt with few-shot examples
- Firestore integration for Canvas state persistence

---

## **2. Architecture Overview**

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Existing)                   │
│              Collaborative Canvas App                    │
│           (React/Next.js + Firestore)                    │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP POST
                        ↓
┌─────────────────────────────────────────────────────────┐
│              FastAPI Backend (NEW)                       │
│  ┌────────────────────────────────────────────────────┐ │
│  │            AI Agent Orchestration                   │ │
│  │  - System Prompt + Few-shot Examples               │ │
│  │  - Tool Execution Engine                           │ │
│  │  - OpenAI API Integration                          │ │
│  │  - Retry Logic                                     │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │                 Canvas Tools                        │ │
│  │  - create_rectangle() - containers, inputs         │ │
│  │  - create_square() - UI elements                   │ │
│  │  - create_circle() - icons/avatars                 │ │
│  │  - create_text() - labels/content                  │ │
│  │  - create_line() - dividers, underlines (NEW)      │ │
│  └────────────────────────────────────────────────────┘ │
└───────────────────────┬─────────────────────────────────┘
                        │ Firebase Admin SDK
                        ↓
┌─────────────────────────────────────────────────────────┐
│                   Firebase                               │
│  - Firestore (Canvas State Persistence)                 │
│  - Authentication (Existing)                            │
│  - Realtime DB (Live object movement - not used here)   │
└─────────────────────────────────────────────────────────┘
```

---

## **3. Technology Stack**

| Component | Technology | Justification |
|-----------|-----------|---------------|
| **Backend Framework** | FastAPI | Fast development, automatic OpenAPI docs, async support |
| **Language** | Python 3.11+ | Better LLM code generation, rich ecosystem |
| **LLM Integration** | OpenAI Python SDK | Native tool calling, streaming support, model flexibility |
| **Firebase Integration** | firebase-admin SDK | Official Python SDK for Firestore |
| **Local Testing** | Uvicorn | Fast ASGI server for development |
| **Environment Management** | python-dotenv | Secure credential management |

---

## **4. API Design**

### **Single Endpoint: POST /api/agent/chat**
Primary and only endpoint for all agent interactions

**Request:**
```json
{
  "sessionId": "canvas-session-123",
  "message": "Create a login form with username, password, and submit button"
}
```

**Response (Batch):**
```json
{
  "response": "I've created a login form for you with all the components properly positioned.",
  "actions": [
    {
      "type": "create_rectangle",
      "params": {
        "x": 100,
        "y": 100,
        "width": 400,
        "height": 350,
        "fill": "#ffffff",
        "stroke": "#e0e0e0",
        "strokeWidth": 2,
        "cornerRadius": 8,
        "boxShadow": {
          "offsetX": 0,
          "offsetY": 4,
          "blur": 12,
          "color": "rgba(0,0,0,0.1)"
        },
        "metadata": {"role": "container", "name": "login-form-container"}
      }
    },
    {
      "type": "create_text",
      "params": {
        "x": 250,
        "y": 130,
        "text": "Login",
        "fontSize": 24,
        "fontWeight": "bold",
        "fill": "#333333"
      }
    },
    // ... more actions
  ],
  "toolCalls": 10,
  "tokensUsed": 1250,
  "model": "gpt-4-turbo"
}
```

**Error Response:**
```json
{
  "error": "OpenAI API error",
  "message": "Rate limit exceeded, retrying...",
  "retryAttempt": 2
}
```

---

## **5. Enhanced Tool Definitions**

### **5.1 create_rectangle**
```python
{
    "type": "function",
    "function": {
        "name": "create_rectangle",
        "description": """Create a rectangle on the canvas.
        
        Rectangles serve multiple purposes:
        - CONTAINERS: Use for form backgrounds, card containers, panels
          Example: 400x350px with subtle shadow for login form container
        - INPUT FIELDS: Use for text input boxes (width > height, typically 300-400px wide, 40-50px tall)
          Example: 300x45px with light fill (#f5f5f5) and border
        - BUTTONS: Use for clickable buttons (width > height, rounded corners)
          Example: 300x45px with primary color fill (#007bff) and 4px corner radius
        - DIVIDERS: Use for separating sections (thin rectangles, 1-2px height)
        
        Visual enhancements:
        - Use boxShadow for depth on containers and buttons (subtle: 0 2px 8px rgba(0,0,0,0.1))
        - Use cornerRadius for modern, friendly UI (4-8px for most elements)
        - Use stroke for borders (1-2px, subtle colors like #e0e0e0)
        
        For login forms, create:
        1. Container: 400x350px, white fill, subtle shadow, 8px corners
        2. Input fields: 300x45px, light gray fill, 1px border, 4px corners
        3. Button: 300x45px, primary color fill, subtle shadow, 4px corners
        
        Always consider visual hierarchy, spacing (20-30px between elements), and alignment.
        """,
        "parameters": {
            "type": "object",
            "properties": {
                "x": {"type": "number", "description": "X coordinate (top-left)"},
                "y": {"type": "number", "description": "Y coordinate (top-left)"},
                "width": {"type": "number", "description": "Width in pixels"},
                "height": {"type": "number", "description": "Height in pixels"},
                "fill": {
                    "type": "string", 
                    "description": "Fill color (hex or rgba). Default: #ffffff",
                    "default": "#ffffff"
                },
                "stroke": {
                    "type": "string", 
                    "description": "Border color (hex or rgba). Default: #000000",
                    "default": "#000000"
                },
                "strokeWidth": {
                    "type": "number", 
                    "description": "Border width in pixels. Default: 1",
                    "default": 1
                },
                "cornerRadius": {
                    "type": "number", 
                    "description": "Corner radius in pixels for rounded corners. 0 = sharp corners. Typical: 4-8px. Default: 0",
                    "default": 0
                },
                "boxShadow": {
                    "type": "object",
                    "description": "Drop shadow for depth. Use for containers and buttons.",
                    "properties": {
                        "offsetX": {"type": "number", "description": "Horizontal offset in pixels. 0 for centered"},
                        "offsetY": {"type": "number", "description": "Vertical offset in pixels. Positive = down. Typical: 2-4px"},
                        "blur": {"type": "number", "description": "Blur radius in pixels. Typical: 8-12px"},
                        "color": {"type": "string", "description": "Shadow color (rgba recommended). Example: rgba(0,0,0,0.1)"}
                    }
                },
                "rotation": {
                    "type": "number", 
                    "description": "Rotation in degrees. Default: 0",
                    "default": 0
                },
                "metadata": {
                    "type": "object",
                    "description": "Metadata for semantic meaning",
                    "properties": {
                        "role": {
                            "type": "string", 
                            "enum": ["container", "input", "button", "divider"],
                            "description": "Semantic role of this rectangle"
                        },
                        "name": {
                            "type": "string", 
                            "description": "Semantic name (e.g., 'username-input', 'submit-button')"
                        }
                    }
                }
            },
            "required": ["x", "y", "width", "height"]
        }
    }
}
```

### **5.2 create_square**
```python
{
    "type": "function",
    "function": {
        "name": "create_square",
        "description": """Create a square on the canvas.
        
        Squares are best for:
        - ICONS: Small squares (20-40px) for icons or checkboxes
        - GRID LAYOUTS: Uniform grid items
        - THUMBNAILS: Profile pictures, image placeholders
        
        Visual enhancements:
        - Use boxShadow for depth on card-like squares
        - Use cornerRadius to soften edges (4-8px typical)
        
        For most UI containers and inputs, use create_rectangle instead as it offers more flexibility.
        """,
        "parameters": {
            "type": "object",
            "properties": {
                "x": {"type": "number", "description": "X coordinate (top-left)"},
                "y": {"type": "number", "description": "Y coordinate (top-left)"},
                "size": {"type": "number", "description": "Side length in pixels"},
                "fill": {
                    "type": "string",
                    "description": "Fill color (hex or rgba). Default: #ffffff",
                    "default": "#ffffff"
                },
                "stroke": {
                    "type": "string",
                    "description": "Border color (hex or rgba). Default: #000000",
                    "default": "#000000"
                },
                "strokeWidth": {
                    "type": "number",
                    "description": "Border width in pixels. Default: 1",
                    "default": 1
                },
                "cornerRadius": {
                    "type": "number",
                    "description": "Corner radius in pixels. 0 = sharp corners. Default: 0",
                    "default": 0
                },
                "boxShadow": {
                    "type": "object",
                    "description": "Drop shadow for depth",
                    "properties": {
                        "offsetX": {"type": "number"},
                        "offsetY": {"type": "number"},
                        "blur": {"type": "number"},
                        "color": {"type": "string"}
                    }
                },
                "rotation": {
                    "type": "number",
                    "description": "Rotation in degrees. Default: 0",
                    "default": 0
                }
            },
            "required": ["x", "y", "size"]
        }
    }
}
```

### **5.3 create_circle**
```python
{
    "type": "function",
    "function": {
        "name": "create_circle",
        "description": """Create a circle on the canvas.
        
        Use circles for:
        - AVATARS: User profile pictures (40-80px diameter) - add subtle shadow for depth
        - ICONS: Circular icons or badges (20-40px)
        - DECORATIVE ELEMENTS: Dots, bullets (8-16px)
        - STATUS INDICATORS: Online/offline dots (8-12px)
        
        Visual enhancements:
        - Use boxShadow for avatars and prominent circular elements
        - Circles don't need cornerRadius (they're already round!)
        """,
        "parameters": {
            "type": "object",
            "properties": {
                "x": {"type": "number", "description": "Center X coordinate"},
                "y": {"type": "number", "description": "Center Y coordinate"},
                "radius": {"type": "number", "description": "Radius in pixels"},
                "fill": {
                    "type": "string",
                    "description": "Fill color (hex or rgba). Default: #ffffff",
                    "default": "#ffffff"
                },
                "stroke": {
                    "type": "string",
                    "description": "Border color (hex or rgba). Default: #000000",
                    "default": "#000000"
                },
                "strokeWidth": {
                    "type": "number",
                    "description": "Border width in pixels. Default: 1",
                    "default": 1
                },
                "boxShadow": {
                    "type": "object",
                    "description": "Drop shadow for depth. Good for avatars.",
                    "properties": {
                        "offsetX": {"type": "number"},
                        "offsetY": {"type": "number"},
                        "blur": {"type": "number"},
                        "color": {"type": "string"}
                    }
                }
            },
            "required": ["x", "y", "radius"]
        }
    }
}
```

### **5.4 create_text**
```python
{
    "type": "function",
    "function": {
        "name": "create_text",
        "description": """Create text on the canvas.
        
        Text serves multiple roles:
        - TITLES: 20-32px, bold, for form/section headers
          Example: "Login" at 24px, bold, dark gray (#333333)
        - LABELS: 14-16px, medium weight, for input field labels
          Example: "Username" at 14px, placed 5-10px above input rectangles
        - BUTTON TEXT: 14-16px, medium/bold, centered on button rectangles
          Example: "Submit" at 16px, white (#ffffff) on colored button
        - BODY TEXT: 12-14px, normal weight, for descriptions or help text
        - PLACEHOLDER TEXT: 12-14px, lighter color (#999999), inside inputs
        
        Positioning:
        - Labels: Place 5-10px above their associated input rectangles
        - Button text: Center on button (horizontally and vertically)
        - Titles: Center horizontally, place near top with adequate spacing
        
        Color guidelines:
        - Primary text: #333333 (dark gray, readable)
        - Secondary text: #666666 (medium gray)
        - Placeholder text: #999999 (light gray)
        - Button text on colored background: #ffffff (white)
        
        For login forms:
        - Title: "Login" at 24px, bold, #333333
        - Labels: "Username" and "Password" at 14px, #666666
        - Button text: "Submit" or "Login" at 16px, bold, #ffffff
        """,
        "parameters": {
            "type": "object",
            "properties": {
                "x": {"type": "number", "description": "X coordinate (left edge for left-aligned, center for centered)"},
                "y": {"type": "number", "description": "Y coordinate (baseline of text)"},
                "text": {"type": "string", "description": "Text content to display"},
                "fontSize": {
                    "type": "number",
                    "description": "Font size in pixels. Default: 16. Typical: titles=20-32, labels=14-16, body=12-14",
                    "default": 16
                },
                "fontWeight": {
                    "type": "string",
                    "enum": ["normal", "bold"],
                    "description": "Font weight. Use 'bold' for titles and button text. Default: normal",
                    "default": "normal"
                },
                "fill": {
                    "type": "string",
                    "description": "Text color (hex or rgba). Default: #000000. Recommended: #333333 for primary, #666666 for secondary, #ffffff for buttons",
                    "default": "#000000"
                },
                "align": {
                    "type": "string",
                    "enum": ["left", "center", "right"],
                    "description": "Text alignment relative to x coordinate. Default: left",
                    "default": "left"
                }
            },
            "required": ["x", "y", "text"]
        }
    }
}
```

### **5.5 create_line (NEW)**
```python
{
    "type": "function",
    "function": {
        "name": "create_line",
        "description": """Create a line on the canvas.
        
        Lines are useful for:
        - DIVIDERS: Horizontal or vertical separators between sections
          Example: 1px gray line to separate form sections
        - UNDERLINES: Emphasis under text or decorative elements
          Example: 2px underline under input fields (alternative to full border)
        - CONNECTING ELEMENTS: Visual connections in diagrams
        
        Visual tips:
        - Use thin lines (1-2px) for subtle dividers
        - Use gray colors (#e0e0e0, #cccccc) for non-intrusive separation
        - Horizontal lines: set y1 = y2, vary x1 and x2
        - Vertical lines: set x1 = x2, vary y1 and y2
        
        For login forms:
        - Optional divider between inputs: 1px, light gray, full width of form
        - Optional underline style for inputs instead of rectangles
        """,
        "parameters": {
            "type": "object",
            "properties": {
                "x1": {"type": "number", "description": "Starting X coordinate"},
                "y1": {"type": "number", "description": "Starting Y coordinate"},
                "x2": {"type": "number", "description": "Ending X coordinate"},
                "y2": {"type": "number", "description": "Ending Y coordinate"},
                "stroke": {
                    "type": "string",
                    "description": "Line color (hex or rgba). Default: #000000. Typical: #e0e0e0 for dividers",
                    "default": "#000000"
                },
                "strokeWidth": {
                    "type": "number",
                    "description": "Line width in pixels. Default: 1. Typical: 1-2px for dividers",
                    "default": 1
                }
            },
            "required": ["x1", "y1", "x2", "y2"]
        }
    }
}
```

---

## **6. System Prompt Design**

```python
SYSTEM_PROMPT = """You are an expert UI designer assistant for a collaborative canvas application. Your role is to help users create professional-looking user interfaces using basic primitives: rectangles, squares, circles, lines, and text.

## AVAILABLE TOOLS

You have access to these canvas tools:
1. **create_rectangle**: For containers, input fields, buttons, dividers
   - Supports boxShadow for depth
   - Supports cornerRadius for rounded corners
   
2. **create_square**: For icons, grid items, thumbnails
   - Supports boxShadow and cornerRadius
   
3. **create_circle**: For avatars, circular icons, status indicators
   - Supports boxShadow for depth
   
4. **create_line**: For dividers, underlines, connecting elements
   - Use for subtle separation between sections
   
5. **create_text**: For titles, labels, button text, body content
   - fontSize for hierarchy (titles: 20-32px, labels: 14-16px)
   - fontWeight (normal or bold)
   - fill color for contrast

## VISUAL DESIGN PRINCIPLES

1. **Depth & Shadows**:
   - Use boxShadow on containers for card-like appearance
   - Typical: `{offsetX: 0, offsetY: 2, blur: 8, color: "rgba(0,0,0,0.1)"}`
   - Stronger shadow for buttons on hover effect: `{offsetX: 0, offsetY: 4, blur: 12, color: "rgba(0,0,0,0.15)"}`

2. **Corner Radius**:
   - Modern UIs use rounded corners (4-8px typical)
   - Containers: 8px for soft, friendly appearance
   - Inputs/Buttons: 4px for subtle rounding
   - Sharp corners (0px) for more formal/technical UIs

3. **Color Palette**:
   - Backgrounds: #ffffff (white), #f5f5f5 (light gray)
   - Borders: #e0e0e0 (subtle), #cccccc (visible)
   - Text: #333333 (primary), #666666 (secondary), #999999 (placeholder)
   - Primary action (buttons): #007bff (blue), #28a745 (green), #dc3545 (red)
   - Button text on colored background: #ffffff (white)

4. **Spacing**:
   - Between major elements: 20-30px
   - Labels to inputs: 5-10px
   - Form padding: 30-50px from container edges
   - Internal button padding: 12-16px vertical, 20-30px horizontal (reflected in button dimensions)

5. **Typography**:
   - Titles: 20-32px, bold, #333333
   - Labels: 14-16px, normal, #666666
   - Button text: 14-16px, bold, #ffffff (on colored buttons)
   - Body text: 12-14px, normal, #666666
   - Placeholder text: 12-14px, normal, #999999

6. **Alignment**:
   - Left-align text within forms
   - Center titles
   - Align input fields vertically (same x coordinate)
   - Consistent width for inputs and buttons (typically 300px)

## STANDARD COMPONENT SIZING

- **Input fields**: 300-400px wide × 40-50px tall
- **Buttons**: Same width as inputs × 40-50px tall
- **Form containers**: 400-500px wide, height varies based on content
- **Icons**: 20-40px
- **Avatars**: 40-80px diameter
- **Divider lines**: Full width of section × 1-2px tall

## LOGIN FORM PATTERN (Primary Example)

A complete login form requires these components in order:

1. **Container Rectangle**:
   - Size: 400w × 380h
   - Position: Centered or at specified location
   - Style: White fill, subtle border (#e0e0e0, 1px), 8px corner radius
   - Shadow: `{offsetX: 0, offsetY: 4, blur: 12, color: "rgba(0,0,0,0.1)"}`
   - Metadata: `{role: "container", name: "login-form-container"}`

2. **Title Text** "Login":
   - Size: 24px, bold
   - Position: Centered horizontally, 30px from container top
   - Color: #333333

3. **Username Label** "Username":
   - Size: 14px, normal
   - Position: 30px from container left edge, below title
   - Color: #666666

4. **Username Input Rectangle**:
   - Size: 340w × 45h
   - Position: 30px from container left, 5px below label
   - Style: Light fill (#f5f5f5), border (#cccccc, 1px), 4px corner radius
   - Metadata: `{role: "input", name: "username-input"}`

5. **Password Label** "Password":
   - Size: 14px, normal
   - Position: Same x as username label, 20px below username input
   - Color: #666666

6. **Password Input Rectangle**:
   - Size: 340w × 45h
   - Position: Same x as username input, 5px below label
   - Style: Same as username input
   - Metadata: `{role: "input", name: "password-input"}`

7. **Submit Button Rectangle**:
   - Size: 340w × 45h
   - Position: Same x as inputs, 25px below password input
   - Style: Primary color fill (#007bff), no border or subtle (#0056b3, 1px), 4px corner radius
   - Shadow: `{offsetX: 0, offsetY: 2, blur: 4, color: "rgba(0,0,0,0.1)"}`
   - Metadata: `{role: "button", name: "submit-button"}`

8. **Button Text** "Login" or "Submit":
   - Size: 16px, bold
   - Position: Centered on button (both x and y)
   - Color: #ffffff (white)

**Spacing Summary for 400px Container:**
- Container padding: 30px on all sides
- Content width: 340px (400 - 30*2)
- Title y: container.y + 30
- First label y: title.y + 40
- Input y: label.y + 20
- Spacing between sections: 20-25px

**Position Calculation Example** (container at x=100, y=100):
```
Container: x=100, y=100, w=400, h=380
Title: x=270 (centered), y=130
Username label: x=130, y=180
Username input: x=130, y=200, w=340, h=45
Password label: x=130, y=265
Password input: x=130, y=285, w=340, h=45
Button: x=130, y=355, w=340, h=45
Button text: x=270 (centered), y=380
```

## OTHER COMMON PATTERNS

### Button (Standalone)
1. Rectangle (background with color, shadow, rounded corners)
2. Text (centered, white if button is colored)

### Card
1. Container rectangle (white, shadow, rounded corners)
2. Title text at top
3. Body text or content below
4. Optional: Divider line between sections
5. Optional: Button at bottom

### Profile Section
1. Circle (avatar with shadow)
2. Text (name, bold, next to or below avatar)
3. Text (role/bio, smaller, secondary color)

## INSTRUCTIONS

When a user requests a UI component:

1. **Analyze**: Identify what components are needed
2. **Plan**: Calculate positions and sizes with proper spacing
3. **Design**: Choose appropriate colors, shadows, and corner radius
4. **Execute**: Create elements in logical order:
   - Containers first (backgrounds)
   - Then content (text, shapes)
   - Buttons last (foreground elements)
5. **Metadata**: Tag rectangles with semantic roles

Always create complete, well-structured, professional interfaces with modern visual styling. Use shadows and rounded corners to create depth and polish.

If a request is ambiguous, make reasonable design decisions based on common UI patterns and modern design trends.
"""
```

---

## **7. Few-Shot Examples**

```python
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
                    "arguments": json.dumps({
                        "x": 400,
                        "y": 200,
                        "width": 400,
                        "height": 380,
                        "fill": "#ffffff",
                        "stroke": "#e0e0e0",
                        "strokeWidth": 1,
                        "cornerRadius": 8,
                        "boxShadow": {
                            "offsetX": 0,
                            "offsetY": 4,
                            "blur": 12,
                            "color": "rgba(0,0,0,0.1)"
                        },
                        "metadata": {"role": "container", "name": "login-form-container"}
                    })
                }
            },
            {
                "id": "call_2",
                "type": "function",
                "function": {
                    "name": "create_text",
                    "arguments": json.dumps({
                        "x": 570,
                        "y": 230,
                        "text": "Login",
                        "fontSize": 24,
                        "fontWeight": "bold",
                        "fill": "#333333",
                        "align": "center"
                    })
                }
            },
            {
                "id": "call_3",
                "type": "function",
                "function": {
                    "name": "create_text",
                    "arguments": json.dumps({
                        "x": 430,
                        "y": 280,
                        "text": "Username",
                        "fontSize": 14,
                        "fill": "#666666"
                    })
                }
            },
            {
                "id": "call_4",
                "type": "function",
                "function": {
                    "name": "create_rectangle",
                    "arguments": json.dumps({
                        "x": 430,
                        "y": 290,
                        "width": 340,
                        "height": 45,
                        "fill": "#f5f5f5",
                        "stroke": "#cccccc",
                        "strokeWidth": 1,
                        "cornerRadius": 4,
                        "metadata": {"role": "input", "name": "username-input"}
                    })
                }
            },
            {
                "id": "call_5",
                "type": "function",
                "function": {
                    "name": "create_text",
                    "arguments": json.dumps({
                        "x": 430,
                        "y": 355,
                        "text": "Password",
                        "fontSize": 14,
                        "fill": "#666666"
                    })
                }
            },
            {
                "id": "call_6",
                "type": "function",
                "function": {
                    "name": "create_rectangle",
                    "arguments": json.dumps({
                        "x": 430,
                        "y": 365,
                        "width": 340,
                        "height": 45,
                        "fill": "#f5f5f5",
                        "stroke": "#cccccc",
                        "strokeWidth": 1,
                        "cornerRadius": 4,
                        "metadata": {"role": "input", "name": "password-input"}
                    })
                }
            },
            {
                "id": "call_7",
                "type": "function",
                "function": {
                    "name": "create_rectangle",
                    "arguments": json.dumps({
                        "x": 430,
                        "y": 435,
                        "width": 340,
                        "height": 45,
                        "fill": "#007bff",
                        "stroke": "#0056b3",
                        "strokeWidth": 1,
                        "cornerRadius": 4,
                        "boxShadow": {
                            "offsetX": 0,
                            "offsetY": 2,
                            "blur": 4,
                            "color": "rgba(0,0,0,0.1)"
                        },
                        "metadata": {"role": "button", "name": "submit-button"}
                    })
                }
            },
            {
                "id": "call_8",
                "type": "function",
                "function": {
                    "name": "create_text",
                    "arguments": json.dumps({
                        "x": 570,
                        "y": 460,
                        "text": "Login",
                        "fontSize": 16,
                        "fontWeight": "bold",
                        "fill": "#ffffff",
                        "align": "center"
                    })
                }
            }
        ]
    },
    {
        "role": "tool",
        "tool_call_id": "call_1",
        "content": json.dumps({"success": True, "objectId": "rect_001"})
    },
    {
        "role": "tool",
        "tool_call_id": "call_2",
        "content": json.dumps({"success": True, "objectId": "text_001"})
    },
    {
        "role": "tool",
        "tool_call_id": "call_3",
        "content": json.dumps({"success": True, "objectId": "text_002"})
    },
    {
        "role": "tool",
        "tool_call_id": "call_4",
        "content": json.dumps({"success": True, "objectId": "rect_002"})
    },
    {
        "role": "tool",
        "tool_call_id": "call_5",
        "content": json.dumps({"success": True, "objectId": "text_003"})
    },
    {
        "role": "tool",
        "tool_call_id": "call_6",
        "content": json.dumps({"success": True, "objectId": "rect_003"})
    },
    {
        "role": "tool",
        "tool_call_id": "call_7",
        "content": json.dumps({"success": True, "objectId": "rect_004"})
    },
    {
        "role": "tool",
        "tool_call_id": "call_8",
        "content": json.dumps({"success": True, "objectId": "text_004"})
    },
    {
        "role": "assistant",
        "content": "I've created a complete login form with a modern design including a container with shadow, input fields for username and password, and a styled submit button."
    }
]
```

---

## **8. Retry Logic Strategy**

### **OpenAI API Retry Configuration**

```python
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from openai import RateLimitError, APIError, APITimeoutError

@retry(
    retry=retry_if_exception_type((RateLimitError, APIError, APITimeoutError)),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    reraise=True
)
async def call_openai_with_retry(messages, tools, model):
    """
    Call OpenAI API with exponential backoff retry logic
    
    Retry conditions:
    - RateLimitError: Too many requests
    - APIError: Server error (5xx)
    - APITimeoutError: Request timeout
    
    Retry strategy:
    - Max 3 attempts
    - Wait: 2s, 4s, 8s (exponential backoff)
    - Re-raise exception after final attempt
    """
    response = await client.chat.completions.create(
        model=model,
        messages=messages,
        tools=tools,
        tool_choice="auto"
    )
    return response
```

**Error Response to Frontend:**
```python
{
    "error": "rate_limit_exceeded",
    "message": "OpenAI rate limit hit. Retrying...",
    "retryAttempt": 2,
    "willRetry": True
}
```

---

## **9. Model Flexibility**

### **Supported Models for Testing**

```python
AVAILABLE_MODELS = {
    "gpt-4-turbo": {
        "name": "gpt-4-turbo-2024-04-09",
        "cost_per_1k_input": 0.01,
        "cost_per_1k_output": 0.03,
        "recommended": True,
        "notes": "Best balance of cost and quality"
    },
    "gpt-4o": {
        "name": "gpt-4o",
        "cost_per_1k_input": 0.0025,
        "cost_per_1k_output": 0.01,
        "recommended": True,
        "notes": "Faster, cheaper, good quality"
    },
    "gpt-4o-mini": {
        "name": "gpt-4o-mini",
        "cost_per_1k_input": 0.00015,
        "cost_per_1k_output": 0.0006,
        "recommended": False,
        "notes": "Cheapest, test if quality sufficient"
    },
    "gpt-4": {
        "name": "gpt-4",
        "cost_per_1k_input": 0.03,
        "cost_per_1k_output": 0.06,
        "recommended": False,
        "notes": "Highest quality, most expensive, slower"
    }
}
```

### **Model Selection in Request (Optional)**

```python
# Request with model override
{
    "sessionId": "canvas-session-123",
    "message": "Create a login form",
    "model": "gpt-4o"  # Optional, defaults to gpt-4-turbo
}
```

### **Testing Different Models**

```python
# Local testing script to compare models
async def compare_models():
    test_prompt = "Create a login form"
    
    for model_key, model_info in AVAILABLE_MODELS.items():
        print(f"\n{'='*60}")
        print(f"Testing: {model_key}")
        print(f"Cost: ${model_info['cost_per_1k_input']}/1k in, ${model_info['cost_per_1k_output']}/1k out")
        print('='*60)
        
        result = await agent.process_message(
            user_message=test_prompt,
            session_id=f"test-{model_key}",
            model=model_info["name"]
        )
        
        print(f"Tool Calls: {result['toolCalls']}")
        print(f"Tokens Used: {result['tokensUsed']}")
        print(f"Estimated Cost: ${calculate_cost(result, model_info):.4f}")
```

---

## **10. Tool Definitions Caching**

**Question: "Cache tool definitions - how does it help?"**

### **The Problem**

Tool definitions are large JSON objects sent with **every** API request. For your 5 tools, this is ~2,000-3,000 tokens per request just for tool definitions.

```python
# Every request includes this overhead
{
    "model": "gpt-4-turbo",
    "messages": [...],
    "tools": [
        {...},  # create_rectangle (500 tokens)
        {...},  # create_square (300 tokens)
        {...},  # create_circle (300 tokens)
        {...},  # create_text (400 tokens)
        {...}   # create_line (200 tokens)
    ]  # Total: ~1,700 tokens per request
}
```

### **The Solution: Cache Tool Definitions**

```python
# Store tools as a constant, not regenerated each request
TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "create_rectangle",
            # ... full definition
        }
    },
    # ... other tools
]

# Reuse in every request
def get_tool_definitions():
    """Return cached tool definitions"""
    return TOOL_DEFINITIONS  # No computation, instant return
```

### **Benefits**

1. **Performance**: No JSON parsing/building each request (~5-10ms saved)
2. **Memory**: Single copy in memory, not recreated per request
3. **Consistency**: Same tool definitions guaranteed across all requests
4. **Cost**: Technically same tokens sent to OpenAI, but faster locally

**Note**: This is about **local caching** (not re-parsing JSON each time), not reducing tokens sent to OpenAI. OpenAI's prompt caching (beta feature) could reduce token costs, but that's separate.

---

## **11. Firestore Integration**

### **Write Canvas Objects to Firestore**

```python
from firebase_admin import firestore
import firebase_admin
from firebase_admin import credentials

# Initialize Firebase Admin
cred = credentials.Certificate("path/to/serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

async def write_canvas_actions_to_firestore(session_id: str, actions: List[Dict]):
    """
    Write canvas actions to Firestore
    
    Structure:
    /canvasSessions/{sessionId}/objects/{objectId}
    """
    session_ref = db.collection('canvasSessions').document(session_id)
    
    # Batch write for efficiency
    batch = db.batch()
    
    for action in actions:
        # Generate unique object ID
        object_ref = session_ref.collection('objects').document()
        
        batch.set(object_ref, {
            'type': action['type'].replace('create_', ''),
            'params': action['params'],
            'createdAt': firestore.SERVER_TIMESTAMP
        })
    
    # Commit batch
    await batch.commit()
    
    return {"success": True, "objectsCreated": len(actions)}
```

### **Frontend Listens to Firestore**

```javascript
// Frontend (React) - Listen to new objects
import { collection, onSnapshot } from 'firebase/firestore';

useEffect(() => {
  const unsubscribe = onSnapshot(
    collection(db, 'canvasSessions', sessionId, 'objects'),
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const objectData = change.doc.data();
          renderCanvasObject(objectData);
        }
      });
    }
  );
  
  return () => unsubscribe();
}, [sessionId]);
```

---

## **12. Implementation Phases**

### **Phase 1: Core Backend Setup**
- [ ] Initialize FastAPI project
- [ ] Set up OpenAI SDK integration with retry logic
- [ ] Create cached tool definitions (rectangle, square, circle, text, line)
- [ ] Implement `/api/agent/chat` endpoint
- [ ] Local testing with mock responses (no Firebase)

### **Phase 2: Prompt Engineering**
- [ ] Write comprehensive system prompt
- [ ] Add few-shot example for login form
- [ ] Test prompt effectiveness with various inputs
- [ ] Iterate on tool descriptions
- [ ] Test with different models (gpt-4-turbo, gpt-4o, gpt-4o-mini)

### **Phase 3: Tool Enhancement**
- [ ] Add boxShadow support to tools
- [ ] Add cornerRadius support to shapes
- [ ] Implement create_line tool
- [ ] Add metadata support for semantic roles
- [ ] Test visual enhancements

### **Phase 4: Firestore Integration**
- [ ] Initialize Firebase Admin SDK
- [ ] Connect to Firestore
- [ ] Implement batch write for canvas objects
- [ ] Test end-to-end with Canvas frontend

### **Phase 5: Testing & Refinement**
- [ ] Test complex UI patterns (login forms, cards, grids)
- [ ] Compare model performance and costs
- [ ] Measure latency and token usage
- [ ] Add logging
- [ ] Document API

---

## **13. Success Metrics**

| Metric | Current (Firebase Functions) | Target (FastAPI) |
|--------|------------------------------|------------------|
| **Development Iteration Speed** | 5-10 min per test | <10 sec per test |
| **Login Form Success Rate** | 20% (creates box) | 95% (complete form with styling) |
| **Tool Calls for Login Form** | N/A | 8-10 calls |
| **Response Latency** | 3-5 sec | <2 sec |
| **Visual Polish** | Basic shapes | Modern UI with shadows, rounded corners |
| **Model Flexibility** | Locked to one model | Test 4+ models easily |

---

## **14. Risk Mitigation**

| Risk | Impact | Mitigation |
|------|--------|------------|
| **OpenAI API rate limits** | High | Exponential backoff retry (3 attempts), graceful error messages |
| **OpenAI API failures** | High | Retry on 5xx errors, timeout handling |
| **Firestore write limits** | Low | Batch writes (500 ops/batch), unlikely to hit limits |
| **Tool calling failures** | Medium | Validate tool outputs, handle malformed arguments gracefully |
| **Model quality variance** | Medium | Test multiple models, document which works best |
| **Cost overruns** | Low | Monitor token usage, use gpt-4o or gpt-4o-mini for development |
| **Latency issues** | Low | Use cached tools, async operations, consider streaming in future |

---

## **15. Configuration Management**

```python
# .env file
OPENAI_API_KEY=sk-...
FIREBASE_CREDENTIALS_PATH=./serviceAccountKey.json
DEFAULT_MODEL=gpt-4-turbo
ENABLE_RETRY=true
MAX_RETRIES=3
LOG_LEVEL=INFO
```

```python
# config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    openai_api_key: str
    firebase_credentials_path: str
    default_model: str = "gpt-4-turbo"
    enable_retry: bool = True
    max_retries: int = 3
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"

settings = Settings()
```

---

## **16. Next Steps**

1. **Review this TDD** - Confirm approach aligns with vision
2. **Set up project structure** - Initialize FastAPI app (you'll define structure)
3. **Implement core agent** - System prompt + cached tools + orchestrator with retry
4. **Local testing** - Iterate rapidly on prompts without Firebase
5. **Add visual enhancements** - Test boxShadow and cornerRadius
6. **Test models** - Compare gpt-4-turbo vs gpt-4o vs gpt-4o-mini
7. **Firestore integration** - Connect to Canvas app
8. **Polish** - Refine based on real usage

---

**Ready to proceed with implementation?** Any other clarifications needed before we start coding?