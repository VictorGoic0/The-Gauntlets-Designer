/**
 * Test Firebase Functions Setup
 * Temporary file to verify cloud functions are working
 */

import { getFunctions, httpsCallable } from "firebase/functions";
import app, { auth } from "../lib/firebase.js";

/**
 * Test the deployed testFunction
 * Call this from browser console or a test component
 */
export async function testFirebaseFunction() {
  try {
    console.log("🔵 Calling test function...");

    // Check if user is authenticated
    const currentUser = auth.currentUser;
    console.log(
      "Current user:",
      currentUser ? currentUser.email : "NOT LOGGED IN"
    );

    if (!currentUser) {
      throw new Error("You must be logged in first!");
    }

    // Get fresh auth token
    const token = await currentUser.getIdToken();
    console.log("Auth token:", token.substring(0, 20) + "...");

    // Explicitly set region to match deployed function
    const functions = getFunctions(app, "us-central1");
    const testFunction = httpsCallable(functions, "testFunction");

    const result = await testFunction();

    console.log("✅ Success! Function response:", result.data);

    return result.data;
  } catch (error) {
    console.error("❌ Error calling function:", error);

    if (error.code === "unauthenticated") {
      console.error("❌ You must be logged in to call this function");
    }

    throw error;
  }
}

// Make it available globally for easy testing
if (typeof window !== "undefined") {
  window.testFirebaseFunction = testFirebaseFunction;
}
