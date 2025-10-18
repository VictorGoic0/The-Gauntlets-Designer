/**
 * AI Service - Handles communication with the AI Agent Firebase Function
 */

import { getFunctions, httpsCallable } from "firebase/functions";
import app from "../lib/firebase";

// Initialize Firebase Functions with explicit region
const functions = getFunctions(app, "us-central1");

/**
 * Execute an AI command on the canvas
 * @param {string} command - Natural language command from the user
 * @returns {Promise<Object>} Response from the AI agent
 */
export async function executeAICommand(command) {
  if (!command || command.trim().length === 0) {
    throw new Error("Command cannot be empty");
  }

  try {
    // Call the aiAgent Firebase Function
    const aiAgent = httpsCallable(functions, "aiAgent");
    const result = await aiAgent({ command: command.trim() });

    return result.data;
  } catch (error) {
    console.error("AI Service error:", error);

    // Provide user-friendly error messages
    if (error.code === "unauthenticated") {
      throw new Error("You must be signed in to use the AI assistant");
    } else if (error.code === "permission-denied") {
      throw new Error("You don't have permission to use the AI assistant");
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error("Failed to execute AI command. Please try again.");
    }
  }
}

/**
 * Check if the AI service is available (user is authenticated)
 * @param {Object} user - Current user object from auth
 * @returns {boolean} Whether AI service can be used
 */
export function isAIServiceAvailable(user) {
  return !!user;
}
