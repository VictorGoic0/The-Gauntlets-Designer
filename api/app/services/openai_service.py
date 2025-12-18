"""OpenAI service with retry logic and error handling."""
from typing import List, Dict, Any, Optional

from openai import OpenAI, RateLimitError, APIError, APITimeoutError
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    RetryCallState,
    before_sleep_log,
    after_log,
)

from app.config import settings
from app.models.models import get_model_name, AVAILABLE_MODELS
from app.utils.logger import logger

# Initialize OpenAI client
client: Optional[OpenAI] = None


def initialize_openai_client() -> OpenAI:
    """
    Initialize OpenAI client with API key from config.
    
    Returns:
        OpenAI client instance
        
    Raises:
        ValueError: If API key is missing or invalid
    """
    global client
    
    if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "your_key_here":
        raise ValueError("OPENAI_API_KEY must be set in environment variables or .env file")
    
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    logger.info("OpenAI client initialized successfully")
    return client


def get_openai_client() -> OpenAI:
    """
    Get or initialize OpenAI client.
    
    Returns:
        OpenAI client instance
    """
    global client
    if client is None:
        client = initialize_openai_client()
    return client


def test_openai_connection() -> bool:
    """
    Test OpenAI connection with a simple completion.
    
    Returns:
        True if connection successful
        
    Raises:
        Exception: If connection fails
    """
    try:
        test_client = get_openai_client()
        # Use a lightweight model for testing
        response = test_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "test"}],
            max_tokens=5,
        )
        logger.info("OpenAI connection test successful")
        return True
    except Exception as e:
        logger.error(f"OpenAI connection test failed: {e}")
        raise


def format_error_response(
    error: Exception,
    retry_attempt: Optional[int] = None,
    will_retry: bool = False
) -> Dict[str, Any]:
    """
    Format error response for frontend consumption.
    
    Args:
        error: The exception that occurred
        retry_attempt: Current retry attempt number (if applicable)
        will_retry: Whether the request will be retried
        
    Returns:
        Formatted error response dictionary
    """
    error_type = type(error).__name__
    error_message = str(error)
    
    # Map error types to user-friendly messages
    if isinstance(error, RateLimitError):
        error_type = "rate_limit_exceeded"
        error_message = "OpenAI rate limit hit. Retrying..."
    elif isinstance(error, APITimeoutError):
        error_type = "timeout_error"
        error_message = "OpenAI request timed out. Retrying..."
    elif isinstance(error, APIError):
        error_type = "api_error"
        error_message = f"OpenAI API error: {error_message}"
    else:
        error_type = "unknown_error"
        error_message = f"Unexpected error: {error_message}"
    
    response = {
        "error": error_type,
        "message": error_message,
    }
    
    if retry_attempt is not None:
        response["retryAttempt"] = retry_attempt
    
    if will_retry:
        response["willRetry"] = will_retry
    
    return response


# Retry configuration (hardcoded, not from environment)
ENABLE_RETRY = True
MAX_RETRIES = 3
RETRY_WAIT_MULTIPLIER = 1
RETRY_WAIT_MIN = 2
RETRY_WAIT_MAX = 10


def create_retry_decorator():
    """
    Create retry decorator based on configuration.
    
    Returns:
        Retry decorator function
    """
    if not ENABLE_RETRY:
        # Return a no-op decorator if retry is disabled
        def no_retry(func):
            return func
        return no_retry
    
    def log_retry_attempt(retry_state: RetryCallState):
        """Log retry attempts."""
        attempt_number = retry_state.attempt_number
        exception = retry_state.outcome.exception()
        logger.warning(
            f"OpenAI API call failed (attempt {attempt_number}/{MAX_RETRIES}): {exception}. Retrying..."
        )
    
    def log_after_retry(retry_state: RetryCallState):
        """Log after retry completes."""
        if retry_state.outcome.failed:
            logger.error(
                f"OpenAI API call failed after {MAX_RETRIES} attempts: {retry_state.outcome.exception()}"
            )
    
    return retry(
        retry=retry_if_exception_type((RateLimitError, APIError, APITimeoutError)),
        stop=stop_after_attempt(MAX_RETRIES),
        wait=wait_exponential(
            multiplier=RETRY_WAIT_MULTIPLIER,
            min=RETRY_WAIT_MIN,
            max=RETRY_WAIT_MAX
        ),
        reraise=True,
        before_sleep=log_retry_attempt,
        after=log_after_retry,
    )


# Create the retry decorator
retry_decorator = create_retry_decorator()


@retry_decorator
def call_openai_with_retry(
    messages: List[Dict[str, str]],
    model: str = "gpt-4-turbo",
    tools: Optional[List[Dict[str, Any]]] = None,
    tool_choice: str = "auto"
) -> Any:
    """
    Call OpenAI API with exponential backoff retry logic.
    
    Retry conditions:
    - RateLimitError: Too many requests
    - APIError: Server error (5xx)
    - APITimeoutError: Request timeout
    
    Retry strategy:
    - Max 3 attempts (hardcoded)
    - Wait: 2s, 4s, 8s (exponential backoff)
    - Re-raise exception after final attempt
    
    Args:
        messages: List of message dictionaries with 'role' and 'content'
        model: Model key (e.g., "gpt-4-turbo") - will be converted to actual model name
        tools: Optional list of tool definitions
        tool_choice: Tool choice mode ("auto", "none", or specific tool)
        
    Returns:
        OpenAI ChatCompletion response object
        
    Raises:
        RateLimitError: If rate limit exceeded after all retries
        APIError: If API error occurs after all retries
        APITimeoutError: If request times out after all retries
        ValueError: If model key is invalid
    """
    openai_client = get_openai_client()
    model_name = get_model_name(model)
    
    # Prepare request parameters
    request_params = {
        "model": model_name,
        "messages": messages,
    }
    
    if tools:
        request_params["tools"] = tools
        request_params["tool_choice"] = tool_choice
    
    # Make the API call (retry logic handled by decorator)
    logger.info(f"Calling OpenAI API with model: {model_name}")
    response = openai_client.chat.completions.create(**request_params)
    
    logger.info(
        f"OpenAI API call successful. "
        f"Tokens: {response.usage.total_tokens if response.usage else 'N/A'}"
    )
    
    return response

