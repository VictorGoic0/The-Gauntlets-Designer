import { serverTimestamp } from "firebase/firestore";

/**
 * Firestore collection structure for canvas objects:
 * Collection: /projects/shared-canvas/objects/{objectId}
 *
 * Fields:
 * - type: string (rectangle, circle, text)
 * - x: number
 * - y: number
 * - width: number
 * - height: number
 * - fill: string (hex color)
 * - rotation: number (degrees)
 * - zIndex: number
 * - createdBy: string (userId)
 * - createdAt: Firestore server timestamp (when object was created, never changes)
 * - lastModifiedBy: string (userId)
 * - lastEditedAt: Firestore server timestamp (when object was last edited, updates on edits)
 */

/**
 * Generate a unique ID for a canvas object
 * @returns {string} Unique ID
 */
export const generateObjectId = () => {
  return `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create a new rectangle object
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {string} userId - User ID who created the object
 * @param {Object} options - Optional properties (width, height, fill)
 * @returns {Object} Rectangle object
 */
export const createRectangle = (x, y, userId, options = {}) => {
  return {
    type: "rectangle",
    x,
    y,
    width: options.width || 100,
    height: options.height || 100,
    fill: options.fill || "#3B82F6", // Default blue color
    rotation: 0,
    zIndex: options.zIndex || 0,
    createdBy: userId,
    createdAt: serverTimestamp(), // When object was created (never changes)
    lastModifiedBy: userId,
  };
};

/**
 * Create a new circle object
 * @param {number} x - X position (center)
 * @param {number} y - Y position (center)
 * @param {string} userId - User ID who created the object
 * @param {Object} options - Optional properties (radius, fill)
 * @returns {Object} Circle object
 */
export const createCircle = (x, y, userId, options = {}) => {
  return {
    type: "circle",
    x,
    y,
    radius: options.radius || 50,
    fill: options.fill || "#10B981", // Default green color
    rotation: 0,
    zIndex: options.zIndex || 0,
    createdBy: userId,
    createdAt: serverTimestamp(), // When object was created (never changes)
    lastModifiedBy: userId,
  };
};

/**
 * Create a new text object
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {string} userId - User ID who created the object
 * @param {Object} options - Optional properties (text, fontSize, fill)
 * @returns {Object} Text object
 */
export const createText = (x, y, userId, options = {}) => {
  return {
    type: "text",
    x,
    y,
    text: options.text || "Double-click to edit",
    fontSize: options.fontSize || 16,
    fontFamily: options.fontFamily || "Arial",
    width: options.width || 200,
    fill: options.fill || "#FFFFFF", // Default white color
    rotation: 0,
    zIndex: options.zIndex || 0,
    createdBy: userId,
    createdAt: serverTimestamp(), // When object was created (never changes)
    lastModifiedBy: userId,
  };
};
