// Color palette - 10 vibrant, distinct colors for user cursors
export const COLOR_PALETTE = [
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#FFA07A", // Light Salmon
  "#98D8C8", // Mint
  "#F7DC6F", // Yellow
  "#BB8FCE", // Purple
  "#85C1E2", // Sky Blue
  "#F8B739", // Orange
  "#52B788", // Green
];

/**
 * Get a consistent color for a user based on their userId.
 * The same userId will always return the same color (deterministic),
 * ensuring consistent cursor colors across sessions.
 *
 * @param {string} userId - The unique identifier for the user (Firebase Auth UID)
 * @returns {string} A hex color code from the palette
 */
export const getUserColor = (userId) => {
  if (!userId) {
    return COLOR_PALETTE[0];
  }

  // Hash function to convert userId string to a number
  // This ensures the same user always gets the same color
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Use modulo to get an index within our color palette
  const index = Math.abs(hash) % COLOR_PALETTE.length;

  return COLOR_PALETTE[index];
};

export default getUserColor;
