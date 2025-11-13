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

Chat endpoint for AI agent interactions.

**Request:**
```json
{
  "sessionId": "canvas-session-123",
  "message": "Create a login form",
  "model": "gpt-4-turbo"  // Optional, defaults to configured default
}
```

**Response:**
```json
{
  "response": "I've created a login form for you...",
  "model": "gpt-4-turbo",
  "tokensUsed": 1250
}
```

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

## Project Structure

```
backend/
├── app/
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
└── test_openai.py            # OpenAI integration tests
```

## Development

### Logging

Logs are written to:
- Console (INFO level and above)
- `logs/app.log` file (all levels)

### CORS

CORS is configured to allow requests from `http://localhost:3000` (frontend development server).

## Troubleshooting

### OpenAI Connection Issues

1. Verify `OPENAI_API_KEY` is set in `.env` file
2. Check API key is valid and has sufficient credits
3. Review logs in `logs/app.log` for detailed error messages

### Import Errors

Make sure you're running commands from the `backend/` directory and the virtual environment is activated.

### Port Already in Use

If port 8000 is already in use, specify a different port:

```bash
uvicorn app.main:app --reload --port 8001
```

