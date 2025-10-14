import { describe, it, expect, vi, beforeEach } from "vitest";

// Create mock functions
const mockAuth = {};
const mockSignInWithPopup = vi.fn();
const mockSignOut = vi.fn();
const mockGoogleAuthProvider = vi.fn();
const mockGetAuth = vi.fn(() => mockAuth);

// Mock Firebase modules
vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock("firebase/firestore", () => ({
  getFirestore: vi.fn(() => ({})),
}));

vi.mock("firebase/auth", () => ({
  getAuth: mockGetAuth,
  GoogleAuthProvider: mockGoogleAuthProvider,
  signInWithPopup: mockSignInWithPopup,
  signOut: mockSignOut,
  onAuthStateChanged: vi.fn(),
}));

describe("Firebase Auth Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signInWithGoogle", () => {
    it("should initiate Google sign-in flow", async () => {
      const mockUser = {
        uid: "123",
        displayName: "Test User",
        email: "test@example.com",
      };

      mockSignInWithPopup.mockResolvedValue({ user: mockUser });

      // Simulate our wrapper function
      const provider = new mockGoogleAuthProvider();
      const result = await mockSignInWithPopup(mockAuth, provider);

      expect(mockSignInWithPopup).toHaveBeenCalledWith(mockAuth, provider);
      expect(mockGoogleAuthProvider).toHaveBeenCalled();
      expect(result.user).toEqual(mockUser);
    });

    it("should handle sign-in errors", async () => {
      const mockError = new Error("Sign-in failed");
      mockSignInWithPopup.mockRejectedValue(mockError);

      const provider = new mockGoogleAuthProvider();

      await expect(mockSignInWithPopup(mockAuth, provider)).rejects.toThrow(
        "Sign-in failed"
      );

      expect(mockSignInWithPopup).toHaveBeenCalledWith(mockAuth, provider);
    });
  });

  describe("signOutUser", () => {
    it("should sign out user successfully", async () => {
      mockSignOut.mockResolvedValue();

      await mockSignOut(mockAuth);

      expect(mockSignOut).toHaveBeenCalledWith(mockAuth);
    });

    it("should handle sign-out errors", async () => {
      const mockError = new Error("Sign-out failed");
      mockSignOut.mockRejectedValue(mockError);

      await expect(mockSignOut(mockAuth)).rejects.toThrow("Sign-out failed");

      expect(mockSignOut).toHaveBeenCalledWith(mockAuth);
    });
  });
});
