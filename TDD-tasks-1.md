# tasks-1.md

**PR #1: Project Setup & Core Infrastructure**

This PR sets up the foundational FastAPI project structure, environment configuration, and basic health check endpoint.

---

## Task 1.1: Initialize FastAPI Project

- [x] Create project root directory `backend/`
- [x] Initialize Python virtual environment (Python 3.11+)
- [x] Create `requirements.txt` with dependencies:
  - fastapi
  - uvicorn[standard]
  - openai
  - firebase-admin
  - python-dotenv
  - tenacity
- [x] Install all dependencies
- [x] Create `.gitignore` (include venv, .env, __pycache__, *.pyc, serviceAccountKey.json)

---

## Task 1.2: Project Structure Setup

- [x] Create directory structure (you'll define this yourself as noted in TDD)
- [x] Create empty `__init__.py` files in all package directories
- [ ] Create `README.md` with:
  - Project description
  - Setup instructions
  - Local development commands
  - Environment variables list

---

## Task 1.3: Environment Configuration

- [x] Create `.env.example` file with template variables:
  ```
  OPENAI_API_KEY=your_key_here
  FIREBASE_CREDENTIALS_PATH=./serviceAccountKey.json
  DEFAULT_MODEL=gpt-4-turbo
  ENABLE_RETRY=true
  MAX_RETRIES=3
  LOG_LEVEL=INFO
  ```
- [x] Create `app/config.py` for loading environment variables
- [x] Add validation for required environment variables
- [ ] Document all environment variables in README

---

## Task 1.4: FastAPI Application Setup

- [x] Create `app/main.py` with basic FastAPI app initialization
- [x] Configure CORS middleware for frontend (allow http://localhost:3000)
- [x] Add startup event handler (placeholder for now)
- [x] Add app metadata (title, description, version)
- [x] Create `run_local.py` script for easy local development

---

## Task 1.5: Health Check Endpoint

- [x] Create `app/api/routes/health.py`
- [x] Implement `GET /api/health` endpoint
- [x] Return basic health status: `{"status": "healthy", "version": "1.0.0"}`
- [x] Register health router in main app
- [x] Test endpoint locally with curl or browser

---

## Task 1.6: Logging Setup

- [x] Create `app/utils/logger.py`
- [x] Configure Python logging with appropriate format
- [x] Set log level from environment variable
- [x] Add file logging (optional, to `logs/` directory)
- [x] Test logging in health check endpoint

---

## Task 1.7: Local Development Testing

- [x] Run FastAPI server locally: `uvicorn app.main:app --reload`
- [x] Verify server starts without errors
- [x] Test health check endpoint returns 200
- [x] Verify CORS headers are present
- [x] Verify logs are being written
- [x] Document any issues encountered

---

## Task 1.8: Documentation

- [ ] Document local setup process in README
- [ ] Add troubleshooting section for common issues
- [ ] Document how to run the server
- [ ] Add example curl commands for health check
- [ ] Create PR description with setup verification steps

---

**PR Acceptance Criteria:**
- FastAPI server runs locally without errors
- Health check endpoint returns 200 status
- All environment variables load correctly
- CORS configured for frontend
- Basic logging functional
- README has clear setup instructions

---

# tasks-2.md

**PR #2: OpenAI Integration & Retry Logic**

This PR adds OpenAI SDK integration with retry logic and model flexibility.

---

## Task 2.1: OpenAI Service Setup

- [x] Create `app/services/openai_service.py`
- [x] Initialize OpenAI client with API key from config
- [x] Create function to test OpenAI connection (simple completion)
- [x] Add connection test to FastAPI startup event
- [x] Handle missing/invalid API key gracefully

---

## Task 2.2: Retry Logic Implementation

- [x] Install `tenacity` library (should already be in requirements.txt)
- [x] Create retry decorator for OpenAI API calls
- [x] Configure retry conditions: RateLimitError, APIError, APITimeoutError
- [x] Set retry strategy: max 3 attempts, exponential backoff (2s, 4s, 8s)
- [x] Add logging for retry attempts
- [x] Test retry logic with intentional failures (comment out API key temporarily)

Refer to TDD Section 8 for retry configuration details.

---

## Task 2.3: Model Configuration

- [x] Create `app/models/models.py` (or add to config.py)
- [x] Define `AVAILABLE_MODELS` dictionary with model metadata
- [x] Include: gpt-4-turbo, gpt-4o, gpt-4o-mini, gpt-4
- [x] Add model validation function
- [x] Set default model (hardcoded in config.py, not from environment variable)
- [x] Create helper function to get model name by key

Refer to TDD Section 9 for model configuration structure.

---

## Task 2.4: OpenAI API Wrapper Function

- [x] Create `call_openai_with_retry()` function in openai_service.py
- [x] Accept parameters: messages, tools, model
- [x] Apply retry decorator
- [x] Call `client.chat.completions.create()`
- [x] Return full response object
- [x] Add error handling for non-retryable errors

---

## Task 2.5: Error Response Formatting

- [x] Create error response helper function
- [x] Format errors for frontend consumption
- [x] Include: error type, message, retry attempt number, willRetry flag
- [x] Handle different error types: rate limit, timeout, API error, invalid request
- [x] Add logging for all errors

Example error response structure in TDD Section 8.

---

## Task 2.6: Testing OpenAI Integration

- [x] Create simple test script to call OpenAI API
- [x] Test with basic completion (no tools yet)
- [x] Verify retry logic by testing with rate limit scenario (if possible)
- [x] Test all configured models (gpt-4-turbo, gpt-4o, etc.)
- [x] Log token usage and response times
- [x] Document any model-specific behaviors observed

---

## Task 2.7: Update Health Check

- [x] Update `/api/health` endpoint to include OpenAI connection status
- [x] Add "openai": "connected" or "disconnected" to response
- [x] Test connection during health check (lightweight call)
- [x] Handle failures gracefully (don't crash health check)

---

## Task 2.8: Documentation

- [x] Document OpenAI service usage
- [x] Document retry logic and configuration
- [x] Document available models and selection
- [x] Add examples of error responses
- [x] Update README with OpenAI API key setup instructions

---

**PR Acceptance Criteria:**
- OpenAI client initializes successfully
- Retry logic triggers on appropriate errors
- All configured models accessible
- Error responses properly formatted
- Health check includes OpenAI status
- Retry attempts logged appropriately

---

# tasks-3.md

**PR #3: Tool Definitions & Caching**

This PR implements all 5 canvas tools with cached definitions.

---

## Task 3.1: Create Tools Module

- [x] Create `app/agent/tools.py`
- [x] Create function `get_tool_definitions()` that returns list of tool schemas
- [x] Add module-level constant `TOOL_DEFINITIONS` for caching
- [x] Add documentation explaining caching benefits

Refer to TDD Section 10 for caching rationale.

---

## Task 3.2: Implement create_rectangle Tool

- [x] Add create_rectangle tool definition to TOOL_DEFINITIONS
- [x] Include all parameters: x, y, width, height, fill, stroke, strokeWidth, cornerRadius, boxShadow, rotation, metadata
- [x] Write comprehensive description explaining use cases (containers, inputs, buttons, dividers)
- [x] Include examples in description for login forms
- [x] Document boxShadow object structure
- [x] Document metadata object structure (role, name)

Refer to TDD Section 5.1 for complete tool definition.

---

## Task 3.3: Implement create_square Tool

- [x] Add create_square tool definition to TOOL_DEFINITIONS
- [x] Include parameters: x, y, size, fill, stroke, strokeWidth, cornerRadius, boxShadow, rotation
- [x] Write description explaining best use cases (icons, grid items, thumbnails)
- [x] Note when to use rectangle instead
- [x] Document all optional parameters with defaults

Refer to TDD Section 5.2 for complete tool definition.

---

## Task 3.4: Implement create_circle Tool

- [x] Add create_circle tool definition to TOOL_DEFINITIONS
- [x] Include parameters: x, y, radius, fill, stroke, strokeWidth, boxShadow
- [x] Write description for use cases (avatars, icons, status indicators)
- [x] Document that circles don't need cornerRadius
- [x] Include sizing guidance in description

Refer to TDD Section 5.3 for complete tool definition.

---

## Task 3.5: Implement create_text Tool

- [x] Add create_text tool definition to TOOL_DEFINITIONS
- [x] Include parameters: x, y, text, fontSize, fontWeight, fill, align
- [x] Write comprehensive description for different text roles (titles, labels, button text, body)
- [x] Include positioning guidance (labels above inputs, button text centered)
- [x] Document color guidelines for different text types
- [x] Include font size recommendations for each role

Refer to TDD Section 5.4 for complete tool definition.

---

## Task 3.6: Implement create_line Tool

- [x] Add create_line tool definition to TOOL_DEFINITIONS
- [x] Include parameters: x1, y1, x2, y2, stroke, strokeWidth
- [x] Write description for use cases (dividers, underlines, connectors)
- [x] Include guidance for horizontal vs vertical lines
- [x] Document typical stroke widths and colors for dividers

Refer to TDD Section 5.5 for complete tool definition.

---

## Task 3.7: Tool Validation Helper

- [x] Create helper function to validate tool definitions on startup
- [x] Check all required fields present
- [x] Verify parameter schemas are valid
- [x] Log tool count and names on server start
- [x] Add to startup event in main.py

---

## Task 3.8: Testing & Documentation

- [x] Create test script to print all tool definitions
- [x] Verify JSON structure is valid
- [x] Count total tokens in tool definitions (approximate)
- [ ] Document each tool in README or separate TOOLS.md (skipped per user request)
- [x] Add comments explaining design decisions

---

**PR Acceptance Criteria:**
- ✅ All 5 tools defined: rectangle, square, circle, text, line
- ✅ Tool definitions cached at module level
- ✅ All parameters documented with types and defaults
- ✅ Descriptions are comprehensive and include examples
- ✅ Tool validation runs on startup without errors
- ✅ Documentation explains each tool's purpose

**PR #3 Status**: ✅ **COMPLETE** - All tool definitions implemented with caching, validation, and comprehensive descriptions.

---

# tasks-4.md