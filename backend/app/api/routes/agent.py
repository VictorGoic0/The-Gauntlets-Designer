"""Agent chat endpoint."""
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.openai_service import (
    call_openai_with_retry,
    format_error_response,
    get_openai_client,
)
from app.config import settings
from app.models.models import validate_model, AVAILABLE_MODELS
from app.utils.logger import logger

router = APIRouter(prefix="/api/agent", tags=["agent"])


class ChatRequest(BaseModel):
    """Request model for chat endpoint."""
    sessionId: str
    message: str
    model: Optional[str] = None  # Optional model override


class ChatResponse(BaseModel):
    """Response model for chat endpoint."""
    response: str
    model: str
    tokensUsed: Optional[int] = None


@router.post("/chat")
async def chat(request: ChatRequest):
    """
    Chat endpoint for AI agent interactions.
    
    Args:
        request: Chat request with sessionId, message, and optional model
        
    Returns:
        Chat response with AI-generated text and metadata
    """
    try:
        # Determine model to use (default from config or override from request)
        model_key = request.model if request.model else settings.DEFAULT_MODEL
        
        # Validate model
        try:
            validate_model(model_key)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        
        # Prepare messages
        messages = [
            {"role": "user", "content": request.message}
        ]
        
        # Call OpenAI API (synchronous call, but we're in async context)
        # Run in thread pool to avoid blocking
        import asyncio
        response = await asyncio.to_thread(
            call_openai_with_retry,
            messages=messages,
            model=model_key,
            tools=None,  # No tools yet (will be added in PR #3)
            tool_choice="auto"
        )
        
        # Extract response content
        response_text = response.choices[0].message.content if response.choices else ""
        
        # Get token usage
        tokens_used = response.usage.total_tokens if response.usage else None
        
        logger.info(
            f"Chat request completed. Session: {request.sessionId}, "
            f"Model: {model_key}, Tokens: {tokens_used}"
        )
        
        return ChatResponse(
            response=response_text,
            model=model_key,
            tokensUsed=tokens_used
        )
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}", exc_info=True)
        
        # Format error response
        error_response = format_error_response(e)
        
        # Determine HTTP status code based on error type
        status_code = 500
        if "rate_limit" in error_response.get("error", ""):
            status_code = 429
        elif "timeout" in error_response.get("error", ""):
            status_code = 504
        
        raise HTTPException(status_code=status_code, detail=error_response)

