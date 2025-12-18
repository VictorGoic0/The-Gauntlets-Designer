import { useState } from 'react';
import { colors, typography, spacing, borderRadius, transitions } from '../../styles/tokens';

/**
 * Input Component
 * 
 * A fully-featured input component with label, error/success states,
 * helper text, icons, and password visibility toggle.
 * 
 * @example
 * // Basic input
 * <Input
 *   label="Email"
 *   type="email"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 * />
 * 
 * @example
 * // Input with error
 * <Input
 *   label="Password"
 *   type="password"
 *   value={password}
 *   onChange={(e) => setPassword(e.target.value)}
 *   error="Password must be at least 8 characters"
 * />
 * 
 * @example
 * // Input with success and helper text
 * <Input
 *   label="Username"
 *   value={username}
 *   onChange={(e) => setUsername(e.target.value)}
 *   success
 *   helperText="Username is available"
 * />
 */
export default function Input({
  label,
  type = 'text',
  value,
  onChange,
  error = '',
  success = false,
  helperText = '',
  placeholder = '',
  disabled = false,
  required = false,
  id,
  name,
  autoComplete,
  className = '',
  style = {},
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Generate unique ID if not provided
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  // Determine input type (handle password toggle)
  const inputType = type === 'password' && showPassword ? 'text' : type;

  // Determine current state
  const hasError = Boolean(error);
  const hasSuccess = success && !hasError;

  // Container styles
  const containerStyles = {
    marginBottom: spacing[4],
    width: '100%',
  };

  // Label styles
  const labelStyles = {
    display: 'block',
    marginBottom: spacing[1],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: hasError ? colors.error.main : colors.text.primary,
    fontFamily: typography.fontFamily.base,
  };

  // Input wrapper styles (for icon positioning)
  const inputWrapperStyles = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  };

  // Input base styles
  const inputBaseStyles = {
    width: '100%',
    padding: `${spacing[3]} ${spacing[4]}`,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.base,
    lineHeight: typography.lineHeight.normal,
    color: colors.text.primary,
    backgroundColor: disabled ? colors.action.disabledBackground : colors.background.paper,
    border: `1px solid ${colors.neutral.lightBase}`,
    borderRadius: borderRadius.base,
    outline: 'none',
    transition: `border-color ${transitions.duration.short} ${transitions.easing.easeInOut}, box-shadow ${transitions.duration.short} ${transitions.easing.easeInOut}`,
    cursor: disabled ? 'not-allowed' : 'text',
  };

  // Input state-specific styles
  let inputStateStyles = {};
  
  if (hasError) {
    inputStateStyles = {
      borderColor: colors.error.main,
      ...(isFocused && {
        boxShadow: `0 0 0 3px ${colors.error.main}33`, // 33 = 20% opacity
      }),
    };
  } else if (hasSuccess) {
    inputStateStyles = {
      borderColor: colors.success.main,
      ...(isFocused && {
        boxShadow: `0 0 0 3px ${colors.success.main}33`,
      }),
    };
  } else if (isFocused) {
    inputStateStyles = {
      borderColor: colors.primary.base,
      boxShadow: `0 0 0 3px ${colors.primary.base}1A`, // 1A = 10% opacity
    };
  }

  // Password toggle button styles
  const toggleButtonStyles = {
    position: 'absolute',
    right: spacing[3],
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: spacing[1],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.text.secondary,
    transition: `color ${transitions.duration.short} ${transitions.easing.easeInOut}`,
  };

  // Helper text styles
  const helperTextStyles = {
    marginTop: spacing[1],
    fontSize: typography.fontSize.xs,
    color: hasError
      ? colors.error.main
      : hasSuccess
      ? colors.success.main
      : colors.text.secondary,
    fontFamily: typography.fontFamily.base,
  };

  // Combine input styles
  const inputStyles = {
    ...inputBaseStyles,
    ...inputStateStyles,
    ...(type === 'password' && { paddingRight: spacing[10] }), // Make room for toggle button
    ...style,
  };

  const displayHelperText = error || helperText;

  return (
    <div style={containerStyles} className={className}>
      {/* Label */}
      {label && (
        <label htmlFor={inputId} style={labelStyles}>
          {label}
          {required && <span style={{ color: colors.error.main, marginLeft: spacing[1] }}>*</span>}
        </label>
      )}

      {/* Input wrapper (for positioning toggle button) */}
      <div style={inputWrapperStyles}>
        <input
          id={inputId}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          aria-invalid={hasError}
          aria-describedby={displayHelperText ? `${inputId}-helper` : undefined}
          style={inputStyles}
          {...props}
        />

        {/* Password visibility toggle button */}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            style={toggleButtonStyles}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = colors.text.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = colors.text.secondary;
            }}
          >
            {showPassword ? (
              // Eye slash icon (hide)
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              // Eye icon (show)
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Helper text or error message */}
      {displayHelperText && (
        <div id={`${inputId}-helper`} style={helperTextStyles}>
          {error || helperText}
        </div>
      )}
    </div>
  );
}
