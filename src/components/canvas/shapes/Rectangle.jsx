import { Rect, Transformer } from "react-konva";
import { useRef, useEffect } from "react";
import { useCanvas } from "../../../hooks/useCanvas";

/**
 * Rectangle shape component
 * Features:
 * - Renders a Konva Rect with given properties
 * - Shows selection border when selected
 * - Handles click for selection
 */
export default function Rectangle({ shapeProps, isSelected, onSelect, onDragStart, onDragMove, onDragEnd, canvasWidth, canvasHeight }) {
  const shapeRef = useRef();
  const transformerRef = useRef();
  const { canvasMode } = useCanvas();

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      // Attach transformer to the selected shape
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const handleClick = (e) => {
    // Only allow selection in select mode
    if (canvasMode === "select") {
      e.cancelBubble = true;
      onSelect();
    }
  };

  const handleDragStart = (e) => {
    if (onDragStart) {
      onDragStart(e);
    }
  };

  const handleDragMove = (e) => {
    if (onDragMove) {
      const node = e.target;
      onDragMove({
        x: node.x(),
        y: node.y(),
      });
    }
  };

  const handleDragEnd = (e) => {
    if (onDragEnd) {
      const node = e.target;
      onDragEnd({
        x: node.x(),
        y: node.y(),
      });
    }
  };

  // Constrain drag within canvas bounds
  const dragBoundFunc = (pos) => {
    if (!canvasWidth || !canvasHeight) return pos;
    
    const width = shapeProps.width || 0;
    const height = shapeProps.height || 0;
    
    return {
      x: Math.max(0, Math.min(pos.x, canvasWidth - width)),
      y: Math.max(0, Math.min(pos.y, canvasHeight - height)),
    };
  };

  return (
    <>
      <Rect
        ref={shapeRef}
        {...shapeProps}
        onClick={handleClick}
        onTap={handleClick}
        draggable={canvasMode === "select" && isSelected}
        dragBoundFunc={dragBoundFunc}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        // Visual feedback when selected
        strokeWidth={isSelected ? 2 : 0}
        stroke={isSelected ? "#3B82F6" : undefined}
      />
      {isSelected && canvasMode === "select" && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize to prevent negative dimensions
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
}

