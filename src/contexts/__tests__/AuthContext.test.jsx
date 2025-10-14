import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider } from "../AuthContext";
import { useAuth } from "../../hooks/useAuth";

// Mock Firebase
vi.mock("../../lib/firebase", () => ({
  auth: {},
}));

// Mock onAuthStateChanged - create inside the factory
vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn(),
}));

// Test component that uses useAuth
function TestComponent() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div data-testid="user-info">
        {currentUser ? currentUser.displayName : "No user"}
      </div>
    </div>
  );
}

describe("AuthContext", () => {
  let mockOnAuthStateChanged;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Get the mocked function
    const auth = await import("firebase/auth");
    mockOnAuthStateChanged = auth.onAuthStateChanged;
  });

  it("should render children when authenticated", async () => {
    // Mock authenticated user
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback({ uid: "123", displayName: "Test User" });
      return vi.fn(); // unsubscribe function
    });

    render(
      <AuthProvider>
        <div>Protected Content</div>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });
  });

  it("should provide correct values through useAuth hook", async () => {
    // Mock authenticated user
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback({ uid: "123", displayName: "Test User" });
      return vi.fn();
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user-info")).toHaveTextContent("Test User");
    });
  });

  it("should handle unauthenticated state", async () => {
    // Mock no user
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null);
      return vi.fn();
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user-info")).toHaveTextContent("No user");
    });
  });

  it("should show loading state initially", () => {
    // Mock that doesn't call callback immediately
    mockOnAuthStateChanged.mockImplementation(() => {
      return vi.fn();
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Should not render children while loading
    expect(screen.queryByTestId("user-info")).not.toBeInTheDocument();
  });
});

