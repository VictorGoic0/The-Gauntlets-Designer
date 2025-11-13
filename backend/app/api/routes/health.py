"""Health check endpoint."""
from fastapi import APIRouter

from app.utils.logger import logger
from app.services.openai_service import test_openai_connection
from app.services.firebase_service import is_firebase_initialized

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
async def health_check():
    """
    Health check endpoint with OpenAI and Firebase connection status.

    Returns:
        dict: Health status, version, OpenAI connection status, and Firebase status
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
    
    # Check Firebase initialization status
    firebase_status = "initialized" if is_firebase_initialized() else "not_initialized"
    
    return {
        "status": "healthy",
        "version": "1.0.0",
        "openai": openai_status,
        "firebase": firebase_status
    }

