"""
Agent orchestrator for processing user messages and executing tools.

This module contains the CanvasAgent class that:
- Routes each request to Grok (fast) or OpenAI (reasoning) via model_router
- Processes user messages through a LangChain agent built per-tier
- Executes tool calls automatically via LangChain
- Formats responses for frontend consumption
- Handles errors gracefully

Routing strategy:
    Fast (Grok):      simple/repetitive shape requests ("Create 20 squares")
    Reasoning (OpenAI): compositional UI patterns ("Build a login form")
    Default:          fast — err on the side of cost

Usage Example:
    ```python
    agent = CanvasAgent()
    result = await agent.process_message(
        user_message="Create a login form",
    )

    # Result contains:
    # - response: Assistant's text response
    # - actions: List of action dicts for frontend
    # - toolCalls: Number of tool calls made
    # - tokensUsed: Total tokens consumed
    # - model: Model used for the request
    # - tier: "fast" or "reasoning"
    ```

Error Handling:
    All errors are caught and returned in a consistent format:
    - Error information in 'error' field
    - Empty actions list
    - Zero tool calls and tokens
    - Error message in response text
"""
from typing import Dict, List, Any

from langchain.agents import create_agent
from langchain_openai import ChatOpenAI

from app.agent.langchain_tools import get_langchain_tools
from app.agent.model_router import ModelTier, get_model_client, route
from app.agent.prompts import SYSTEM_PROMPT
from app.config import settings
from app.utils.logger import logger, TimingContext, get_request_id


def _build_agent(tier: ModelTier):
    """
    Build a LangChain agent for the given model tier.

    Creates a fresh agent bound to the correct ChatOpenAI client (Grok or OpenAI).
    Called once per unique tier and cached for the lifetime of the process.

    Args:
        tier: "fast" or "reasoning"

    Returns:
        A compiled LangChain agent graph ready for .invoke() / .astream()
    """
    _, model_name = get_model_client(tier)

    if tier == "reasoning":
        llm = ChatOpenAI(
            model=model_name,
            api_key=settings.OPENAI_API_KEY,
        )
    else:
        llm = ChatOpenAI(
            model=model_name,
            api_key=settings.GROK_API_KEY,
            base_url=settings.GROK_BASE_URL,
        )

    tools = get_langchain_tools()
    agent = create_agent(
        model=llm,
        tools=tools,
        system_prompt=SYSTEM_PROMPT,
    )
    logger.info(f"Built LangChain agent for tier={tier}, model={model_name}")
    return agent


# Cache one agent per tier — avoids rebuilding on every request
_AGENT_CACHE: Dict[ModelTier, Any] = {}


def _get_agent(tier: ModelTier):
    if tier not in _AGENT_CACHE:
        _AGENT_CACHE[tier] = _build_agent(tier)
    return _AGENT_CACHE[tier]


class CanvasAgent:
    """
    AI agent for creating canvas UI components using LangChain.

    Routes each request to Grok (fast) or OpenAI (reasoning) based on
    message complexity, then executes tool calls to create shapes on the canvas.
    """

    def __init__(self):
        """Eagerly build both agents so first-request latency is predictable."""
        _get_agent("fast")
        _get_agent("reasoning")
        logger.info("CanvasAgent initialized (both model tiers ready)")
    
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
    ) -> Dict[str, Any]:
        """
        Process user message using LangChain agent.

        Routes to Grok (fast) or OpenAI (reasoning) based on message complexity,
        then invokes the appropriate cached LangChain agent.

        Note: LangChain tools write directly to Firestore, so no separate write needed.

        Args:
            user_message: The user's natural language request

        Returns:
            Dictionary with:
            - response: Assistant's text response
            - actions: List of action dictionaries (empty; tools execute directly)
            - toolCalls: Number of tool calls made
            - tokensUsed: Estimated tokens used (not available from LangChain)
            - model: Model name used
            - tier: "fast" or "reasoning"

        Raises:
            Exception: If processing fails (wrapped in error response)
        """
        _, model_name, tier = route(user_message)
        request_id = get_request_id() or "no-request-id"

        try:
            logger.info(
                f"Processing message — tier={tier}, model={model_name}, request_id={request_id}"
            )

            agent = _get_agent(tier)

            with TimingContext("langchain_agent_invoke", logger):
                result = agent.invoke(
                    {"messages": [{"role": "user", "content": user_message}]}
                )

            messages = result.get("messages", [])

            assistant_message = ""
            for msg in reversed(messages):
                if hasattr(msg, 'content') and msg.content and hasattr(msg, 'type') and msg.type == "ai":
                    assistant_message = msg.content
                    break

            if not assistant_message:
                assistant_message = "I've processed your request and created the components."

            tool_calls = self._extract_tool_calls_from_messages(messages)

            response_dict = {
                "response": assistant_message,
                "actions": [],
                "toolCalls": len(tool_calls),
                "tokensUsed": 0,
                "model": model_name,
                "tier": tier,
            }

            logger.info(
                f"Completed — tier={tier}, tool_calls={len(tool_calls)}, request_id={request_id}"
            )

            return response_dict

        except Exception as e:
            logger.error(f"Error processing message: {e}", exc_info=True)

            return {
                "response": f"I encountered an error processing your request: {str(e)}",
                "actions": [],
                "toolCalls": 0,
                "tokensUsed": 0,
                "model": model_name,
                "tier": tier,
                "error": {
                    "type": type(e).__name__,
                    "message": str(e)
                }
            }
    
    async def stream_message(
        self,
        user_message: str,
    ):
        """
        Stream message processing with real-time tool execution updates.

        Routes to the appropriate model tier, then uses LangChain's astream with
        stream_mode="updates" to emit events for each agent step.

        Args:
            user_message: The user's natural language request

        Yields:
            Event dictionaries for streaming to frontend:
            - progress: {"event": "progress", "message": str} - Tool execution progress
            - complete: {"event": "complete", "message": str, "toolCalls": int, "model": str, "tier": str}
            - error: {"event": "error", "message": str}
        """
        _, model_name, tier = route(user_message)
        request_id = get_request_id() or "no-request-id"

        try:
            logger.info(
                f"Streaming message — tier={tier}, model={model_name}, request_id={request_id}"
            )
            
            tool_call_count = 0
            final_message = ""
            agent = _get_agent(tier)

            async for chunk in agent.astream(
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
            
            logger.info(
                f"Streaming completed — tier={tier}, tool_calls={tool_call_count}, request_id={request_id}"
            )

            yield {
                "event": "complete",
                "message": final_message or "I've completed your request.",
                "toolCalls": tool_call_count,
                "model": model_name,
                "tier": tier,
            }

        except Exception as e:
            logger.error(f"Error during streaming: {e}", exc_info=True)

            yield {
                "event": "error",
                "message": str(e)
            }

