"""Tests for system prompt and few-shot examples."""
import json

from app.agent.prompts import SYSTEM_PROMPT, FEW_SHOT_EXAMPLES


class TestSystemPrompt:
    """Test system prompt structure and content."""
    
    def test_system_prompt_not_empty(self):
        """Test that system prompt is not empty."""
        assert len(SYSTEM_PROMPT) > 0, "System prompt should not be empty"
        assert len(SYSTEM_PROMPT) > 100, "System prompt should be substantial"
    
    def test_system_prompt_contains_tools_section(self):
        """Test that system prompt mentions available tools."""
        assert "create_rectangle" in SYSTEM_PROMPT or "rectangle" in SYSTEM_PROMPT.lower()
        assert "create_circle" in SYSTEM_PROMPT or "circle" in SYSTEM_PROMPT.lower()
        assert "create_text" in SYSTEM_PROMPT or "text" in SYSTEM_PROMPT.lower()
    
    def test_system_prompt_contains_design_principles(self):
        """Test that system prompt includes design principles."""
        assert "design" in SYSTEM_PROMPT.lower() or "principle" in SYSTEM_PROMPT.lower()
    
    def test_system_prompt_loads_without_error(self):
        """Test that system prompt can be loaded without errors."""
        # Just verify it's a string
        assert isinstance(SYSTEM_PROMPT, str), "System prompt should be a string"


class TestFewShotExamples:
    """Test few-shot examples structure."""
    
    def test_few_shot_examples_not_empty(self):
        """Test that few-shot examples list is not empty."""
        assert len(FEW_SHOT_EXAMPLES) > 0, "Few-shot examples should not be empty"
    
    def test_few_shot_examples_structure(self):
        """Test that each example has required structure."""
        for example in FEW_SHOT_EXAMPLES:
            assert "role" in example, "Example missing 'role' field"
            assert example["role"] in ["user", "assistant", "tool"], (
                f"Example role must be 'user', 'assistant', or 'tool', got: {example['role']}"
            )
            
            if example["role"] == "user":
                assert "content" in example, "User example missing 'content'"
            
            if example["role"] == "assistant":
                # Should have either content or tool_calls
                assert "content" in example or "tool_calls" in example, (
                    "Assistant example should have 'content' or 'tool_calls'"
                )
            
            if example["role"] == "tool":
                assert "content" in example, "Tool example missing 'content'"
                assert "tool_call_id" in example, "Tool example missing 'tool_call_id'"
    
    def test_few_shot_examples_tool_calls_structure(self):
        """Test that tool calls in examples have correct structure."""
        for example in FEW_SHOT_EXAMPLES:
            if example.get("role") == "assistant" and "tool_calls" in example:
                tool_calls = example["tool_calls"]
                assert isinstance(tool_calls, list), "tool_calls should be a list"
                
                for tool_call in tool_calls:
                    assert "id" in tool_call, "Tool call missing 'id'"
                    assert "type" in tool_call, "Tool call missing 'type'"
                    assert tool_call["type"] == "function", "Tool call type must be 'function'"
                    assert "function" in tool_call, "Tool call missing 'function'"
                    
                    func = tool_call["function"]
                    assert "name" in func, "Tool call function missing 'name'"
                    assert "arguments" in func, "Tool call function missing 'arguments'"
                    
                    # Arguments should be a dict (will be converted to JSON string later)
                    assert isinstance(func["arguments"], dict), (
                        "Tool call arguments should be a dict"
                    )
    
    def test_few_shot_examples_serializable(self):
        """Test that few-shot examples can be serialized (for JSON conversion)."""
        # Should not raise exception when converting to JSON
        json_str = json.dumps(FEW_SHOT_EXAMPLES, default=str)
        assert len(json_str) > 0, "JSON serialization should produce non-empty string"
    
    def test_few_shot_examples_has_login_form(self):
        """Test that few-shot examples include a login form example."""
        # Check if any example mentions login form
        has_login = False
        for example in FEW_SHOT_EXAMPLES:
            content = example.get("content", "").lower()
            if "login" in content:
                has_login = True
                break
        
        assert has_login, "Few-shot examples should include a login form example"

