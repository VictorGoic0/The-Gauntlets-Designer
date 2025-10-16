import { useState, useEffect, useRef, useCallback } from "react";
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
import Cursor from "./Cursor";
import Rectangle from "./shapes/Rectangle";
import Circle from "./shapes/Circle";
import Text from "./shapes/Text";
import LoadingState from "./LoadingState";
import { createRectangle, createCircle, createText } from "../../utils/objectUtils";
import { updateObject, deleteObjects } from "../../utils/firestoreUtils";

export default function Canvas() {
  // Get canvas state from context
  const {
    stagePosition,
    setStagePosition,
    stageScale,
    setStageScale,
    MIN_SCALE,
    MAX_SCALE,
    canvasMode,
    clearSelection,
    selectObject,
    isSelected,
    selectedObjectIds,
  } = useCanvas();
  
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
  
  // Local state for object positions during drag (optimistic updates)
  const [localObjectPositions, setLocalObjectPositions] = useState({});
  
  // Local state for object transforms during resize/rotate (optimistic updates)
  const [localObjectTransforms, setLocalObjectTransforms] = useState({});
  
  // Track which object is currently being dragged for visual feedback
  const [draggingObjectId, setDraggingObjectId] = useState(null);
  
  // Object syncing (pass dragging objects to prevent remote updates during drag)
  const { objects, loading } = useObjectSync(localObjectPositions);
  
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
  useEffect(() => {
    setLocalObjectPositions((prev) => {
      const updated = { ...prev };
      let changed = false;
      
      Object.keys(prev).forEach((objectId) => {
        const remoteObject = objects.find(obj => obj.id === objectId);
        if (remoteObject) {
          const localPos = prev[objectId];
          // If remote position matches local (within 1px tolerance), clear local
          if (
            Math.abs(remoteObject.x - localPos.x) < 1 &&
            Math.abs(remoteObject.y - localPos.y) < 1
          ) {
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
  }, [selectedObjectIds, deleteSelectedObjects]);

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

  // Handle drag start
  const handleObjectDragStart = (objectId) => {
    setDraggingObjectId(objectId);
  };

  // Handle drag move - update local position (optimistic update)
  const handleObjectDragMove = (objectId, newPosition, objectSize) => {
    // Constrain position within canvas bounds
    let constrainedX, constrainedY;
    
    if (objectSize.radius) {
      // For circles: x,y is center position, so constrain using radius
      const radius = objectSize.radius;
      constrainedX = Math.max(radius, Math.min(newPosition.x, CANVAS_WIDTH - radius));
      constrainedY = Math.max(radius, Math.min(newPosition.y, CANVAS_HEIGHT - radius));
    } else {
      // For rectangles/text: x,y is top-left corner, so constrain using width/height
      const width = objectSize.width || 0;
      const height = objectSize.height || 0;
      constrainedX = Math.max(0, Math.min(newPosition.x, CANVAS_WIDTH - width));
      constrainedY = Math.max(0, Math.min(newPosition.y, CANVAS_HEIGHT - height));
    }
    
    setLocalObjectPositions((prev) => ({
      ...prev,
      [objectId]: { x: constrainedX, y: constrainedY },
    }));
  };

  // Handle drag end - write final position to Firestore
  const handleObjectDragEnd = async (objectId, newPosition, objectSize) => {
    setDraggingObjectId(null);
    
    // Constrain final position within canvas bounds
    let constrainedX, constrainedY;
    
    if (objectSize.radius) {
      // For circles: x,y is center position, so constrain using radius
      const radius = objectSize.radius;
      constrainedX = Math.max(radius, Math.min(newPosition.x, CANVAS_WIDTH - radius));
      constrainedY = Math.max(radius, Math.min(newPosition.y, CANVAS_HEIGHT - radius));
    } else {
      // For rectangles/text: x,y is top-left corner, so constrain using width/height
      const width = objectSize.width || 0;
      const height = objectSize.height || 0;
      constrainedX = Math.max(0, Math.min(newPosition.x, CANVAS_WIDTH - width));
      constrainedY = Math.max(0, Math.min(newPosition.y, CANVAS_HEIGHT - height));
    }
    
    // Update object position using utility function
    await updateObject(objectId, {
      x: constrainedX,
      y: constrainedY,
    }, currentUser.uid);
    
    // Keep local position until remote update arrives to prevent flicker
    // The useEffect below will clear it when remote position matches
  };

  // Handle transform (resize/rotate) - optimistic update
  const handleObjectTransform = (objectId, transformData) => {
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
    
    // Clear local transform after Firestore update
    setLocalObjectTransforms((prev) => {
      const newTransforms = { ...prev };
      delete newTransforms[objectId];
      return newTransforms;
    });
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
              
              if (obj.type === "rectangle") {
                return (
                  <Rectangle
                    key={obj.id}
                    shapeProps={{
                      x: position.x,
                      y: position.y,
                      width: mergedProps.width,
                      height: mergedProps.height,
                      fill: mergedProps.fill,
                      rotation: mergedProps.rotation,
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
                      x: position.x,
                      y: position.y,
                      radius: mergedProps.radius,
                      fill: mergedProps.fill,
                      rotation: mergedProps.rotation,
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
                      x: position.x,
                      y: position.y,
                      text: mergedProps.text,
                      fontSize: mergedProps.fontSize,
                      fontFamily: mergedProps.fontFamily,
                      width: mergedProps.width,
                      fill: mergedProps.fill,
                      rotation: mergedProps.rotation,
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

