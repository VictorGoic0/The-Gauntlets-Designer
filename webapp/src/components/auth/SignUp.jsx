import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signUpWithEmail, signInWithGoogle } from "../../lib/firebase";
import { showSuccess, showError } from "../../utils/toast";
import { AUTH_ERROR_MESSAGES } from "./Login";
import Card from "../design-system/Card";
import Button from "../design-system/Button";
import Input from "../design-system/Input";
import { colors, typography, spacing } from "../../styles/tokens";
import GoogleMarkIcon from "../icons/GoogleMarkIcon";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onChangeDisplayNameField = (event) =>
    setDisplayName(event.target.value);

  const onChangeEmailField = (event) => setEmail(event.target.value);

  const onChangePasswordField = (event) => setPassword(event.target.value);

  const onSubmitSignUpForm = async (event) => {
    event.preventDefault();
    
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
      void navigate("/");
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

  const onClickGoogleSignUpWithGoogle = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      showSuccess("Account created successfully! Welcome!");
      // User will be redirected automatically by AuthContext
      void navigate("/");
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
            Create your account
          </h2>
          <p style={subtitleStyle}>
            Join the collaborative canvas
          </p>
        </div>

        <div className="space-y-6">
          {/* Email/Password Sign Up Form */}
          <form onSubmit={onSubmitSignUpForm} className="space-y-4">
            <Input
              label="Display Name"
              type="text"
              name="displayName"
              required
              value={displayName}
              onChange={onChangeDisplayNameField}
              placeholder="John Doe"
            />

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
              autoComplete="new-password"
              required
              value={password}
              onChange={onChangePasswordField}
              placeholder="At least 6 characters"
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
                {loading ? "Creating account..." : "Sign up"}
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
              onClick={onClickGoogleSignUpWithGoogle}
              variant="outline"
              size="md"
              disabled={loading}
              style={googleButtonStyle}
            >
            <GoogleMarkIcon style={{ width: "18px", height: "18px" }} />
            <span>Sign in with Google</span>
            </Button>
          </div>

          {/* Link to Login */}
          <div className="text-center">
            <p className="text-sm" style={{ color: colors.text.secondary }}>
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium hover:text-blue-500"
                style={linkStyle}
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

