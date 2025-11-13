# The Gauntlet's Designer - Backend API

FastAPI backend for the AI-powered design agent.

## Setup

### Prerequisites

- Python 3.11+
- OpenAI API key
- Firebase credentials (optional for local development)

### Installation

1. Create and activate virtual environment:
```bash
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file in the `backend/` directory:
```bash
OPENAI_API_KEY=your_key_here
FIREBASE_CREDENTIALS_PATH=./serviceAccountKey.json
```

4. **Get Firebase Service Account Key** (for Firestore writes):
   
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Click the gear icon ⚙️ → **Project settings**
   - Go to the **Service accounts** tab
   - Click **Generate new private key**
   - Click **Generate key** in the confirmation dialog
   - A JSON file will download automatically
   - Save this file as `serviceAccountKey.json` in the `backend/` directory
   - **Important**: This file contains sensitive credentials - it's already in `.gitignore`
   
   The downloaded file will have all the fields you need (type, project_id, private_key_id, private_key, client_email, client_id).

## Running the Server

### Local Development

Use the provided script:
```bash
python run_local.py
```

Or directly with uvicorn:
```bash
uvicorn app.main:app --reload
```

The server will start at `http://localhost:8000`

## API Endpoints

### Health Check

**GET** `/api/health`

Returns server health status and OpenAI connection status.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "openai": "connected"
}
```

### Agent Chat

**POST** `/api/agent/chat`

Process a natural language request and generate actions to create UI components on the canvas.

**Request:**
```json
{
  "message": "Create a login form",
  "model": "gpt-4-turbo"  // Optional, defaults to configured default
}
```

**Response:**
```json
{
  "response": "I've created a login form for you...",
  "actions": [
    {
      "type": "rectangle",
      "params": {
        "x": 100,
        "y": 100,
        "width": 300,
        "height": 200,
        "fill": "#FFFFFF",
        "cornerRadius": 8
      }
    }
  ],
  "toolCalls": 8,
  "tokensUsed": 1250,
  "model": "gpt-4-turbo"
}
```

**Error Responses:**

- **400 Bad Request**: Invalid request (missing message, empty message, invalid model)
- **500 Internal Server Error**: Agent processing error or unexpected server error

**Example curl command:**
```bash
curl -X POST http://localhost:8000/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Create a login form"
  }'
```

**Interactive API Documentation:**

FastAPI automatically generates interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Configuration

### Environment Variables

- `OPENAI_API_KEY` (required): Your OpenAI API key
- `FIREBASE_CREDENTIALS_PATH` (optional): Path to Firebase service account key

### Hardcoded Configuration

The following settings are hardcoded in `app/config.py` for easy testing:

- `DEFAULT_MODEL`: `"gpt-4-turbo"` - Default model to use
- `ENABLE_RETRY`: `True` - Enable retry logic for OpenAI API calls
- `MAX_RETRIES`: `3` - Maximum number of retry attempts
- `LOG_LEVEL`: `"INFO"` - Logging level

## OpenAI Integration

### Available Models

The following models are configured and available:

- `gpt-4-turbo`: Best balance of cost and quality (recommended)
- `gpt-4o`: Faster, cheaper, good quality (recommended)
- `gpt-4o-mini`: Cheapest option for testing
- `gpt-4`: Highest quality, most expensive

### Retry Logic

The OpenAI service includes automatic retry logic with exponential backoff:

- **Retry conditions**: RateLimitError, APIError, APITimeoutError
- **Max attempts**: 3 (hardcoded)
- **Backoff strategy**: 2s, 4s, 8s (exponential)

### Error Handling

Errors are formatted for frontend consumption:

```json
{
  "error": "rate_limit_exceeded",
  "message": "OpenAI rate limit hit. Retrying...",
  "retryAttempt": 2,
  "willRetry": true
}
```

## Testing

### Test OpenAI Integration

Run the test script to verify OpenAI integration:

```bash
python test_openai.py
```

This will test:
- Model configuration
- OpenAI connection
- Basic completion
- Error formatting

### Test Agent Orchestrator

Test the agent orchestrator with various prompts:

```bash
python test_agent.py
```

This will test:
- Agent message processing
- Tool call extraction
- Action formatting
- Response construction
- Error handling

Test cases include:
- Login form creation (should produce 8-10 tool calls)
- Simple button creation
- Grid of circles creation

### Test API Endpoint

Test the API endpoint with various scenarios (requires server to be running):

```bash
# Start server in one terminal
python run_local.py

# In another terminal, run tests
python test_api_endpoint.py
```

This will test:
- Valid request with login form
- Missing message validation
- Empty message validation
- Invalid model validation
- Valid model override

### Run Test Suite

Run the comprehensive test suite with pytest:

```bash
# Install test dependencies (if not already installed)
pip install -r requirements.txt

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_tools.py

# Run with coverage
pytest --cov=app --cov-report=html
```

### Integration Testing

Run integration tests to verify the complete flow:

```bash
# Test agent directly (no server needed)
python integration_test.py

# Test via API endpoint (requires server running)
python integration_test.py --api
```

### Model Comparison

Compare different OpenAI models for performance and cost:

```bash
python compare_models.py "Create a login form"
```

This will test all available models and provide:
- Response time comparison
- Token usage comparison
- Cost estimation
- Tool call quality comparison

### Error Handling Verification

Test error handling for various edge cases:

```bash
python test_error_handling.py
```

This tests:
- Invalid OpenAI API key
- Missing Firebase credentials
- Malformed tool calls
- Rate limit handling
- Network errors

## Project Structure

```
backend/
├── app/
│   ├── agent/
│   │   ├── orchestrator.py   # Agent orchestrator (PR #5)
│   │   ├── prompts.py        # System prompt and few-shot examples
│   │   └── tools.py          # Tool definitions for OpenAI
│   ├── api/
│   │   └── routes/
│   │       ├── health.py      # Health check endpoint
│   │       └── agent.py       # Agent chat endpoint
│   ├── models/
│   │   └── models.py          # Model configuration
│   ├── services/
│   │   └── openai_service.py  # OpenAI integration with retry logic
│   ├── utils/
│   │   └── logger.py          # Logging configuration
│   ├── config.py              # Application configuration
│   └── main.py                # FastAPI app entry point
├── logs/                      # Application logs
├── requirements.txt           # Python dependencies
├── run_local.py              # Local development script
├── test_openai.py            # OpenAI integration tests
└── test_agent.py             # Agent orchestrator tests
```

## Development

### Logging

Logs are written to:
- Console (INFO level and above)
- `logs/app.log` file (all levels)

Logs include:
- Request IDs for tracing requests across the system
- Timing information for performance monitoring
- Token usage for cost tracking
- Error details with stack traces

Example log entry:
```
2024-01-15 10:30:45 - app - INFO - [a1b2c3d4] - Processing chat request. Model: gpt-4-turbo, Message length: 20, Request ID: a1b2c3d4
2024-01-15 10:30:46 - app - INFO - [a1b2c3d4] - Completed openai_api_call in 1.234s
2024-01-15 10:30:46 - app - INFO - [a1b2c3d4] - Chat request completed successfully. Tool calls: 8, Tokens: 1250, Request ID: a1b2c3d4
```

### CORS

CORS is configured to allow requests from `http://localhost:3000` (frontend development server).

### Performance Optimization

The backend includes several performance optimizations:

1. **Cached Tool Definitions**: Tool definitions are cached at module level to avoid JSON parsing on every request
2. **Module-level Agent Instance**: Agent is initialized once at module level, not per request
3. **Batch Firestore Writes**: Multiple actions are written to Firestore in a single batch operation
4. **Request Timing**: Built-in timing context managers for performance monitoring

### Code Quality

The codebase follows these quality standards:
- Type hints on all functions
- Comprehensive docstrings
- Consistent error handling
- Request ID tracking for debugging
- Performance timing instrumentation

## Performance Metrics

### Baseline Metrics

Typical performance metrics for common requests:

**Login Form Creation:**
- Response time: 2-4 seconds
- Token usage: 1,200-1,500 tokens
- Tool calls: 8-10
- Estimated cost (gpt-4-turbo): $0.015-0.020

**Simple Button:**
- Response time: 1-2 seconds
- Token usage: 500-800 tokens
- Tool calls: 2-3
- Estimated cost (gpt-4-turbo): $0.006-0.010

**Grid of Circles (3x3):**
- Response time: 2-3 seconds
- Token usage: 800-1,200 tokens
- Tool calls: 9
- Estimated cost (gpt-4-turbo): $0.010-0.015

### Model Comparison

See `compare_models.py` for detailed model comparison. Generally:
- **gpt-4o**: Fastest, cheapest, good quality (recommended for production)
- **gpt-4-turbo**: Best balance of cost and quality (current default)
- **gpt-4o-mini**: Cheapest, good for testing
- **gpt-4**: Highest quality, most expensive, slower

## Troubleshooting

### OpenAI Connection Issues

1. Verify `OPENAI_API_KEY` is set in `.env` file
2. Check API key is valid and has sufficient credits
3. Review logs in `logs/app.log` for detailed error messages
4. Check request ID in logs to trace specific requests

### Firebase Issues

1. Verify `FIREBASE_CREDENTIALS_PATH` points to valid service account key
2. Check that service account key has Firestore write permissions
3. Verify Firebase project is active and billing is enabled (if required)
4. Check logs for specific Firebase error messages

### Import Errors

1. Make sure you're running commands from the `backend/` directory
2. Verify virtual environment is activated
3. Install dependencies: `pip install -r requirements.txt`
4. Check Python version (requires 3.11+)

### Port Already in Use

If port 8000 is already in use, specify a different port:

```bash
uvicorn app.main:app --reload --port 8001
```

### Test Failures

1. Ensure all dependencies are installed: `pip install -r requirements.txt`
2. Check that `.env` file is configured with valid API keys
3. For integration tests, ensure server is running if using `--api` flag
4. Review test output for specific error messages

### Performance Issues

1. Check logs for timing information
2. Verify tool definitions are cached (should see "CanvasAgent initialized" once at startup)
3. Monitor token usage - high token counts indicate expensive requests
4. Consider using faster/cheaper models (gpt-4o) for production

## FAQ

**Q: Can I use a different OpenAI model?**
A: Yes, specify the model in the request body or change `DEFAULT_MODEL` in `app/config.py`.

**Q: Do I need Firebase for local development?**
A: No, Firebase is optional. The agent will return actions even if Firebase writes fail.

**Q: How do I add a new tool?**
A: Add the tool definition to `app/agent/tools.py` and update the system prompt in `app/agent/prompts.py`.

**Q: How do I modify the system prompt?**
A: Edit `SYSTEM_PROMPT` in `app/agent/prompts.py`. See comments in that file for guidance.

**Q: How do I add a new UI pattern?**
A: Add a few-shot example to `FEW_SHOT_EXAMPLES` in `app/agent/prompts.py`.

**Q: What's the difference between tool calls and actions?**
A: Tool calls are what OpenAI generates (with "create_" prefix). Actions are formatted for the frontend (without prefix).

**Q: How do I trace a specific request?**
A: Look for the request ID in logs. Each request gets a unique 8-character ID that appears in all related log entries.

