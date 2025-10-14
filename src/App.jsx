import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import CanvasPage from "./pages/CanvasPage";

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
