import { colors, typography, spacing, borderRadius, shadows, transitions } from '../../styles/tokens';
import ButtonSpinnerIcon from '../icons/ButtonSpinnerIcon';

/**
 * Button Component
 * 
 * A versatile button component with multiple variants, sizes, and states.
 * Fully accessible with proper ARIA labels and keyboard navigation.
 * 
 * @example
 * // Primary button
 * <Button variant="primary" onClick={handleClick}>
 *   Sign In
 * </Button>
 * 
 * @example
 * // Button with loading state
 * <Button variant="primary" loading disabled>
 *   Loading...
 * </Button>
 * 
 * @example
 * // Outline button with icon
 * <Button variant="outline" size="sm">
 *   <span>✓</span> Success
 * </Button>
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  type = 'button',
  onClick,
  className = '',
  style = {},
  ariaLabel,
  ...props
}) {
  // Base button styles
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    fontFamily: typography.fontFamily.base,
    fontWeight: typography.fontWeight.semibold,
    border: 'none',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    textDecoration: 'none',
    transition: `all ${transitions.duration.short} ${transitions.easing.easeInOut}`,
    outline: 'none',
    userSelect: 'none',
    ...(fullWidth && { width: '100%' }),
  };

  // Size styles
  const sizeStyles = {
    sm: {
      fontSize: typography.fontSize.sm,
      padding: `${spacing[2]} ${spacing[4]}`,
      borderRadius: borderRadius.base,
      minHeight: '32px',
    },
    md: {
      fontSize: typography.fontSize.base,
      padding: `${spacing[3]} ${spacing[6]}`,
      borderRadius: borderRadius.base,
      minHeight: '40px',
    },
    lg: {
      fontSize: typography.fontSize.lg,
      padding: `${spacing[4]} ${spacing[8]}`,
      borderRadius: borderRadius.md,
      minHeight: '48px',
    },
  };

  // Variant styles
  const variantStyles = {
    primary: {
      backgroundColor: colors.primary.mediumDark,
      color: colors.neutral.white,
      boxShadow: shadows.sm,
      border: `1px solid ${colors.primary.mediumDark}`,
    },
    secondary: {
      backgroundColor: colors.secondary.mediumDark,
      color: colors.neutral.white,
      boxShadow: shadows.sm,
      border: `1px solid ${colors.secondary.mediumDark}`,
    },
    outline: {
      backgroundColor: 'transparent',
      color: colors.primary.mediumDark,
      boxShadow: 'none',
      border: `1px solid ${colors.primary.mediumDark}`,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.text.primary,
      boxShadow: 'none',
      border: '1px solid transparent',
    },
  };

  // Disabled styles
  const disabledStyles = disabled || loading ? {
    opacity: 0.6,
    cursor: 'not-allowed',
  } : {};

  // Combine all styles
  const buttonStyles = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...disabledStyles,
    ...style,
  };

  // Hover styles (applied via inline style event handlers)
  const getHoverStyles = () => {
    if (disabled || loading) return {};
    
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary.dark,
          borderColor: colors.primary.dark,
          boxShadow: shadows.md,
        };
      case 'secondary':
        return {
          backgroundColor: colors.secondary.dark,
          borderColor: colors.secondary.dark,
          boxShadow: shadows.md,
        };
      case 'outline':
        return {
          backgroundColor: colors.primary.lightest,
          borderColor: colors.primary.dark,
          color: colors.primary.dark,
        };
      case 'ghost':
        return {
          backgroundColor: colors.action.hover,
        };
      default:
        return {};
    }
  };

  // Active/press styles
  const getActiveStyles = () => {
    if (disabled || loading) return {};
    
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary.darker,
          borderColor: colors.primary.darker,
        };
      case 'secondary':
        return {
          backgroundColor: colors.secondary.darker,
          borderColor: colors.secondary.darker,
        };
      case 'outline':
        return {
          backgroundColor: colors.primary.lighter,
        };
      case 'ghost':
        return {
          backgroundColor: colors.action.selected,
        };
      default:
        return {};
    }
  };

  // Focus styles
  const getFocusStyles = () => {
    if (disabled || loading) return {};
    
    return {
      boxShadow: `0 0 0 3px ${colors.primary.base}33`, // 33 = 20% opacity
    };
  };

  const onMouseEnterButton = (event) => {
    if (!disabled && !loading) {
      Object.assign(event.currentTarget.style, getHoverStyles());
    }
  };

  const onMouseLeaveButton = (event) => {
    if (!disabled && !loading) {
      Object.assign(event.currentTarget.style, {
        ...variantStyles[variant],
        ...sizeStyles[size],
      });
    }
  };

  const onMouseDownButton = (event) => {
    if (!disabled && !loading) {
      Object.assign(event.currentTarget.style, getActiveStyles());
    }
  };

  const onMouseUpButton = (event) => {
    if (!disabled && !loading) {
      Object.assign(event.currentTarget.style, getHoverStyles());
    }
  };

  const onFocusButton = (event) => {
    if (!disabled && !loading) {
      Object.assign(event.currentTarget.style, {
        ...variantStyles[variant],
        ...getFocusStyles(),
      });
    }
  };

  const onBlurButton = (event) => {
    if (!disabled && !loading) {
      Object.assign(event.currentTarget.style, variantStyles[variant]);
    }
  };

  return (
    <button
      type={type}
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-busy={loading}
      className={className}
      style={buttonStyles}
      onMouseEnter={onMouseEnterButton}
      onMouseLeave={onMouseLeaveButton}
      onMouseDown={onMouseDownButton}
      onMouseUp={onMouseUpButton}
      onFocus={onFocusButton}
      onBlur={onBlurButton}
      {...props}
    >
      {/* Loading spinner */}
      {loading && <ButtonSpinnerIcon />}
      
      {children}
    </button>
  );
}
