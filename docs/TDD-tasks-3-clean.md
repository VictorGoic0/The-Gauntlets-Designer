# TDD-tasks-3.md

**Backend Refactor & Streaming Integration**

This document outlines the PRs and tasks for migrating the AI agent from Firebase Functions to the Python FastAPI backend, integrating LangChain, and implementing streaming outputs to the frontend.

---

## Overview

**Current Architecture:**

- Frontend: React + Firebase SDK
- Backend: Firebase Cloud Functions (Node.js) with OpenAI GPT-3.5-Turbo
- Database: Firebase Firestore + Realtime DB (hybrid storage)

**Target Architecture:**

- Frontend: React + HTTP client (fetch/axios)
- Backend: Python FastAPI with LangChain + OpenAI
- Database: Firebase Firestore + Realtime DB (unchanged)
- Communication: Server-Sent Events (SSE) for streaming

**Key Principles:**

1. Backend communicates with agent only (no frontend → Firestore writes for agent actions)
2. Frontend listens to Firestore for updates (existing sync mechanism)
3. Streaming provides real-time feedback as agent executes tools
4. Firebase Realtime DB handles high-frequency updates (cursors, positions)

**Reference**: See `api/langchain-examples.md` for LangChain API examples

---

## PR #21: Backend Agent Migration to LangChain

**Goal**: Migrate AI agent from Firebase Functions to Python FastAPI backend with LangChain integration

**Dependencies**: None (can start immediately)

---

### Task 21.1: Install LangChain Dependencies

**Description**: Add LangChain and related packages to Python backend

- [x] Add `langchain` to `api/requirements.txt`
- [x] Install dependencies in virtual environment
- [x] Verify imports work
- [x] Document version choices

**Files Modified:**

- `api/requirements.txt`

**Acceptance Criteria:**

- LangChain packages install without conflicts
- No version conflicts with existing packages

---

### Task 21.2: Create LangChain Tool Definitions

**Description**: Convert existing tool definitions to LangChain format using `@tool` decorator

**Current Tools** (from `functions/tools.js`):

1. `createRectangle` - Create rectangle with position, size, fill, stroke, etc.
2. `createCircle` - Create circle with position, radius, fill, stroke
3. `createText` - Create text with position, content, fontSize, fill
4. `moveObject` - Move object to new position
5. `resizeObject` - Resize object (width/height or radius)
6. `changeColor` - Change object fill color
7. `rotateObject` - Rotate object by degrees

**Implementation:**

- [x] Create `api/app/agent/langchain_tools.py`
- [x] Import: `from langchain.tools import tool`
- [x] Define each tool as Python function with `@tool` decorator
- [x] Add comprehensive docstrings (LangChain uses these for prompts)
- [x] Include parameter types and descriptions
- [x] Add Firebase Admin SDK imports for Firestore writes
- [x] Implement tool execution logic (write to Firestore + Realtime DB)
- [x] Add error handling for each tool
- [x] Return structured results: `{"success": bool, "objectId": str, "message": str}`
- [x] Implement all 7 tools following same pattern
- [x] Add helper function to get tool list: `def get_langchain_tools() -> list`

**Files Created:**

- `api/app/agent/langchain_tools.py`

**Acceptance Criteria:**

- All 7 tools defined with `@tool` decorator
- Comprehensive docstrings for each tool
- Tools write to both Firestore and Realtime DB
- Error handling returns structured results

**Reference**: See `api/langchain-examples.md` for `@tool` decorator syntax

---

### Task 21.3: Migrate System Prompt to LangChain

**Description**: Convert system prompt from Node.js to Python with LangChain format

**Current Prompt Location**: `functions/index.js` (system message content)

**Implementation:**

- [x] Review existing system prompt in `functions/index.js`
- [x] Update `api/app/agent/prompts.py` to work with LangChain
- [x] Keep design principles, sizing guidelines, and patterns
- [x] Update few-shot examples for LangChain format
- [x] Test prompt token count (should be similar to current ~2000 tokens)

**Files Modified:**

- `api/app/agent/prompts.py`

**Acceptance Criteria:**

- System prompt maintains all design principles
- Few-shot examples updated for LangChain format
- Prompt is clear about tool usage patterns
- Token count remains reasonable (<3000 tokens)

**Reference**: See `api/langchain-examples.md` for system prompt syntax

---

### Task 21.4: Create LangChain Agent Orchestrator

**Description**: Replace OpenAI direct calls with LangChain agent using `create_agent()`

**Current Implementation**: `api/app/agent/orchestrator.py` uses OpenAI SDK directly

**Implementation:**

- [x] Import: `from langchain.agents import create_agent`
- [x] Update `CanvasAgent.__init__()`:
  - Load LangChain tools from `langchain_tools.py`
  - Create agent with `create_agent(model="gpt-4-turbo", tools=[...], system_prompt="...")`
- [x] Update `process_message()` method:
  - Call `agent.invoke({"messages": [{"role": "user", "content": user_message}]})`
  - Extract tool calls and results from agent output
  - Format response for frontend (maintain existing structure)
- [x] Maintain existing error handling
- [x] Keep response format consistent: `{"response": str, "actions": list, "toolCalls": int, ...}`

**Files Modified:**

- `api/app/agent/orchestrator.py`

**Acceptance Criteria:**

- LangChain agent executes tools correctly
- Response format matches existing frontend expectations
- Error handling maintains existing behavior
- Logging provides visibility into agent execution

**Reference**: See `api/langchain-examples.md` for `create_agent()` usage

---

### Task 21.5: Add Streaming Support (Preparation)

**Description**: Prepare orchestrator for streaming (full implementation in PR #22)

- [x] Add `stream_message()` method to `CanvasAgent` (stub for now)
- [x] Research LangChain streaming APIs
- [x] Document streaming approach in comments
- [x] Plan how to emit events for each tool execution

**Note**: Full streaming implementation happens in PR #22. This task is just preparation.

**Files Modified:**

- `api/app/agent/orchestrator.py`

**Acceptance Criteria:**

- `stream_message()` method exists (can be a stub)
- Comments document planned streaming approach
- No breaking changes to existing `process_message()` method

---

### Task 21.6: Update API Route for LangChain

**Description**: Ensure API route works with new LangChain orchestrator

- [x] Review `api/app/api/routes/agent.py`
- [x] Verify request/response structures still match
- [x] Update any LangChain-specific error handling
- [x] Test endpoint with curl/Postman
- [x] Verify Firebase writes still work correctly

**Files Modified:**

- `api/app/api/routes/agent.py` (minimal changes expected)

**Acceptance Criteria:**

- POST `/api/agent/chat` works with LangChain agent
- Response format unchanged from frontend perspective
- Error handling covers LangChain-specific errors
- Firebase writes confirmed in Firestore console

---

### Task 21.7: Documentation & Cleanup

**Description**: Document LangChain migration and clean up old code

- [x] Update `api/README.md` with LangChain usage
- [x] Document tool definitions and how to add new tools
- [x] Add comments explaining LangChain agent flow
- [x] Update deployment docs (if needed)
- [x] Remove old OpenAI direct call code (if fully replaced)
- [x] Update environment variable docs

**Files Modified:**

- `api/README.md`
- `api/DEPLOYMENT.md` (if needed)

**Acceptance Criteria:**

- README explains LangChain integration
- Clear instructions for adding new tools
- Deployment docs updated if needed
- Old code removed or clearly marked as deprecated

---

**PR #21 Acceptance Criteria:**

- ✅ LangChain integrated into Python backend
- ✅ All 7 tools working with LangChain
- ✅ System prompt and few-shot examples migrated
- ✅ Agent orchestrator uses LangChain
- ✅ API endpoint works with new orchestrator
- ✅ Performance comparable to Firebase Functions
- ✅ Documentation updated

---

## PR #22: Server-Sent Events (SSE) Streaming

**Goal**: Implement streaming from backend to frontend so each tool execution is emitted in real-time

**Dependencies**: PR #21 (LangChain migration must be complete)

---

### Task 22.1: Add SSE Support to FastAPI

**Description**: Set up Server-Sent Events infrastructure in FastAPI

- [x] Install SSE library: `pip install sse-starlette`
- [x] Add to `api/requirements.txt`
- [x] Import in route: `from sse_starlette.sse import EventSourceResponse`
- [x] Research FastAPI SSE best practices
- [x] Create test endpoint `/api/agent/stream-test`
- [x] Test with curl: `curl -N http://localhost:8000/api/agent/stream-test`
- [x] Verify events stream correctly

**Files Modified:**

- `api/requirements.txt`
- `api/app/api/routes/agent.py`

**Acceptance Criteria:**

- `sse-starlette` installed
- Basic SSE endpoint works
- Events stream to client correctly
- No CORS issues

---

### Task 22.2: Implement Streaming in LangChain Agent

**Description**: Use LangChain's streaming APIs to emit events during tool execution

**Implementation:**

- [x] Update `CanvasAgent.stream_message()` method
- [x] Use LangChain streaming capabilities
- [x] Filter for tool execution events
- [x] Emit SSE event for each tool start/end
- [x] Include tool name, arguments, and result in each event
- [x] Handle errors during streaming
- [x] Emit final completion event

**Files Modified:**

- `api/app/agent/orchestrator.py`

**Acceptance Criteria:**

- `stream_message()` method implemented
- Events emit for each tool execution
- Event format is consistent and parseable
- Errors during streaming handled gracefully
- Streaming works for both single and multi-tool commands

---

### Task 22.3: Create SSE Streaming Endpoint

**Description**: Add new API endpoint for streaming agent responses

- [x] Create new route: `POST /api/agent/chat-stream`
- [x] Accept same request format as `/api/agent/chat`
- [x] Call `agent.stream_message()` instead of `process_message()`
- [x] Wrap in `EventSourceResponse`
- [x] Format events as SSE (event: type, data: JSON)
- [x] Add error handling for streaming failures
- [x] Test with curl

**Files Modified:**

- `api/app/api/routes/agent.py`

**Acceptance Criteria:**

- `/api/agent/chat-stream` endpoint works
- Events stream in SSE format
- Error handling works
- curl tests successful

---

### Task 22.4: Update Frontend to Use SSE

**Description**: Refactor frontend to consume SSE stream instead of single response

**Current Implementation**: `webapp/src/services/aiService.js` uses `httpsCallable()` for Firebase Functions

**New Implementation**: Use `fetch` with streaming for SSE

**Implementation:**

- [x] Create new function: `executeAICommandStream(command, onToolStart, onToolEnd, onComplete, onError)`
- [x] Use `fetch` API with streaming
- [x] Handle different event types: `tool_start`, `tool_end`, `complete`, `error`
- [x] Call callbacks for each event
- [x] Close stream on completion or error
- [x] Return cleanup function

**Files Modified:**

- `webapp/src/services/aiService.js`
- `webapp/src/components/ai/AIPanel.jsx`

**Acceptance Criteria:**

- Streaming function works with SSE endpoint
- Frontend receives events in real-time
- UI updates as each tool executes
- Error handling works correctly
- Cleanup function properly closes stream

---

### Task 22.5: Update AIPanel UI for Streaming

**Description**: Enhance AI panel to show real-time tool execution progress

**Current UI**: Shows loading spinner, then final result

**New UI**: Shows progress for each tool as it executes

**Implementation:**

- [x] Add state for tracking tool execution progress
- [x] Display list of tools being executed
- [x] Show status for each tool: pending → executing → complete/error
- [x] Add visual indicators (icons, colors, animations)
- [x] Show tool names in user-friendly format
- [x] Display final summary when complete
- [x] Handle errors for individual tools (partial success)

**Files Modified:**

- `webapp/src/components/ai/AIPanel.jsx`

**Acceptance Criteria:**

- UI shows real-time progress
- Each tool's status is visible
- Animations are smooth
- Error states handled gracefully
- Final summary displayed on completion

---

### Task 22.6: Deprecate Firebase Functions

**Description**: Mark Firebase Functions as deprecated and document migration

- [x] Add deprecation notice to `functions/index.js`
- [x] Update `functions/README.md` with migration notes
- [x] Document differences between Firebase Functions and FastAPI versions
- [x] Keep Firebase Functions code for reference (don't delete yet)
- [x] Add comment: "Deprecated: Use FastAPI backend at /api/agent/chat-stream"
- [x] Update frontend to use FastAPI by default
- [x] Add environment variable to toggle between backends (for testing)

**Files Modified:**

- `functions/index.js`
- `functions/README.md`
- `webapp/src/services/aiService.js`

**Acceptance Criteria:**

- Firebase Functions marked as deprecated
- Migration path documented
- Frontend uses FastAPI by default
- Old code preserved for reference
- Clear instructions for switching backends

---

### Task 22.7: Documentation & Cleanup

**Description**: Document streaming implementation and clean up

- [x] Update `api/README.md` with streaming endpoint docs
- [x] Add SSE event format documentation
- [x] Document frontend streaming usage
- [x] Add examples for both streaming and non-streaming endpoints
- [x] Update API docs at `/docs` (FastAPI auto-docs)
- [x] Add troubleshooting section for streaming issues
- [x] Document browser compatibility (EventSource support)

**Files Modified:**

- `api/README.md`
- `webapp/README.md`
- `api/app/api/routes/agent.py` (docstrings)

**Acceptance Criteria:**

- Streaming endpoint fully documented
- Event format clearly explained
- Frontend usage examples provided
- Troubleshooting guide complete
- API docs updated

---

**PR #22 Acceptance Criteria:**

- ✅ SSE streaming implemented in FastAPI
- ✅ LangChain agent streams tool executions
- ✅ Frontend consumes SSE stream
- ✅ UI shows real-time progress
- ✅ Error handling works for streaming
- ✅ Performance meets targets
- ✅ All tests pass
- ✅ Documentation complete

---

## PR #23: Frontend Backend Integration

**Goal**: Complete frontend refactor to use Python backend exclusively

**Dependencies**: PR #21 and PR #22 must be complete

---

### Task 23.1: Update Environment Variables

**Description**: Add backend API URL to frontend environment

- [ ] Add to `webapp/.env.example`: `VITE_API_BASE_URL=http://localhost:8000`
- [ ] Add to `webapp/.env.local`: `VITE_API_BASE_URL=http://localhost:8000`
- [ ] Update for production (Netlify environment variables)
- [ ] Document environment variables in `webapp/README.md`

**Files Modified:**

- `webapp/.env.example`
- `webapp/.env.local`
- `webapp/README.md`

**Acceptance Criteria:**

- Environment variables configured
- Local development uses `localhost:8000`
- Production uses deployed backend URL
- Documentation updated

---

### Task 23.2: Remove Firebase Functions Dependencies

**Description**: Clean up Firebase Functions references in frontend

- [ ] Update `webapp/src/services/aiService.js`:
  - Remove Firebase Functions imports
  - Remove `httpsCallable()` usage
  - Keep only HTTP fetch-based functions
- [ ] Remove Firebase Functions from `webapp/package.json` (if present)
- [ ] Update imports in `AIPanel.jsx` (if needed)
- [ ] Test that AI panel works with backend

**Files Modified:**

- `webapp/src/services/aiService.js`
- `webapp/package.json`
- `webapp/src/components/ai/AIPanel.jsx`

**Acceptance Criteria:**

- No Firebase Functions imports remain
- AI service uses HTTP fetch only
- All AI panel features work
- No console errors

---

### Task 23.3: Update Documentation

**Description**: Update all documentation for new backend integration

- [ ] Update `README.md` (root):
  - Document new architecture (FastAPI backend)
  - Update setup instructions
  - Add backend startup instructions
- [ ] Update `webapp/README.md`:
  - Document environment variables
  - Update AI service usage
  - Add troubleshooting section
- [ ] Update `api/README.md`:
  - Document streaming endpoints
  - Update deployment instructions
- [ ] Update `PRD.md` (if needed):
  - Note architecture change
  - Update tech stack section

**Files Modified:**

- `README.md`
- `webapp/README.md`
- `api/README.md`
- `PRD.md`

**Acceptance Criteria:**

- All documentation updated
- Setup instructions accurate
- Architecture changes documented
- Troubleshooting guides complete

---

### Task 23.4: Cleanup & Optimization

**Description**: Remove dead code and optimize

- [ ] Remove unused Firebase Functions code (or move to `/archive`)
- [ ] Remove unused imports in frontend
- [ ] Optimize bundle size (check for unused dependencies)
- [ ] Run linter and fix warnings
- [ ] Check for console warnings/errors

**Files Modified:**

- Various (cleanup)

**Acceptance Criteria:**

- No dead code remains
- Linter passes with no warnings
- Bundle size optimized
- No console errors

---

**PR #23 Acceptance Criteria:**

- ✅ Frontend uses Python backend exclusively
- ✅ Documentation complete
- ✅ No Firebase Functions dependencies in frontend
- ✅ Code cleanup complete

---

## Summary

**Total PRs**: 3

**PR Breakdown:**

1. **PR #21**: Backend Agent Migration to LangChain

   - Migrate from OpenAI direct calls to LangChain
   - Convert tools to LangChain format
   - Update orchestrator
   - Documentation

2. **PR #22**: Server-Sent Events Streaming

   - Add SSE support to FastAPI
   - Implement streaming in LangChain agent
   - Update frontend to consume SSE
   - Real-time UI updates

3. **PR #23**: Frontend Backend Integration
   - Remove Firebase Functions dependencies
   - Documentation
   - Code cleanup

**Key Benefits:**

- ✅ LangChain provides better tool management and extensibility
- ✅ Streaming gives real-time feedback (better UX)
- ✅ Python backend easier to maintain than Node.js Firebase Functions
- ✅ Centralized backend (all logic in one place)
- ✅ Better error handling and logging
- ✅ Easier to add new tools and features

**Architecture After Completion:**

```
Frontend (React)
    ↓ HTTP + SSE
Python Backend (FastAPI + LangChain)
    ↓ Tool Execution
Firebase (Firestore + Realtime DB)
    ↓ Real-time Sync
All Connected Users
```

**No Changes to Firebase Sync:**

- Frontend still listens to Firestore for object updates
- Realtime DB still handles cursors and positions
- Multi-user collaboration unchanged
- Only AI agent communication moves to backend

---

## Notes

- **Streaming is optional**: Keep non-streaming endpoint `/api/agent/chat` for backwards compatibility
- **Firebase Functions**: Don't delete immediately, keep for reference
- **Performance**: Monitor response times, aim for sub-5s for complex commands
- **Error Handling**: Ensure partial failures don't break entire flow
- **Documentation**: Keep docs updated as you go, not at the end
- **Reference**: See `api/langchain-examples.md` for LangChain API examples
