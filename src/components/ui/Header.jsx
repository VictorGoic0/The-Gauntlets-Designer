import { useAuth } from "../../hooks/useAuth";
import { signOutUser } from "../../lib/firebase";

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
        <div className="flex items-center gap-4">
          <span className="text-gray-300">
            Welcome, {currentUser?.displayName || "User"}
          </span>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}

