#!/usr/bin/env python3
"""
Test script to verify tool definitions are valid.
Run with: python test_tools.py
"""
import json
import sys
from app.agent.tools import TOOL_DEFINITIONS, get_tool_definitions, validate_tool_definitions

def main():
    print("Testing tool definitions...")
    print(f"\nTotal tools: {len(TOOL_DEFINITIONS)}")
    
    # Test get_tool_definitions()
    tools = get_tool_definitions()
    print(f"get_tool_definitions() returned {len(tools)} tools")
    
    # Print tool names
    print("\nTool names:")
    for tool in tools:
        print(f"  - {tool['function']['name']}")
    
    # Validate tool definitions
    try:
        validate_tool_definitions()
        print("\n✓ Tool definitions validated successfully")
    except Exception as e:
        print(f"\n✗ Validation failed: {e}")
        sys.exit(1)
    
    # Verify JSON structure
    try:
        json_str = json.dumps(tools, indent=2)
        print(f"\n✓ JSON structure is valid")
        print(f"  Approximate size: {len(json_str)} characters")
        # Rough token estimate: ~4 characters per token
        estimated_tokens = len(json_str) // 4
        print(f"  Estimated tokens: ~{estimated_tokens}")
    except Exception as e:
        print(f"\n✗ JSON serialization failed: {e}")
        sys.exit(1)
    
    print("\n✓ All tests passed!")

if __name__ == "__main__":
    main()

