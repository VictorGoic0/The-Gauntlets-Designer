import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmail, signInWithGoogle } from "../../lib/firebase";
import { showSuccess, showError } from "../../utils/toast";
import Card from "../design-system/Card";
import Button from "../design-system/Button";
import Input from "../design-system/Input";
import { colors, typography, spacing } from "../../styles/tokens";

// Firebase Auth error code to user-friendly message mapping
export const AUTH_ERROR_MESSAGES = {
  "auth/invalid-credential": "Invalid email or password. Please try again.",
  "auth/user-not-found": "No account found with this email. Please sign up.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/user-disabled": "This account has been disabled. Please contact support.",
  "auth/too-many-requests": "Too many failed login attempts. Please try again later.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Password should be at least 6 characters.",
  "INVALID_LOGIN_CREDENTIALS": "Invalid email or password. Please try again.",
  "EMAIL_EXISTS": "An account with this email already exists.",
  "WEAK_PASSWORD": "Password should be at least 6 characters.",
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await signInWithEmail(email, password);
      showSuccess("Welcome back!");
      // User will be redirected automatically by AuthContext
      navigate("/");
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
          errorMessage = error.message || "An error occurred. Please try again.";
      }
      
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      showSuccess("Welcome back!");
      // User will be redirected automatically by AuthContext
      navigate("/");
    } catch (error) {
      // Get error code from either error.code or error.message
      const errorCode = error.code || error.message;
      
      // Map error code to user-friendly message
      const errorMessage = AUTH_ERROR_MESSAGES[errorCode] || error.message || "An error occurred. Please try again.";
      
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const titleStyle = {
    fontSize: typography.fontSize['3xl'],
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
    textDecoration: 'none',
  };

  const googleButtonStyle = {
    width: '240px',
    backgroundColor: colors.neutral.white,
    borderColor: colors.neutral.lightBase,
    color: colors.neutral.dark,
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4 py-12">
      <Card variant="elevated" padding="lg" style={{ width: '420px', minHeight: '400px' }}>
        <div className="text-center">
          <h2 style={titleStyle}>
            Welcome to Goico's Artist
          </h2>
          <p style={subtitleStyle}>
            Real-time collaborative canvas for creative teams
          </p>
        </div>

        <div className="space-y-6">
          {/* Email/Password Login Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <Input
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />

            <Input
              label="Password"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />

            <div className="flex justify-center" style={{ marginTop: '32px' }}>
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
                disabled={loading}
                style={{ width: '200px' }}
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
              onClick={handleGoogleSignIn}
              variant="outline"
              size="md"
              disabled={loading}
              style={googleButtonStyle}
            >
            <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
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

