import { useState, useEffect, useRef } from "react";
import { Stage, Layer, Rect } from "react-konva";

export default function Canvas() {
  const [stageSize, setStageSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const stageRef = useRef(null);

  // Canvas dimensions (logical canvas size)
  const CANVAS_WIDTH = 5000;
  const CANVAS_HEIGHT = 5000;

  // Update stage size on window resize
  useEffect(() => {
    const handleResize = () => {
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="w-full h-screen overflow-hidden bg-gray-900">
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
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
          />
        </Layer>
      </Stage>
    </div>
  );
}

