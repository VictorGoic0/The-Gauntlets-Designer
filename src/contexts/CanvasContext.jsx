import { createContext, useState } from "react";

export const CanvasContext = createContext(null);

export function CanvasProvider({ children }) {
  // Pan state
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  
  // Zoom state
  const [stageScale, setStageScale] = useState(1);
  
  // Selection state
  const [selectedObjectIds, setSelectedObjectIds] = useState([]);
  
  // Canvas mode: 'select', 'rectangle', 'circle', 'text'
  const [canvasMode, setCanvasMode] = useState("select");

  // Zoom constraints
  const MIN_SCALE = 0.1;
  const MAX_SCALE = 5;

  // Selection methods
  const selectObject = (objectId) => {
    setSelectedObjectIds([objectId]);
  };

  const addToSelection = (objectId) => {
    if (!selectedObjectIds.includes(objectId)) {
      setSelectedObjectIds([...selectedObjectIds, objectId]);
    }
  };

  const deselectObject = (objectId) => {
    setSelectedObjectIds(selectedObjectIds.filter((id) => id !== objectId));
  };

  const clearSelection = () => {
    setSelectedObjectIds([]);
  };

  const isSelected = (objectId) => {
    return selectedObjectIds.includes(objectId);
  };

  const value = {
    // Pan state
    stagePosition,
    setStagePosition,
    
    // Zoom state
    stageScale,
    setStageScale,
    MIN_SCALE,
    MAX_SCALE,
    
    // Selection state
    selectedObjectIds,
    selectObject,
    addToSelection,
    deselectObject,
    clearSelection,
    isSelected,
    
    // Canvas mode
    canvasMode,
    setCanvasMode,
  };

  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
}

