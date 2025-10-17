import { useAuth } from "../../hooks/useAuth";
import { signOutUser } from "../../lib/firebase";
import ConnectionStatus from "./ConnectionStatus";
import Button from "../design-system/Button";

export default function Header() {
  const { currentUser } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Goico's Artist</h1>
        <div className="flex items-center" style={{ gap: '2rem' }}>
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

