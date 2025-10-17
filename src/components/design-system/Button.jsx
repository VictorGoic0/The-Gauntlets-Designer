import PropTypes from 'prop-types';
import { colors, typography, spacing, borderRadius, shadows, transitions } from '../../styles/tokens';

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
      backgroundColor: colors.primary[600],
      color: '#ffffff',
      boxShadow: shadows.sm,
      border: `1px solid ${colors.primary[600]}`,
    },
    secondary: {
      backgroundColor: colors.secondary[600],
      color: '#ffffff',
      boxShadow: shadows.sm,
      border: `1px solid ${colors.secondary[600]}`,
    },
    outline: {
      backgroundColor: 'transparent',
      color: colors.primary[600],
      boxShadow: 'none',
      border: `1px solid ${colors.primary[600]}`,
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
          backgroundColor: colors.primary[700],
          borderColor: colors.primary[700],
          boxShadow: shadows.md,
        };
      case 'secondary':
        return {
          backgroundColor: colors.secondary[700],
          borderColor: colors.secondary[700],
          boxShadow: shadows.md,
        };
      case 'outline':
        return {
          backgroundColor: colors.primary[50],
          borderColor: colors.primary[700],
          color: colors.primary[700],
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
          backgroundColor: colors.primary[800],
          borderColor: colors.primary[800],
        };
      case 'secondary':
        return {
          backgroundColor: colors.secondary[800],
          borderColor: colors.secondary[800],
        };
      case 'outline':
        return {
          backgroundColor: colors.primary[100],
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
      boxShadow: `0 0 0 3px ${colors.primary[500]}33`, // 33 = 20% opacity
    };
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
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, getHoverStyles());
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, {
            ...variantStyles[variant],
            ...sizeStyles[size],
          });
        }
      }}
      onMouseDown={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, getActiveStyles());
        }
      }}
      onMouseUp={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, getHoverStyles());
        }
      }}
      onFocus={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, {
            ...variantStyles[variant],
            ...getFocusStyles(),
          });
        }
      }}
      onBlur={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, variantStyles[variant]);
        }
      }}
      {...props}
    >
      {/* Loading spinner */}
      {loading && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            animation: 'spin 1s linear infinite',
          }}
        >
          <style>
            {`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}
          </style>
          <circle cx="12" cy="12" r="10" opacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" opacity="0.75" />
        </svg>
      )}
      
      {children}
    </button>
  );
}

Button.propTypes = {
  /** Button content */
  children: PropTypes.node.isRequired,
  
  /** Visual variant of the button */
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'ghost']),
  
  /** Button size */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  
  /** Show loading spinner and disable button */
  loading: PropTypes.bool,
  
  /** Disable the button */
  disabled: PropTypes.bool,
  
  /** Make button full width */
  fullWidth: PropTypes.bool,
  
  /** Button type attribute */
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  
  /** Click handler */
  onClick: PropTypes.func,
  
  /** Additional CSS classes */
  className: PropTypes.string,
  
  /** Custom inline styles */
  style: PropTypes.object,
  
  /** ARIA label for accessibility */
  ariaLabel: PropTypes.string,
};

