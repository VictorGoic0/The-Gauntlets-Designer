import toast from "react-hot-toast";
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from "../styles/tokens";

/**
 * Toast Utility
 *
 * Custom wrapper around react-hot-toast with our design system styling.
 * Provides helper functions for different toast types.
 *
 * Usage:
 * import { showSuccess, showError, showWarning, showInfo } from '../utils/toast';
 *
 * showSuccess('Login successful!');
 * showError('Invalid credentials');
 * showWarning('Connection unstable');
 * showInfo('New update available');
 */

// Base toast configuration
export const toastConfig = {
  // Default options for all toasts
  duration: 4000,
  position: "top-right",

  // Styling
  style: {
    background: colors.background.paper,
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.base,
    fontWeight: typography.fontWeight.medium,
    padding: spacing[4],
    borderRadius: borderRadius.md,
    boxShadow: shadows.elevation[6],
    maxWidth: "400px",
  },

  // Success styling
  success: {
    duration: 3000,
    style: {
      background: colors.success.main,
      color: colors.success.contrastText,
    },
    iconTheme: {
      primary: colors.success.contrastText,
      secondary: colors.success.main,
    },
  },

  // Error styling
  error: {
    duration: 5000,
    style: {
      background: colors.error.main,
      color: colors.error.contrastText,
    },
    iconTheme: {
      primary: colors.error.contrastText,
      secondary: colors.error.main,
    },
  },

  // Loading styling
  loading: {
    style: {
      background: colors.neutral[700],
      color: colors.neutral[0],
    },
  },
};

/**
 * Show a success toast
 * @param {string} message - Message to display
 * @param {object} options - Additional toast options
 */
export const showSuccess = (message, options = {}) => {
  return toast.success(message, {
    ...toastConfig.success,
    ...options,
  });
};

/**
 * Show an error toast
 * @param {string} message - Error message to display
 * @param {object} options - Additional toast options
 */
export const showError = (message, options = {}) => {
  return toast.error(message, {
    ...toastConfig.error,
    ...options,
  });
};

/**
 * Show a warning toast
 * @param {string} message - Warning message to display
 * @param {object} options - Additional toast options
 */
export const showWarning = (message, options = {}) => {
  return toast(message, {
    duration: 4000,
    style: {
      ...toastConfig.style,
      background: colors.warning.main,
      color: colors.warning.contrastText,
    },
    icon: "⚠️",
    ...options,
  });
};

/**
 * Show an info toast
 * @param {string} message - Info message to display
 * @param {object} options - Additional toast options
 */
export const showInfo = (message, options = {}) => {
  return toast(message, {
    duration: 4000,
    style: {
      ...toastConfig.style,
      background: colors.info.main,
      color: colors.info.contrastText,
    },
    icon: "ℹ️",
    ...options,
  });
};

/**
 * Show a loading toast
 * @param {string} message - Loading message to display
 * @param {object} options - Additional toast options
 * @returns {string} Toast ID (use to dismiss later with toast.dismiss(id))
 */
export const showLoading = (message, options = {}) => {
  return toast.loading(message, {
    ...toastConfig.loading,
    ...options,
  });
};

/**
 * Dismiss a specific toast by ID
 * @param {string} toastId - ID of the toast to dismiss
 */
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

/**
 * Dismiss all toasts
 */
export const dismissAll = () => {
  toast.dismiss();
};

/**
 * Custom toast with full control
 * @param {string} message - Message to display
 * @param {object} options - Toast options
 */
export const showCustom = (message, options = {}) => {
  return toast(message, {
    ...toastConfig,
    ...options,
  });
};

// Export the base toast object for advanced use cases
export { toast };

// Default export with all helpers
export default {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  loading: showLoading,
  custom: showCustom,
  dismiss: dismissToast,
  dismissAll,
  toast, // Original toast object
};
