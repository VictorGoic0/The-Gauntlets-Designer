import { useCanvas } from "../../hooks/useCanvas";

/**
 * Toolbar component for canvas tools
 * Features:
 * - Select, Rectangle, Circle, Text tools
 * - Visual indication of active tool
 * - Positioned on the left side of the canvas
 */
export default function Toolbar() {
  const { canvasMode, setCanvasMode } = useCanvas();

  const tools = [
    {
      id: "select",
      name: "Select",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-[30px] w-[30px]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
          />
        </svg>
      ),
    },
    {
      id: "rectangle",
      name: "Rectangle",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-[30px] w-[30px]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z"
          />
        </svg>
      ),
    },
    {
      id: "circle",
      name: "Circle",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-[30px] w-[30px]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: "text",
      name: "Text",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-[30px] w-[30px]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16m-7 6h7"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-3 flex flex-row gap-2 pointer-events-auto">
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => setCanvasMode(tool.id)}
          className={`
            p-4 rounded-md transition-all duration-200 flex items-center justify-center
            ${
              canvasMode === tool.id
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
            }
          `}
          title={tool.name}
          aria-label={tool.name}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  );
}

