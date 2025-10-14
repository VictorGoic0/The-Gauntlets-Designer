# CollabCanvas - Product Requirements Document

## Executive Summary

CollabCanvas is a real-time collaborative design tool inspired by Figma, enabling multiple users to design together on a shared canvas with live cursor tracking and instant synchronization. This MVP focuses on building rock-solid multiplayer infrastructure with basic shape manipulation.

**Project Timeline**: 7-day sprint with hard MVP checkpoint at 24 hours

---

## Product Vision

Build the foundational infrastructure for real-time collaborative design, proving that multiple users can create, edit, and manipulate design elements simultaneously without conflicts or performance degradation.

---

## Tech Stack

### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite (development and build)
- **Canvas Library**: Konva.js + react-konva
- **Deployment**: Netlify
- **Styling**: Tailwind CSS
- **UI Components**: Tailwind component library (shadcn/ui, Headless UI, or similar)
- **Design Priority**: Functionality over aesthetics for MVP

### Backend & Real-Time
- **Platform**: Firebase
  - **Firestore**: Real-time database for canvas state and object sync
  - **Firebase Auth**: User authentication
  - **Firebase Hosting**: Optional alternative to Netlify
- **Real-time Sync**: Firestore listeners (onSnapshot)

### Architecture Pattern
- **Client-side state management**: React hooks (useState + Context API when needed)
- **Sync strategy**: Optimistic updates with server reconciliation
- **Conflict resolution**: Last-write-wins (document choice in codebase)

---

## MVP Requirements (24-Hour Checkpoint)

### Core Functionality
✅ **Canvas Operations**
- Pan and zoom functionality
- Large workspace (doesn't need to be infinite, but spacious)

✅ **Shape Support**
- At least one shape type: rectangle, circle, OR text
- Create shapes on click/drag
- Move shapes via drag-and-drop

✅ **Real-Time Collaboration**
- Sync between 2+ users in real-time
- Multiplayer cursors with name labels
- Presence awareness (show who's online)

✅ **User System**
- User authentication (Firebase Auth)
- Users have accounts and display names

✅ **Deployment**
- Publicly accessible URL
- Works in multiple browsers simultaneously

### MVP Success Criteria
- Two users can see each other's cursors moving in real-time
- Creating/moving a shape appears instantly for both users
- Canvas state persists if users disconnect and reconnect
- No crashes or broken sync during basic usage

---

## Full Canvas Feature Requirements

### Canvas Features

**Workspace**
- Large canvas area with smooth pan (click-drag)
- Smooth zoom (scroll wheel or pinch)
- 30 FPS minimum during all interactions

**Supported Shapes**
- **Rectangles**: Solid fill colors
- **Circles**: Solid fill colors
- **Lines**: Solid stroke colors
- **Text Layers**: Basic formatting (font size, color)

**Object Transformations**
- Move: Click and drag
- Resize: Corner/edge handles
- Rotate: Rotation handle or input
- Lock aspect ratio option for resize

**Selection System**
- Single selection: Click object
- Multi-selection: Shift+click or drag-to-select box
- Visual selection indicators (bounding box, handles)

**Layer Management**
- Layer stack (z-index ordering)
- Bring forward / Send backward
- Delete selected objects (Delete/Backspace key)
- Duplicate selected objects (Cmd/Ctrl+D)

### Real-Time Collaboration Features

**Multiplayer Cursors**
- Show all connected users' cursor positions
- Update cursor position <50ms latency
- Display user name label near cursor
- Unique color per user
- Smooth cursor interpolation (no jittering)

**Live Object Sync**
- Object creation syncs across all users instantly
- Object modifications (move, resize, rotate, delete) sync in <100ms
- All users see identical canvas state

**Presence System**
- Show list of currently connected users
- Display user avatars/initials and names
- Show connection status (online/offline indicators)
- Handle graceful disconnects

**Conflict Resolution**
- **Strategy**: Last-write-wins
- Document this choice in README
- Prevent race conditions during simultaneous edits
- Lock mechanism optional but not required for MVP

**State Persistence**
- Canvas state saves to Firestore automatically
- All objects persist across sessions
- Users can leave and return to find their work intact
- Handle edge cases: all users disconnect simultaneously

---

## Performance Targets

### MVP Performance (30 FPS)
- ✅ 30 FPS during pan, zoom, and object manipulation
- ✅ Support 200+ simple objects without FPS drops
- ✅ Support 3+ concurrent users without degradation
- ✅ Cursor sync: <50ms latency
- ✅ Object sync: <100ms latency

### Stretch Performance (Post-MVP)
- 60 FPS target
- 500+ objects support
- 5+ concurrent users

---

## Testing Requirements

### Manual Testing Scenarios

**Scenario 1: Basic Collaboration**
1. Open app in two different browsers
2. Sign in as two different users
3. Verify both cursors are visible and synced
4. Create a shape in Browser A → appears in Browser B instantly
5. Move shape in Browser B → updates in Browser A instantly

**Scenario 2: State Persistence**
1. User A creates 3 shapes
2. User A refreshes the page mid-edit
3. Verify all 3 shapes still exist after reload
4. User B should still see all shapes without issues

**Scenario 3: Rapid Sync**
1. Two users create shapes rapidly (5+ shapes in 10 seconds)
2. Two users move the same shape simultaneously
3. Verify no shapes disappear, duplicate, or become unresponsive
4. Verify canvas stays in sync

**Scenario 4: Multi-user Stress Test**
1. Open app in 3-5 browser windows
2. All users create and move objects simultaneously
3. Monitor FPS (should stay above 30)
4. Verify no sync errors or state corruption

---

## Firebase Data Model

### Collections Structure

```
/projects/{projectId}
  - name: string
  - createdBy: userId
  - createdAt: timestamp
  - lastModified: timestamp

/projects/{projectId}/objects/{objectId}
  - type: 'rectangle' | 'circle' | 'line' | 'text'
  - x: number
  - y: number
  - width: number
  - height: number
  - rotation: number
  - fill: string (color)
  - stroke: string (color)
  - text: string (for text objects)
  - fontSize: number (for text objects)
  - zIndex: number
  - createdBy: userId
  - lastModifiedBy: userId
  - lastModified: timestamp

/projects/{projectId}/cursors/{userId}
  - x: number
  - y: number
  - userName: string
  - userColor: string
  - lastSeen: timestamp

/projects/{projectId}/presence/{userId}
  - userName: string
  - userEmail: string
  - userColor: string
  - isOnline: boolean
  - lastSeen: timestamp
```

### Firestore Rules
- Users can only edit projects they have access to
- All authenticated users can read/write to shared projects
- Cursor and presence data is ephemeral (auto-cleanup on disconnect)

---

## User Stories

### As a Designer (User A)
- I can create shapes on the canvas so that I can start designing
- I can move and resize shapes so that I can arrange my design
- I can see other designers' cursors so that I know where they're working
- I can see when others join or leave so that I know who's collaborating

### As a Collaborator (User B)
- I can join an existing project and see all existing shapes
- I can make edits that appear instantly for others
- I can see what User A is working on in real-time
- I can work on different parts of the canvas without conflicts

### As a Returning User
- I can reload the page and see my previous work
- I can leave and come back hours later to find the canvas unchanged
- I can see the current state even if all other users have disconnected

---

## Build Strategy & Timeline

### Phase 1: Foundation (Hours 0-8) - Priority: CRITICAL
**Goal**: Get multiplayer cursors syncing

- [ ] Set up React + Vite project
- [ ] Set up Firebase project (Auth + Firestore)
- [ ] Implement Firebase Auth (email/password or Google)
- [ ] Create basic canvas with Konva.js
- [ ] Implement cursor tracking locally
- [ ] Sync cursor positions to Firestore
- [ ] Display multiplayer cursors with names
- [ ] Deploy to Netlify

**Checkpoint**: Two cursors moving in real-time across two browsers

---

### Phase 2: Object Sync (Hours 8-16) - Priority: CRITICAL
**Goal**: Get shape creation and movement syncing

- [ ] Add rectangle creation to canvas
- [ ] Save rectangles to Firestore on creation
- [ ] Listen to Firestore and render remote rectangles
- [ ] Implement drag-to-move with Konva
- [ ] Update Firestore on object position changes
- [ ] Add optimistic updates (local changes instant)
- [ ] Handle create/update/delete operations

**Checkpoint**: Two users can create and move rectangles, both see updates

---

### Phase 3: MVP Feature Complete (Hours 16-24) - Priority: HIGH
**Goal**: Meet all MVP requirements

- [ ] Add presence system (who's online)
- [ ] Add pan and zoom controls
- [ ] Implement state persistence (reload test)
- [ ] Add basic conflict resolution (last-write-wins)
- [ ] Handle disconnects gracefully
- [ ] Performance testing (30 FPS check)
- [ ] Bug fixes and polish
- [ ] MVP deployment and testing

**Checkpoint**: Submit MVP - all hard requirements met

---

### Phase 4: Additional Shapes (Days 2-3) - Priority: MEDIUM
**Goal**: Support multiple shape types

- [ ] Add circle shape
- [ ] Add line/path shape
- [ ] Add text layers with basic formatting
- [ ] Implement shape-specific properties (stroke, fill)
- [ ] Test sync with mixed shape types

---

### Phase 5: Transformations (Days 3-4) - Priority: MEDIUM
**Goal**: Full object manipulation

- [ ] Add resize handles to shapes
- [ ] Add rotation handles
- [ ] Implement multi-select (Shift+click)
- [ ] Implement drag-to-select box
- [ ] Add delete and duplicate commands
- [ ] Add keyboard shortcuts

---

### Phase 6: Layer Management (Days 4-5) - Priority: LOW
**Goal**: Control object stacking

- [ ] Implement z-index/layer order
- [ ] Add "bring forward" / "send backward" controls
- [ ] Show layer list panel
- [ ] Allow reordering in layer panel
- [ ] Sync layer changes across users

---

### Phase 7: Polish & Performance (Days 5-7) - Priority: MEDIUM
**Goal**: Optimize and stabilize

- [ ] Optimize Firestore queries (use indexes)
- [ ] Implement cursor throttling (update every 50ms max)
- [ ] Add loading states and error handling
- [ ] Improve UX (tooltips, hints, onboarding)
- [ ] Stress test with 5 users and 200+ objects
- [ ] Fix any remaining bugs
- [ ] Final deployment and testing

---

## Known Risks & Mitigation

### Risk 1: Real-time sync is complex
**Mitigation**: Start simple with cursor sync first. Use Firestore's built-in real-time listeners. Test continuously with 2 browsers open.

### Risk 2: Performance degradation with many objects
**Mitigation**: Start with 30 FPS target instead of 60. Use Konva's layering and caching. Implement object culling (don't render off-screen objects).

### Risk 3: Race conditions during simultaneous edits
**Mitigation**: Accept last-write-wins for MVP. Document behavior. Consider operational transforms (OT) or CRDTs only if time permits.

### Risk 4: Firestore costs with high traffic
**Mitigation**: Throttle cursor updates. Use Firestore local cache. Monitor usage in Firebase console.

### Risk 5: Firebase connection drops
**Mitigation**: Implement reconnection logic. Show connection status to users. Queue updates locally and sync when reconnected.

---

## Questions to Resolve

- [ ] Specific color palette for UI and shapes?
- [ ] User authentication method: Email/password, Google, or both?
- [ ] Project sharing model: Single shared project or multiple projects per user?
- [ ] Do we need a landing page or go straight to canvas?

---

## Notes

- **Focus on multiplayer first**: A simple canvas with perfect sync beats a feature-rich canvas with broken collaboration
- **Test continuously**: Always have 2 browser windows open while developing
- **Deploy early**: Deploy after Phase 1 to catch deployment issues early
- **Document decisions**: Especially conflict resolution strategy
- **Performance monitoring**: Keep DevTools open, watch FPS counter