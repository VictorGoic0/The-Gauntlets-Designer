const { onCall, HttpsError } = require("firebase-functions/v2/https");

/**
 * Test function - v2 API (auth test only for now)
 */
exports.testFunction = onCall((request) => {
  console.log("=== TEST FUNCTION CALLED (v2) ===");
  console.log("Has auth?", !!request.auth);

  if (!request.auth) {
    console.error("ERROR: No auth context!");
    throw new HttpsError(
      "unauthenticated",
      "User must be authenticated to call this function."
    );
  }

  console.log("Authenticated user:", request.auth.uid);

  return {
    success: true,
    message: "Firebase Functions v2 is working correctly!",
    user: {
      uid: request.auth.uid,
      email: request.auth.token.email || "N/A",
    },
    timestamp: new Date().toISOString(),
  };
});
