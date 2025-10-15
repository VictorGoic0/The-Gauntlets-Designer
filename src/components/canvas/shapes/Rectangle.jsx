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
export default function Rectangle({ shapeProps, isSelected, onSelect, onDragStart, onDragMove, onDragEnd, onTransform, onTransformEnd, canvasWidth, canvasHeight }) {
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

  const handleTransform = (e) => {
    if (onTransform) {
      const node = e.target;
      onTransform({
        x: node.x(),
        y: node.y(),
        width: node.width() * node.scaleX(),
        height: node.height() * node.scaleY(),
        rotation: node.rotation(),
      });
    }
  };

  const handleTransformEnd = (e) => {
    if (onTransformEnd) {
      const node = e.target;
      const newWidth = node.width() * node.scaleX();
      const newHeight = node.height() * node.scaleY();
      
      onTransformEnd({
        x: node.x(),
        y: node.y(),
        width: newWidth,
        height: newHeight,
        rotation: node.rotation(),
      });
      
      // Apply scale to actual dimensions and reset scale
      node.width(newWidth);
      node.height(newHeight);
      node.scaleX(1);
      node.scaleY(1);
    }
  };

  // Constrain drag within canvas bounds
  // Note: pos is in canvas coordinates (not screen coordinates)
  // Konva automatically handles coordinate transforms for shapes within the Stage
  // This works correctly regardless of pan/zoom level
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
        onTransform={handleTransform}
        onTransformEnd={handleTransformEnd}
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

