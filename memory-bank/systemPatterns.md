# System Patterns: CollabCanvas

## Architecture Overview

CollabCanvas follows a client-side state management pattern with real-time synchronization via Firebase. The application uses React Context for state management, Konva.js for canvas rendering, and Firebase for backend services. A new FastAPI backend (Python) handles AI agent operations with OpenAI integration.

## Key Technical Decisions

### State Management Pattern

- **React Context**: CanvasContext for canvas state, AuthContext for user state
- **Local State**: useState for component-specific state
- **Optimistic Updates**: Local changes appear instantly, then sync to server
- **Conflict Resolution**: Last-write-wins with server timestamps, deletion takes priority

### Real-time Synchronization

- **Firestore**: Primary database for canvas objects and state persistence
- **Realtime Database**: Presence tracking with onDisconnect() for instant cleanup
- **onSnapshot Listeners**: Real-time updates for objects and cursors
- **Throttled Updates**: Cursor updates throttled to 45ms for performance

### Canvas Rendering

- **Konva.js**: 2D canvas library for high-performance rendering
- **React-Konva**: React bindings for Konva
- **Coordinate System**: 5000x5000 logical canvas with screen coordinate transforms
- **Layer Management**: Single layer for MVP, objects sorted by zIndex

## Component Relationships

### Core Components

```
App.jsx
├── AuthProvider (AuthContext)
├── CanvasProvider (CanvasContext)
└── CanvasPage
    ├── Header (user info, sign out)
    ├── Toolbar (shape tools)
    ├── Canvas (main canvas)
    │   ├── Rectangle (shape components)
    │   └── Cursor (remote user cursors)
    ├── PresencePanel (online users)
    └── ZoomControls (zoom controls)
```

### Hook Dependencies

```
Canvas.jsx
├── useAuth (user authentication)
├── useCanvas (canvas state management)
├── useCursorTracking (local cursor)
├── useCursorSync (remote cursors)
├── usePresence (presence tracking)
├── usePresenceSync (online users)
└── useObjectSync (canvas objects)
```

## Data Flow Patterns

### Object Creation Flow

1. User clicks on canvas
2. Local rectangle created instantly (optimistic update)
3. Rectangle written to Firestore
4. useObjectSync receives update and renders for all users

### Drag and Move Flow

1. User starts dragging object
2. Local position updated continuously (optimistic updates)
3. Remote updates blocked during drag
4. On drag end, final position written to Firestore
5. Remote updates resume after drag completes

### Cursor Tracking Flow

1. Mouse move events tracked locally
2. Cursor position throttled to 45ms updates
3. Position written to Firestore cursors collection
4. useCursorSync receives updates and renders remote cursors
5. onDisconnect() removes cursor when user leaves

## Design Patterns in Use

### Optimistic Updates

- Local changes appear instantly for responsive UX
- Server updates applied when received
- Conflict resolution handles simultaneous edits

### Event-Driven Architecture

- Firebase listeners trigger UI updates
- Keyboard shortcuts for common actions
- Mouse events for canvas interactions

### Component Composition

- Reusable shape components (Rectangle, Circle, Text)
- Context providers for shared state
- Custom hooks for Firebase integration

### Error Handling

- Try-catch blocks around Firebase operations
- Graceful degradation for network issues
- Console logging for debugging
- Exponential backoff retry for OpenAI API (rate limits, 5xx errors, timeouts)
- Graceful error responses to frontend with retry information

### OpenAI Service Pattern

- **Client Initialization**: Singleton pattern for OpenAI client (initialized once, reused)
- **Retry Decorator**: Tenacity-based retry with exponential backoff (2s, 4s, 8s, max 3 attempts)
- **Error Formatting**: Standardized error responses with error type, message, retry attempt, and willRetry flag
- **Model Configuration**: Centralized model definitions with metadata (cost, recommended status, notes)
- **Async Wrapper**: Synchronous OpenAI SDK calls wrapped in `asyncio.to_thread()` for FastAPI async endpoints
- **Connection Testing**: Lightweight connection test on startup and health check (non-blocking)

## AI Agent Architecture

### Backend Pattern

- **FastAPI**: Python web framework for API endpoints
- **OpenAI SDK**: Native tool calling API integration (synchronous SDK wrapped in async context)
- **Firebase Admin SDK**: Server-side Firestore writes for canvas objects (to be implemented)
- **Cached Tools**: Tool definitions stored as constants in `app/agent/tools.py` (no re-parsing per request) ✅ **IMPLEMENTED (PR #3)**
- **Retry Logic**: Tenacity library for exponential backoff on API errors (RateLimitError, APIError, APITimeoutError)
- **Model Configuration**: Hardcoded model settings for easy testing (DEFAULT_MODEL, ENABLE_RETRY, MAX_RETRIES)
- **Error Formatting**: Standardized error responses for frontend consumption

### Agent Orchestration Flow

1. Frontend sends POST request to `/api/agent/chat` with sessionId, message, and optional model override
2. FastAPI backend validates model and prepares messages
3. OpenAI API called via `call_openai_with_retry()` with retry logic, tool definitions, and prompts ✅ **TOOLS & PROMPTS READY (PR #3, #4)**
4. Retry logic handles RateLimitError, APIError, APITimeoutError with exponential backoff
5. Agent returns response with tool calls (tool definitions and prompts available, execution pending orchestrator)
6. Response formatted with model used and token usage
7. Frontend receives response with AI-generated text and metadata
8. (Next: Orchestrator executes tool calls, batch writes to Firestore, actions array returned - PR #5)

### Tool Execution Pattern

- **Batch Processing**: All tool calls executed, then batch written to Firestore
- **Action Format**: Each action has `type` (create_rectangle, create_text, etc.) and `params`
- **Metadata Support**: Rectangles can have semantic roles (container, input, button, divider) ✅ **IMPLEMENTED**
- **Visual Enhancements**: boxShadow, cornerRadius, strokeWidth for modern UI styling ✅ **IMPLEMENTED**

### Tool Definitions (PR #3) ✅ **COMPLETE**

- **Cached Definitions**: Module-level `TOOL_DEFINITIONS` constant in `app/agent/tools.py` (~2,247 tokens)
- **Available Tools**: create_rectangle, create_square, create_circle, create_text, create_line
- **Validation**: Startup validation ensures all tool definitions are properly structured
- **Enhanced Properties**: All tools support modern UI features (boxShadow, cornerRadius, stroke, metadata, align)
- **Streamlined Descriptions**: Concise, principle-based descriptions (refactored in PR #4)

### System Prompt & Few-Shot Examples (PR #4) ✅ **COMPLETE**

- **System Prompt**: Balanced "just right" approach in `app/agent/prompts.py` (~637 tokens)
- **Design Principles**: Shadows, corners, colors, typography, sizing guidelines
- **Common Patterns**: Login form (8 components), card, button, profile section patterns
- **Few-Shot Examples**: Complete login form example with 8 tool calls (~759 tokens)
- **Python Dicts**: Tool call arguments stored as native Python dicts (no json.dumps needed)
- **Total Token Usage**: ~1,396 tokens per request (system prompt + few-shot examples, before user message)

## Performance Optimizations

### Rendering Optimizations

- Konva's built-in performance optimizations
- Object culling (only render visible objects)
- Throttled cursor updates
- Efficient coordinate transformations

### State Management Optimizations

- Minimal re-renders with proper dependency arrays
- Local state for dragging to avoid excessive Firestore writes
- Debounced updates where appropriate

### Firebase Optimizations

- Single collection queries
- Server timestamps for conflict resolution
- onDisconnect() for automatic cleanup
- Efficient security rules
