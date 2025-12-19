import { useState, useEffect } from "react";
import Header from "../components/ui/Header";
import Canvas from "../components/canvas/Canvas";
import ZoomControls from "../components/canvas/ZoomControls";
import PresencePanel from "../components/canvas/PresencePanel";
import Toolbar from "../components/canvas/Toolbar";
import AIPanel from "../components/ai/AIPanel";

export default function CanvasPage() {
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);

  // Keyboard shortcut: Cmd/Ctrl + K to toggle AI panel
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore shortcuts if user is typing in an input/textarea
      const isTyping = 
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable;

      // Check for Cmd (Mac) or Ctrl (Windows/Linux) + K
      if ((e.metaKey || e.ctrlKey) && e.key === "k" && !isTyping) {
        e.preventDefault(); // Prevent browser's default search
        setIsAIPanelOpen((prev) => !prev);
      }

      // Escape key to close AI panel (allow even when typing)
      if (e.key === "Escape" && isAIPanelOpen) {
        setIsAIPanelOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAIPanelOpen]);

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden bg-gray-900">
      {/* Header at the top */}
      <Header onOpenAI={() => setIsAIPanelOpen(true)} />
      
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

      {/* AI Panel (slides in from right) */}
      <AIPanel
        isOpen={isAIPanelOpen}
        onClose={() => setIsAIPanelOpen(false)}
      />
    </div>
  );
}

