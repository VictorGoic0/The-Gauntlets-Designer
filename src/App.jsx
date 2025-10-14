import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Header from "./components/ui/Header";

// Temporary Canvas placeholder component
function CanvasPlaceholder() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Canvas Coming Soon!</h2>
          <p className="text-gray-400 mb-2">
            You're successfully authenticated.
          </p>
          <p className="text-gray-400">
            The canvas will be implemented in PR #3.
          </p>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <CanvasPlaceholder />
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;
