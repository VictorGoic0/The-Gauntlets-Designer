"""Tests for tool definitions."""
import json
import pytest

from app.agent.tools import get_tool_definitions, validate_tool_definitions, TOOL_DEFINITIONS


class TestToolDefinitions:
    """Test tool definitions structure and validation."""
    
    def test_tool_definitions_not_empty(self):
        """Test that tool definitions list is not empty."""
        tools = get_tool_definitions()
        assert len(tools) > 0, "Tool definitions should not be empty"
    
    def test_tool_definitions_structure(self):
        """Test that each tool has required structure."""
        tools = get_tool_definitions()
        
        for tool in tools:
            assert "type" in tool, "Tool missing 'type' field"
            assert tool["type"] == "function", "Tool type must be 'function'"
            assert "function" in tool, "Tool missing 'function' field"
            
            func = tool["function"]
            assert "name" in func, "Tool function missing 'name'"
            assert "description" in func, "Tool function missing 'description'"
            assert "parameters" in func, "Tool function missing 'parameters'"
            
            params = func["parameters"]
            assert "type" in params, "Parameters missing 'type'"
            assert params["type"] == "object", "Parameters type must be 'object'"
            assert "properties" in params, "Parameters missing 'properties'"
            assert "required" in params, "Parameters missing 'required'"
    
    def test_tool_definitions_valid_json(self):
        """Test that tool definitions can be serialized to JSON."""
        tools = get_tool_definitions()
        # Should not raise exception
        json_str = json.dumps(tools)
        assert len(json_str) > 0, "JSON serialization should produce non-empty string"
        
        # Should be able to deserialize
        parsed = json.loads(json_str)
        assert len(parsed) == len(tools), "Deserialized tools should match original count"
    
    def test_validate_tool_definitions(self):
        """Test that validate_tool_definitions passes for valid tools."""
        # Should not raise exception
        result = validate_tool_definitions()
        assert result is True, "Validation should return True"
    
    def test_required_parameters_exist_in_properties(self):
        """Test that all required parameters are defined in properties."""
        tools = get_tool_definitions()
        
        for tool in tools:
            func = tool["function"]
            params = func["parameters"]
            required = params.get("required", [])
            properties = params.get("properties", {})
            
            for req_param in required:
                assert req_param in properties, (
                    f"Tool '{func['name']}' has required parameter '{req_param}' "
                    f"that is not defined in properties"
                )
    
    def test_tool_names_unique(self):
        """Test that all tool names are unique."""
        tools = get_tool_definitions()
        tool_names = [tool["function"]["name"] for tool in tools]
        assert len(tool_names) == len(set(tool_names)), "Tool names must be unique"
    
    def test_expected_tools_present(self):
        """Test that expected tools are present."""
        tools = get_tool_definitions()
        tool_names = [tool["function"]["name"] for tool in tools]
        
        expected_tools = [
            "create_rectangle",
            "create_square",
            "create_circle",
            "create_text",
            "create_line"
        ]
        
        for expected in expected_tools:
            assert expected in tool_names, f"Expected tool '{expected}' not found"

