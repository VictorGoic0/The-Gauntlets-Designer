/**
 * Design Tokens
 *
 * Foundational design values for the CollabCanvas design system.
 * Inspired by Material Design principles with a modern aesthetic.
 */

// ============================================================================
// COLORS
// ============================================================================

export const colors = {
  // Primary - Blue palette (main brand color)
  primary: {
    50: "#e3f2fd",
    100: "#bbdefb",
    200: "#90caf9",
    300: "#64b5f6",
    400: "#42a5f5",
    500: "#2196f3", // Main
    600: "#1e88e5",
    700: "#1976d2",
    800: "#1565c0",
    900: "#0d47a1",
  },

  // Secondary - Purple/Indigo palette (accent color)
  secondary: {
    50: "#f3e5f5",
    100: "#e1bee7",
    200: "#ce93d8",
    300: "#ba68c8",
    400: "#ab47bc",
    500: "#9c27b0", // Main
    600: "#8e24aa",
    700: "#7b1fa2",
    800: "#6a1b9a",
    900: "#4a148c",
  },

  // Neutral - Gray palette (text, backgrounds, borders)
  neutral: {
    0: "#ffffff",
    50: "#fafafa",
    100: "#f5f5f5",
    200: "#eeeeee",
    300: "#e0e0e0",
    400: "#bdbdbd",
    500: "#9e9e9e",
    600: "#757575",
    700: "#616161",
    800: "#424242",
    900: "#212121",
    1000: "#000000",
  },

  // Semantic colors
  success: {
    light: "#81c784",
    main: "#4caf50",
    dark: "#388e3c",
    contrastText: "#ffffff",
  },

  error: {
    light: "#e57373",
    main: "#f44336",
    dark: "#d32f2f",
    contrastText: "#ffffff",
  },

  warning: {
    light: "#ffb74d",
    main: "#ff9800",
    dark: "#f57c00",
    contrastText: "#000000",
  },

  info: {
    light: "#64b5f6",
    main: "#2196f3",
    dark: "#1976d2",
    contrastText: "#ffffff",
  },

  // Background colors
  background: {
    default: "#fafafa",
    paper: "#ffffff",
    elevated: "#ffffff",
  },

  // Text colors
  text: {
    primary: "rgba(0, 0, 0, 0.87)",
    secondary: "rgba(0, 0, 0, 0.6)",
    disabled: "rgba(0, 0, 0, 0.38)",
    hint: "rgba(0, 0, 0, 0.38)",
  },

  // Divider
  divider: "rgba(0, 0, 0, 0.12)",

  // Action colors (for interactive elements)
  action: {
    active: "rgba(0, 0, 0, 0.54)",
    hover: "rgba(0, 0, 0, 0.04)",
    selected: "rgba(0, 0, 0, 0.08)",
    disabled: "rgba(0, 0, 0, 0.26)",
    disabledBackground: "rgba(0, 0, 0, 0.12)",
    focus: "rgba(0, 0, 0, 0.12)",
  },
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  // Font family
  fontFamily: {
    base: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'Consolas, Monaco, "Courier New", monospace',
  },

  // Font sizes
  fontSize: {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    base: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
    "5xl": "3rem", // 48px
  },

  // Font weights
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Line heights
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Letter spacing
  letterSpacing: {
    tighter: "-0.05em",
    tight: "-0.025em",
    normal: "0",
    wide: "0.025em",
    wider: "0.05em",
    widest: "0.1em",
  },
};

// ============================================================================
// SPACING
// ============================================================================

export const spacing = {
  0: "0",
  1: "0.25rem", // 4px
  2: "0.5rem", // 8px
  3: "0.75rem", // 12px
  4: "1rem", // 16px
  5: "1.25rem", // 20px
  6: "1.5rem", // 24px
  7: "1.75rem", // 28px
  8: "2rem", // 32px
  10: "2.5rem", // 40px
  12: "3rem", // 48px
  16: "4rem", // 64px
  20: "5rem", // 80px
  24: "6rem", // 96px
};

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
  none: "0",
  sm: "0.25rem", // 4px
  base: "0.5rem", // 8px
  md: "0.75rem", // 12px
  lg: "1rem", // 16px
  xl: "1.5rem", // 24px
  "2xl": "2rem", // 32px
  full: "9999px", // Fully rounded
};

// ============================================================================
// SHADOWS
// ============================================================================

export const shadows = {
  none: "none",
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  base: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",

  // Elevation system (Material Design inspired)
  elevation: {
    0: "none",
    1: "0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)",
    2: "0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)",
    3: "0px 3px 3px -2px rgba(0,0,0,0.2), 0px 3px 4px 0px rgba(0,0,0,0.14), 0px 1px 8px 0px rgba(0,0,0,0.12)",
    4: "0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)",
    6: "0px 3px 5px -1px rgba(0,0,0,0.2), 0px 6px 10px 0px rgba(0,0,0,0.14), 0px 1px 18px 0px rgba(0,0,0,0.12)",
    8: "0px 5px 5px -3px rgba(0,0,0,0.2), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)",
    12: "0px 7px 8px -4px rgba(0,0,0,0.2), 0px 12px 17px 2px rgba(0,0,0,0.14), 0px 5px 22px 4px rgba(0,0,0,0.12)",
    16: "0px 8px 10px -5px rgba(0,0,0,0.2), 0px 16px 24px 2px rgba(0,0,0,0.14), 0px 6px 30px 5px rgba(0,0,0,0.12)",
    24: "0px 11px 15px -7px rgba(0,0,0,0.2), 0px 24px 38px 3px rgba(0,0,0,0.14), 0px 9px 46px 8px rgba(0,0,0,0.12)",
  },
};

// ============================================================================
// TRANSITIONS
// ============================================================================

export const transitions = {
  // Duration
  duration: {
    shortest: "150ms",
    shorter: "200ms",
    short: "250ms",
    standard: "300ms",
    complex: "375ms",
    enteringScreen: "225ms",
    leavingScreen: "195ms",
  },

  // Easing
  easing: {
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    easeOut: "cubic-bezier(0.0, 0, 0.2, 1)",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
  },
};

// ============================================================================
// BREAKPOINTS (for future responsive design)
// ============================================================================

export const breakpoints = {
  xs: "0px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

// ============================================================================
// Z-INDEX
// ============================================================================

export const zIndex = {
  mobileStepper: 1000,
  speedDial: 1050,
  appBar: 1100,
  drawer: 1200,
  modal: 1300,
  snackbar: 1400,
  tooltip: 1500,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a color value from the token system
 * @param {string} path - Dot notation path (e.g., 'primary.500', 'success.main')
 * @returns {string} Color value
 */
export function getColor(path) {
  const keys = path.split(".");
  let value = colors;

  for (const key of keys) {
    value = value[key];
    if (value === undefined) {
      console.warn(`Color token not found: ${path}`);
      return colors.neutral[500]; // Fallback
    }
  }

  return value;
}

/**
 * Get a spacing value
 * @param {number} multiplier - Spacing scale multiplier
 * @returns {string} Spacing value
 */
export function getSpacing(multiplier) {
  return spacing[multiplier] || spacing[4]; // Default to 1rem
}

/**
 * Create a transition CSS string
 * @param {string} property - CSS property to transition
 * @param {string} duration - Duration key (e.g., 'standard', 'short')
 * @param {string} easing - Easing key (e.g., 'easeInOut', 'easeOut')
 * @returns {string} Transition CSS string
 */
export function createTransition(
  property = "all",
  duration = "standard",
  easing = "easeInOut"
) {
  return `${property} ${
    transitions.duration[duration] || transitions.duration.standard
  } ${transitions.easing[easing] || transitions.easing.easeInOut}`;
}

// Default export for convenience
export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  breakpoints,
  zIndex,
  getColor,
  getSpacing,
  createTransition,
};
