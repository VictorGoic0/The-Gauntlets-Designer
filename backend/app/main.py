"""FastAPI application main entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health, agent
from app.config import settings
from app.utils.logger import logger

# Initialize FastAPI app
app = FastAPI(
    title="The Gauntlet's Designer API",
    description="AI-powered design agent backend",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend development server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)
app.include_router(agent.router)


@app.on_event("startup")
async def startup_event():
    """Startup event handler."""
    logger.info("Starting FastAPI application")
    logger.info(f"OpenAI API Key configured: {bool(settings.OPENAI_API_KEY)}")
    logger.info(f"Firebase credentials path: {settings.FIREBASE_CREDENTIALS_PATH}")
    logger.info(f"Default model: {settings.DEFAULT_MODEL}")
    logger.info(f"Retry enabled: {settings.ENABLE_RETRY}")
    logger.info(f"Max retries: {settings.MAX_RETRIES}")
    
    # Validate tool definitions
    try:
        from app.agent.tools import validate_tool_definitions
        validate_tool_definitions()
        logger.info("Tool definitions validated successfully")
    except Exception as e:
        logger.error(f"Tool definition validation failed: {e}")
        raise
    
    # Test OpenAI connection (non-blocking, log errors but don't crash)
    try:
        from app.services.openai_service import test_openai_connection
        import asyncio
        # Run in thread pool since it's a synchronous call
        await asyncio.to_thread(test_openai_connection)
        logger.info("OpenAI connection test passed")
    except Exception as e:
        logger.warning(f"OpenAI connection test failed (non-fatal): {e}")
    
    logger.info("Application startup complete")


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler."""
    logger.info("Shutting down FastAPI application")

