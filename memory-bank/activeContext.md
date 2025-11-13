# Active Context: CollabCanvas

## Current Work Focus

The project is currently in **Phase 3** with MVP features largely complete. **New focus**: Migrating the Canvas AI agent from Firebase Functions to a FastAPI backend (Python) to enable faster iteration, better LLM code generation, and improved agent performance.

**PR #1 Status**: ✅ **COMPLETE** - FastAPI project setup, environment configuration, health check endpoint, and logging infrastructure are all implemented.

**PR #2 Status**: ✅ **COMPLETE** - OpenAI SDK integration with retry logic, model flexibility, error handling, and `/api/agent/chat` endpoint are all implemented.

**PR #3 Status**: ✅ **COMPLETE** - All 5 canvas tool definitions (rectangle, square, circle, text, line) implemented with cached definitions, validation, and comprehensive descriptions.

## Recent Changes

### PR #1: FastAPI Backend Setup ✅ **COMPLETE**

**Completed (December 2024):**
- ✅ Created FastAPI project structure in `backend/` directory
- ✅ Set up Python package structure with `app/`, `app/api/routes/`, `app/utils/`
- ✅ Created `requirements.txt` with FastAPI, Uvicorn, OpenAI, Firebase Admin, python-dotenv, tenacity
- ✅ Implemented `app/config.py` with plain Python Settings class (no Pydantic)
- ✅ Created `.env.example` with OPENAI_API_KEY and FIREBASE_CREDENTIALS_PATH
- ✅ Configured FastAPI app with CORS middleware for `http://localhost:3000`
- ✅ Implemented health check endpoint at `GET /api/health`
- ✅ Set up logging infrastructure with console and file logging to `logs/` directory
- ✅ Created `run_local.py` script for local development
- ✅ Updated `.gitignore` with comprehensive Python exclusions

**Technical Decisions:**
- Used plain Python classes for configuration (no Pydantic dependency)
- Environment variables: Only OPENAI_API_KEY and FIREBASE_CREDENTIALS_PATH required
- Hardcoded for testing: DEFAULT_MODEL="gpt-4-turbo", ENABLE_RETRY=True, MAX_RETRIES=3
- Validation uses warnings instead of exceptions to allow development without full setup

### PR #2: OpenAI Integration & Retry Logic ✅ **COMPLETE**

**Completed (December 2024):**
- ✅ Created `app/services/openai_service.py` with OpenAI client initialization
- ✅ Implemented retry logic with tenacity (exponential backoff: 2s, 4s, 8s, max 3 attempts)
- ✅ Created `app/models/models.py` with AVAILABLE_MODELS dictionary (gpt-4-turbo, gpt-4o, gpt-4o-mini, gpt-4)
- ✅ Implemented `call_openai_with_retry()` wrapper function with retry decorator
- ✅ Created error response formatting helper for frontend consumption
- ✅ Updated health check endpoint to include OpenAI connection status
- ✅ Created `/api/agent/chat` endpoint (POST) for AI agent interactions
- ✅ Created comprehensive test script (`test_openai.py`) for OpenAI integration
- ✅ Created backend README.md with setup instructions and API documentation

**Technical Decisions:**
- Model configuration and retry settings are hardcoded (not in environment variables) for easy testing
- OpenAI SDK calls are synchronous but run in thread pool for async FastAPI endpoints
- Retry logic handles RateLimitError, APIError, and APITimeoutError with exponential backoff
- Error responses formatted with error type, message, retry attempt, and willRetry flag
- Health check performs lightweight OpenAI connection test without blocking

### PR #3: Tool Definitions & Caching ✅ **COMPLETE**

**Completed (December 2024):**
- ✅ Created `app/agent/tools.py` with module-level `TOOL_DEFINITIONS` constant for caching
- ✅ Implemented `get_tool_definitions()` function to return cached tool schemas
- ✅ Created all 5 tool definitions: create_rectangle, create_square, create_circle, create_text, create_line
- ✅ Added comprehensive descriptions with use cases, examples, and design guidance
- ✅ Implemented tool validation function with startup integration
- ✅ Created test script (`test_tools.py`) to verify tool definitions (~3,600 tokens total)
- ✅ All tools include enhanced properties: boxShadow, cornerRadius, stroke, strokeWidth, metadata, align

**Technical Decisions:**
- Tool definitions cached at module level to avoid JSON parsing per request (~5-10ms saved)
- Validation runs on startup to catch errors early
- Enhanced properties (boxShadow, metadata, cornerRadius, etc.) implemented per TDD design
- Tool definitions follow OpenAI function calling schema format
- All parameters documented with types, defaults, and usage examples

### Completed Features ✅

- **Authentication**: Google Sign-In with proper user management
- **Canvas Infrastructure**: 5000x5000 canvas with pan/zoom controls
- **Real-time Cursors**: Multi-user cursor tracking with <50ms perceived latency
- **Presence System**: Online user tracking with onDisconnect cleanup
- **Shape Creation**: Rectangle creation with real-time sync
- **Drag & Move**: Optimistic updates with conflict resolution
- **Selection System**: Object selection and multi-select support
- **Delete Functionality**: Backspace key deletion with optimistic updates
- **State Persistence**: Canvas state persists across sessions
- **Deployment**: Netlify configuration with environment variables

### Current Implementation Status

- **Canvas.jsx**: Fully implemented with all core features
- **CanvasContext.jsx**: Complete state management for canvas operations
- **Firebase Integration**: Complete with Firestore and Realtime Database
- **Hook System**: All custom hooks implemented and working
- **Utility Functions**: Firestore operations and object management complete

## Next Steps

### Immediate Priorities (AI Agent Migration)

1. **Phase 1: Core Backend Setup** ✅ **COMPLETE**
   - ✅ Initialize FastAPI project
   - ✅ Set up project structure with proper package organization
   - ✅ Configure environment variables (OPENAI_API_KEY, FIREBASE_CREDENTIALS_PATH)
   - ✅ Create health check endpoint (`/api/health`)
   - ✅ Set up logging infrastructure (console + file logging)
   - ✅ Configure CORS for frontend integration
   - ✅ Set up OpenAI SDK integration with retry logic (PR #2)
   - ✅ Implement `/api/agent/chat` endpoint (PR #2)
   - ✅ Create cached tool definitions (rectangle, square, circle, text, line) (PR #3)
   - ⏳ Local testing with mock responses (no Firebase)

2. **Phase 2: Prompt Engineering**
   - Write comprehensive system prompt
   - Add few-shot example for login form
   - Test prompt effectiveness with various inputs
   - Iterate on tool descriptions
   - Test with different models (gpt-4-turbo, gpt-4o, gpt-4o-mini)

3. **Phase 3: Tool Enhancement**
   - Add boxShadow support to tools
   - Add cornerRadius support to shapes
   - Implement create_line tool
   - Add metadata support for semantic roles
   - Test visual enhancements

4. **Phase 4: Firestore Integration**
   - Initialize Firebase Admin SDK
   - Connect to Firestore
   - Implement batch write for canvas objects
   - Test end-to-end with Canvas frontend

5. **Phase 5: Testing & Refinement**
   - Test complex UI patterns (login forms, cards, grids)
   - Compare model performance and costs
   - Measure latency and token usage
   - Add logging
   - Document API

### Post-MVP Features (Phase 4+)

1. **Additional Shapes**: Circle and Text components
2. **Transformations**: Resize handles and rotation
3. **Layer Management**: Z-index ordering and layer controls
4. **Performance Optimization**: Further optimizations for scale

## Active Decisions and Considerations

### Technical Decisions Made

- **Single Shared Canvas**: Hardcoded project ID 'shared-canvas' for MVP simplicity
- **Last-Write-Wins**: Conflict resolution strategy with deletion priority
- **Optimistic Updates**: Local changes appear instantly for responsive UX
- **Throttled Cursors**: 45ms updates for performance with interpolation
- **onDisconnect Cleanup**: Automatic presence removal on browser close
- **AI Agent Migration**: Moving from Firebase Functions (JS) to FastAPI (Python) for better LLM integration and faster iteration

### Current Architecture Decisions

- **Firestore for Objects**: Primary storage for canvas objects with real-time sync
- **Realtime Database for Presence**: Better suited for presence tracking with onDisconnect
- **Konva.js for Rendering**: High-performance 2D canvas library
- **React Context for State**: Centralized state management for canvas operations
- **FastAPI Backend**: New Python backend for AI agent with OpenAI integration
- **OpenAI Tool Calling**: Using native OpenAI tool calling API for agent orchestration
- **Cached Tool Definitions**: Tool definitions stored as constants to avoid re-parsing on each request
- **Exponential Backoff Retry**: Retry logic for OpenAI API rate limits and errors (3 attempts, exponential backoff)

### Performance Considerations

- **Cursor Throttling**: 45ms updates prevent excessive Firestore writes
- **Optimistic Updates**: Local state prevents UI lag during network operations
- **Efficient Rendering**: Konva's built-in optimizations for smooth performance
- **Conflict Resolution**: Server timestamps ensure consistent state across users

## Current Challenges

### Resolved Challenges

- ✅ Real-time synchronization complexity
- ✅ Conflict resolution during simultaneous edits
- ✅ Performance optimization for multiple users
- ✅ State persistence across sessions
- ✅ Firebase configuration and deployment

### Ongoing Considerations

- **Scalability**: How the system performs with more users and objects
- **Error Handling**: Robust error handling for network issues
- **User Experience**: Smooth interactions and clear feedback
- **Testing Coverage**: Comprehensive testing across different scenarios
- **AI Agent Quality**: Ensuring agent generates complete, well-styled UI components (target: 95% success rate for login forms)
- **Model Selection**: Testing different OpenAI models (gpt-4-turbo, gpt-4o, gpt-4o-mini) for cost/quality balance
- **Token Costs**: Monitoring and optimizing token usage for cost efficiency
- **Response Latency**: Target <2 sec response time for AI agent requests

## Development Environment

- **Current Branch**: victor.PR-8 (based on git status)
- **Memory Bank**: Recently deleted and being recreated
- **Deployment**: Netlify configuration complete
- **Testing**: Vitest setup with comprehensive test coverage
