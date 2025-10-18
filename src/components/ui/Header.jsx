import { useAuth } from "../../hooks/useAuth";
import { signOutUser } from "../../lib/firebase";
import ConnectionStatus from "./ConnectionStatus";
import Button from "../design-system/Button";
import { testCreateRectangle } from "../../services/testFunctions";
import toast from "react-hot-toast";

export default function Header() {
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
        <div className="flex items-center" style={{ gap: '2rem' }}>
          <Button
            onClick={handleTestFunction}
            variant="outline"
            size="sm"
          >
            Test AI
          </Button>
          <ConnectionStatus />
          <span className="text-gray-300">
            Welcome, {currentUser?.displayName || "User"}
          </span>
          <Button
            onClick={handleSignOut}
            variant="primary"
            size="sm"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
}

