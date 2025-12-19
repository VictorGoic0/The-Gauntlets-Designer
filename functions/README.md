# Firebase Functions - DEPRECATED

⚠️ **This directory contains deprecated Firebase Functions code.**

## Migration Status

As of **PR #22**, the AI agent has been fully migrated to the FastAPI backend with the following improvements:

- ✅ **LangChain Integration** (PR #21): Better tool management and extensibility
- ✅ **Server-Sent Events Streaming** (PR #22): Real-time tool execution updates
- ✅ **Improved Performance**: Faster response times and better error handling
- ✅ **Better Developer Experience**: Easier to test and iterate locally

## New Backend Location

The AI agent is now implemented in:

- **Backend**: `/api` directory (FastAPI + LangChain)
- **Endpoint**: `POST /api/agent/chat-stream` (streaming) or `POST /api/agent/chat` (non-streaming)
- **Documentation**: See `/api/README.md`

## Why This Was Deprecated

1. **Limited Streaming Support**: Firebase Functions don't support Server-Sent Events well
2. **Slow Iteration**: 5-10 minute deploy times vs instant local testing
3. **Limited Tooling**: LangChain provides better tool management
4. **Cost**: FastAPI backend is more cost-effective for development

## Migration Notes

### Differences Between Firebase Functions and FastAPI Backend

| Feature             | Firebase Functions            | FastAPI Backend                      |
| ------------------- | ----------------------------- | ------------------------------------ |
| **Tool Format**     | OpenAI function schemas       | LangChain `@tool` decorator          |
| **Streaming**       | Not supported                 | SSE streaming with real-time updates |
| **System Prompt**   | Inline in function            | Separate `prompts.py` module         |
| **Tool Names**      | camelCase                     | snake_case (Python convention)       |
| **Response Format** | `{success, message, results}` | `{response, actions, toolCalls}`     |
| **Deployment**      | 5-10 minutes                  | Instant (local)                      |

### Frontend Changes

The frontend (`webapp/src/services/aiService.js`) now uses:

- `executeAICommandStream()` for streaming (recommended)
- `executeAICommand()` for non-streaming (legacy support)

Both point to the FastAPI backend, not Firebase Functions.

## Keeping This Code

This code is kept for:

1. **Reference**: Understanding the original implementation
2. **Backwards Compatibility**: In case rollback is needed
3. **Documentation**: Showing the evolution of the system

## Removal Plan

This directory can be safely removed once:

1. FastAPI backend is fully tested in production
2. All team members are familiar with the new system
3. No rollback concerns remain

## Questions?

See the main project README or `/api/README.md` for current documentation.
