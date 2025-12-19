# Project Brief: CollabCanvas

## Project Overview

CollabCanvas is a real-time collaborative design tool inspired by Figma, enabling multiple users to design together on a shared canvas with live cursor tracking and instant synchronization. This is a 7-day sprint project with a hard MVP checkpoint at 24 hours.

## Core Requirements

- **Real-time collaboration**: Multiple users can create, edit, and manipulate design elements simultaneously
- **Live cursor tracking**: Show all connected users' cursor positions with <50ms perceived latency
- **Presence system**: Display who's currently online and connected
- **Shape manipulation**: Create, move, resize, and delete shapes (rectangles, circles, text)
- **State persistence**: Canvas state persists across page reloads and disconnects
- **Authentication**: Google Sign-In only for MVP
- **AI Agent**: FastAPI backend with OpenAI integration for generating UI components from natural language

## Success Criteria

- Two users can see each other's cursors moving in real-time
- Creating/moving a shape appears instantly for both users
- Canvas state persists if users disconnect and reconnect
- No crashes or broken sync during basic usage
- 30 FPS minimum during all interactions
- Support 200+ simple objects without FPS drops
- Support 3+ concurrent users without degradation

## Technical Constraints

- **Canvas dimensions**: 5,000 x 5,000 pixels
- **Single shared canvas**: Hardcoded project ID 'shared-canvas' accessible to all authenticated users
- **Conflict resolution**: Last-write-wins with optimistic deletion (deletes take priority)
- **Cursor throttle**: 45ms updates (~22 updates/second) with interpolation for <50ms perceived latency
- **Performance target**: 30 FPS minimum, <100ms object sync latency

## Project Timeline

- **Phase 1 (Hours 0-8)**: Foundation - Get multiplayer cursors syncing
- **Phase 2 (Hours 8-16)**: Object Sync - Get shape creation and movement syncing
- **Phase 3 (Hours 16-24)**: MVP Feature Complete - Meet all MVP requirements
- **Phase 4-7 (Days 2-7)**: Additional shapes, transformations, layer management, polish

## Current Status

The project is currently in **Phase 3** with MVP features largely complete. All core functionality is implemented and working:

- ✅ Google Sign-In authentication
- ✅ Real-time cursor tracking with user colors
- ✅ Presence system with onDisconnect cleanup
- ✅ Rectangle creation, selection, and drag/move with real-time sync
- ✅ Pan and zoom controls
- ✅ Delete with Backspace key
- ✅ State persistence across sessions
- ✅ Netlify deployment configuration
- ✅ Optimistic updates with conflict resolution

## AI Agent Migration ✅ **COMPLETE**

**Objective**: Migrate Canvas AI agent from Firebase Functions (JavaScript) to FastAPI backend (Python) for faster iteration and better LLM code generation.

**Status**: ✅ **All 8 PRs Complete** - Migration fully implemented with comprehensive testing, documentation, and performance monitoring.

**Completed State**:
- ✅ FastAPI backend with OpenAI agent (PR #1, #2)
- ✅ Local development/testing environment (PR #1)
- ✅ Enhanced tool set with visual styling options (boxShadow, cornerRadius, metadata) (PR #3)
- ✅ Comprehensive system prompt with few-shot examples (PR #4)
- ✅ Firestore integration for Canvas state persistence (PR #7)
- ✅ Support for multiple OpenAI models (gpt-4-turbo, gpt-4o, gpt-4o-mini, gpt-4) (PR #2)
- ✅ Comprehensive test suite with pytest (PR #8)
- ✅ Integration testing scripts (PR #8)
- ✅ Model comparison tools (PR #8)
- ✅ Performance monitoring and logging enhancements (PR #8)
- ✅ Complete documentation (PR #8)
