"""
Canvas tool definitions for OpenAI function calling.

Tool definitions are cached at module level to avoid re-parsing JSON on every request.
This provides:
- Performance: No JSON construction/parsing per request (~5-10ms saved)
- Memory: Single copy in memory, not recreated per request
- Consistency: Same tool definitions guaranteed across all requests

Refer to TDD Section 10 for caching rationale.
"""

# Module-level constant for cached tool definitions
TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "create_rectangle",
            "description": "Create a rectangle. Use for containers, input fields, buttons, and dividers. Supports cornerRadius for modern styling (4-8px typical).",
            "parameters": {
                "type": "object",
                "properties": {
                    "x": {"type": "number", "description": "X coordinate (top-left)"},
                    "y": {"type": "number", "description": "Y coordinate (top-left)"},
                    "width": {"type": "number", "description": "Width in pixels"},
                    "height": {"type": "number", "description": "Height in pixels"},
                    "fill": {
                        "type": "string",
                        "description": "Fill color (hex or rgba)",
                        "default": "#007bff"
                    },
                    "stroke": {
                        "type": "string",
                        "description": "Border color",
                        "default": "#000000"
                    },
                    "strokeWidth": {
                        "type": "number",
                        "description": "Border width in pixels",
                        "default": 1
                    },
                    "cornerRadius": {
                        "type": "number",
                        "description": "Corner radius for rounded corners",
                        "default": 0
                    },
                    # Future enhancement: boxShadow support
                    # When frontend supports boxShadow, uncomment this and add to document_data in firebase_service.py
                    # Example structure:
                    # "boxShadow": {
                    #     "offsetX": 0,
                    #     "offsetY": 2,
                    #     "blur": 4,
                    #     "color": "rgba(0, 0, 0, 0.1)"
                    # }
                    # "boxShadow": {
                    #     "type": "object",
                    #     "description": "Drop shadow for depth",
                    #     "properties": {
                    #         "offsetX": {"type": "number", "description": "Horizontal offset"},
                    #         "offsetY": {"type": "number", "description": "Vertical offset"},
                    #         "blur": {"type": "number", "description": "Blur radius"},
                    #         "color": {"type": "string", "description": "Shadow color (rgba)"}
                    #     }
                    # },
                    "rotation": {
                        "type": "number",
                        "description": "Rotation in degrees. Default: 0",
                        "default": 0
                    }
                },
                "required": ["x", "y", "width", "height"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_square",
            "description": "Create a square. Use for icons, grid items, and thumbnails. Supports cornerRadius.",
            "parameters": {
                "type": "object",
                "properties": {
                    "x": {"type": "number", "description": "X coordinate (top-left)"},
                    "y": {"type": "number", "description": "Y coordinate (top-left)"},
                    "size": {"type": "number", "description": "Side length in pixels"},
                    "fill": {
                        "type": "string",
                        "description": "Fill color",
                        "default": "#007bff"
                    },
                    "stroke": {
                        "type": "string",
                        "description": "Border color",
                        "default": "#000000"
                    },
                    "strokeWidth": {
                        "type": "number",
                        "description": "Border width",
                        "default": 1
                    },
                    "cornerRadius": {
                        "type": "number",
                        "description": "Corner radius",
                        "default": 0
                    },
                    # Future enhancement: boxShadow support
                    # When frontend supports boxShadow, uncomment this and add to document_data in firebase_service.py
                    # Example structure:
                    # "boxShadow": {
                    #     "offsetX": 0,
                    #     "offsetY": 2,
                    #     "blur": 4,
                    #     "color": "rgba(0, 0, 0, 0.1)"
                    # }
                    # "boxShadow": {
                    #     "type": "object",
                    #     "description": "Drop shadow",
                    #     "properties": {
                    #         "offsetX": {"type": "number"},
                    #         "offsetY": {"type": "number"},
                    #         "blur": {"type": "number"},
                    #         "color": {"type": "string"}
                    #     }
                    # },
                    "rotation": {
                        "type": "number",
                        "description": "Rotation in degrees. Default: 0",
                        "default": 0
                    }
                },
                "required": ["x", "y", "size"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_circle",
            "description": "Create a circle. Use for avatars, icons, badges, and status indicators.",
            "parameters": {
                "type": "object",
                "properties": {
                    "x": {"type": "number", "description": "Center X coordinate"},
                    "y": {"type": "number", "description": "Center Y coordinate"},
                    "radius": {"type": "number", "description": "Radius in pixels"},
                    "fill": {
                        "type": "string",
                        "description": "Fill color",
                        "default": "#ff0000"
                    },
                    "stroke": {
                        "type": "string",
                        "description": "Border color",
                        "default": "#000000"
                    },
                    "strokeWidth": {
                        "type": "number",
                        "description": "Border width",
                        "default": 1
                    },
                    # Future enhancement: boxShadow support
                    # When frontend supports boxShadow, uncomment this and add to document_data in firebase_service.py
                    # Example structure:
                    # "boxShadow": {
                    #     "offsetX": 0,
                    #     "offsetY": 2,
                    #     "blur": 4,
                    #     "color": "rgba(0, 0, 0, 0.1)"
                    # }
                    # "boxShadow": {
                    #     "type": "object",
                    #     "description": "Drop shadow",
                    #     "properties": {
                    #         "offsetX": {"type": "number"},
                    #         "offsetY": {"type": "number"},
                    #         "blur": {"type": "number"},
                    #         "color": {"type": "string"}
                    #     }
                    # }
                },
                "required": ["x", "y", "radius"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_text",
            "description": "Create text. Use for titles, labels, button text, and body content. Supports fontSize, fontWeight (normal/bold), fill color, and alignment.",
            "parameters": {
                "type": "object",
                "properties": {
                    "x": {"type": "number", "description": "X coordinate"},
                    "y": {"type": "number", "description": "Y coordinate"},
                    "text": {"type": "string", "description": "Text content"},
                    "fontSize": {
                        "type": "number",
                        "description": "Font size in pixels",
                        "default": 16
                    },
                    "fontWeight": {
                        "type": "string",
                        "enum": ["normal", "bold"],
                        "description": "Font weight",
                        "default": "normal"
                    },
                    "fill": {
                        "type": "string",
                        "description": "Text color",
                        "default": "#000000"
                    },
                    "align": {
                        "type": "string",
                        "enum": ["left", "center", "right"],
                        "description": "Text alignment",
                        "default": "left"
                    }
                },
                "required": ["x", "y", "text"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_line",
            "description": "Create a line. Use for dividers, underlines, and connecting elements.",
            "parameters": {
                "type": "object",
                "properties": {
                    "x1": {"type": "number", "description": "Starting X coordinate"},
                    "y1": {"type": "number", "description": "Starting Y coordinate"},
                    "x2": {"type": "number", "description": "Ending X coordinate"},
                    "y2": {"type": "number", "description": "Ending Y coordinate"},
                    "stroke": {
                        "type": "string",
                        "description": "Line color",
                        "default": "#000000"
                    },
                    "strokeWidth": {
                        "type": "number",
                        "description": "Line width",
                        "default": 1
                    }
                },
                "required": ["x1", "y1", "x2", "y2"]
            }
        }
    }
]


def get_tool_definitions():
    """
    Return cached tool definitions.
    
    Returns:
        list: List of tool definition dictionaries ready for OpenAI API
    """
    return TOOL_DEFINITIONS


def validate_tool_definitions():
    """
    Validate tool definitions on startup.
    
    Checks:
    - All required fields present (type, function, name, description, parameters)
    - Parameter schemas are valid
    - Required parameters are specified
    
    Raises:
        ValueError: If validation fails
    """
    from app.utils.logger import logger
    
    if not TOOL_DEFINITIONS:
        raise ValueError("TOOL_DEFINITIONS is empty")
    
    tool_names = []
    
    for idx, tool in enumerate(TOOL_DEFINITIONS):
        # Check top-level structure
        if "type" not in tool:
            raise ValueError(f"Tool at index {idx} missing 'type' field")
        if tool["type"] != "function":
            raise ValueError(f"Tool at index {idx} has invalid type: {tool['type']}")
        
        if "function" not in tool:
            raise ValueError(f"Tool at index {idx} missing 'function' field")
        
        func = tool["function"]
        
        # Check function fields
        required_func_fields = ["name", "description", "parameters"]
        for field in required_func_fields:
            if field not in func:
                raise ValueError(f"Tool at index {idx} missing '{field}' in function")
        
        tool_name = func["name"]
        tool_names.append(tool_name)
        
        # Check parameters structure
        params = func["parameters"]
        if "type" not in params:
            raise ValueError(f"Tool '{tool_name}' parameters missing 'type' field")
        if params["type"] != "object":
            raise ValueError(f"Tool '{tool_name}' parameters type must be 'object'")
        
        if "properties" not in params:
            raise ValueError(f"Tool '{tool_name}' parameters missing 'properties' field")
        
        if "required" not in params:
            raise ValueError(f"Tool '{tool_name}' parameters missing 'required' field")
        
        # Validate required parameters exist in properties
        required_params = params.get("required", [])
        properties = params.get("properties", {})
        for req_param in required_params:
            if req_param not in properties:
                raise ValueError(
                    f"Tool '{tool_name}' has required parameter '{req_param}' "
                    f"that is not defined in properties"
                )
    
    logger.info(f"Validated {len(TOOL_DEFINITIONS)} tool definitions: {', '.join(tool_names)}")
    return True

