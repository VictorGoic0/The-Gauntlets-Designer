"""
Agent orchestrator for processing user messages and executing tools.

This module contains the CanvasAgent class that:
- Processes user messages through LangChain agent
- Executes tool calls automatically via LangChain
- Formats responses for frontend consumption
- Handles errors gracefully

The agent uses LangChain's create_agent() with tool definitions and system prompt.

Usage Example:
    ```python
    agent = CanvasAgent()
    result = await agent.process_message(
        user_message="Create a login form",
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

from langchain.agents import create_agent

from app.agent.langchain_tools import get_langchain_tools
from app.agent.prompts import SYSTEM_PROMPT
from app.config import settings
from app.utils.logger import logger, TimingContext, get_request_id


class CanvasAgent:
    """
    AI agent for creating canvas UI components using LangChain.
    
    This agent processes natural language requests and executes tool calls
    to create rectangles, circles, and text elements on a canvas.
    
    The agent uses:
    - LangChain's create_agent() for orchestration
    - System prompt with design principles and patterns
    - Tool definitions with @tool decorator
    - Error handling middleware for tool execution
    """
    
    def __init__(self):
        """Initialize the LangChain agent with tools (no middleware for async compatibility)."""
        self.tools = get_langchain_tools()
        
        # Create LangChain agent with tools (no middleware to avoid async issues)
        self.agent = create_agent(
            model="gpt-4-turbo",
            tools=self.tools,
            system_prompt=SYSTEM_PROMPT
        )
        
        logger.info(f"CanvasAgent initialized with {len(self.tools)} LangChain tools")
    
    def _extract_tool_calls_from_messages(
        self,
        messages: List[Any]
    ) -> List[Dict[str, Any]]:
        """
        Extract tool calls from LangChain agent messages.
        
        LangChain agent returns a list of messages including tool calls and tool responses.
        We need to extract the tool calls to count them and format for frontend.
        
        Args:
            messages: List of LangChain message objects
            
        Returns:
            List of tool call dictionaries with 'name' and 'arguments' keys
        """
        tool_calls = []
        
        for msg in messages:
            # Check if this is an AI message with tool calls
            if hasattr(msg, 'tool_calls') and msg.tool_calls:
                for tool_call in msg.tool_calls:
                    try:
                        tool_name = tool_call.get("name", "")
                        tool_args = tool_call.get("args", {})
                        
                        if tool_name:
                            tool_calls.append({
                                "name": tool_name,
                                "arguments": tool_args
                            })
                            logger.debug(f"Extracted tool call: {tool_name}")
                    except Exception as e:
                        logger.error(f"Error extracting tool call: {e}")
                        continue
        
        logger.info(f"Extracted {len(tool_calls)} tool calls from agent messages")
        return tool_calls
    
    async def process_message(
        self,
        user_message: str,
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process user message using LangChain agent.
        
        This method:
        1. Invokes LangChain agent with user message
        2. Agent automatically executes tools via LangChain
        3. Extracts tool calls from agent messages
        4. Returns structured response for frontend
        
        Note: LangChain tools write directly to Firestore, so no separate write needed.
        
        Args:
            user_message: The user's natural language request
            model: Optional model override (defaults to gpt-4-turbo)
            
        Returns:
            Dictionary with:
            - response: Assistant's text response
            - actions: List of action dictionaries (empty for now, tools execute directly)
            - toolCalls: Number of tool calls made
            - tokensUsed: Estimated tokens used (not available from LangChain)
            - model: Model used for the request
            
        Raises:
            Exception: If processing fails (wrapped in error response)
        """
        try:
            model_key = model or "gpt-4-turbo"
            request_id = get_request_id() or "no-request-id"
            
            logger.info(
                f"Processing message with LangChain agent, model: {model_key}, Request ID: {request_id}"
            )
            
            # Invoke LangChain agent
            with TimingContext("langchain_agent_invoke", logger):
                result = self.agent.invoke(
                    {"messages": [{"role": "user", "content": user_message}]}
                )
            
            # Extract messages from result
            messages = result.get("messages", [])
            
            # Extract assistant's final response
            assistant_message = ""
            for msg in reversed(messages):
                if hasattr(msg, 'content') and msg.content and hasattr(msg, 'type') and msg.type == "ai":
                    assistant_message = msg.content
                    break
            
            if not assistant_message:
                assistant_message = "I've processed your request and created the components."
            
            # Extract tool calls from messages
            tool_calls = self._extract_tool_calls_from_messages(messages)
            
            # For now, return empty actions since tools execute directly
            # In the future, we could extract tool results from ToolMessage objects
            actions = []
            
            # Build response
            response_dict = {
                "response": assistant_message,
                "actions": actions,
                "toolCalls": len(tool_calls),
                "tokensUsed": 0,  # LangChain doesn't expose token usage easily
                "model": model_key
            }
            
            logger.info(
                f"Successfully processed message with LangChain. Tool calls: {len(tool_calls)}, "
                f"Request ID: {request_id}"
            )
            
            return response_dict
            
        except Exception as e:
            logger.error(f"Error processing message with LangChain: {e}", exc_info=True)
            
            # Return error response in consistent format
            return {
                "response": f"I encountered an error processing your request: {str(e)}",
                "actions": [],
                "toolCalls": 0,
                "tokensUsed": 0,
                "model": model or "gpt-4-turbo",
                "error": {
                    "type": type(e).__name__,
                    "message": str(e)
                }
            }
    
    async def stream_message(
        self,
        user_message: str,
        model: Optional[str] = None
    ):
        """
        Stream message processing with real-time tool execution updates.
        
        Uses LangChain's astream with stream_mode="updates" to emit events for each agent step.
        
        Args:
            user_message: The user's natural language request
            model: Optional model override
            
        Yields:
            Event dictionaries for streaming to frontend:
            - progress: {"event": "progress", "message": str} - Tool execution progress
            - complete: {"event": "complete", "message": str, "toolCalls": int} - Final message
            - error: {"event": "error", "message": str} - Error occurred
        """
        try:
            model_key = model or "gpt-4-turbo"
            request_id = get_request_id() or "no-request-id"
            
            logger.info(
                f"Streaming message with LangChain agent, model: {model_key}, Request ID: {request_id}"
            )
            
            tool_call_count = 0
            final_message = ""
            
            # Stream from LangChain agent using stream_mode="updates"
            async for chunk in self.agent.astream(
                {"messages": [{"role": "user", "content": user_message}]},
                stream_mode="updates"
            ):
                # chunk is a dict with step name as key and data as value
                for step, data in chunk.items():
                    logger.debug(f"Stream step: {step}, data keys: {data.keys()}")
                    
                    # Check if this step has messages
                    if "messages" in data and data["messages"]:
                        last_message = data["messages"][-1]
                        
                        # Check if this is a tool message (result of tool execution)
                        if hasattr(last_message, 'type') and last_message.type == "tool":
                            tool_call_count += 1
                            
                            # Parse the tool result
                            try:
                                if hasattr(last_message, 'content'):
                                    content = last_message.content
                                    # If content is a string, try to parse as JSON
                                    if isinstance(content, str):
                                        import json
                                        result = json.loads(content)
                                    else:
                                        result = content
                                    
                                    # Extract message from result
                                    if isinstance(result, dict) and "message" in result:
                                        progress_msg = result["message"]
                                    else:
                                        progress_msg = f"Successfully executed tool"
                                    
                                    yield {
                                        "event": "progress",
                                        "message": progress_msg
                                    }
                            except Exception as e:
                                logger.debug(f"Could not parse tool result: {e}")
                                yield {
                                    "event": "progress",
                                    "message": "Successfully executed tool"
                                }
                        
                        # Check if this is an AI message (final response)
                        elif hasattr(last_message, 'type') and last_message.type == "ai":
                            if hasattr(last_message, 'content') and last_message.content:
                                final_message = last_message.content
            
            # Send completion event with final message
            logger.info(f"Streaming completed. Tool calls: {tool_call_count}, Request ID: {request_id}")
            
            yield {
                "event": "complete",
                "message": final_message or "I've completed your request.",
                "toolCalls": tool_call_count
            }
            
        except Exception as e:
            logger.error(f"Error during streaming: {e}", exc_info=True)
            
            yield {
                "event": "error",
                "message": str(e)
            }

