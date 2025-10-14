import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Header from "./components/ui/Header";
import Canvas from "./components/canvas/Canvas";

// Canvas page component
function CanvasPage() {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-900">
      {/* Header positioned absolutely at top */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <Header />
      </div>
      
      {/* Canvas fills entire screen */}
      <div className="w-full h-full">
        <Canvas />
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <CanvasPage />
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;
