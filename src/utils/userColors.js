// Color palette - 10 vibrant, distinct colors for user cursors
const COLOR_PALETTE = [
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
 * Get a consistent color for a user based on their userId
 * @param {string} userId - The unique identifier for the user
 * @returns {string} A hex color code
 */
export const getUserColor = (userId) => {
  if (!userId) {
    return COLOR_PALETTE[0];
  }

  // Simple hash function to convert userId to a number
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
