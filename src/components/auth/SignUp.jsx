import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signUpWithEmail, signInWithGoogle } from "../../lib/firebase";
import { showSuccess, showError } from "../../utils/toast";
import { AUTH_ERROR_MESSAGES } from "./Login";
import Card from "../design-system/Card";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      const errorMessage = "Please enter a display name";
      showError(errorMessage);
      return;
    }
    
    try {
      setLoading(true);
      await signUpWithEmail(email, password, displayName);
      showSuccess("Account created successfully! Welcome!");
      // User will be redirected automatically by AuthContext
      navigate("/");
    } catch (error) {
      // Get error code from either error.code or error.message
      const errorCode = error.code || error.message;
      
      // Map error code to user-friendly message
      let errorMessage;
      switch (errorCode) {
        case "auth/email-already-in-use":
        case "auth/weak-password":
        case "auth/invalid-email":
        case "EMAIL_EXISTS":
        case "WEAK_PASSWORD":
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
      showSuccess("Account created successfully! Welcome!");
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4 py-12">
      <Card variant="elevated" padding="lg" style={{ width: '420px', minHeight: '400px' }}>
        <div className="text-center">
          <h2 className="text-3xl font-bold" style={{ color: '#111827' }}>
            Create your account
          </h2>
          <p className="mt-2 text-sm" style={{ color: '#4B5563' }}>
            Join the collaborative canvas
          </p>
        </div>

        <div className="space-y-6">
          {/* Email/Password Sign Up Form */}
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium" style={{ color: '#111827' }}>
                Display Name
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium" style={{ color: '#111827' }}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium" style={{ color: '#111827' }}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="At least 6 characters"
              />
            </div>

            <div className="flex justify-center" style={{ marginTop: '32px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{ width: '200px', height: '40px' }}
                className="px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Creating account..." : "Sign up"}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white" style={{ color: '#6B7280' }}>Or continue with</span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <div className="flex justify-center">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              style={{ width: '240px', height: '40px' }}
              className="flex items-center justify-center gap-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            Sign in with Google
            </button>
          </div>

          {/* Link to Login */}
          <div className="text-center">
            <p className="text-sm" style={{ color: '#4B5563' }}>
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium hover:text-blue-500"
                style={{ color: '#2563EB' }}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

