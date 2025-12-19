"""Agent chat endpoint with LangChain integration and SSE streaming."""
import json
from fastapi import APIRouter, HTTPException, status
from sse_starlette.sse import EventSourceResponse
from app.agent.orchestrator import CanvasAgent
from app.models.requests import ChatRequest
from app.models.responses import ChatResponse
from app.models.models import validate_model, AVAILABLE_MODELS
from app.utils.logger import logger, set_request_id, TimingContext

router = APIRouter(prefix="/api/agent", tags=["agent"])

# Initialize agent instance (module level for performance)
agent = CanvasAgent()


@router.post(
    "/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Process user message and generate canvas actions",
    description="""
    Process a natural language request and generate actions to create UI components on the canvas.
    
    The agent uses LangChain with OpenAI to execute tool calls that create rectangles,
    circles, and text elements according to design principles and patterns.
    
    Tools are executed automatically by LangChain and write directly to Firestore.
    
    Returns:
    - response: Assistant's text response
    - actions: List of actions (currently empty as tools execute directly)
    - toolCalls: Number of tool calls made
    - tokensUsed: Total tokens consumed (estimated)
    - model: Model used for the request
    """
)
async def chat(request: ChatRequest):
    """
    Chat endpoint for AI agent interactions using LangChain.
    
    This endpoint:
    1. Validates the request (message, model)
    2. Processes the message through the LangChain-powered CanvasAgent
    3. Tools are executed automatically and write to Firestore
    4. Returns response and metadata for frontend consumption
    
    Args:
        request: Chat request with message and optional model
        
    Returns:
        Chat response with metadata and assistant's text response
        
    Raises:
        HTTPException: 400 for validation errors, 500 for processing errors
    """
    # Generate and set request ID for tracing
    request_id = set_request_id()
    
    try:
        with TimingContext("chat_request", logger):
            # Validate message
            if not request.message or not request.message.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="message is required and cannot be empty"
                )
            
            # Determine model to use (default from config or override from request)
            model_key = request.model if request.model else None
            
            # Validate model if provided
            if model_key:
                try:
                    validate_model(model_key)
                except ValueError as e:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=str(e)
                    )
            
            # Log request with request ID
            logger.info(
                f"Processing chat request. Model: {model_key or 'default'}, "
                f"Message length: {len(request.message)}, Request ID: {request_id}"
            )
            
            # Process message through agent
            result = await agent.process_message(
                user_message=request.message,
                model=model_key
            )
        
            # Check if agent returned an error
            if "error" in result:
                error_info = result.get("error", {})
                error_type = error_info.get("type", "UnknownError")
                error_message = error_info.get("message", "An unknown error occurred")
                
                logger.error(
                    f"Agent processing error: {error_type}: {error_message}, Request ID: {request_id}"
                )
                
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail={
                        "error": error_type,
                        "detail": error_message
                    }
                )
            
            # Log success with metrics
            logger.info(
                f"Chat request completed successfully. Tool calls: {result.get('toolCalls', 0)}, "
                f"Tokens: {result.get('tokensUsed', 0)}, Request ID: {request_id}"
            )
            
            # Return successful response
            return ChatResponse(
                response=result.get("response", ""),
                actions=result.get("actions", []),
                toolCalls=result.get("toolCalls", 0),
                tokensUsed=result.get("tokensUsed", 0),
                model=result.get("model", "unknown")
            )
        
    except HTTPException:
        # Re-raise HTTP exceptions (validation errors, etc.)
        raise
        
    except Exception as e:
        # Catch any unexpected errors
        logger.error(
            f"Unexpected error in chat endpoint: {e}, Request ID: {request_id}",
            exc_info=True
        )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "InternalServerError",
                "detail": f"An unexpected error occurred: {str(e)}"
            }
        )


@router.post(
    "/chat-stream",
    status_code=status.HTTP_200_OK,
    summary="Stream AI agent responses with real-time tool execution",
    description="""
    Process a natural language request and stream tool executions in real-time using Server-Sent Events (SSE).
    
    The agent uses LangChain with OpenAI to execute tool calls that create rectangles,
    circles, and text elements. Each tool execution is streamed as it happens.
    
    Event types:
    - tool_start: Tool execution begins (includes tool name and arguments)
    - tool_end: Tool execution completes (includes tool name and result)
    - message: AI assistant message chunk
    - complete: All processing complete (includes total tool call count)
    - error: An error occurred during processing
    
    Returns:
    Server-Sent Events stream with real-time updates
    """
)
async def chat_stream(request: ChatRequest):
    """
    Chat streaming endpoint for real-time AI agent interactions.
    
    This endpoint:
    1. Validates the request (message, model)
    2. Streams the message processing through the LangChain-powered CanvasAgent
    3. Tools are executed automatically and events are emitted in real-time
    4. Returns SSE stream with tool_start, tool_end, message, complete, and error events
    
    Args:
        request: Chat request with message and optional model
        
    Returns:
        EventSourceResponse with SSE stream of events
        
    Raises:
        HTTPException: 400 for validation errors
    """
    # Generate and set request ID for tracing
    request_id = set_request_id()
    
    try:
        # Validate message
        if not request.message or not request.message.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="message is required and cannot be empty"
            )
        
        # Determine model to use
        model_key = request.model if request.model else None
        
        # Validate model if provided
        if model_key:
            try:
                validate_model(model_key)
            except ValueError as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=str(e)
                )
        
        # Log request with request ID
        logger.info(
            f"Processing streaming chat request. Model: {model_key or 'default'}, "
            f"Message length: {len(request.message)}, Request ID: {request_id}"
        )
        
        # Create event generator
        async def event_generator():
            """Generate SSE events from agent stream."""
            try:
                async for event in agent.stream_message(
                    user_message=request.message,
                    model=model_key
                ):
                    # Format as SSE event
                    event_type = event.get("event", "message")
                    event_data = json.dumps(event)
                    
                    yield {
                        "event": event_type,
                        "data": event_data
                    }
                    
            except Exception as e:
                logger.error(
                    f"Error in event generator: {e}, Request ID: {request_id}",
                    exc_info=True
                )
                
                # Send error event
                error_event = {
                    "event": "error",
                    "message": str(e)
                }
                
                yield {
                    "event": "error",
                    "data": json.dumps(error_event)
                }
        
        # Return SSE response
        return EventSourceResponse(event_generator())
        
    except HTTPException:
        # Re-raise HTTP exceptions (validation errors, etc.)
        raise
        
    except Exception as e:
        # Catch any unexpected errors
        logger.error(
            f"Unexpected error in chat-stream endpoint: {e}, Request ID: {request_id}",
            exc_info=True
        )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "InternalServerError",
                "detail": f"An unexpected error occurred: {str(e)}"
            }
        )

