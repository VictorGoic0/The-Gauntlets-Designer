/**
 * OpenAI Tool Schemas and Execution Logic
 * Defines all AI tools and how they execute on the canvas
 */

const admin = require("firebase-admin");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const realtimeDb = admin.database(); // Add Realtime Database reference

/**
 * OpenAI Tool Schema for createRectangle
 */
const createRectangleSchema = {
  type: "function",
  function: {
    name: "createRectangle",
    description:
      "Create a rectangle shape on the canvas at the specified position with optional dimensions and color",
    parameters: {
      type: "object",
      properties: {
        x: {
          type: "number",
          description: "X position of the rectangle (0-5000)",
        },
        y: {
          type: "number",
          description: "Y position of the rectangle (0-5000)",
        },
        width: {
          type: "number",
          description: "Width of the rectangle in pixels (default: 100)",
        },
        height: {
          type: "number",
          description: "Height of the rectangle in pixels (default: 100)",
        },
        fill: {
          type: "string",
          description:
            "Fill color in hex format (e.g., #3B82F6, #FF0000). Default: #3B82F6 (blue)",
        },
        rotation: {
          type: "number",
          description: "Rotation in degrees (0-360). Default: 0",
        },
      },
      required: ["x", "y"],
    },
  },
};

/**
 * Execute createRectangle tool
 * @param {Object} args - Tool arguments from OpenAI
 * @param {string} userId - ID of the user making the request
 * @returns {Promise<Object>} Created object data
 */
async function executeCreateRectangle(args, userId) {
  const objectData = {
    type: "rectangle",
    x: args.x,
    y: args.y,
    width: args.width || 100,
    height: args.height || 100,
    fill: args.fill || "#3B82F6", // Default blue
    rotation: args.rotation || 0,
    zIndex: 0,
    createdBy: userId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastModifiedBy: userId,
  };

  // Write to Firestore
  const docRef = await db
    .collection("projects")
    .doc("shared-canvas")
    .collection("objects")
    .add(objectData);

  // PR #18: Write position to Realtime DB for live position tracking
  try {
    await realtimeDb.ref(`objectPositions/${docRef.id}`).set({
      x: args.x,
      y: args.y,
      timestamp: admin.database.ServerValue.TIMESTAMP,
    });
  } catch (positionError) {
    console.error("Error writing position to Realtime DB:", positionError);
    // Continue anyway - object exists in Firestore
  }

  return {
    success: true,
    objectId: docRef.id,
    message: `Created rectangle at (${args.x}, ${args.y})`,
  };
}

/**
 * OpenAI Tool Schema for createCircle
 */
const createCircleSchema = {
  type: "function",
  function: {
    name: "createCircle",
    description:
      "Create a circle shape on the canvas at the specified position with optional radius and color",
    parameters: {
      type: "object",
      properties: {
        x: {
          type: "number",
          description: "X position of the circle center (0-5000)",
        },
        y: {
          type: "number",
          description: "Y position of the circle center (0-5000)",
        },
        radius: {
          type: "number",
          description: "Radius of the circle in pixels (default: 50)",
        },
        fill: {
          type: "string",
          description:
            "Fill color in hex format (e.g., #10B981, #FF0000). Default: #10B981 (green)",
        },
        rotation: {
          type: "number",
          description: "Rotation in degrees (0-360). Default: 0",
        },
      },
      required: ["x", "y"],
    },
  },
};

/**
 * OpenAI Tool Schema for createText
 */
const createTextSchema = {
  type: "function",
  function: {
    name: "createText",
    description:
      "Create a text element on the canvas with specified content and styling",
    parameters: {
      type: "object",
      properties: {
        x: {
          type: "number",
          description: "X position of the text (0-5000)",
        },
        y: {
          type: "number",
          description: "Y position of the text (0-5000)",
        },
        text: {
          type: "string",
          description: "The text content to display",
        },
        fontSize: {
          type: "number",
          description: "Font size in pixels (default: 16)",
        },
        fill: {
          type: "string",
          description:
            "Text color in hex format (e.g., #FFFFFF, #000000). Default: #FFFFFF (white)",
        },
        fontFamily: {
          type: "string",
          description: "Font family (default: Arial)",
        },
        width: {
          type: "number",
          description: "Text box width in pixels (default: 200)",
        },
        rotation: {
          type: "number",
          description: "Rotation in degrees (0-360). Default: 0",
        },
      },
      required: ["x", "y", "text"],
    },
  },
};

/**
 * Execute createCircle tool
 * @param {Object} args - Tool arguments from OpenAI
 * @param {string} userId - ID of the user making the request
 * @returns {Promise<Object>} Created object data
 */
async function executeCreateCircle(args, userId) {
  const objectData = {
    type: "circle",
    x: args.x,
    y: args.y,
    radius: args.radius || 50,
    fill: args.fill || "#10B981", // Default green
    rotation: args.rotation || 0,
    zIndex: 0,
    createdBy: userId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastModifiedBy: userId,
  };

  // Write to Firestore
  const docRef = await db
    .collection("projects")
    .doc("shared-canvas")
    .collection("objects")
    .add(objectData);

  // PR #18: Write position to Realtime DB for live position tracking
  try {
    await realtimeDb.ref(`objectPositions/${docRef.id}`).set({
      x: args.x,
      y: args.y,
      timestamp: admin.database.ServerValue.TIMESTAMP,
    });
  } catch (positionError) {
    console.error("Error writing position to Realtime DB:", positionError);
    // Continue anyway - object exists in Firestore
  }

  return {
    success: true,
    objectId: docRef.id,
    message: `Created circle at (${args.x}, ${args.y}) with radius ${
      args.radius || 50
    }`,
  };
}

/**
 * Execute createText tool
 * @param {Object} args - Tool arguments from OpenAI
 * @param {string} userId - ID of the user making the request
 * @returns {Promise<Object>} Created object data
 */
async function executeCreateText(args, userId) {
  const objectData = {
    type: "text",
    x: args.x,
    y: args.y,
    text: args.text,
    fontSize: args.fontSize || 16,
    fontFamily: args.fontFamily || "Arial",
    width: args.width || 200,
    fill: args.fill || "#FFFFFF", // Default white
    rotation: args.rotation || 0,
    zIndex: 0,
    createdBy: userId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastModifiedBy: userId,
  };

  // Write to Firestore
  const docRef = await db
    .collection("projects")
    .doc("shared-canvas")
    .collection("objects")
    .add(objectData);

  // PR #18: Write position to Realtime DB for live position tracking
  try {
    await realtimeDb.ref(`objectPositions/${docRef.id}`).set({
      x: args.x,
      y: args.y,
      timestamp: admin.database.ServerValue.TIMESTAMP,
    });
  } catch (positionError) {
    console.error("Error writing position to Realtime DB:", positionError);
    // Continue anyway - object exists in Firestore
  }

  return {
    success: true,
    objectId: docRef.id,
    message: `Created text "${args.text}" at (${args.x}, ${args.y})`,
  };
}

// =============================================================================
// MANIPULATION TOOL SCHEMAS
// =============================================================================

/**
 * OpenAI Tool Schema for moveObject
 */
const moveObjectSchema = {
  type: "function",
  function: {
    name: "moveObject",
    description: "Move an existing object to a new position on the canvas",
    parameters: {
      type: "object",
      properties: {
        objectId: {
          type: "string",
          description: "The ID of the object to move",
        },
        x: {
          type: "number",
          description: "New X position (0-5000)",
        },
        y: {
          type: "number",
          description: "New Y position (0-5000)",
        },
      },
      required: ["objectId", "x", "y"],
    },
  },
};

/**
 * OpenAI Tool Schema for resizeObject
 */
const resizeObjectSchema = {
  type: "function",
  function: {
    name: "resizeObject",
    description:
      "Resize an existing object. For rectangles/text, provide width and height. For circles, provide radius.",
    parameters: {
      type: "object",
      properties: {
        objectId: {
          type: "string",
          description: "The ID of the object to resize",
        },
        width: {
          type: "number",
          description: "New width in pixels (for rectangles and text)",
        },
        height: {
          type: "number",
          description: "New height in pixels (for rectangles and text)",
        },
        radius: {
          type: "number",
          description: "New radius in pixels (for circles)",
        },
      },
      required: ["objectId"],
    },
  },
};

/**
 * OpenAI Tool Schema for changeColor
 */
const changeColorSchema = {
  type: "function",
  function: {
    name: "changeColor",
    description: "Change the color/fill of an existing object",
    parameters: {
      type: "object",
      properties: {
        objectId: {
          type: "string",
          description: "The ID of the object to recolor",
        },
        fill: {
          type: "string",
          description:
            "New fill color in hex format (e.g., #FF0000 for red, #00FF00 for green)",
        },
      },
      required: ["objectId", "fill"],
    },
  },
};

/**
 * OpenAI Tool Schema for rotateObject
 */
const rotateObjectSchema = {
  type: "function",
  function: {
    name: "rotateObject",
    description: "Rotate an existing object by a specified angle",
    parameters: {
      type: "object",
      properties: {
        objectId: {
          type: "string",
          description: "The ID of the object to rotate",
        },
        rotation: {
          type: "number",
          description:
            "Rotation angle in degrees (0-360). 0 = no rotation, 90 = quarter turn clockwise",
        },
      },
      required: ["objectId", "rotation"],
    },
  },
};

// =============================================================================
// MANIPULATION TOOL EXECUTION
// =============================================================================

/**
 * Execute moveObject tool
 * @param {Object} args - Tool arguments from OpenAI
 * @param {string} userId - ID of the user making the request
 * @returns {Promise<Object>} Execution result
 */
async function executeMoveObject(args, userId) {
  const docRef = db
    .collection("projects")
    .doc("shared-canvas")
    .collection("objects")
    .doc(args.objectId);

  // Check if object exists
  const doc = await docRef.get();
  if (!doc.exists) {
    throw new Error(`Object ${args.objectId} not found`);
  }

  await docRef.update({
    x: args.x,
    y: args.y,
    lastModifiedBy: userId,
    lastEditedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    objectId: args.objectId,
    message: `Moved object to (${args.x}, ${args.y})`,
  };
}

/**
 * Execute resizeObject tool
 * @param {Object} args - Tool arguments from OpenAI
 * @param {string} userId - ID of the user making the request
 * @returns {Promise<Object>} Execution result
 */
async function executeResizeObject(args, userId) {
  const docRef = db
    .collection("projects")
    .doc("shared-canvas")
    .collection("objects")
    .doc(args.objectId);

  // Check if object exists
  const doc = await docRef.get();
  if (!doc.exists) {
    throw new Error(`Object ${args.objectId} not found`);
  }

  const objectData = doc.data();
  const updates = {
    lastModifiedBy: userId,
    lastEditedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  // For circles, update radius
  if (objectData.type === "circle") {
    if (args.radius !== undefined) {
      updates.radius = args.radius;
    } else {
      throw new Error("Radius required for resizing circles");
    }
  } else {
    // For rectangles and text, update width/height
    if (args.width !== undefined) updates.width = args.width;
    if (args.height !== undefined) updates.height = args.height;
  }

  await docRef.update(updates);

  return {
    success: true,
    objectId: args.objectId,
    message: `Resized ${objectData.type}`,
  };
}

/**
 * Execute changeColor tool
 * @param {Object} args - Tool arguments from OpenAI
 * @param {string} userId - ID of the user making the request
 * @returns {Promise<Object>} Execution result
 */
async function executeChangeColor(args, userId) {
  const docRef = db
    .collection("projects")
    .doc("shared-canvas")
    .collection("objects")
    .doc(args.objectId);

  // Check if object exists
  const doc = await docRef.get();
  if (!doc.exists) {
    throw new Error(`Object ${args.objectId} not found`);
  }

  await docRef.update({
    fill: args.fill,
    lastModifiedBy: userId,
    lastEditedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    objectId: args.objectId,
    message: `Changed color to ${args.fill}`,
  };
}

/**
 * Execute rotateObject tool
 * @param {Object} args - Tool arguments from OpenAI
 * @param {string} userId - ID of the user making the request
 * @returns {Promise<Object>} Execution result
 */
async function executeRotateObject(args, userId) {
  const docRef = db
    .collection("projects")
    .doc("shared-canvas")
    .collection("objects")
    .doc(args.objectId);

  // Check if object exists
  const doc = await docRef.get();
  if (!doc.exists) {
    throw new Error(`Object ${args.objectId} not found`);
  }

  await docRef.update({
    rotation: args.rotation,
    lastModifiedBy: userId,
    lastEditedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    objectId: args.objectId,
    message: `Rotated to ${args.rotation} degrees`,
  };
}

/**
 * Export all tool schemas (for OpenAI API)
 */
const toolSchemas = [
  createRectangleSchema,
  createCircleSchema,
  createTextSchema,
  moveObjectSchema,
  resizeObjectSchema,
  changeColorSchema,
  rotateObjectSchema,
];

/**
 * Execute a tool call
 * @param {string} toolName - Name of the tool to execute
 * @param {Object} args - Tool arguments from OpenAI
 * @param {string} userId - ID of the user making the request
 * @returns {Promise<Object>} Execution result
 */
async function executeTool(toolName, args, userId) {
  switch (toolName) {
    // Creation tools
    case "createRectangle":
      return await executeCreateRectangle(args, userId);
    case "createCircle":
      return await executeCreateCircle(args, userId);
    case "createText":
      return await executeCreateText(args, userId);
    // Manipulation tools
    case "moveObject":
      return await executeMoveObject(args, userId);
    case "resizeObject":
      return await executeResizeObject(args, userId);
    case "changeColor":
      return await executeChangeColor(args, userId);
    case "rotateObject":
      return await executeRotateObject(args, userId);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

module.exports = {
  toolSchemas,
  executeTool,
};
