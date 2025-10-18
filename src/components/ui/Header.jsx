import { useAuth } from "../../hooks/useAuth";
import { signOutUser } from "../../lib/firebase";
import ConnectionStatus from "./ConnectionStatus";
import Button from "../design-system/Button";
import { testCreateRectangle } from "../../services/testFunctions";
import toast from "react-hot-toast";

export default function Header({ onOpenAI }) {
  const { currentUser } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleTestFunction = async () => {
    try {
      const result = await testCreateRectangle();
      if (result.results && result.results.length > 0) {
        toast.success(`✅ Rectangle created!`);
      } else {
        toast.success(`✅ AI Agent responded: ${result.message}`);
      }
    } catch (error) {
      toast.error(`❌ AI Agent failed: ${error.message}`);
    }
  };

  return (
    <header className="bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Goico's Artist</h1>
        <div className="flex items-center" style={{ gap: '1rem' }}>
          {/* AI Assistant Button */}
          <Button
            onClick={onOpenAI}
            variant="primary"
            size="sm"
            title="Open AI Assistant (Ctrl/Cmd + K)"
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg
                style={{ width: '1rem', height: '1rem' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              AI Assistant
            </span>
          </Button>

          {/* Test Button (for development) */}
          <Button
            onClick={handleTestFunction}
            variant="outline"
            size="sm"
          >
            Test
          </Button>

          <ConnectionStatus />

          <span className="text-gray-300">
            Welcome, {currentUser?.displayName || "User"}
          </span>

          <Button
            onClick={handleSignOut}
            variant="outline"
            size="sm"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
}

