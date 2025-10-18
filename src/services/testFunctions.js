/**
 * Test AI Agent Functions
 * Test the createRectangle tool and other AI agent functionality
 */

import { getFunctions, httpsCallable } from "firebase/functions";
import app, { auth } from "../lib/firebase.js";

/**
 * Test the AI Agent with createRectangle command
 * Call this from browser console or test button
 */
export async function testCreateRectangle() {
  try {
    console.log("🔵 Testing AI Agent: createRectangle...");

    // Check if user is authenticated
    const currentUser = auth.currentUser;
    console.log(
      "Current user:",
      currentUser ? currentUser.email : "NOT LOGGED IN"
    );

    if (!currentUser) {
      throw new Error("You must be logged in first!");
    }

    // Call the AI Agent function
    const functions = getFunctions(app, "us-central1");
    const aiAgent = httpsCallable(functions, "aiAgent");

    // Test command: Create a red rectangle at position 100, 200
    const result = await aiAgent({
      command:
        "Create 5 red rectangles at position 100, 200 with width 150 and height 100 and rotate it 45 degrees",
    });

    console.log("✅ Success! AI Agent response:", result.data);

    if (result.data.results && result.data.results.length > 0) {
      console.log("✅ Rectangle created:", result.data.results[0]);
      console.log("📝 Object ID:", result.data.results[0].objectId);
    }

    return result.data;
  } catch (error) {
    console.error("❌ Error calling AI Agent:", error);

    if (error.code === "unauthenticated") {
      console.error("❌ You must be logged in to call this function");
    } else if (error.code === "invalid-argument") {
      console.error("❌ Invalid command format");
    } else {
      console.error("❌ Error details:", error.message);
    }

    throw error;
  }
}

/**
 * Test createCircle command
 */
export async function testCreateCircle() {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("You must be logged in first!");
    }

    const functions = getFunctions(app, "us-central1");
    const aiAgent = httpsCallable(functions, "aiAgent");

    const result = await aiAgent({
      command: "Create a blue circle at position 300, 200 with radius 75",
    });

    console.log("✅ Circle created:", result.data);
    return result.data;
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

/**
 * Test createText command
 */
export async function testCreateText() {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("You must be logged in first!");
    }

    const functions = getFunctions(app, "us-central1");
    const aiAgent = httpsCallable(functions, "aiAgent");

    const result = await aiAgent({
      command: 'Create text that says "Hello AI!" at position 500, 300',
    });

    console.log("✅ Text created:", result.data);
    return result.data;
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

/**
 * Test all three creation commands at once
 */
export async function testAllShapes() {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("You must be logged in first!");
    }

    const functions = getFunctions(app, "us-central1");
    const aiAgent = httpsCallable(functions, "aiAgent");

    const result = await aiAgent({
      command:
        "Create a red rectangle, a green circle, and text that says Welcome",
    });

    console.log("✅ All shapes created:", result.data);
    return result.data;
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

// Make functions available globally for easy testing
if (typeof window !== "undefined") {
  window.testCreateRectangle = testCreateRectangle;
  window.testCreateCircle = testCreateCircle;
  window.testCreateText = testCreateText;
  window.testAllShapes = testAllShapes;
}
