import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmail, signInWithGoogle } from "../../lib/firebase";
import { showSuccess, showError } from "../../utils/toast";
import Card from "../design-system/Card";
import Button from "../design-system/Button";
import Input from "../design-system/Input";
import { colors, typography, spacing } from "../../styles/tokens";
import GoogleMarkIcon from "../icons/GoogleMarkIcon";

// Firebase Auth error code to user-friendly message mapping
export const AUTH_ERROR_MESSAGES = {
  "auth/invalid-credential": "Invalid email or password. Please try again.",
  "auth/user-not-found": "No account found with this email. Please sign up.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/user-disabled":
    "This account has been disabled. Please contact support.",
  "auth/too-many-requests":
    "Too many failed login attempts. Please try again later.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Password should be at least 6 characters.",
  INVALID_LOGIN_CREDENTIALS: "Invalid email or password. Please try again.",
  EMAIL_EXISTS: "An account with this email already exists.",
  WEAK_PASSWORD: "Password should be at least 6 characters.",
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onChangeEmailField = (event) => setEmail(event.target.value);

  const onChangePasswordField = (event) => setPassword(event.target.value);

  const onSubmitEmailSignInForm = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      await signInWithEmail(email, password);
      showSuccess("Welcome back!");
      // User will be redirected automatically by AuthContext
      void navigate("/");
    } catch (error) {
      // Get error code from either error.code or error.message
      const errorCode = error.code || error.message;

      // Map error code to user-friendly message
      let errorMessage;
      switch (errorCode) {
        case "auth/invalid-credential":
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-email":
        case "auth/user-disabled":
        case "auth/too-many-requests":
        case "INVALID_LOGIN_CREDENTIALS":
          errorMessage = AUTH_ERROR_MESSAGES[errorCode];
          break;
        default:
          errorMessage =
            error.message || "An error occurred. Please try again.";
      }

      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onClickGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      showSuccess("Welcome back!");
      // User will be redirected automatically by AuthContext
      void navigate("/");
    } catch (error) {
      // Get error code from either error.code or error.message
      const errorCode = error.code || error.message;

      // Map error code to user-friendly message
      const errorMessage =
        AUTH_ERROR_MESSAGES[errorCode] ||
        error.message ||
        "An error occurred. Please try again.";

      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const titleStyle = {
    fontSize: typography.fontSize["3xl"],
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral.darkest,
    margin: 0,
    fontFamily: typography.fontFamily.base,
  };

  const subtitleStyle = {
    marginTop: spacing[2],
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.base,
  };

  const dividerTextStyle = {
    padding: `0 ${spacing[2]}`,
    backgroundColor: colors.background.paper,
    color: colors.neutral.base,
    fontSize: typography.fontSize.sm,
  };

  const linkStyle = {
    color: colors.primary.dark,
    fontWeight: typography.fontWeight.medium,
    textDecoration: "none",
  };

  const googleButtonStyle = {
    width: "240px",
    backgroundColor: colors.neutral.white,
    borderColor: colors.neutral.lightBase,
    color: colors.neutral.dark,
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4 py-12">
      <Card
        variant="elevated"
        padding="lg"
        style={{ width: "420px", minHeight: "400px" }}
      >
        <div className="text-center">
          <h2 style={titleStyle}>Welcome to Black Canvas</h2>
          <p style={subtitleStyle}>
            Real-time collaborative canvas for creative teams
          </p>
        </div>

        <div className="space-y-6">
          {/* Email/Password Login Form */}
          <form onSubmit={onSubmitEmailSignInForm} className="space-y-4">
            <Input
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={onChangeEmailField}
              placeholder="you@example.com"
            />

            <Input
              label="Password"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={onChangePasswordField}
              placeholder="Enter your password"
            />

            <div className="flex justify-center" style={{ marginTop: "32px" }}>
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
                disabled={loading}
                style={{ width: "200px" }}
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span style={dividerTextStyle}>Or continue with</span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <div className="flex justify-center">
            <Button
              onClick={onClickGoogleSignIn}
              variant="outline"
              size="md"
              disabled={loading}
              style={googleButtonStyle}
            >
              <GoogleMarkIcon style={{ width: "18px", height: "18px" }} />
              <span>Sign in with Google</span>
            </Button>
          </div>

          {/* Link to Sign Up */}
          <div className="text-center">
            <p className="text-sm" style={{ color: colors.text.secondary }}>
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-medium hover:text-blue-500"
                style={linkStyle}
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
