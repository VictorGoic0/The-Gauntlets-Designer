import useLocalStore from "../../stores/localStore";

export default function ZoomControls() {
  const stageScale = useLocalStore((state) => state.canvas.stageScale);
  const MIN_SCALE = useLocalStore((state) => state.canvas.MIN_SCALE);
  const MAX_SCALE = useLocalStore((state) => state.canvas.MAX_SCALE);
  const setStageScale = useLocalStore((state) => state.setStageScale);
  const setStagePosition = useLocalStore((state) => state.setStagePosition);

  // Calculate zoom percentage
  const zoomPercentage = Math.round(stageScale * 100);

  // Zoom in by 20%
  const handleZoomIn = () => {
    const newScale = Math.min(stageScale * 1.2, MAX_SCALE);
    setStageScale(newScale);
  };

  // Zoom out by 20%
  const handleZoomOut = () => {
    const newScale = Math.max(stageScale / 1.2, MIN_SCALE);
    setStageScale(newScale);
  };

  // Reset zoom to 100%
  const handleResetZoom = () => {
    setStageScale(1);
    setStagePosition({ x: 0, y: 0 });
  };

  return (
    <div 
      className="absolute bottom-6 right-6 z-50 bg-gray-800 rounded-lg shadow-lg p-3 flex flex-col gap-2 border border-gray-700 pointer-events-auto"
    >
      {/* Zoom In Button */}
      <button
        onClick={handleZoomIn}
        disabled={stageScale >= MAX_SCALE}
        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        title="Zoom In"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      {/* Zoom Percentage Display */}
      <div className="px-3 py-1 bg-gray-900 text-white text-center rounded-md font-mono text-sm">
        {zoomPercentage}%
      </div>

      {/* Zoom Out Button */}
      <button
        onClick={handleZoomOut}
        disabled={stageScale <= MIN_SCALE}
        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        title="Zoom Out"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 12H4"
          />
        </svg>
      </button>

      {/* Reset Zoom Button */}
      <button
        onClick={handleResetZoom}
        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors font-medium text-xs"
        title="Reset Zoom (100%)"
      >
        Reset
      </button>
    </div>
  );
}

