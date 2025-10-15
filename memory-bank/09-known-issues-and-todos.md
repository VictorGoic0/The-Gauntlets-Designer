# Known Issues and TODOs

## Current Known Issues

### High Priority 🔴

#### 1. Test Coverage Gaps

**Issue**: Many unit and integration tests not yet implemented.

**Affected Areas:**

- Object sync hook tests
- Rectangle creation tests
- Selection logic tests
- Presence hook tests
- Firestore utils tests
- Coordinate transformation tests
- Drag behavior integration tests

**Impact**: Can't verify behavior changes, risk of regressions

**Solution**: Implement missing tests as listed in `tasks.md` PR sections

---

#### 2. Some Cursor Tests Failing

**Issue**: Cursor tracking and sync tests may be failing.

**Status**: Marked as completed in tasks.md but need verification

**Impact**: Can't be confident cursor logic is correct

**Solution**:

1. Run `npm test` and identify failing tests
2. Fix test mocks for Firebase Realtime Database
3. Verify throttling logic
4. Ensure onDisconnect mocks work correctly

---

#### 3. Offline Mode Not Implemented

**Issue**: PR #8 in progress but offline queue logic not yet complete.

**Missing:**

- Queue updates when offline
- Sync queued updates when reconnected
- Firestore offline persistence enabled

**Impact**: App may fail or lose data when network disconnects

**Solution**: Complete PR #8 tasks

---

#### 4. No Connection Status Indicator

**Issue**: Users can't see if they're connected or disconnected.

**Missing:**

- ConnectionStatus component
- Listen to Firestore connection state
- Display indicator in UI

**Impact**: Poor UX when connection issues occur

**Solution**: Create ConnectionStatus.jsx and integrate into Header

---

#### 5. No Loading State

**Issue**: Canvas loads without showing loading indicator.

**Missing:**

- LoadingState component
- Show spinner while loading initial data

**Impact**: Users see blank canvas briefly, confusing

**Solution**: Create LoadingState.jsx and show while objects are loading

---

### Medium Priority 🟡

#### 6. No Error Handling

**Issue**: Failed Firestore operations don't show user-facing errors.

**Current Behavior:** Errors logged to console only

**Impact**: Users don't know if their actions succeeded

**Solution:**

1. Add error boundary for React errors
2. Add toast notifications for Firestore errors
3. Add retry logic for transient failures

---

#### 7. No Keyboard Shortcuts (Except Delete)

**Issue**: Delete key works, but other shortcuts missing.

**Missing:**

- Escape: deselect all
- Cmd/Ctrl+D: duplicate
- Cmd/Ctrl+Z: undo
- Arrow keys: move object

**Impact**: Less efficient workflow for power users

**Solution**: Add keyboard event listeners in Canvas component

---

#### 8. Selection State Not Synced

**Issue**: Selection is local only, not visible to other users.

**Design Decision**: Intentional for MVP (reduces sync complexity)

**Impact**: Users can't see what others are editing

**Future Solution**: Add selection sync to presence data

---

#### 9. No Concurrent Edit Indicators

**Issue**: Multiple users can edit same object without knowing.

**Current Behavior:** Last-write-wins silently

**Impact**: One user's work can be overwritten without warning

**Future Solution:** Add visual indicator "User X is editing this"

---

#### 10. No Undo/Redo

**Issue**: Can't undo accidental changes or deletes.

**Current Behavior:** All changes are permanent

**Impact**: Accidental deletes are frustrating

**Future Solution:** Implement undo buffer (command pattern)

---

### Low Priority 🟢

#### 11. Only One Shape Type

**Issue**: Only rectangles implemented.

**Planned:** Circles, text, lines (PR #10)

**Impact**: Limited design capabilities

**Solution:** Complete PR #10 and beyond

---

#### 12. No Resize/Rotate

**Issue**: Can only move objects, not resize or rotate.

**Planned:** PR #11

**Impact**: Can't fully design with shapes

**Solution:** Complete PR #11

---

#### 13. No Multi-Select

**Issue**: Can only select one object at a time.

**Planned:** PR #11

**Impact**: Can't move multiple objects together

**Solution:** Add Shift+click and drag-to-select box

---

#### 14. No Layer Management

**Issue**: Can't reorder object stacking.

**Planned:** PR #6 (later tasks)

**Impact**: Objects can be obscured by others

**Solution:** Add bring forward/send backward controls

---

#### 15. No Analytics or Monitoring

**Issue**: Can't track errors or usage in production.

**Missing:**

- Error tracking (Sentry, LogRocket)
- Analytics (Google Analytics, Mixpanel)
- Performance monitoring

**Impact**: Can't diagnose production issues

**Future Solution:** Add monitoring service

---

#### 16. No Rate Limiting

**Issue**: Users could spam Firestore with writes.

**Current Protection:** Firebase quota limits only

**Impact:** Potential abuse, quota exhaustion

**Future Solution:** Implement client-side rate limiting

---

#### 17. Single Shared Canvas Only

**Issue**: No multi-project support.

**Design Decision:** Intentional for MVP

**Impact:** All users share one canvas, no isolation

**Future Solution:** Add project collection and per-project permissions

---

## Technical Debt

### 1. Mock Firebase Everywhere in Tests

**Issue:** Firebase mocked globally in `src/test/setup.js`

**Problem:** Hard to test different Firebase behaviors

**Better Approach:** Mock per-test for more control

---

### 2. No TypeScript

**Issue:** JavaScript only, no type safety

**Impact:** Easy to introduce type errors

**Future:** Consider migrating to TypeScript

---

### 3. Console.log for Debugging

**Issue:** Many console.logs in production code

**Better Approach:** Use proper logging library with levels

---

### 4. Hardcoded Project ID

**Issue:** `'shared-canvas'` hardcoded throughout codebase

**Impact:** Hard to add multi-project support later

**Better Approach:** Use constant or context

---

### 5. No CI/CD Pipeline

**Issue:** Tests not run automatically on push

**Impact:** Can merge broken code

**Future:** Set up GitHub Actions for automated testing

---

## Bugs to Investigate

### 1. Cursor Jitter at High Zoom

**Reported:** Possible jitter when zoomed in very far

**Status:** Not confirmed

**Priority:** Low (if it exists)

---

### 2. Object Position Drift

**Reported:** Objects may drift slightly after many moves

**Possible Cause:** Coordinate transformation rounding errors

**Status:** Not confirmed

**Priority:** Medium (if confirmed)

---

### 3. Memory Leak with Many Objects

**Reported:** Possible memory increase with 200+ objects

**Status:** Not tested

**Priority:** Medium

---

## TODOs from Tasks.md

### PR #8: State Persistence & Reconnection (Current)

- [ ] Verify Firestore persistence (objects persist when all users disconnect)
- [ ] Create LoadingState component
- [ ] Create ConnectionStatus component
- [ ] Implement offline queue in useObjectSync
- [ ] Add reconnection logic verification
- [ ] Test state persistence scenarios
- [ ] Write unit tests for offline queue
- [ ] Write unit tests for connection status
- [ ] Write integration tests for state persistence

### PR #10: Circle & Text Shapes (Next)

- [ ] Create Circle component
- [ ] Create Text component
- [ ] Update Toolbar with Circle and Text buttons
- [ ] Update Canvas to handle all shape types
- [ ] Add shape-specific properties to Firestore

### PR #11: Resize & Rotate Transformations

- [ ] Create TransformWrapper component with Konva Transformer
- [ ] Add transform handlers to shapes
- [ ] Update object data structure (rotation, scaleX, scaleY)
- [ ] Handle rotation sync
- [ ] Handle resize sync
- [ ] Add keyboard shortcuts (Delete, Escape)
- [ ] Write tests for transformations

### Future PRs

- Multi-select (Shift+click, drag-to-select box)
- Layer management (z-index, bring forward/send backward)
- Duplicate objects (Cmd/Ctrl+D)
- Undo/Redo
- Object locking
- Multi-project support
- User permissions
- Performance optimizations

---

## Performance Optimizations Needed

### Short-Term

1. Add object culling (don't render off-screen objects)
2. Use React.memo for expensive components
3. Use useMemo/useCallback for expensive computations
4. Add Konva layer caching

### Long-Term

1. Implement virtual scrolling for large object lists
2. Optimize Firestore queries with indexes
3. Add service worker for offline support
4. Implement lazy loading for large canvases

---

## Security Improvements Needed

### Short-Term

1. Add client-side validation before Firestore writes
2. Add rate limiting for cursor updates
3. Sanitize user input (user names, text objects)

### Long-Term

1. More granular Firestore security rules
2. Server-side validation (Cloud Functions)
3. Audit logging for sensitive operations
4. Per-project permissions

---

## Documentation Gaps

### Code Documentation

- [ ] Add JSDoc comments to complex functions
- [ ] Document hook usage with examples
- [ ] Add architecture diagrams to README

### User Documentation

- [ ] Add user guide (how to use the app)
- [ ] Add FAQ
- [ ] Add troubleshooting guide
- [ ] Add keyboard shortcuts reference

### Developer Documentation

- [ ] Add contributing guide
- [ ] Add development setup guide (more detail)
- [ ] Add Firebase setup walkthrough
- [ ] Add testing guide
