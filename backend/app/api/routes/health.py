"""Health check endpoint."""
from fastapi import APIRouter

from app.utils.logger import logger
from app.services.openai_service import test_openai_connection

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
async def health_check():
    """
    Health check endpoint with OpenAI connection status.

    Returns:
        dict: Health status, version, and OpenAI connection status
    """
    logger.info("Health check endpoint called")
    
    # Check OpenAI connection status (lightweight, non-blocking)
    openai_status = "disconnected"
    try:
        import asyncio
        # Run in thread pool since it's a synchronous call
        await asyncio.to_thread(test_openai_connection)
        openai_status = "connected"
    except Exception as e:
        logger.debug(f"OpenAI connection check failed: {e}")
        openai_status = "disconnected"
    
    return {
        "status": "healthy",
        "version": "1.0.0",
        "openai": openai_status
    }

