import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Stage, Layer, Rect } from "react-konva";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useCanvas } from "../../hooks/useCanvas";
import { useAuth } from "../../hooks/useAuth";
import useCursorTracking from "../../hooks/useCursorTracking";
import useCursorSync from "../../hooks/useCursorSync";
import usePresence from "../../hooks/usePresence";
import usePresenceSync from "../../hooks/usePresenceSync";
import useObjectSync from "../../hooks/useObjectSync";
import useLocalStore from "../../stores/localStore";
import * as actions from "../../stores/actions";
import Cursor from "./Cursor";
import Rectangle from "./shapes/Rectangle";
import Circle from "./shapes/Circle";
import Text from "./shapes/Text";
import LoadingState from "./LoadingState";
import { createRectangle, createCircle, createText } from "../../utils/objectUtils";
import { updateObject, deleteObjects } from "../../utils/firestoreUtils";

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

  // Cursor tracking and syncing
  useCursorTracking(true);
  const remoteCursors = useCursorSync();
  
  // Presence tracking
  usePresence(true);
  const onlineUsers = usePresenceSync();
  
  // Local state for object transforms during resize/rotate (optimistic updates)
  const [localObjectTransforms, setLocalObjectTransforms] = useState({});
  
  // Track which object is currently being transformed for visual feedback
  const [_transformingObjectId, setTransformingObjectId] = useState(null);
  
  // Combine dragging and transforming objects to prevent remote updates during user actions
  // Use useMemo to create stable reference that only changes when actual IDs change
  const activeObjectIds = useMemo(() => {
    return {
      ...localObjectPositions,
      ...Object.keys(localObjectTransforms).reduce((acc, id) => {
        acc[id] = true;
        return acc;
      }, {}),
    };
  }, [localObjectPositions, localObjectTransforms]);
  
  // Object syncing (pass active objects to prevent remote updates during drag/transform)
  const { objects, loading } = useObjectSync(activeObjectIds);
  
  // Filter cursors to only show users who are in the presence list (online)
  const visibleCursors = remoteCursors.filter((cursor) => {
    return onlineUsers.some((user) => user.userId === cursor.userId);
  });

  // Canvas dimensions (logical canvas size)
  const CANVAS_WIDTH = 5000;
  const CANVAS_HEIGHT = 5000;

  // Delete selected objects from Firestore
  const deleteSelectedObjects = useCallback(async () => {
    // Delete all selected objects using utility function
    await deleteObjects(selectedObjectIds);
    
    // Clear local state for deleted objects using store actions
    selectedObjectIds.forEach((id) => {
      useLocalStore.getState().clearLocalObjectPosition(id);
    });
    
    setLocalObjectTransforms((prev) => {
      const updated = { ...prev };
      selectedObjectIds.forEach((id) => {
        delete updated[id];
      });
      return updated;
    });
    
    // Clear selection
    clearSelection();
  }, [selectedObjectIds, clearSelection]);

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

  // Clear local positions when remote updates match
  // Clean up local positions for deleted objects and when remote matches
  useEffect(() => {
    const existingObjectIds = new Set(objects.map((obj) => obj.id));
    const store = useLocalStore.getState();
    const currentLocalPositions = store.dragging.localObjectPositions;
    
    Object.keys(currentLocalPositions).forEach((objectId) => {
      // If object was deleted remotely, remove local position
      if (!existingObjectIds.has(objectId)) {
        store.clearLocalObjectPosition(objectId);
        return;
      }
      
      // If object exists and not being dragged, check if remote matches
      const remoteObject = objects.find(obj => obj.id === objectId);
      if (remoteObject) {
        const localPos = currentLocalPositions[objectId];
        // If remote position matches local (within 1px tolerance), clear local
        if (
          Math.abs(remoteObject.x - localPos.x) < 1 &&
          Math.abs(remoteObject.y - localPos.y) < 1
        ) {
          store.clearLocalObjectPosition(objectId);
        }
      }
    });
  }, [objects]);

  // Clean up local transforms for deleted objects and when remote matches
  useEffect(() => {
    const existingObjectIds = new Set(objects.map((obj) => obj.id));
    
    setLocalObjectTransforms((prev) => {
      const updated = { ...prev };
      let changed = false;
      
      Object.keys(prev).forEach((objectId) => {
        // If object was deleted remotely, remove local transform
        if (!existingObjectIds.has(objectId)) {
          delete updated[objectId];
          changed = true;
          return;
        }
        
        // If object exists, check if remote transform matches local (within tolerance)
        const remoteObject = objects.find(obj => obj.id === objectId);
        if (remoteObject) {
          const localTransform = prev[objectId];
          // Check if remote transform matches local (within tolerance)
          let matches = true;
          
          // Check position
          if (localTransform.x !== undefined && Math.abs(remoteObject.x - localTransform.x) >= 1) {
            matches = false;
          }
          if (localTransform.y !== undefined && Math.abs(remoteObject.y - localTransform.y) >= 1) {
            matches = false;
          }
          
          // Check dimensions (1px tolerance)
          if (localTransform.width !== undefined && Math.abs((remoteObject.width || 0) - localTransform.width) >= 1) {
            matches = false;
          }
          if (localTransform.height !== undefined && Math.abs((remoteObject.height || 0) - localTransform.height) >= 1) {
            matches = false;
          }
          if (localTransform.radius !== undefined && Math.abs((remoteObject.radius || 0) - localTransform.radius) >= 1) {
            matches = false;
          }
          if (localTransform.fontSize !== undefined && Math.abs((remoteObject.fontSize || 16) - localTransform.fontSize) >= 0.5) {
            matches = false;
          }
          
          // Check rotation (0.5 degree tolerance)
          if (localTransform.rotation !== undefined && Math.abs((remoteObject.rotation || 0) - localTransform.rotation) >= 0.5) {
            matches = false;
          }
          
          if (matches) {
            delete updated[objectId];
            changed = true;
          }
        }
      });
      
      return changed ? updated : prev;
    });
  }, [objects]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setSpacePressed(true);
      }
      
      // Delete selected objects on Backspace
      if (e.code === "Backspace" && selectedObjectIds.length > 0) {
        e.preventDefault();
        deleteSelectedObjects();
      }
      
      // Deselect all on Escape
      if (e.code === "Escape" && selectedObjectIds.length > 0) {
        e.preventDefault();
        clearSelection();
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        setSpacePressed(false);
        setIsDragging(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [selectedObjectIds, deleteSelectedObjects, clearSelection]);

  // Create shape on canvas and sync to Firestore
  const createShapeOnCanvas = async (x, y, shapeType) => {
    let shapeData;
    
    switch (shapeType) {
      case "rectangle":
        shapeData = createRectangle(x, y, currentUser.uid);
        break;
      case "circle":
        shapeData = createCircle(x, y, currentUser.uid);
        break;
      case "text":
        shapeData = createText(x, y, currentUser.uid);
        break;
      default:
        return;
    }
    
    // Write to Firestore - useObjectSync will handle the real-time update
    await addDoc(
      collection(db, "projects", "shared-canvas", "objects"),
      shapeData
    );
  };

  // Handle drag start - use central action
  const handleObjectDragStart = (objectId) => {
    actions.startDrag(objectId);
  };

  // Handle drag move - use central action
  const handleObjectDragMove = (objectId, newPosition, objectSize) => {
    actions.moveObject(objectId, newPosition, objectSize);
  };

  // Handle drag end - use central action
  const handleObjectDragEnd = async (objectId, newPosition, objectSize) => {
    await actions.finishDrag(objectId, newPosition, objectSize, currentUser);
  };

  // Handle transform (resize/rotate) - optimistic update
  const handleObjectTransform = (objectId, transformData) => {
    // Track that this object is being transformed
    setTransformingObjectId(objectId);
    
    // Update local state immediately for responsive UX
    setLocalObjectTransforms((prev) => ({
      ...prev,
      [objectId]: transformData,
    }));
  };

  // Handle transform end - write final transform to Firestore
  const handleObjectTransformEnd = async (objectId, transformData) => {
    // Update Firestore with all transform properties
    await updateObject(objectId, transformData, currentUser.uid);
    
    // Keep local transform until remote update arrives to prevent snap-back
    // The useEffect above will clear it when remote transform matches
    setTransformingObjectId(null);
  };

  // Mouse event handlers for panning and shape creation
  const handleMouseDown = (e) => {
    const isMiddleButton = e.evt.button === 1;
    
    // Check if clicking on the stage background or the dark background rect
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'background';
    
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
        
        createShapeOnCanvas(canvasX, canvasY, canvasMode);
        return;
      }
    }
    
    if (spacePressed || isMiddleButton) {
      e.evt.preventDefault();
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
  const handleWheel = (e) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    const oldScale = stageScale;
    const pointer = stage.getPointerPosition();

    // Calculate new scale based on wheel direction
    const scaleBy = 1.1;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
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
            
            {/* Render all canvas objects */}
            {!loading && objects.map((obj) => {
              // Use local transform if object is being transformed, otherwise use Firestore data
              const localTransform = localObjectTransforms[obj.id];
              const position = localTransform ? { x: localTransform.x, y: localTransform.y } : 
                               (localObjectPositions[obj.id] || { x: obj.x, y: obj.y });
              const isDragging = draggingObjectId === obj.id;
              
              // Merge local transforms with Firestore data for optimistic updates
              const mergedProps = localTransform ? { ...obj, ...localTransform } : obj;
              
              // Ensure all numeric values have defaults to prevent NaN warnings
              const safeX = position.x ?? 0;
              const safeY = position.y ?? 0;
              const safeRotation = mergedProps.rotation ?? 0;
              
              if (obj.type === "rectangle") {
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
                      opacity: isDragging ? 0.6 : 1,
                    }}
                    isSelected={isSelected(obj.id)}
                    onSelect={() => selectObject(obj.id)}
                    onDragStart={() => handleObjectDragStart(obj.id)}
                    onDragMove={(newPos) => handleObjectDragMove(obj.id, newPos, { width: obj.width, height: obj.height })}
                    onDragEnd={(newPos) => handleObjectDragEnd(obj.id, newPos, { width: obj.width, height: obj.height })}
                    onTransform={(transformData) => handleObjectTransform(obj.id, transformData)}
                    onTransformEnd={(transformData) => handleObjectTransformEnd(obj.id, transformData)}
                    canvasWidth={CANVAS_WIDTH}
                    canvasHeight={CANVAS_HEIGHT}
                  />
                );
              }
              
              if (obj.type === "circle") {
                return (
                  <Circle
                    key={obj.id}
                    shapeProps={{
                      x: safeX,
                      y: safeY,
                      radius: mergedProps.radius ?? 50,
                      fill: mergedProps.fill ?? "#3b82f6",
                      rotation: safeRotation,
                      opacity: isDragging ? 0.6 : 1,
                    }}
                    isSelected={isSelected(obj.id)}
                    onSelect={() => selectObject(obj.id)}
                    onDragStart={() => handleObjectDragStart(obj.id)}
                    onDragMove={(newPos) => handleObjectDragMove(obj.id, newPos, { radius: obj.radius })}
                    onDragEnd={(newPos) => handleObjectDragEnd(obj.id, newPos, { radius: obj.radius })}
                    onTransform={(transformData) => handleObjectTransform(obj.id, transformData)}
                    onTransformEnd={(transformData) => handleObjectTransformEnd(obj.id, transformData)}
                    canvasWidth={CANVAS_WIDTH}
                    canvasHeight={CANVAS_HEIGHT}
                  />
                );
              }
              
              if (obj.type === "text") {
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
                      opacity: isDragging ? 0.6 : 1,
                    }}
                    isSelected={isSelected(obj.id)}
                    onSelect={() => selectObject(obj.id)}
                    onDragStart={() => handleObjectDragStart(obj.id)}
                    onDragMove={(newPos) => handleObjectDragMove(obj.id, newPos, { width: obj.width || 200, height: 50 })}
                    onDragEnd={(newPos) => handleObjectDragEnd(obj.id, newPos, { width: obj.width || 200, height: 50 })}
                    onTransform={(transformData) => handleObjectTransform(obj.id, transformData)}
                    onTransformEnd={(transformData) => handleObjectTransformEnd(obj.id, transformData)}
                    onTextChange={(newText) => updateObject(obj.id, { text: newText }, currentUser.uid)}
                    canvasWidth={CANVAS_WIDTH}
                    canvasHeight={CANVAS_HEIGHT}
                  />
                );
              }
              
              return null;
            })}
          </Layer>
        </Stage>
      )}

      {/* Loading state overlay */}
      {loading && <LoadingState />}

      {/* Cursor overlay - HTML elements for simplicity */}
      {/* Only show cursors for users who are currently present/online */}
      {visibleCursors.map((cursor) => (
        <Cursor
          key={cursor.userId}
          x={cursor.x}
          y={cursor.y}
          userName={cursor.userName}
          userColor={cursor.userColor}
        />
      ))}
    </div>
  );
}

