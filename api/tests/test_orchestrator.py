"""Tests for agent orchestrator."""
import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from typing import Dict, Any

from app.agent.orchestrator import CanvasAgent


class TestCanvasAgent:
    """Test CanvasAgent class."""
    
    def test_agent_initialization(self):
        """Test that agent initializes correctly."""
        agent = CanvasAgent()
        assert agent is not None
        assert hasattr(agent, 'tool_definitions')
        assert len(agent.tool_definitions) > 0
    
    @pytest.mark.asyncio
    async def test_process_message_with_mock_openai(self):
        """Test process_message with mocked OpenAI response."""
        # Create mock OpenAI response
        mock_response = Mock()
        mock_choice = Mock()
        mock_message = Mock()
        
        # Mock tool call
        mock_tool_call = Mock()
        mock_tool_call.function.name = "create_rectangle"
        mock_tool_call.function.arguments = '{"x": 100, "y": 100, "width": 200, "height": 50}'
        
        mock_message.content = "I've created a rectangle for you."
        mock_message.tool_calls = [mock_tool_call]
        
        mock_choice.message = mock_message
        mock_response.choices = [mock_choice]
        mock_response.usage = Mock()
        mock_response.usage.total_tokens = 150
        
        # Mock OpenAI service
        with patch('app.agent.orchestrator.call_openai_with_retry', return_value=mock_response):
            with patch('app.agent.orchestrator.is_firebase_initialized', return_value=False):
                agent = CanvasAgent()
                result = await agent.process_message("Create a rectangle")
                
                assert result is not None
                assert "response" in result
                assert "actions" in result
                assert "toolCalls" in result
                assert "tokensUsed" in result
                assert "model" in result
                assert result["toolCalls"] == 1
                assert len(result["actions"]) == 1
                assert result["actions"][0]["type"] == "rectangle"
    
    @pytest.mark.asyncio
    async def test_process_message_no_tool_calls(self):
        """Test process_message when no tool calls are made."""
        mock_response = Mock()
        mock_choice = Mock()
        mock_message = Mock()
        
        mock_message.content = "I understand your request."
        mock_message.tool_calls = None
        
        mock_choice.message = mock_message
        mock_response.choices = [mock_choice]
        mock_response.usage = Mock()
        mock_response.usage.total_tokens = 50
        
        with patch('app.agent.orchestrator.call_openai_with_retry', return_value=mock_response):
            with patch('app.agent.orchestrator.is_firebase_initialized', return_value=False):
                agent = CanvasAgent()
                result = await agent.process_message("Hello")
                
                assert result["toolCalls"] == 0
                assert len(result["actions"]) == 0
                assert len(result["response"]) > 0
    
    @pytest.mark.asyncio
    async def test_process_message_error_handling(self):
        """Test that errors are handled gracefully."""
        with patch('app.agent.orchestrator.call_openai_with_retry', side_effect=Exception("API Error")):
            agent = CanvasAgent()
            result = await agent.process_message("Create something")
            
            assert "error" in result
            assert result["toolCalls"] == 0
            assert len(result["actions"]) == 0
            assert "error" in result["response"].lower() or "encountered" in result["response"].lower()
    
    @pytest.mark.asyncio
    async def test_process_message_multiple_tool_calls(self):
        """Test process_message with multiple tool calls."""
        mock_response = Mock()
        mock_choice = Mock()
        mock_message = Mock()
        
        # Create multiple tool calls
        mock_tool_call1 = Mock()
        mock_tool_call1.function.name = "create_rectangle"
        mock_tool_call1.function.arguments = '{"x": 100, "y": 100, "width": 200, "height": 50}'
        
        mock_tool_call2 = Mock()
        mock_tool_call2.function.name = "create_text"
        mock_tool_call2.function.arguments = '{"x": 150, "y": 120, "text": "Button"}'
        
        mock_message.content = "I've created a button."
        mock_message.tool_calls = [mock_tool_call1, mock_tool_call2]
        
        mock_choice.message = mock_message
        mock_response.choices = [mock_choice]
        mock_response.usage = Mock()
        mock_response.usage.total_tokens = 200
        
        with patch('app.agent.orchestrator.call_openai_with_retry', return_value=mock_response):
            with patch('app.agent.orchestrator.is_firebase_initialized', return_value=False):
                agent = CanvasAgent()
                result = await agent.process_message("Create a button")
                
                assert result["toolCalls"] == 2
                assert len(result["actions"]) == 2
    
    def test_build_messages(self):
        """Test _build_messages method."""
        agent = CanvasAgent()
        messages = agent._build_messages("Create a login form")
        
        assert len(messages) > 0
        assert messages[0]["role"] == "system"
        assert messages[-1]["role"] == "user"
        assert messages[-1]["content"] == "Create a login form"
    
    def test_extract_tool_calls_empty(self):
        """Test _extract_tool_calls with no tool calls."""
        mock_response = Mock()
        mock_choice = Mock()
        mock_message = Mock()
        mock_message.tool_calls = None
        mock_choice.message = mock_message
        mock_response.choices = [mock_choice]
        
        agent = CanvasAgent()
        tool_calls = agent._extract_tool_calls(mock_response)
        
        assert len(tool_calls) == 0
    
    def test_format_actions(self):
        """Test _format_actions method."""
        agent = CanvasAgent()
        tool_calls = [
            {
                "name": "create_rectangle",
                "arguments": {"x": 100, "y": 100, "width": 200, "height": 50}
            }
        ]
        
        actions = agent._format_actions(tool_calls)
        
        assert len(actions) == 1
        assert actions[0]["type"] == "rectangle"
        assert actions[0]["params"]["x"] == 100

