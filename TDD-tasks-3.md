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

---

## PR #21: Backend Agent Migration to LangChain

**Goal**: Migrate AI agent from Firebase Functions to Python FastAPI backend with LangChain integration

**Dependencies**: None (can start immediately)

---

### Task 21.1: Install LangChain Dependencies

**Description**: Add LangChain and related packages to Python backend

- [ ] Add to `api/requirements.txt`:
  ```
  langchain==0.1.0
  langchain-openai==0.0.2
  langchain-community==0.0.10
  ```
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Verify imports work in Python REPL
- [ ] Document LangChain version choices in comments

**Files Modified:**

- `api/requirements.txt`

**Acceptance Criteria:**

- LangChain packages install without conflicts
- No version conflicts with existing packages (openai, fastapi, etc.)

---

### Task 21.2: Create LangChain Tool Definitions

**Description**: Convert existing tool definitions to LangChain format

**Current Tools** (from `functions/tools.js`):

1. `createRectangle` - Create rectangle with position, size, fill, stroke, etc.
2. `createCircle` - Create circle with position, radius, fill, stroke
3. `createText` - Create text with position, content, fontSize, fill
4. `moveObject` - Move object to new position
5. `resizeObject` - Resize object (width/height or radius)
6. `changeColor` - Change object fill color
7. `rotateObject` - Rotate object by degrees

**Implementation:**

- [ ] Create `api/app/agent/langchain_tools.py`
- [ ] Import LangChain tool decorators: `from langchain.tools import tool`
- [ ] Define each tool as a Python function with `@tool` decorator
- [ ] Add comprehensive docstrings (LangChain uses these for prompts)
- [ ] Include parameter types and descriptions
- [ ] Add Firebase Admin SDK imports for Firestore writes
- [ ] Implement tool execution logic (write to Firestore + Realtime DB)
- [ ] Add error handling for each tool
- [ ] Return structured results: `{"success": bool, "objectId": str, "message": str}`

**Example Structure:**

```python
from langchain.tools import tool
from typing import Optional
from firebase_admin import firestore, db as realtime_db
import logging

logger = logging.getLogger(__name__)

@tool
def create_rectangle(
    x: float,
    y: float,
    width: float = 100,
    height: float = 100,
    fill: str = "#3B82F6",
    stroke: Optional[str] = None,
    strokeWidth: float = 0,
    cornerRadius: float = 0,
    rotation: float = 0,
    userId: str = None
) -> dict:
    """
    Create a rectangle on the canvas.

    Use this tool to create rectangular shapes for containers, buttons, input fields,
    cards, dividers, or any rectangular UI elements.

    Args:
        x: X position on canvas (0-5000)
        y: Y position on canvas (0-5000)
        width: Width in pixels (default: 100)
        height: Height in pixels (default: 100)
        fill: Fill color as hex (default: #3B82F6 blue)
        stroke: Stroke color as hex (optional)
        strokeWidth: Stroke width in pixels (default: 0)
        cornerRadius: Corner radius in pixels (default: 0)
        rotation: Rotation in degrees (default: 0)
        userId: ID of user creating the object

    Returns:
        dict: {"success": bool, "objectId": str, "message": str}
    """
    try:
        # Write to Firestore
        db = firestore.client()
        doc_ref = db.collection("projects").document("shared-canvas").collection("objects").add({
            "type": "rectangle",
            "x": x,
            "y": y,
            "width": width,
            "height": height,
            "fill": fill,
            "stroke": stroke,
            "strokeWidth": strokeWidth,
            "cornerRadius": cornerRadius,
            "rotation": rotation,
            "createdBy": userId,
            "createdAt": firestore.SERVER_TIMESTAMP,
            "lastEditedBy": userId,
            "lastEditedAt": firestore.SERVER_TIMESTAMP,
            "zIndex": 1
        })

        object_id = doc_ref[1].id

        # Write position to Realtime DB
        rtdb = realtime_db.reference()
        rtdb.child(f"objectPositions/{object_id}").set({
            "x": x,
            "y": y,
            "timestamp": {".sv": "timestamp"}
        })

        logger.info(f"Created rectangle {object_id} at ({x}, {y})")

        return {
            "success": True,
            "objectId": object_id,
            "message": f"Created rectangle at ({x}, {y})"
        }

    except Exception as e:
        logger.error(f"Error creating rectangle: {e}")
        return {
            "success": False,
            "objectId": None,
            "message": f"Failed to create rectangle: {str(e)}"
        }
```

- [ ] Implement all 7 tools following this pattern
- [ ] Add helper function to get tool list: `def get_langchain_tools() -> list`

**Files Created:**

- `api/app/agent/langchain_tools.py`

**Acceptance Criteria:**

- All 7 tools defined with `@tool` decorator
- Comprehensive docstrings for each tool
- Tools write to both Firestore and Realtime DB
- Error handling returns structured results

---

### Task 21.3: Migrate System Prompt to LangChain

**Description**: Convert system prompt from Node.js to Python with LangChain format

**Current Prompt Location**: `functions/index.js` (system message content)

**Implementation:**

- [ ] Review existing system prompt in `functions/index.js`
- [ ] Update `api/app/agent/prompts.py` to include LangChain-specific instructions
- [ ] Add instructions for tool usage with LangChain
- [ ] Keep design principles, sizing guidelines, and patterns
- [ ] Add note about returning structured tool results
- [ ] Update few-shot examples to use LangChain tool call format
- [ ] Test prompt token count (should be similar to current ~2000 tokens)

**Key Changes:**

- LangChain uses function calling under the hood (similar to current approach)
- Tool results are automatically formatted by LangChain
- May need to adjust prompt for LangChain's tool execution flow

**Files Modified:**

- `api/app/agent/prompts.py`

**Acceptance Criteria:**

- System prompt maintains all design principles
- Few-shot examples updated for LangChain format
- Prompt is clear about tool usage patterns
- Token count remains reasonable (<3000 tokens)

---

### Task 21.4: Create LangChain Agent Orchestrator

**Description**: Replace OpenAI direct calls with LangChain agent

**Current Implementation**: `api/app/agent/orchestrator.py` uses OpenAI SDK directly

**Implementation:**

- [ ] Import LangChain components:
  ```python
  from langchain_openai import ChatOpenAI
  from langchain.agents import AgentExecutor, create_openai_functions_agent
  from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
  from langchain.schema import SystemMessage, HumanMessage
  ```
- [ ] Update `CanvasAgent.__init__()`:
  - Initialize `ChatOpenAI` model
  - Load LangChain tools from `langchain_tools.py`
  - Create agent with `create_openai_functions_agent()`
  - Create `AgentExecutor` with tools
- [ ] Update `process_message()` method:
  - Build prompt with system message + few-shot examples + user message
  - Execute agent with `agent_executor.invoke()`
  - Extract tool calls and results from agent output
  - Format response for frontend (maintain existing structure)
- [ ] Add streaming support (Task 21.5 will implement fully)
- [ ] Maintain existing error handling
- [ ] Keep response format consistent: `{"response": str, "actions": list, "toolCalls": int, ...}`

**Example Structure:**

```python
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from app.agent.langchain_tools import get_langchain_tools
from app.agent.prompts import SYSTEM_PROMPT, FEW_SHOT_EXAMPLES
from app.config import settings

class CanvasAgent:
    def __init__(self):
        # Initialize LangChain model
        self.llm = ChatOpenAI(
            model=settings.DEFAULT_MODEL,
            temperature=0,
            openai_api_key=settings.OPENAI_API_KEY
        )

        # Load tools
        self.tools = get_langchain_tools()

        # Create prompt template
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", SYSTEM_PROMPT),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad")
        ])

        # Create agent
        self.agent = create_openai_functions_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=self.prompt
        )

        # Create executor
        self.agent_executor = AgentExecutor(
            agent=self.agent,
            tools=self.tools,
            verbose=True,
            return_intermediate_steps=True
        )

    async def process_message(self, user_message: str, user_id: str, model: str = None) -> dict:
        """Process user message with LangChain agent"""
        try:
            # Override model if specified
            if model:
                self.llm.model_name = model

            # Inject userId into tool context (for Firebase writes)
            # LangChain doesn't natively support this, so we'll use a workaround
            # Store userId in a context variable that tools can access

            # Execute agent
            result = await self.agent_executor.ainvoke({
                "input": user_message,
                "chat_history": []  # Add few-shot examples here if needed
            })

            # Extract actions from intermediate steps
            actions = []
            for step in result.get("intermediate_steps", []):
                tool_name = step[0].tool
                tool_input = step[0].tool_input
                tool_output = step[1]

                # Format action for frontend
                actions.append({
                    "type": tool_name.replace("create_", "").replace("_", ""),
                    "params": tool_input,
                    "result": tool_output
                })

            # Build response
            return {
                "response": result.get("output", ""),
                "actions": actions,
                "toolCalls": len(actions),
                "tokensUsed": 0,  # LangChain doesn't expose this easily
                "model": self.llm.model_name
            }

        except Exception as e:
            logger.error(f"Error processing message: {e}", exc_info=True)
            return {
                "response": f"Error: {str(e)}",
                "actions": [],
                "toolCalls": 0,
                "tokensUsed": 0,
                "model": model or settings.DEFAULT_MODEL,
                "error": {"type": type(e).__name__, "message": str(e)}
            }
```

- [ ] Implement full orchestrator with LangChain
- [ ] Handle userId injection for Firebase writes (context variable or tool kwargs)
- [ ] Maintain response format compatibility with frontend
- [ ] Add logging for debugging
- [ ] Test with existing API endpoint

**Files Modified:**

- `api/app/agent/orchestrator.py`

**Acceptance Criteria:**

- LangChain agent executes tools correctly
- Response format matches existing frontend expectations
- Error handling maintains existing behavior
- Logging provides visibility into agent execution

---

### Task 21.5: Add Streaming Support (Preparation)

**Description**: Prepare orchestrator for streaming (full implementation in PR #22)

- [ ] Add `stream_message()` method to `CanvasAgent` (stub for now)
- [ ] Research LangChain streaming APIs: `astream()` and `astream_events()`
- [ ] Document streaming approach in comments
- [ ] Plan how to emit events for each tool execution
- [ ] Consider using `callbacks` parameter in LangChain for streaming

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

- [ ] Review `api/app/api/routes/agent.py`
- [ ] Verify request/response structures still match
- [ ] Update any LangChain-specific error handling
- [ ] Test endpoint with curl/Postman
- [ ] Verify Firebase writes still work correctly

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

- [ ] Update `api/README.md` with LangChain usage
- [ ] Document tool definitions and how to add new tools
- [ ] Add comments explaining LangChain agent flow
- [ ] Update deployment docs (if needed)
- [ ] Remove old OpenAI direct call code (if fully replaced)
- [ ] Update environment variable docs

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

- [ ] Install SSE library: `pip install sse-starlette`
- [ ] Add to `api/requirements.txt`
- [ ] Import in route: `from sse_starlette.sse import EventSourceResponse`
- [ ] Research FastAPI SSE best practices
- [ ] Test basic SSE endpoint (hello world)

**Example Basic SSE Endpoint:**

```python
from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse
import asyncio

@router.get("/stream-test")
async def stream_test():
    async def event_generator():
        for i in range(5):
            yield {
                "event": "message",
                "data": f"Count: {i}"
            }
            await asyncio.sleep(1)

    return EventSourceResponse(event_generator())
```

- [ ] Create test endpoint `/api/agent/stream-test`
- [ ] Test with curl: `curl -N http://localhost:8000/api/agent/stream-test`
- [ ] Verify events stream correctly

**Files Modified:**

- `api/requirements.txt`
- `api/app/api/routes/agent.py`

**Acceptance Criteria:**

- `sse-starlette` installed
- Basic SSE endpoint works
- Events stream to client correctly
- No CORS issues (CORS already configured)

---

### Task 22.2: Implement Streaming in LangChain Agent

**Description**: Use LangChain's streaming APIs to emit events during tool execution

**LangChain Streaming Approach:**

- Use `astream_events()` method on agent executor
- Subscribe to events: `on_tool_start`, `on_tool_end`, `on_agent_action`, etc.
- Emit SSE events for each tool execution

**Implementation:**

- [ ] Update `CanvasAgent.stream_message()` method
- [ ] Use `agent_executor.astream_events()` instead of `ainvoke()`
- [ ] Filter for tool execution events
- [ ] Emit SSE event for each tool start/end
- [ ] Include tool name, arguments, and result in each event
- [ ] Handle errors during streaming
- [ ] Emit final completion event

**Example Structure:**

```python
async def stream_message(self, user_message: str, user_id: str, model: str = None):
    """Stream agent execution with real-time tool updates"""
    try:
        if model:
            self.llm.model_name = model

        # Stream events from agent
        async for event in self.agent_executor.astream_events(
            {"input": user_message, "chat_history": []},
            version="v1"
        ):
            kind = event["event"]

            # Tool execution started
            if kind == "on_tool_start":
                tool_name = event["name"]
                tool_input = event["data"].get("input")

                yield {
                    "event": "tool_start",
                    "data": {
                        "tool": tool_name,
                        "input": tool_input
                    }
                }

            # Tool execution completed
            elif kind == "on_tool_end":
                tool_name = event["name"]
                tool_output = event["data"].get("output")

                yield {
                    "event": "tool_end",
                    "data": {
                        "tool": tool_name,
                        "output": tool_output
                    }
                }

            # Agent finished
            elif kind == "on_chain_end":
                final_output = event["data"].get("output")

                yield {
                    "event": "complete",
                    "data": {
                        "response": final_output.get("output", ""),
                        "totalTools": len(final_output.get("intermediate_steps", []))
                    }
                }

    except Exception as e:
        logger.error(f"Error streaming message: {e}", exc_info=True)
        yield {
            "event": "error",
            "data": {
                "error": str(e)
            }
        }
```

- [ ] Implement streaming method
- [ ] Test with simple command: "Create a rectangle"
- [ ] Test with multi-tool command: "Create 5 circles"
- [ ] Verify events emit in correct order
- [ ] Handle streaming errors gracefully

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

- [ ] Create new route: `POST /api/agent/chat-stream`
- [ ] Accept same request format as `/api/agent/chat`
- [ ] Call `agent.stream_message()` instead of `process_message()`
- [ ] Wrap in `EventSourceResponse`
- [ ] Format events as SSE (event: type, data: JSON)
- [ ] Add error handling for streaming failures
- [ ] Test with curl: `curl -N -X POST http://localhost:8000/api/agent/chat-stream -H "Content-Type: application/json" -d '{"message": "Create 3 circles"}'`

**Example Endpoint:**

```python
@router.post(
    "/chat-stream",
    summary="Stream AI agent responses in real-time",
    description="Process user message and stream tool executions as they happen"
)
async def chat_stream(request: ChatRequest):
    """
    Streaming endpoint for AI agent interactions.

    Returns Server-Sent Events (SSE) with:
    - tool_start: When a tool begins execution
    - tool_end: When a tool completes execution
    - complete: When agent finishes all work
    - error: If an error occurs
    """
    # Validate request
    if not request.message or not request.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="message is required and cannot be empty"
        )

    # Stream events
    async def event_generator():
        try:
            async for event in agent.stream_message(
                user_message=request.message,
                model=request.model
            ):
                # Format as SSE
                yield {
                    "event": event["event"],
                    "data": json.dumps(event["data"])
                }
        except Exception as e:
            logger.error(f"Streaming error: {e}", exc_info=True)
            yield {
                "event": "error",
                "data": json.dumps({"error": str(e)})
            }

    return EventSourceResponse(event_generator())
```

- [ ] Implement streaming endpoint
- [ ] Test with curl
- [ ] Verify events stream correctly
- [ ] Test error handling

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

**New Implementation**: Use `EventSource` API for SSE

- [ ] Create new function: `executeAICommandStream(command, onEvent, onComplete, onError)`
- [ ] Use native `EventSource` API (no library needed)
- [ ] Handle different event types: `tool_start`, `tool_end`, `complete`, `error`
- [ ] Call callbacks for each event
- [ ] Close EventSource on completion or error
- [ ] Add authentication headers (if needed)

**Example Implementation:**

```javascript
/**
 * Execute AI command with streaming updates
 * @param {string} command - Natural language command
 * @param {Function} onToolStart - Callback when tool starts: (toolName, input) => void
 * @param {Function} onToolEnd - Callback when tool ends: (toolName, output) => void
 * @param {Function} onComplete - Callback when agent finishes: (response, totalTools) => void
 * @param {Function} onError - Callback on error: (error) => void
 * @returns {Function} Cleanup function to close the stream
 */
export function executeAICommandStream(
  command,
  onToolStart,
  onToolEnd,
  onComplete,
  onError
) {
  if (!command || command.trim().length === 0) {
    onError(new Error("Command cannot be empty"));
    return () => {};
  }

  // Use fetch with streaming instead of EventSource for POST requests
  const controller = new AbortController();

  fetch(`${API_BASE_URL}/api/agent/chat-stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: command.trim() }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));

            // Handle different event types
            if (line.includes("event: tool_start")) {
              onToolStart(data.tool, data.input);
            } else if (line.includes("event: tool_end")) {
              onToolEnd(data.tool, data.output);
            } else if (line.includes("event: complete")) {
              onComplete(data.response, data.totalTools);
            } else if (line.includes("event: error")) {
              onError(new Error(data.error));
            }
          }
        }
      }
    })
    .catch((error) => {
      if (error.name !== "AbortError") {
        onError(error);
      }
    });

  // Return cleanup function
  return () => controller.abort();
}
```

- [ ] Implement streaming function
- [ ] Update `AIPanel.jsx` to use streaming
- [ ] Show real-time progress as tools execute
- [ ] Display loading state for each tool
- [ ] Handle errors during streaming
- [ ] Test with various commands

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

- [ ] Add state for tracking tool execution progress
- [ ] Display list of tools being executed
- [ ] Show status for each tool: pending → executing → complete/error
- [ ] Add visual indicators (icons, colors, animations)
- [ ] Show tool names in user-friendly format
- [ ] Display final summary when complete
- [ ] Handle errors for individual tools (partial success)

**Example UI Structure:**

```jsx
{
  isStreaming && (
    <div className="tool-progress">
      <h4>Executing...</h4>
      {toolProgress.map((tool, index) => (
        <div key={index} className="tool-item">
          <span className={`status-icon ${tool.status}`}>
            {tool.status === "executing" && "⏳"}
            {tool.status === "complete" && "✅"}
            {tool.status === "error" && "❌"}
          </span>
          <span className="tool-name">{tool.name}</span>
          {tool.status === "error" && (
            <span className="error-message">{tool.error}</span>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] Implement streaming UI
- [ ] Add animations for tool execution
- [ ] Style with design system tokens
- [ ] Test with multi-tool commands
- [ ] Handle edge cases (all tools fail, partial success)

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

- [ ] Add deprecation notice to `functions/index.js`
- [ ] Update `functions/README.md` with migration notes
- [ ] Document differences between Firebase Functions and FastAPI versions
- [ ] Keep Firebase Functions code for reference (don't delete yet)
- [ ] Add comment: "Deprecated: Use FastAPI backend at /api/agent/chat-stream"
- [ ] Update frontend to use FastAPI by default
- [ ] Add environment variable to toggle between backends (for testing)

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

### Task 22.7: Testing & Performance Validation

**Description**: Comprehensive testing of streaming implementation

**Test Cases:**

1. **Single Tool Execution**

   - Command: "Create a red rectangle"
   - Verify: 1 tool_start event, 1 tool_end event, 1 complete event
   - Verify: Object appears in Firestore

2. **Multiple Tools (Sequential)**

   - Command: "Create 5 blue circles in a row"
   - Verify: 5 tool_start events, 5 tool_end events in order
   - Verify: All 5 objects appear in Firestore

3. **Complex Command**

   - Command: "Create a login form"
   - Verify: Multiple tool events (7-10 tools)
   - Verify: All objects positioned correctly

4. **Error Handling**

   - Command: "Create a rectangle at position -100, -100"
   - Verify: Error event emitted
   - Verify: Frontend shows error message

5. **Network Interruption**

   - Start streaming command
   - Disconnect network mid-stream
   - Verify: Frontend handles disconnect gracefully

---

### Task 22.7: Documentation & Cleanup

**Description**: Document streaming implementation and clean up

- [ ] Update `api/README.md` with streaming endpoint docs
- [ ] Add SSE event format documentation
- [ ] Document frontend streaming usage
- [ ] Add examples for both streaming and non-streaming endpoints
- [ ] Update API docs at `/docs` (FastAPI auto-docs)
- [ ] Add troubleshooting section for streaming issues
- [ ] Document browser compatibility (EventSource support)

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

- [ ] Add to `webapp/.env.example`:
  ```
  VITE_API_BASE_URL=http://localhost:8000
  ```
- [ ] Add to `webapp/.env.local`:
  ```
  VITE_API_BASE_URL=http://localhost:8000
  ```
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
- **Testing**: Test each PR independently before merging
- **Performance**: Monitor response times, aim for sub-5s for complex commands
- **Error Handling**: Ensure partial failures don't break entire flow
- **Documentation**: Keep docs updated as you go, not at the end
