"""
Agent orchestrator for processing user messages and executing tools.

This module contains the CanvasAgent class that:
- Processes user messages through OpenAI API
- Extracts tool calls from responses
- Formats actions for frontend consumption
- Handles errors gracefully

The agent uses cached tool definitions and prompts for performance.

Usage Example:
    ```python
    agent = CanvasAgent()
    result = await agent.process_message(
        user_message="Create a login form",
        session_id="session-123",
        model="gpt-4-turbo"  # optional
    )
    
    # Result contains:
    # - response: Assistant's text response
    # - actions: List of action dicts for frontend
    # - toolCalls: Number of tool calls made
    # - tokensUsed: Total tokens consumed
    # - model: Model used for the request
    ```

Error Handling:
    All errors are caught and returned in a consistent format:
    - Error information in 'error' field
    - Empty actions list
    - Zero tool calls and tokens
    - Error message in response text
"""
import json
from typing import Dict, List, Any, Optional

from app.agent.tools import get_tool_definitions
from app.agent.prompts import SYSTEM_PROMPT, FEW_SHOT_EXAMPLES
from app.services.openai_service import call_openai_with_retry
from app.config import settings
from app.utils.logger import logger


class CanvasAgent:
    """
    AI agent for creating canvas UI components.
    
    This agent processes natural language requests and generates tool calls
    to create rectangles, squares, circles, lines, and text elements on a canvas.
    
    The agent uses:
    - System prompt with design principles and patterns
    - Few-shot examples demonstrating correct tool usage
    - Cached tool definitions for performance
    - Retry logic for OpenAI API calls
    """
    
    def __init__(self):
        """Initialize the agent with cached tool definitions."""
        self.tool_definitions = get_tool_definitions()
        logger.info(f"CanvasAgent initialized with {len(self.tool_definitions)} tools")
    
    def _build_messages(
        self,
        user_message: str
    ) -> List[Dict[str, Any]]:
        """
        Build message array for OpenAI API.
        
        Structure:
        1. System message with prompt
        2. Few-shot examples (user, assistant with tool calls, tool responses, final assistant)
        3. Current user message
        
        Args:
            user_message: The user's request
            
        Returns:
            List of message dictionaries formatted for OpenAI API
        """
        messages = []
        
        # Add system prompt
        messages.append({
            "role": "system",
            "content": SYSTEM_PROMPT
        })
        
        # Add few-shot examples
        # Convert tool call arguments from Python dicts to JSON strings
        for example in FEW_SHOT_EXAMPLES:
            example_copy = example.copy()
            
            # If this is an assistant message with tool_calls, convert arguments to JSON strings
            if example_copy.get("role") == "assistant" and "tool_calls" in example_copy:
                tool_calls = []
                for tool_call in example_copy["tool_calls"]:
                    tool_call_copy = tool_call.copy()
                    if "function" in tool_call_copy:
                        func_copy = tool_call_copy["function"].copy()
                        if "arguments" in func_copy:
                            # Convert Python dict to JSON string
                            func_copy["arguments"] = json.dumps(func_copy["arguments"])
                        tool_call_copy["function"] = func_copy
                    tool_calls.append(tool_call_copy)
                example_copy["tool_calls"] = tool_calls
            
            # If this is a tool response, convert content to JSON string
            if example_copy.get("role") == "tool" and "content" in example_copy:
                if isinstance(example_copy["content"], dict):
                    example_copy["content"] = json.dumps(example_copy["content"])
            
            messages.append(example_copy)
        
        # Add current user message
        messages.append({
            "role": "user",
            "content": user_message
        })
        
        return messages
    
    def _extract_tool_calls(
        self,
        response: Any
    ) -> List[Dict[str, Any]]:
        """
        Extract tool calls from OpenAI response.
        
        Args:
            response: OpenAI ChatCompletion response object
            
        Returns:
            List of tool call dictionaries with 'name' and 'arguments' keys
        """
        tool_calls = []
        
        if not response.choices or len(response.choices) == 0:
            logger.warning("OpenAI response has no choices")
            return tool_calls
        
        message = response.choices[0].message
        
        if not hasattr(message, 'tool_calls') or not message.tool_calls:
            logger.info("No tool calls in response")
            return tool_calls
        
        for tool_call in message.tool_calls:
            try:
                if not hasattr(tool_call, 'function'):
                    logger.warning(f"Tool call missing 'function' attribute: {tool_call}")
                    continue
                
                func = tool_call.function
                tool_name = func.name if hasattr(func, 'name') else None
                tool_args_str = func.arguments if hasattr(func, 'arguments') else "{}"
                
                if not tool_name:
                    logger.warning(f"Tool call missing name: {tool_call}")
                    continue
                
                # Parse JSON arguments
                try:
                    tool_args = json.loads(tool_args_str)
                except json.JSONDecodeError as e:
                    logger.error(f"Invalid JSON in tool arguments for {tool_name}: {tool_args_str}. Error: {e}")
                    continue
                
                tool_calls.append({
                    "name": tool_name,
                    "arguments": tool_args
                })
                
                logger.debug(f"Extracted tool call: {tool_name} with {len(tool_args)} arguments")
                
            except Exception as e:
                logger.error(f"Error extracting tool call: {e}. Tool call: {tool_call}")
                continue
        
        logger.info(f"Extracted {len(tool_calls)} tool calls from response")
        return tool_calls
    
    def _format_actions(
        self,
        tool_calls: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Convert tool calls to actions format for frontend.
        
        Each action has:
        - type: tool name (without "create_" prefix if present)
        - params: tool arguments dictionary
        
        Args:
            tool_calls: List of tool call dictionaries
            
        Returns:
            List of action dictionaries formatted for frontend
        """
        actions = []
        
        for tool_call in tool_calls:
            try:
                tool_name = tool_call.get("name", "")
                tool_args = tool_call.get("arguments", {})
                
                if not tool_name:
                    logger.warning("Tool call missing name, skipping")
                    continue
                
                # Remove "create_" prefix if present for frontend
                action_type = tool_name
                if tool_name.startswith("create_"):
                    action_type = tool_name[7:]  # Remove "create_" prefix
                
                action = {
                    "type": action_type,
                    "params": tool_args
                }
                
                actions.append(action)
                
            except Exception as e:
                logger.error(f"Error formatting action from tool call {tool_call}: {e}")
                continue
        
        logger.info(f"Formatted {len(actions)} actions for frontend")
        return actions
    
    async def process_message(
        self,
        user_message: str,
        session_id: str,
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process user message and return actions.
        
        This method:
        1. Builds message array with system prompt, few-shot examples, and user message
        2. Calls OpenAI API with retry logic
        3. Extracts tool calls from response
        4. Formats actions for frontend
        5. Returns structured response
        
        Args:
            user_message: The user's natural language request
            session_id: Session identifier for tracking
            model: Optional model override (defaults to settings.DEFAULT_MODEL)
            
        Returns:
            Dictionary with:
            - response: Assistant's text response
            - actions: List of action dictionaries
            - toolCalls: Number of tool calls made
            - tokensUsed: Total tokens used
            - model: Model used for the request
            
        Raises:
            Exception: If processing fails (wrapped in error response)
        """
        try:
            # Use provided model or default
            model_key = model or settings.DEFAULT_MODEL
            
            logger.info(f"Processing message for session {session_id} with model {model_key}")
            
            # Build messages
            messages = self._build_messages(user_message)
            
            # Call OpenAI API with retry logic
            response = call_openai_with_retry(
                messages=messages,
                model=model_key,
                tools=self.tool_definitions,
                tool_choice="auto"
            )
            
            # Extract assistant's text response
            assistant_message = ""
            if response.choices and len(response.choices) > 0:
                message = response.choices[0].message
                if hasattr(message, 'content') and message.content:
                    assistant_message = message.content
                else:
                    assistant_message = "I've processed your request and created the components."
            
            # Extract tool calls
            tool_calls = self._extract_tool_calls(response)
            
            # Format actions for frontend
            actions = self._format_actions(tool_calls)
            
            # Extract token usage
            tokens_used = 0
            if response.usage:
                tokens_used = response.usage.total_tokens
            
            # Get model name used
            model_used = model_key
            
            # Build response
            result = {
                "response": assistant_message,
                "actions": actions,
                "toolCalls": len(tool_calls),
                "tokensUsed": tokens_used,
                "model": model_used
            }
            
            logger.info(
                f"Successfully processed message for session {session_id}. "
                f"Tool calls: {len(tool_calls)}, Tokens: {tokens_used}"
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing message for session {session_id}: {e}", exc_info=True)
            
            # Return error response in consistent format
            return {
                "response": f"I encountered an error processing your request: {str(e)}",
                "actions": [],
                "toolCalls": 0,
                "tokensUsed": 0,
                "model": model or settings.DEFAULT_MODEL,
                "error": {
                    "type": type(e).__name__,
                    "message": str(e)
                }
            }

