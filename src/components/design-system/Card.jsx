import { colors, spacing, borderRadius, shadows, transitions } from '../../styles/tokens';

/**
 * Card Component
 * 
 * A versatile container component for grouping related content.
 * Inspired by Material Design with modern styling.
 * 
 * @example
 * // Elevated card (default)
 * <Card>Content here</Card>
 * 
 * @example
 * // Outlined card
 * <Card variant="outlined">Content here</Card>
 * 
 * @example
 * // Flat card with custom padding
 * <Card variant="flat" padding="lg">Content here</Card>
 * 
 * @example
 * // Card with hover effect
 * <Card hover>Content here</Card>
 */
export default function Card({
  children,
  variant = 'elevated',
  padding = 'md',
  hover = false,
  className = '',
  style = {},
  ...props
}) {
  // Base styles applied to all cards
  const baseStyles = {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    transition: transitions.duration.standard + ' ' + transitions.easing.easeInOut,
    fontFamily: 'inherit',
  };

  // Variant-specific styles
  const variantStyles = {
    elevated: {
      boxShadow: shadows.elevation[2],
      border: 'none',
    },
    outlined: {
      boxShadow: 'none',
      border: `1px solid ${colors.divider}`,
    },
    flat: {
      boxShadow: 'none',
      border: 'none',
      backgroundColor: colors.background.default,
    },
  };

  // Padding options
  const paddingStyles = {
    none: {
      padding: 0,
    },
    sm: {
      padding: spacing[4], // 16px
    },
    md: {
      padding: spacing[6], // 24px
    },
    lg: {
      padding: spacing[8], // 32px
    },
  };

  // Hover effect (optional)
  const hoverStyles = hover ? {
    cursor: 'pointer',
  } : {};

  // Combine all styles
  const cardStyles = {
    ...baseStyles,
    ...variantStyles[variant],
    ...paddingStyles[padding],
    ...hoverStyles,
    ...style, // Allow custom styles to override
  };

  // Add hover class for CSS hover effects
  const hoverClass = hover ? 'card-hover' : '';

  return (
    <>
      {/* Inject hover styles if needed */}
      {hover && (
        <style>
          {`
            .card-hover:hover {
              box-shadow: ${variant === 'elevated' ? shadows.elevation[8] : shadows.elevation[4]};
              transform: translateY(-2px);
            }
          `}
        </style>
      )}
      
      <div
        className={`${hoverClass} ${className}`.trim()}
        style={cardStyles}
        {...props}
      >
        {children}
      </div>
    </>
  );
}
