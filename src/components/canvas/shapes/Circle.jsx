import { Circle as KonvaCircle, Transformer } from "react-konva";
import { useRef, useEffect } from "react";
import useLocalStore from "../../../stores/localStore";

/**
 * Circle shape component
 * Features:
 * - Renders a Konva Circle with given properties
 * - Shows selection border when selected
 * - Shows remote selection borders from other users (PR #19)
 * - Handles click for selection
 * - Default radius: 50px
 */
export default function Circle({ shapeProps, isSelected, remoteSelectors = [], onSelect, onDragStart, onDragMove, onDragEnd, onTransform, onTransformEnd, canvasWidth, canvasHeight }) {
  const shapeRef = useRef();
  const transformerRef = useRef();
  const canvasMode = useLocalStore((state) => state.canvas.mode);

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
      // For circles, scale affects the radius
      const avgScale = (node.scaleX() + node.scaleY()) / 2;
      onTransform({
        x: node.x(),
        y: node.y(),
        radius: node.radius() * avgScale,
        rotation: node.rotation(),
      });
    }
  };

  const handleTransformEnd = (e) => {
    if (onTransformEnd) {
      const node = e.target;
      // For circles, scale affects the radius
      const avgScale = (node.scaleX() + node.scaleY()) / 2;
      const newRadius = node.radius() * avgScale;
      
      onTransformEnd({
        x: node.x(),
        y: node.y(),
        radius: newRadius,
        rotation: node.rotation(),
      });
      
      // Apply scale to actual radius and reset scale
      node.radius(newRadius);
      node.scaleX(1);
      node.scaleY(1);
    }
  };

  // Constrain drag within canvas bounds
  // Account for circle radius when constraining position
  const dragBoundFunc = (pos) => {
    if (!canvasWidth || !canvasHeight) return pos;
    
    const radius = shapeProps.radius || 50;
    
    return {
      x: Math.max(radius, Math.min(pos.x, canvasWidth - radius)),
      y: Math.max(radius, Math.min(pos.y, canvasHeight - radius)),
    };
  };

  // Get count of remote selectors
  const remoteSelectorsCount = remoteSelectors.length;
  const hasRemoteSelectors = remoteSelectorsCount > 0;

  return (
    <>
      {/* Remote selection borders (PR #19) - rendered behind the shape */}
      {hasRemoteSelectors && remoteSelectors.map((selector, index) => (
        <KonvaCircle
          key={`remote-selection-${selector.userId}`}
          x={shapeProps.x}
          y={shapeProps.y}
          radius={(shapeProps.radius || 50) + 4 + (index * 3)} // Offset outward for nested borders
          rotation={shapeProps.rotation || 0}
          stroke={selector.userColor}
          strokeWidth={3}
          fill="transparent"
          listening={false} // Don't interfere with events
          opacity={0.8}
        />
      ))}
      
      <KonvaCircle
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
        // Visual feedback when selected by current user
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

