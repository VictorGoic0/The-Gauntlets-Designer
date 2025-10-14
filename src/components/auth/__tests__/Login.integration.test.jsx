import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Login from "../Login";
import * as firebase from "../../../lib/firebase";

// Mock the firebase module
vi.mock("../../../lib/firebase", () => ({
  signInWithGoogle: vi.fn(),
}));

describe("Login Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Google Sign-In Flow", () => {
    it("should trigger auth flow when Sign in with Google button is clicked", async () => {
      const user = userEvent.setup();
      vi.mocked(firebase.signInWithGoogle).mockResolvedValue({
        uid: "123",
        displayName: "Test User",
        email: "test@example.com",
      });

      render(<Login />);

      const signInButton = screen.getByRole("button", {
        name: /sign in with google/i,
      });

      await user.click(signInButton);

      expect(firebase.signInWithGoogle).toHaveBeenCalledTimes(1);
    });

    it("should show loading state while signing in", async () => {
      const user = userEvent.setup();
      let resolveSignIn;
      const signInPromise = new Promise((resolve) => {
        resolveSignIn = resolve;
      });

      vi.mocked(firebase.signInWithGoogle).mockReturnValue(signInPromise);

      render(<Login />);

      const signInButton = screen.getByRole("button", {
        name: /sign in with google/i,
      });

      await user.click(signInButton);

      // Button should show loading text
      expect(screen.getByText(/signing in\.\.\./i)).toBeInTheDocument();

      // Button should be disabled during loading
      expect(signInButton).toBeDisabled();

      // Resolve the promise
      resolveSignIn({ uid: "123" });

      await waitFor(() => {
        expect(screen.getByText(/sign in with google/i)).toBeInTheDocument();
      });
    });

    it("should not trigger auth flow multiple times when button is clicked rapidly", async () => {
      const user = userEvent.setup();
      let resolveSignIn;
      const signInPromise = new Promise((resolve) => {
        resolveSignIn = resolve;
      });

      vi.mocked(firebase.signInWithGoogle).mockReturnValue(signInPromise);

      render(<Login />);

      const signInButton = screen.getByRole("button", {
        name: /sign in with google/i,
      });

      // Try to click multiple times
      await user.click(signInButton);
      await user.click(signInButton);
      await user.click(signInButton);

      // Should only be called once because button is disabled after first click
      expect(firebase.signInWithGoogle).toHaveBeenCalledTimes(1);

      resolveSignIn({ uid: "123" });
    });
  });

  describe("Error Handling", () => {
    it("should display error message when sign-in fails", async () => {
      const user = userEvent.setup();
      const errorMessage = "Failed to sign in with Google";

      vi.mocked(firebase.signInWithGoogle).mockRejectedValue(
        new Error(errorMessage)
      );

      render(<Login />);

      const signInButton = screen.getByRole("button", {
        name: /sign in with google/i,
      });

      await user.click(signInButton);

      await waitFor(() => {
        expect(screen.getByText("Authentication Error")).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it("should display error message for popup closed by user", async () => {
      const user = userEvent.setup();
      const errorMessage = "Popup closed by user";

      vi.mocked(firebase.signInWithGoogle).mockRejectedValue(
        new Error(errorMessage)
      );

      render(<Login />);

      const signInButton = screen.getByRole("button", {
        name: /sign in with google/i,
      });

      await user.click(signInButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it("should clear previous error when attempting to sign in again", async () => {
      const user = userEvent.setup();

      // First attempt fails
      vi.mocked(firebase.signInWithGoogle).mockRejectedValueOnce(
        new Error("First error")
      );

      render(<Login />);

      const signInButton = screen.getByRole("button", {
        name: /sign in with google/i,
      });

      // First click - should show error
      await user.click(signInButton);

      await waitFor(() => {
        expect(screen.getByText("First error")).toBeInTheDocument();
      });

      // Second attempt succeeds
      vi.mocked(firebase.signInWithGoogle).mockResolvedValueOnce({
        uid: "123",
      });

      // Second click - error should disappear
      await user.click(signInButton);

      await waitFor(() => {
        expect(screen.queryByText("First error")).not.toBeInTheDocument();
      });
    });

    it("should re-enable button after error", async () => {
      const user = userEvent.setup();

      vi.mocked(firebase.signInWithGoogle).mockRejectedValue(
        new Error("Sign-in failed")
      );

      render(<Login />);

      const signInButton = screen.getByRole("button", {
        name: /sign in with google/i,
      });

      await user.click(signInButton);

      await waitFor(() => {
        expect(screen.getByText("Sign-in failed")).toBeInTheDocument();
      });

      // Button should be enabled again after error
      expect(signInButton).not.toBeDisabled();
    });
  });

  describe("UI Rendering", () => {
    it("should render welcome message and branding", () => {
      render(<Login />);

      expect(
        screen.getByText("Welcome to CollabCanvas")
      ).toBeInTheDocument();
      expect(
        screen.getByText(/real-time collaborative canvas for creative teams/i)
      ).toBeInTheDocument();
    });

    it("should render Google sign-in button with icon", () => {
      render(<Login />);

      const signInButton = screen.getByRole("button", {
        name: /sign in with google/i,
      });

      expect(signInButton).toBeInTheDocument();
      // Google logo SVG should be present
      expect(signInButton.querySelector("svg")).toBeInTheDocument();
    });

    it("should not show error message initially", () => {
      render(<Login />);

      expect(
        screen.queryByText("Authentication Error")
      ).not.toBeInTheDocument();
    });
  });
});

