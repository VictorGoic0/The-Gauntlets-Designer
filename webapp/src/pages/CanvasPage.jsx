import { useState, useEffect, useEffectEvent } from "react";
import Header from "../components/ui/Header";
import Canvas from "../components/canvas/Canvas";
import ZoomControls from "../components/canvas/ZoomControls";
import PresencePanel from "../components/canvas/PresencePanel";
import Toolbar from "../components/canvas/Toolbar";
import AIPanel from "../components/ai/AIPanel";

export default function CanvasPage() {
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);

  const onCanvasPageKeyDown = useEffectEvent((event) => {
    const isTyping =
      event.target.tagName === "INPUT" ||
      event.target.tagName === "TEXTAREA" ||
      event.target.isContentEditable;

    if ((event.metaKey || event.ctrlKey) && event.key === "k" && !isTyping) {
      event.preventDefault();
      setIsAIPanelOpen(
        (previousIsAIPanelOpen) => !previousIsAIPanelOpen,
      );
    }

    if (event.key === "Escape") {
      setIsAIPanelOpen((previousIsOpen) =>
        previousIsOpen ? false : previousIsOpen,
      );
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", onCanvasPageKeyDown);
    return () => {
      window.removeEventListener("keydown", onCanvasPageKeyDown);
    };
  }, []);

  const onClickOpenAIPanel = () => setIsAIPanelOpen(true);

  const onCloseAIPanel = () => setIsAIPanelOpen(false);

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden bg-gray-900">
      {/* Header at the top */}
      <Header onOpenAI={onClickOpenAIPanel} />
      
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
      <AIPanel isOpen={isAIPanelOpen} onClose={onCloseAIPanel} />
    </div>
  );
}

