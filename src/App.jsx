import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";
import { signOutUser } from "./lib/firebase";

// Temporary Canvas placeholder component
function CanvasPlaceholder() {
  const { currentUser } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">CollabCanvas</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-300">
              Welcome, {currentUser?.displayName || "User"}
            </span>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
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
