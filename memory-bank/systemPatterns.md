# System Patterns: CollabCanvas

## Architecture Overview

CollabCanvas follows a client-side state management pattern with real-time synchronization via Firebase. The application uses React Context for state management, Konva.js for canvas rendering, and Firebase for backend services.

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
