import { Text as KonvaText, Transformer } from "react-konva";
import { useRef, useEffect, useState } from "react";
import useLocalStore from "../../../stores/localStore";

/**
 * Text shape component
 * Features:
 * - Renders a Konva Text with given properties
 * - Shows selection border when selected
 * - Handles click for selection
 * - Double-click to edit text
 * - Default text: "Double-click to edit"
 * - Default fontSize: 16
 */
export default function Text({ 
  shapeProps, 
  isSelected, 
  onSelect, 
  onDragStart, 
  onDragMove, 
  onDragEnd,
  onTransform,
  onTransformEnd,
  onTextChange,
  canvasWidth, 
  canvasHeight 
}) {
  const shapeRef = useRef();
  const transformerRef = useRef();
  const onTextChangeRef = useRef(onTextChange);
  const isEditingRef = useRef(false);
  const canvasMode = useLocalStore((state) => state.canvas.mode);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(shapeProps.text || "Double-click to edit");
  
  // Keep refs updated without triggering re-renders
  useEffect(() => {
    onTextChangeRef.current = onTextChange;
  }, [onTextChange]);
  
  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);
  
  // Update local editValue when props change from Firestore
  // Only sync when shapeProps.text changes (not when isEditing state changes)
  // to avoid overwriting user's edit before Firestore confirms the update
  useEffect(() => {
    if (!isEditingRef.current) {
      setEditValue(shapeProps.text || "Double-click to edit");
    }
  }, [shapeProps.text]);

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      // Attach transformer to the selected shape
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected, shapeProps.width, shapeProps.fontSize, editValue]);

  const handleClick = (e) => {
    // Only allow selection in select mode
    if (canvasMode === "select") {
      e.cancelBubble = true;
      onSelect();
    }
  };

  const handleDoubleClick = (e) => {
    if (canvasMode === "select" && isSelected) {
      e.cancelBubble = true;
      setIsEditing(true);
      setEditValue(shapeProps.text || "Double-click to edit");
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
        fontSize: (shapeProps.fontSize || 16) * node.scaleY(),
        rotation: node.rotation(),
      });
    }
  };

  const handleTransformEnd = (e) => {
    if (onTransformEnd) {
      const node = e.target;
      const newWidth = node.width() * node.scaleX();
      const newFontSize = (shapeProps.fontSize || 16) * node.scaleY();
      
      onTransformEnd({
        x: node.x(),
        y: node.y(),
        width: newWidth,
        fontSize: newFontSize,
        rotation: node.rotation(),
      });
      
      // Apply scale to actual dimensions and reset scale
      node.width(newWidth);
      node.fontSize(newFontSize);
      node.scaleX(1);
      node.scaleY(1);
    }
  };

  // Constrain drag within canvas bounds
  const dragBoundFunc = (pos) => {
    if (!canvasWidth || !canvasHeight) return pos;
    
    const width = shapeProps.width || 200;
    const height = shapeProps.height || 50;
    
    return {
      x: Math.max(0, Math.min(pos.x, canvasWidth - width)),
      y: Math.max(0, Math.min(pos.y, canvasHeight - height)),
    };
  };

  // Handle text editing with HTML input overlay
  useEffect(() => {
    if (isEditing && shapeRef.current) {
      const textNode = shapeRef.current;
      const stage = textNode.getStage();
      const stageBox = stage.container().getBoundingClientRect();
      
      // Get text position in screen coordinates
      const textPosition = textNode.getAbsolutePosition();
      const stageAttrs = stage.attrs;
      
      const x = stageBox.left + textPosition.x * stageAttrs.scaleX + stageAttrs.x;
      const y = stageBox.top + textPosition.y * stageAttrs.scaleY + stageAttrs.y;
      
      // Create textarea for editing
      const textarea = document.createElement("textarea");
      document.body.appendChild(textarea);
      
      textarea.value = editValue;
      textarea.style.position = "absolute";
      textarea.style.top = `${y}px`;
      textarea.style.left = `${x}px`;
      textarea.style.width = `${textNode.width() * stageAttrs.scaleX}px`;
      textarea.style.fontSize = `${(shapeProps.fontSize || 16) * stageAttrs.scaleY}px`;
      textarea.style.fontFamily = shapeProps.fontFamily || "Arial";
      textarea.style.border = "2px solid #3B82F6";
      textarea.style.padding = "4px";
      textarea.style.margin = "0px";
      textarea.style.overflow = "hidden";
      textarea.style.background = "white";
      textarea.style.color = "#000000"; // Black text for visibility
      textarea.style.outline = "none";
      textarea.style.resize = "none";
      textarea.style.lineHeight = "1.2";
      textarea.style.transformOrigin = "left top";
      textarea.style.zIndex = "1000";
      
      textarea.focus();
      textarea.select();
      
      const removeTextarea = () => {
        if (document.body.contains(textarea)) {
          document.body.removeChild(textarea);
        }
      };
      
      const handleBlur = () => {
        const newText = textarea.value;
        if (onTextChangeRef.current && newText !== shapeProps.text) {
          // Update local state immediately for instant feedback
          setEditValue(newText);
          // Then update Firestore
          onTextChangeRef.current(newText);
        }
        setIsEditing(false);
        removeTextarea();
      };
      
      const handleKeyDown = (e) => {
        // Stop event propagation to prevent canvas shortcuts while typing
        e.stopPropagation();
        
        if (e.key === "Escape") {
          setIsEditing(false);
          removeTextarea();
        } else if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault(); // Prevent default Enter behavior
          handleBlur();
        }
      };
      
      textarea.addEventListener("blur", handleBlur);
      textarea.addEventListener("keydown", handleKeyDown);
      
      return () => {
        textarea.removeEventListener("blur", handleBlur);
        textarea.removeEventListener("keydown", handleKeyDown);
        removeTextarea();
      };
    }
  }, [isEditing, editValue, shapeProps.text, shapeProps.fontSize, shapeProps.fontFamily]);

  return (
    <>
      <KonvaText
        ref={shapeRef}
        {...shapeProps}
        text={editValue || "Double-click to edit"}
        fontSize={shapeProps.fontSize || 16}
        fontFamily={shapeProps.fontFamily || "Arial"}
        fill={shapeProps.fill || "#FFFFFF"}
        onClick={handleClick}
        onTap={handleClick}
        onDblClick={handleDoubleClick}
        onDblTap={handleDoubleClick}
        draggable={canvasMode === "select" && isSelected && !isEditing}
        dragBoundFunc={dragBoundFunc}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onTransform={handleTransform}
        onTransformEnd={handleTransformEnd}
        // Visual feedback when selected
        strokeWidth={isSelected ? 2 : 0}
        stroke={isSelected ? "#3B82F6" : undefined}
        // Make text wrap
        width={shapeProps.width || 200}
      />
      {isSelected && canvasMode === "select" && !isEditing && (
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

