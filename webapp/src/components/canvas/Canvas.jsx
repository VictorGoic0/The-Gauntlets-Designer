import {
  useState,
  useEffect,
  useEffectEvent,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Stage, Layer, Rect } from "react-konva";
import { useAuth } from "../../hooks/useAuth";
import useCursorTracking from "../../hooks/useCursorTracking";
import useCursorSync from "../../hooks/useCursorSync";
import usePresence from "../../hooks/usePresence";
import usePresenceSync from "../../hooks/usePresenceSync";
import useSelectionTracking from "../../hooks/useSelectionTracking";
import useSelectionSync from "../../hooks/useSelectionSync";
import useObjectSync from "../../hooks/useObjectSync";
import useObjectPositions from "../../hooks/useObjectPositions";
import { useCanvasLocalOptimisticPrune } from "../../hooks/useCanvasLocalOptimisticPrune";
import useLocalStore from "../../stores/localStore";
import usePresenceStore from "../../stores/presenceStore";
import useFirestoreStore from "../../stores/firestoreStore";
import * as actions from "../../stores/actions";
import Cursor from "./Cursor";
import Rectangle from "./shapes/Rectangle";
import Circle from "./shapes/Circle";
import Text from "./shapes/Text";
import LoadingState from "./LoadingState";

export default function Canvas() {
  // Get canvas view state from Local Store (zoom, pan)
  const stagePosition = useLocalStore((state) => state.canvas.stagePosition);
  const stageScale = useLocalStore((state) => state.canvas.stageScale);
  const MIN_SCALE = useLocalStore((state) => state.canvas.MIN_SCALE);
  const MAX_SCALE = useLocalStore((state) => state.canvas.MAX_SCALE);
  const setStagePosition = useLocalStore((state) => state.setStagePosition);
  const setStageScale = useLocalStore((state) => state.setStageScale);

  // Get canvas mode state from Local Store (tool selection)
  const canvasMode = useLocalStore((state) => state.canvas.mode);

  // Get selection state from Local Store
  const selectedObjectIds = useLocalStore((state) => state.selection.selectedObjectIds);
  const clearSelection = useLocalStore((state) => state.clearSelection);
  const selectObject = useLocalStore((state) => state.selectObject);
  const isSelected = useLocalStore((state) => state.isSelected);
  
  // Get dragging state from Local Store
  const localObjectPositions = useLocalStore((state) => state.dragging.localObjectPositions);
  const draggingObjectId = useLocalStore((state) => state.dragging.draggingObjectId);
  
  // Get transform state from Local Store
  const localObjectTransforms = useLocalStore((state) => state.transforms.localObjectTransforms);
  const transformingObjectId = useLocalStore((state) => state.transforms.transformingObjectId);
  
  const { currentUser } = useAuth();

  const [stageSize, setStageSize] = useState({
    width: 0,
    height: 0,
  });

  // Local UI state
  const [isDragging, setIsDragging] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);

  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const dragStartPos = useRef({ x: 0, y: 0 });

  // Calculate container offset from viewport (for cursor positioning)
  const [containerOffset, setContainerOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateContainerOffset = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerOffset({ x: rect.left, y: rect.top });
      }
    };

    // Update on mount and window resize
    updateContainerOffset();
    window.addEventListener("resize", updateContainerOffset);
    
    return () => window.removeEventListener("resize", updateContainerOffset);
  }, []);

  // Cursor tracking and syncing
  useCursorTracking(true, stagePosition, stageScale, containerOffset);
  useCursorSync(); // Sets up Realtime DB listener, writes to Presence Store
  
  // Presence tracking
  usePresence(true);
  usePresenceSync(); // Sets up Realtime DB listener, writes to Presence Store
  
  // Selection tracking and syncing (PR #19)
  useSelectionTracking(); // Tracks current user's selection
  useSelectionSync(); // Syncs remote users' selections
  
  // Object position syncing (PR #18)
  useObjectPositions(); // Syncs object positions from Realtime DB
  
  // Read remote cursors from Presence Store
  const remoteCursors = usePresenceStore((state) => state.cursors.remoteCursors);
  
  // Read online users from Presence Store
  const onlineUsers = usePresenceStore((state) => state.presence.onlineUsers);
  
  // Read remote selections from Presence Store (PR #19)
  const remoteSelections = usePresenceStore((state) => state.selections.remoteSelections);
  
  // Read object positions from Presence Store (PR #18)
  const objectPositions = usePresenceStore((state) => state.objectPositions.data);
  
  // Only mark objects as "active" if they're CURRENTLY being manipulated
  // This prevents remote updates during the actual drag/transform
  // Local overlays can persist after the action ends without blocking remote updates
  const activeObjectIds = useMemo(() => {
    const active = {};
    if (draggingObjectId) {
      active[draggingObjectId] = true;
    }
    if (transformingObjectId) {
      active[transformingObjectId] = true;
    }
    return active;
  }, [draggingObjectId, transformingObjectId]);
  
  // Object syncing - sets up Firestore listener, writes to Firestore Store
  useObjectSync(activeObjectIds);
  
  // Read objects from Firestore Store (synced objects)
  const firestoreObjects = useFirestoreStore((state) => state.objects.sorted);
  const loading = useFirestoreStore((state) => state.objects.isLoading);
  
  // Read object positions loading state (PR #18)
  const objectPositionsLoading = usePresenceStore((state) => state.objectPositions.isLoading);
  
  // Read optimistic objects data from Local Store (not yet synced)
  // Return the data object itself to avoid recreating arrays
  const optimisticObjectsData = useLocalStore((state) => state.optimisticObjects.data);
  
  // Combine Firestore objects and optimistic objects
  // Then merge with Realtime DB positions (PR #18)
  const objects = useMemo(() => {
    const combined = [...firestoreObjects, ...Object.values(optimisticObjectsData)];
    
    // Merge: Realtime DB position overrides Firestore position
    // Priority: Realtime DB > Firestore
    // (Local overlays will be applied later during rendering)
    return combined.map((obj) => {
      const realtimePosition = objectPositions[obj.id];
      if (realtimePosition) {
        return {
          ...obj,
          x: realtimePosition.x,
          y: realtimePosition.y,
        };
      }
      return obj;
    });
  }, [firestoreObjects, optimisticObjectsData, objectPositions]);
  
  // Filter cursors to only show users who are in the presence list (online)
  // Then convert from canvas coordinates to screen coordinates for rendering
  const visibleCursors = useMemo(() => {
    return remoteCursors
      .filter((cursor) => {
        return onlineUsers.some((user) => user.userId === cursor.userId);
      })
      .map((cursor) => ({
        ...cursor,
        // Convert canvas coordinates to screen coordinates
        x: cursor.x * stageScale + stagePosition.x,
        y: cursor.y * stageScale + stagePosition.y,
      }));
  }, [remoteCursors, onlineUsers, stageScale, stagePosition]);

  // Get remote selectors for each object (PR #19)
  // Maps objectId -> array of users who have selected it
  const getRemoteSelectors = useCallback((objectId) => {
    return remoteSelections
      .filter((selection) => selection.objectId === objectId)
      .filter((selection) => selection.userId !== currentUser?.uid) // Exclude current user
      .map((selection) => ({
        userId: selection.userId,
        userName: selection.userName,
        userColor: selection.userColor,
      }));
  }, [remoteSelections, currentUser]);

  // Canvas dimensions (logical canvas size)
  const CANVAS_WIDTH = 5000;
  const CANVAS_HEIGHT = 5000;

  // Delete selected objects from Firestore
  const deleteSelectedObjects = useCallback(async () => {
    // Delete all selected objects using central action (includes optimistic updates)
    await actions.deleteObjects(selectedObjectIds, currentUser);
    
    // Clear local state for deleted objects using store actions
    selectedObjectIds.forEach((id) => {
      useLocalStore.getState().clearLocalObjectPosition(id);
      useLocalStore.getState().clearLocalObjectTransform(id);
    });
  }, [selectedObjectIds, currentUser]);

  useCanvasLocalOptimisticPrune(objects, draggingObjectId, transformingObjectId);

  // Update stage size based on container dimensions
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const onCanvasKeyDown = useEffectEvent((event) => {
    const isTyping =
      event.target.tagName === "INPUT" ||
      event.target.tagName === "TEXTAREA" ||
      event.target.isContentEditable;

    if (isTyping) return;

    if (event.code === "Space" && !event.repeat) {
      event.preventDefault();
      setSpacePressed(true);
    }

    if (event.code === "Backspace" && selectedObjectIds.length > 0) {
      event.preventDefault();
      void deleteSelectedObjects();
    }

    if (event.code === "Escape" && selectedObjectIds.length > 0) {
      event.preventDefault();
      clearSelection();
    }
  });

  const onCanvasKeyUp = useEffectEvent((event) => {
    const isTyping =
      event.target.tagName === "INPUT" ||
      event.target.tagName === "TEXTAREA" ||
      event.target.isContentEditable;

    if (isTyping) return;

    if (event.code === "Space") {
      event.preventDefault();
      setSpacePressed(false);
      setIsDragging(false);
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", onCanvasKeyDown);
    window.addEventListener("keyup", onCanvasKeyUp);
    return () => {
      window.removeEventListener("keydown", onCanvasKeyDown);
      window.removeEventListener("keyup", onCanvasKeyUp);
    };
  }, []);

  // Handle drag start - use central action
  const handleObjectDragStart = (objectId) => {
    actions.startDrag(objectId);
  };

  // Handle drag move - use central action
  const handleObjectDragMove = (objectId, newPosition, objectSize) => {
    void actions.moveObject(objectId, newPosition, objectSize);
  };

  // Handle drag end - use central action
  const handleObjectDragEnd = async (objectId, newPosition, objectSize) => {
    await actions.finishDrag(objectId, newPosition, objectSize, currentUser);
  };

  // Handle transform (resize/rotate) - use central action
  const handleObjectTransform = (objectId, transformData) => {
    actions.transformObject(objectId, transformData);
  };

  // Handle transform end - use central action
  const handleObjectTransformEnd = async (objectId, transformData) => {
    await actions.finishTransform(objectId, transformData, currentUser);
  };

  // Mouse event handlers for panning and shape creation
  const handleMouseDown = (event) => {
    const isMiddleButton = event.evt.button === 1;

    // Check if clicking on the stage background or the dark background rect
    const clickedOnEmpty =
      event.target === event.target.getStage() ||
      event.target.name() === "background";
    
    if (clickedOnEmpty) {
      // Clear selection when clicking on empty space
      clearSelection();
      
      // Handle shape creation
      if ((canvasMode === "rectangle" || canvasMode === "circle" || canvasMode === "text") && 
          currentUser && !spacePressed && !isMiddleButton) {
        const stage = stageRef.current;
        const pointerPos = stage.getPointerPosition();
        
        // Convert screen coordinates to canvas coordinates
        const canvasX = (pointerPos.x - stagePosition.x) / stageScale;
        const canvasY = (pointerPos.y - stagePosition.y) / stageScale;
        
        // Use central action for shape creation (includes optimistic updates)
        void actions.createShape(canvasX, canvasY, canvasMode, currentUser);
        return;
      }
    }
    
    if (spacePressed || isMiddleButton) {
      event.evt.preventDefault();
      setIsDragging(true);
      
      const stage = stageRef.current;
      const pointerPos = stage.getPointerPosition();
      
      dragStartPos.current = {
        x: pointerPos.x - stagePosition.x,
        y: pointerPos.y - stagePosition.y,
      };
    }
  };

  const handleMouseMove = () => {
    if (!isDragging) return;

    const stage = stageRef.current;
    const pointerPos = stage.getPointerPosition();

    setStagePosition({
      x: pointerPos.x - dragStartPos.current.x,
      y: pointerPos.y - dragStartPos.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom handler - zoom toward cursor position
  const handleWheel = (event) => {
    event.evt.preventDefault();

    const stage = stageRef.current;
    const oldScale = stageScale;
    const pointer = stage.getPointerPosition();

    // Calculate new scale based on wheel direction
    const scaleBy = 1.1;
    const direction = event.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    // Clamp scale between min and max
    const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

    // Calculate mouse position relative to stage before zoom
    const mousePointTo = {
      x: (pointer.x - stagePosition.x) / oldScale,
      y: (pointer.y - stagePosition.y) / oldScale,
    };

    // Calculate new position to keep zoom centered on cursor
    const newPosition = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    setStageScale(clampedScale);
    setStagePosition(newPosition);
  };

  function renderRemoteCursor(cursor) {
    return (
      <Cursor
        key={cursor.userId}
        x={cursor.x}
        y={cursor.y}
        userName={cursor.userName}
        userColor={cursor.userColor}
      />
    );
  }

  function renderCanvasObject(obj) {
    const localTransform = localObjectTransforms[obj.id];
    const position = localTransform
      ? { x: localTransform.x, y: localTransform.y }
      : localObjectPositions[obj.id] || { x: obj.x, y: obj.y };
    const isObjectBeingDragged = draggingObjectId === obj.id;

    const mergedProps = localTransform ? { ...obj, ...localTransform } : obj;

    const safeX = position.x ?? 0;
    const safeY = position.y ?? 0;
    const safeRotation = mergedProps.rotation ?? 0;

    const onSelectShape = () => selectObject(obj.id);
    const onDragStartShape = () => handleObjectDragStart(obj.id);
    const onTransformShape = (transformData) =>
      handleObjectTransform(obj.id, transformData);
    const onTransformEndShape = (transformData) =>
      handleObjectTransformEnd(obj.id, transformData);

    if (obj.type === "rectangle") {
      const onDragMoveRectangle = (newPos) =>
        handleObjectDragMove(obj.id, newPos, {
          width: obj.width,
          height: obj.height,
        });
      const onDragEndRectangle = (newPos) =>
        handleObjectDragEnd(obj.id, newPos, {
          width: obj.width,
          height: obj.height,
        });

      return (
        <Rectangle
          key={obj.id}
          shapeProps={{
            x: safeX,
            y: safeY,
            width: mergedProps.width ?? 100,
            height: mergedProps.height ?? 100,
            fill: mergedProps.fill ?? "#3b82f6",
            rotation: safeRotation,
            opacity: isObjectBeingDragged ? 0.6 : 1,
          }}
          isSelected={isSelected(obj.id)}
          remoteSelectors={getRemoteSelectors(obj.id)}
          onSelect={onSelectShape}
          onDragStart={onDragStartShape}
          onDragMove={onDragMoveRectangle}
          onDragEnd={onDragEndRectangle}
          onTransform={onTransformShape}
          onTransformEnd={onTransformEndShape}
          canvasWidth={CANVAS_WIDTH}
          canvasHeight={CANVAS_HEIGHT}
        />
      );
    }

    if (obj.type === "circle") {
      const onDragMoveCircle = (newPos) =>
        handleObjectDragMove(obj.id, newPos, { radius: obj.radius });
      const onDragEndCircle = (newPos) =>
        handleObjectDragEnd(obj.id, newPos, { radius: obj.radius });

      return (
        <Circle
          key={obj.id}
          shapeProps={{
            x: safeX,
            y: safeY,
            radius: mergedProps.radius ?? 50,
            fill: mergedProps.fill ?? "#3b82f6",
            rotation: safeRotation,
            opacity: isObjectBeingDragged ? 0.6 : 1,
          }}
          isSelected={isSelected(obj.id)}
          remoteSelectors={getRemoteSelectors(obj.id)}
          onSelect={onSelectShape}
          onDragStart={onDragStartShape}
          onDragMove={onDragMoveCircle}
          onDragEnd={onDragEndCircle}
          onTransform={onTransformShape}
          onTransformEnd={onTransformEndShape}
          canvasWidth={CANVAS_WIDTH}
          canvasHeight={CANVAS_HEIGHT}
        />
      );
    }

    if (obj.type === "text") {
      const onDragMoveText = (newPos) =>
        handleObjectDragMove(obj.id, newPos, {
          width: obj.width || 200,
          height: 50,
        });
      const onDragEndText = (newPos) =>
        handleObjectDragEnd(obj.id, newPos, {
          width: obj.width || 200,
          height: 50,
        });
      const onTextContentChange = (newText) =>
        actions.updateText(obj.id, newText, currentUser);

      return (
        <Text
          key={obj.id}
          shapeProps={{
            x: safeX,
            y: safeY,
            text: mergedProps.text ?? "Double-click to edit",
            fontSize: mergedProps.fontSize ?? 16,
            fontFamily: mergedProps.fontFamily ?? "Arial",
            width: mergedProps.width ?? 200,
            fill: mergedProps.fill ?? "#000000",
            rotation: safeRotation,
            opacity: isObjectBeingDragged ? 0.6 : 1,
          }}
          isSelected={isSelected(obj.id)}
          remoteSelectors={getRemoteSelectors(obj.id)}
          onSelect={onSelectShape}
          onDragStart={onDragStartShape}
          onDragMove={onDragMoveText}
          onDragEnd={onDragEndText}
          onTransform={onTransformShape}
          onTransformEnd={onTransformEndShape}
          onTextChange={onTextContentChange}
          canvasWidth={CANVAS_WIDTH}
          canvasHeight={CANVAS_HEIGHT}
        />
      );
    }

    return null;
  }

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden bg-gray-900"
      style={{ cursor: spacePressed || isDragging ? 'grab' : 'default' }}
    >
      {stageSize.width > 0 && (
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          x={stagePosition.x}
          y={stagePosition.y}
          scaleX={stageScale}
          scaleY={stageScale}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          className="bg-gray-900"
        >
          <Layer>
            {/* Dark background rectangle covering the logical canvas */}
            <Rect
              x={0}
              y={0}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              fill="#1a1a1a"
              name="background"
            />
            
            {/* Render all canvas objects - wait for both Firestore and Realtime DB positions (PR #18) */}
            {!loading &&
              !objectPositionsLoading &&
              objects.map(renderCanvasObject)}
          </Layer>
        </Stage>
      )}

      {/* Loading state overlay - wait for both Firestore and Realtime DB (PR #18) */}
      {(loading || objectPositionsLoading) && <LoadingState />}

      {/* Cursor overlay - HTML elements for simplicity */}
      {/* Only show cursors for users who are currently present/online */}
      {visibleCursors.map(renderRemoteCursor)}
    </div>
  );
}

