import { doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

/**
 * Firestore utility functions for canvas objects
 * All functions use the hardcoded project ID: 'shared-canvas'
 */

/**
 * Update a canvas object in Firestore
 * @param {string} objectId - The object ID
 * @param {Object} updates - Fields to update
 * @param {string} userId - User ID making the update
 * @returns {Promise<void>}
 */
export const updateObject = async (objectId, updates, userId) => {
  try {
    const objectRef = doc(db, "projects", "shared-canvas", "objects", objectId);
    await updateDoc(objectRef, {
      ...updates,
      lastModified: serverTimestamp(),
      lastModifiedBy: userId,
    });
  } catch (error) {
    console.error("Error updating object:", error);
  }
};

/**
 * Delete a canvas object from Firestore
 * Deletion takes priority over any other operations (last-write-wins exception)
 * @param {string} objectId - The object ID to delete
 * @returns {Promise<void>}
 */
export const deleteObject = async (objectId) => {
  try {
    const objectRef = doc(db, "projects", "shared-canvas", "objects", objectId);
    await deleteDoc(objectRef);
  } catch (error) {
    console.error("Error deleting object:", error);
  }
};

/**
 * Delete multiple canvas objects from Firestore
 * @param {string[]} objectIds - Array of object IDs to delete
 * @returns {Promise<void>}
 */
export const deleteObjects = async (objectIds) => {
  try {
    const deletePromises = objectIds.map((objectId) => deleteObject(objectId));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error deleting objects:", error);
  }
};
