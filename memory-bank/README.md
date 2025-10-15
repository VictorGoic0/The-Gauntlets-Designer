# Memory Bank - CollabCanvas Figma Clone

This memory bank contains comprehensive documentation about the CollabCanvas project (Figma Clone built during "The Gauntlet" Week 1).

## Contents

### Core Documentation

1. **[01-project-overview.md](01-project-overview.md)**

   - Project description and goals
   - Timeline and current status
   - MVP requirements and completion status
   - Key features (completed, in progress, planned)

2. **[02-tech-stack.md](02-tech-stack.md)**

   - Complete list of technologies used
   - Frontend framework (React + Vite)
   - Canvas library (Konva)
   - Backend services (Firebase)
   - Testing tools (Vitest)
   - Deployment platform (Netlify)

3. **[03-architecture.md](03-architecture.md)**

   - System architecture overview
   - Component structure
   - Custom hooks
   - State management strategy
   - Real-time sync patterns
   - Performance optimizations
   - Security model

4. **[04-firebase-data-model.md](04-firebase-data-model.md)**
   - Firestore collections structure
   - Realtime Database structure
   - Data sync patterns
   - Security rules (Firestore & Realtime DB)
   - Conflict resolution strategy
   - Performance considerations

### Implementation Details

5. **[05-implementation-status.md](05-implementation-status.md)**

   - Detailed PR-by-PR progress
   - Completed features
   - In-progress work
   - Testing status
   - Known gaps
   - Git branch status

6. **[06-key-patterns-and-decisions.md](06-key-patterns-and-decisions.md)**
   - Critical design decisions
   - Single shared canvas model
   - Optimistic updates pattern
   - Last-write-wins conflict resolution
   - Optimistic deletion priority
   - Cursor throttling strategy
   - Code organization patterns
   - Performance patterns

### Testing & Deployment

7. **[07-testing-strategy.md](07-testing-strategy.md)**

   - Testing philosophy
   - Testing stack
   - Test coverage status
   - Manual testing scenarios
   - Mocking strategies
   - Testing challenges and solutions
   - Future improvements

8. **[08-deployment-and-environment.md](08-deployment-and-environment.md)**
   - Development environment setup
   - Production deployment (Netlify)
   - Firebase configuration
   - Environment variables
   - Troubleshooting guide
   - Performance optimization plans
   - Scaling considerations

### Issues & Planning

9. **[09-known-issues-and-todos.md](09-known-issues-and-todos.md)**
   - Current known issues (high/medium/low priority)
   - Technical debt
   - Bugs to investigate
   - TODOs from tasks.md
   - Performance optimizations needed
   - Security improvements needed
   - Documentation gaps

## Quick Reference

### Project Status

- **Current Branch**: `victor.PR-8` (State Persistence & Reconnection)
- **MVP Status**: ✅ ALL REQUIREMENTS MET
- **Deployed**: ✅ Netlify setup complete

### Key Technologies

- React 19.1.1 + Vite 7.1.7
- Konva.js 10.0.2 + react-konva 19.0.10
- Firebase 12.4.0 (Auth, Firestore, Realtime Database)
- Tailwind CSS 4.1.14
- Vitest 3.2.4

### Performance Targets

- ✅ 30 FPS during all interactions
- ✅ <50ms perceived cursor latency
- ✅ <100ms object sync latency
- ✅ 200+ objects without FPS drops
- ✅ 3+ concurrent users supported

### Critical Features

- ✅ Google Sign-In authentication
- ✅ 5,000 x 5,000 pixel canvas
- ✅ Pan and zoom
- ✅ Real-time cursor tracking
- ✅ Rectangle creation and movement
- ✅ Multiplayer sync
- ✅ Presence system
- 🚧 Offline mode (in progress)

## How to Use This Memory Bank

### For Development

1. Start with **01-project-overview.md** to understand the project
2. Review **03-architecture.md** to understand the system design
3. Check **05-implementation-status.md** for current progress
4. Reference **04-firebase-data-model.md** when working with data

### For Debugging

1. Check **09-known-issues-and-todos.md** for known problems
2. Review **08-deployment-and-environment.md** for troubleshooting
3. Reference **07-testing-strategy.md** for testing approaches

### For Planning

1. Review **05-implementation-status.md** for completed work
2. Check **09-known-issues-and-todos.md** for TODOs
3. Reference **01-project-overview.md** for roadmap

### For Onboarding

Read in order:

1. 01-project-overview.md
2. 02-tech-stack.md
3. 03-architecture.md
4. 05-implementation-status.md
5. 08-deployment-and-environment.md

## Keeping This Updated

This memory bank is a **snapshot** created on 2025-10-15 at the state of PR #8.

When updating:

- Update **05-implementation-status.md** after completing PRs
- Update **09-known-issues-and-todos.md** when discovering issues or completing TODOs
- Update **03-architecture.md** when making architectural changes
- Update **06-key-patterns-and-decisions.md** when making significant design decisions

## Related Files

This memory bank complements other project documentation:

- `README.md` - Setup and deployment instructions
- `PRD.md` - Product requirements document
- `tasks.md` - Detailed PR breakdown and implementation tasks
- `DEPLOYMENT.md` - Netlify deployment guide
- `architecture.mermaid` - Visual system architecture diagram
