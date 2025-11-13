**PR #4: System Prompt & Few-Shot Examples**

This PR implements the comprehensive system prompt and few-shot examples for the agent.

---

## Task 4.1: Create Prompts Module

- [x] Create `app/agent/prompts.py`
- [x] Add module-level constants for SYSTEM_PROMPT and FEW_SHOT_EXAMPLES
- [x] Add comments explaining prompt engineering strategy

---

## Task 4.2: Write System Prompt - Header & Tools Section

- [x] Write system prompt opening (role definition)
- [x] Document all 5 available tools with brief descriptions
- [x] Explain tool capabilities (boxShadow, cornerRadius, etc.)
- [x] Keep tone instructional and clear
- [x] Include critical rules for multiple objects (from existing Firebase Functions)

Refer to TDD Section 6 for complete system prompt.

---

## Task 4.3: Write System Prompt - Design Principles

- [x] Add "Visual Design Principles" section
- [x] Document depth & shadows guidelines
- [x] Document corner radius guidelines
- [x] Document color palette with specific hex values
- [x] Document spacing rules
- [x] Document typography hierarchy
- [x] Document alignment principles

Refer to TDD Section 6 for all design principles.

---

## Task 4.4: Write System Prompt - Component Sizing

- [x] Add "Standard Component Sizing" section
- [x] Document input field dimensions
- [x] Document button dimensions
- [x] Document form container sizes
- [x] Document icon and avatar sizes
- [x] Document divider line sizes

---

## Task 4.5: Write System Prompt - Login Form Pattern

- [x] Add "Login Form Pattern" section with detailed 8-step component breakdown
- [x] Include exact sizing for each component
- [x] Include positioning calculations
- [x] Add spacing summary
- [x] Add complete position calculation example with concrete numbers
- [x] Include visual ASCII art layout (optional but helpful - skipped for initial refactor)

This is the most important section - refer to TDD Section 6 for complete details.

---

## Task 4.6: Write System Prompt - Other Patterns & Instructions

- [x] Add "Other Common Patterns" section (Button, Card, Profile Section)
- [x] Add "Instructions" section with step-by-step process
- [x] Emphasize metadata usage for semantic roles
- [x] Add note about making reasonable design decisions for ambiguous requests
- [x] Close with encouraging tone

---

## Task 4.7: Create Few-Shot Example - Login Form

- [x] Create complete few-shot example conversation
- [x] User message: "Create a login form"
- [x] Assistant message with 8 tool calls (all create_ functions)
- [x] Add tool response messages for all 8 calls
- [x] Final assistant summary message
- [x] Use Python dicts for all arguments (no json.dumps needed)
- [x] Verify all positions, sizes, colors match system prompt example

Refer to TDD Section 7 for complete few-shot example structure.

---

## Task 4.8: Testing & Refinement

- [x] Print complete system prompt to verify formatting
- [x] Count approximate token length of system prompt
- [x] Count approximate token length of few-shot examples
- [x] Verify structure of few-shot examples is valid
- [x] Test loading prompts module without errors
- [x] Document prompt token usage in comments

---

## Task 4.9: Documentation

- [x] Add comments explaining prompt engineering decisions
- [x] Document how to modify prompts for experimentation
- [x] Note where examples can be added
- [x] Add TODO comments for future pattern additions
- [x] Update README with prompt customization guidance (skipped - will add when needed)

---

**PR Acceptance Criteria:**
- [x] System prompt is comprehensive and well-structured
- [x] All design principles documented clearly
- [x] Login form pattern has complete step-by-step breakdown
- [x] Few-shot example is valid and matches system prompt
- [x] Prompts load without errors
- [x] Token usage documented
- [x] Clear instructions for future modifications

**PR #4 Status: ✅ COMPLETE**

---

# tasks-5.md

**PR #5: Agent Orchestrator & Tool Execution**

This PR implements the core agent logic that processes user messages and executes tools.

---

## Task 5.1: Create Agent Orchestrator Module

- [x] Create `app/agent/orchestrator.py`
- [x] Import OpenAI client, tools, prompts
- [x] Create `CanvasAgent` class
- [x] Initialize with cached tool definitions in __init__
- [x] Add docstring explaining agent's role

---

## Task 5.2: Implement Message Processing Method

- [x] Create `process_message()` async method
- [x] Accept parameters: user_message, session_id, optional model override
- [x] Build message array: [system_prompt, few_shot_examples, user_message]
- [x] Call OpenAI API with retry wrapper (from openai_service)
- [x] Pass tools to OpenAI API call
- [x] Extract response and tool calls
- [x] Return structured response dict

Example method signature:
```python
async def process_message(
    self,
    user_message: str,
    session_id: str,
    model: str = None
) -> Dict:
    """
    Process user message and return actions
    
    Returns:
        {
            "response": str,
            "actions": List[Dict],
            "toolCalls": int,
            "tokensUsed": int,
            "model": str
        }
    """
```

---

## Task 5.3: Tool Call Extraction

- [x] Extract tool_calls from OpenAI response
- [x] Handle case where no tool calls made
- [x] Parse each tool call: name, arguments
- [x] Validate arguments are valid JSON
- [x] Log each tool call for debugging
- [x] Handle malformed tool calls gracefully

---

## Task 5.4: Action Formatting

- [x] Convert tool calls to "actions" format for frontend
- [x] Each action: {"type": tool_name, "params": arguments_dict}
- [x] Store all actions in list
- [x] Handle tool execution errors (wrap in try/except)
- [x] Log action count

Example action structure from TDD Section 4.

---

## Task 5.5: Response Construction

- [x] Extract assistant's text response (message.content)
- [x] Default to helpful message if content is None
- [x] Count total tool calls
- [x] Extract token usage from response
- [x] Include model used in response
- [x] Return complete response dict

---

## Task 5.6: Error Handling

- [x] Wrap entire process_message in try/except
- [x] Handle OpenAI API errors (already retried by this point)
- [x] Handle invalid tool arguments
- [x] Handle missing required parameters
- [x] Return error response in consistent format
- [x] Log all errors with context

---

## Task 5.7: Testing Orchestrator Locally

- [x] Create test script `test_agent.py` in project root
- [x] Import CanvasAgent
- [x] Test with: "Create a login form"
- [x] Test with: "Create a 3x3 grid of circles"
- [x] Test with: "Create a button"
- [x] Print actions for each test case
- [x] Verify tool calls are logical and complete
- [x] No Firebase integration needed yet

---

## Task 5.8: Documentation

- [x] Add docstrings to all methods
- [x] Document return value structure
- [x] Add usage examples in comments
- [x] Document error handling approach
- [x] Update README with agent testing instructions

---

**PR Acceptance Criteria:**
- [x] Agent processes messages and returns valid responses
- [x] Tool calls extracted correctly from OpenAI response
- [x] Actions formatted correctly for frontend
- [x] Error handling covers common failure cases
- [x] Local testing script works without Firebase
- [x] Token usage and model tracked in response
- [x] Login form test produces 8-10 tool calls with correct structure

**PR #5 Status: ✅ COMPLETE**

---

# tasks-6.md

**PR #6: API Route & Request Handling**

This PR creates the single API endpoint and connects it to the agent.

---

## Task 6.1: Create Agent Route Module

- [x] Create `app/api/routes/agent.py`
- [x] Create APIRouter instance
- [x] Import CanvasAgent from orchestrator
- [x] Initialize agent instance (module level or per-request)
- [x] Add route docstrings

---

## Task 6.2: Define Request/Response Structures

- [x] Create `app/models/requests.py`
- [x] Define ChatRequest class/dict structure:
  - sessionId: str (required)
  - message: str (required)
  - model: str (optional)
- [x] Create `app/models/responses.py`
- [x] Define ChatResponse structure (matches agent response)
- [x] Define ErrorResponse structure
- [x] Add type hints

Example structures in TDD Section 4.

---

## Task 6.3: Implement POST /api/agent/chat Endpoint

- [x] Create POST endpoint handler
- [x] Accept ChatRequest body
- [x] Extract sessionId, message, optional model
- [x] Call agent.process_message()
- [x] Return agent response as JSON
- [x] Add appropriate HTTP status codes (200, 400, 500)

---

## Task 6.4: Request Validation

- [x] Validate sessionId is present and non-empty
- [x] Validate message is present and non-empty
- [x] Validate model (if provided) is in AVAILABLE_MODELS
- [x] Return 400 Bad Request for invalid input
- [x] Include helpful error messages

---

## Task 6.5: Error Handling

- [x] Wrap endpoint logic in try/except
- [x] Catch agent errors (OpenAI failures, etc.)
- [x] Return 500 Internal Server Error for unexpected errors
- [x] Return formatted error response
- [x] Log all errors with request context (sessionId, message excerpt)

---

## Task 6.6: Register Route in Main App

- [x] Import agent router in app/main.py
- [x] Register with prefix "/api/agent"
- [x] Add "agent" tag
- [x] Verify route shows up in auto-generated docs at /docs

---

## Task 6.7: Testing API Endpoint

- [x] Start FastAPI server locally
- [x] Test with curl: POST to /api/agent/chat
- [x] Test with valid login form request
- [x] Test with invalid request (missing sessionId)
- [x] Test with invalid model name
- [x] Verify responses match expected structure
- [x] Check logs for errors

Example curl command:
```bash
curl -X POST http://localhost:8000/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "test-123", "message": "Create a login form"}'
```

---

## Task 6.8: Documentation

- [x] Update README with API endpoint documentation
- [x] Document request/response formats
- [x] Add example curl commands
- [x] Document error responses
- [x] Add note about accessing interactive docs at /docs

---

**PR Acceptance Criteria:**
- [x] POST /api/agent/chat endpoint functional
- [x] Request validation working (rejects invalid input)
- [x] Agent responses returned correctly
- [x] Error handling covers common cases
- [x] Route registered and visible in /docs
- [x] curl tests pass successfully
- [x] Clear documentation of API usage

**PR #6 Status: ✅ COMPLETE**

---

# tasks-7.md

**PR #7: Firebase Integration**

This PR adds Firestore integration for persisting canvas objects.

---

## Task 7.1: Firebase Admin SDK Setup

- [x] Add firebase-admin to requirements.txt (should already be there)
- [x] Download Firebase service account key JSON
- [x] Save as `serviceAccountKey.json` in project root (gitignored)
- [x] Add FIREBASE_CREDENTIALS_PATH to .env
- [x] Update .env.example with Firebase variable

---

## Task 7.2: Create Firebase Service Module

- [x] Create `app/services/firebase_service.py`
- [x] Import firebase_admin and firestore
- [x] Create `initialize_firebase()` function
- [x] Load credentials from path in config
- [x] Initialize Firebase app
- [x] Get Firestore client instance
- [x] Handle initialization errors gracefully

---

## Task 7.3: Initialize Firebase on Startup

- [x] Import firebase_service in app/main.py
- [x] Call initialize_firebase() in startup event
- [x] Add try/except for initialization errors
- [x] Log successful initialization
- [x] Update health check to include Firebase status

---

## Task 7.4: Implement Firestore Write Function

- [x] Create `write_canvas_actions_to_firestore()` async function
- [x] Accept parameters: actions (removed session_id - not needed)
- [x] Get reference to /projects/shared-canvas/objects collection (matches frontend)
- [x] Use batch write for efficiency
- [x] For each action, create document with:
  - type: action type (without "create_" prefix)
  - params: action parameters
  - createdAt: SERVER_TIMESTAMP
- [x] Commit batch
- [x] Return success status with count

Refer to TDD Section 11 for Firestore structure and code example.

---

## Task 7.5: Integrate Firestore Writes into Agent

- [x] Import firebase_service in orchestrator.py
- [x] After actions generated, call write_canvas_actions_to_firestore()
- [x] Pass actions (removed session_id - not needed)
- [x] Handle Firestore write errors (log but don't fail request)
- [x] Add Firestore write status to response (optional)

---

## Task 7.6: Error Handling

- [x] Handle missing service account key file
- [x] Handle invalid credentials
- [x] Handle Firestore permission errors
- [x] Handle network errors during write
- [x] Log all Firebase errors with context
- [x] Ensure agent still returns response even if Firebase write fails

---

## Task 7.7: Testing Firestore Integration

- [x] Test agent with real requests (removed sessionId requirement)
- [x] Verify objects written to Firestore
- [x] Check Firestore console to see created documents
- [x] Test with multiple actions (login form)
- [x] Verify batch write commits all objects
- [x] Test error cases (Firebase not initialized, etc.)

---

## Task 7.8: Documentation

- [x] Document Firestore setup process in README
- [x] Explain how to get service account key
- [x] Document Firestore data structure
- [x] Add troubleshooting for common Firebase errors
- [x] Document how to view data in Firestore console

---

**PR Acceptance Criteria:**
- [x] Firebase Admin SDK initialized successfully
- [x] Firestore client accessible
- [x] Canvas actions written to Firestore correctly
- [x] Batch writes commit atomically
- [x] Error handling prevents crashes
- [x] Health check includes Firebase status
- [x] Documentation covers setup and troubleshooting
- [x] Can verify data in Firestore console after test

**PR #7 Status: ✅ COMPLETE**

**Key Changes:**
- Removed sessionId requirement (not needed - no conversation persistence)
- Firestore path matches frontend: `/projects/shared-canvas/objects`
- Simplified service account key template (only 6 required fields)
- Non-blocking Firebase initialization (graceful failure if not configured)
- Agent returns actions even if Firestore write fails

---

# tasks-8.md

**PR #8: Testing, Refinement & Documentation**

This PR focuses on comprehensive testing, performance measurement, and final documentation.

---

## Task 8.1: Create Comprehensive Test Suite

- [ ] Create `tests/` directory
- [ ] Create test for each tool definition (valid JSON)
- [ ] Create test for system prompt (loads without error)
- [ ] Create test for agent orchestrator (mock OpenAI response)
- [ ] Create test for API endpoint (mock agent)
- [ ] Use pytest or unittest

---

## Task 8.2: Integration Testing Script

- [ ] Create `integration_test.py` in project root
- [ ] Test complete flow: API request → agent → Firestore
- [ ] Test multiple UI patterns:
  - Login form
  - Button
  - 3x3 grid of circles
  - Card with title and text
- [ ] Log results for each test
- [ ] Measure and log token usage
- [ ] Measure and log response latency

---

## Task 8.3: Model Comparison Testing

- [ ] Create `compare_models.py` script
- [ ] Test same prompt with all 4 models:
  - gpt-4-turbo
  - gpt-4o
  - gpt-4o-mini
  - gpt-4
- [ ] Log for each model:
  - Tool calls generated
  - Token usage
  - Response time
  - Estimated cost
  - Quality assessment (manual review)
- [ ] Document findings in results file

Refer to TDD Section 9 for model comparison approach.

---

## Task 8.4: Performance Optimization

- [ ] Profile agent response time (identify bottlenecks)
- [ ] Verify tool definitions are cached (not recreated each request)
- [ ] Check for unnecessary async/await overhead
- [ ] Optimize Firestore batch writes if needed
- [ ] Measure baseline performance metrics

---

## Task 8.5: Error Handling Verification

- [ ] Test with invalid OpenAI API key (expect retry then error)
- [ ] Test with missing Firebase credentials (expect graceful failure)
- [ ] Test with malformed request body (expect 400)
- [ ] Test with OpenAI rate limit (expect retry then success or error)
- [ ] Verify all errors logged appropriately
- [ ] Verify error responses follow consistent format

---

## Task 8.6: Logging Enhancements

- [ ] Add request ID to all logs for tracing
- [ ] Log sessionId with all agent operations
- [ ] Log token usage for monitoring costs
- [ ] Add performance timing logs (start, end, duration)
- [ ] Ensure no sensitive data logged (API keys, etc.)

---

## Task 8.7: API Documentation Polish

- [ ] Verify OpenAPI docs at /docs are complete
- [ ] Add descriptions to all endpoints
- [ ] Add examples for request/response bodies
- [ ] Document all error codes
- [ ] Test interactive docs (try requests from /docs page)

---

## Task 8.8: README Completion

- [ ] Complete all sections of README
- [ ] Add architecture diagram (ASCII art or link to image)
- [ ] Document all environment variables
- [ ] Add setup instructions (step-by-step)
- [ ] Add testing instructions
- [ ] Add deployment notes (for future)
- [ ] Add troubleshooting section
- [ ] Add FAQ section

---

## Task 8.9: Code Quality

- [ ] Add type hints to all functions
- [ ] Add docstrings to all modules, classes, functions
- [ ] Remove any commented-out code
- [ ] Format code consistently (consider using black or ruff)
- [ ] Check for unused imports
- [ ] Verify all TODOs are documented or resolved

---

## Task 8.10: Final Testing

- [ ] Run full test suite
- [ ] Test with frontend Canvas app (if available)
- [ ] Verify login form renders correctly
- [ ] Test multiple concurrent requests
- [ ] Test long-running session with many requests
- [ ] Measure success rate (% of requests that work correctly)

---

## Task 8.11: Performance Metrics Documentation

- [ ] Document baseline metrics:
  - Average response time
  - Average token usage per request type
  - Tool call efficiency (calls per UI pattern)
  - Success rate
- [ ] Compare to old Firebase Functions implementation
- [ ] Document in README or separate METRICS.md file

---

## Task 8.12: Handoff Documentation

- [ ] Create DEPLOYMENT.md with deployment instructions (for future)
- [ ] Create CONTRIBUTING.md if others will contribute
- [ ] Document how to add new tools
- [ ] Document how to modify prompts
- [ ] Document how to add new UI patterns to few-shot examples
- [ ] Add contact info or support channels

---

**PR Acceptance Criteria:**
- All tests pass
- Integration tests successful for all UI patterns
- Model comparison results documented
- Performance metrics measured and documented
- Error handling verified for all edge cases
- API documentation complete and accurate
- README comprehensive with clear setup instructions
- Code quality high (type hints, docstrings, formatted)
- Frontend integration tested (if available)
- Handoff documentation complete

---

**END OF TASK FILES**

Each task file represents a complete PR that can be worked on independently (after dependencies are met). The tasks are granular with checkboxes for tracking progress.