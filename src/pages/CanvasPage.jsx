import { CanvasProvider } from "../contexts/CanvasContext";
import Header from "../components/ui/Header";
import Canvas from "../components/canvas/Canvas";
import ZoomControls from "../components/canvas/ZoomControls";
import PresencePanel from "../components/canvas/PresencePanel";
import Toolbar from "../components/canvas/Toolbar";

export default function CanvasPage() {
  return (
    <CanvasProvider>
      <div className="flex flex-col w-full h-screen overflow-hidden bg-gray-900">
        {/* Header at the top */}
        <Header />
        
        {/* Canvas fills remaining space */}
        <div className="flex-1 relative">
          <Canvas />
          
          {/* Toolbar overlay positioned in top-center */}
          <Toolbar />
          
          {/* Presence panel overlay positioned in top-right corner */}
          <PresencePanel />
          
          {/* Zoom controls overlay positioned in bottom-right corner */}
          <ZoomControls />
        </div>
      </div>
    </CanvasProvider>
  );
}

