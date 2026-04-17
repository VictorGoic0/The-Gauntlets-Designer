import { useEffect } from "react";
import useLocalStore from "../stores/localStore";

/**
 * Clears local optimistic drag/transform overlays when remote Firestore state matches
 * or when objects are removed remotely. Keeps imperative RT sync out of Canvas.jsx body.
 */
export function useCanvasLocalOptimisticPrune(
  objects,
  draggingObjectId,
  transformingObjectId,
) {
  useEffect(() => {
    const existingObjectIds = new Set(objects.map((obj) => obj.id));
    const store = useLocalStore.getState();
    const currentLocalPositions = store.dragging.localObjectPositions;

    for (const objectId of Object.keys(currentLocalPositions)) {
      if (!existingObjectIds.has(objectId)) {
        store.clearLocalObjectPosition(objectId);
        continue;
      }

      if (draggingObjectId !== objectId) {
        const remoteObject = objects.find((obj) => obj.id === objectId);
        if (remoteObject) {
          const localPos = currentLocalPositions[objectId];
          if (
            Math.abs(remoteObject.x - localPos.x) < 1 &&
            Math.abs(remoteObject.y - localPos.y) < 1
          ) {
            store.clearLocalObjectPosition(objectId);
          }
        }
      }
    }
  }, [objects, draggingObjectId]);

  useEffect(() => {
    const existingObjectIds = new Set(objects.map((obj) => obj.id));
    const store = useLocalStore.getState();
    const currentLocalTransforms = store.transforms.localObjectTransforms;

    for (const objectId of Object.keys(currentLocalTransforms)) {
      if (!existingObjectIds.has(objectId)) {
        store.clearLocalObjectTransform(objectId);
        continue;
      }

      if (transformingObjectId !== objectId) {
        const remoteObject = objects.find((obj) => obj.id === objectId);
        if (remoteObject) {
          const localTransform = currentLocalTransforms[objectId];
          let matches = true;

          if (
            localTransform.x !== undefined &&
            Math.abs(remoteObject.x - localTransform.x) >= 1
          ) {
            matches = false;
          }
          if (
            localTransform.y !== undefined &&
            Math.abs(remoteObject.y - localTransform.y) >= 1
          ) {
            matches = false;
          }
          if (
            localTransform.width !== undefined &&
            Math.abs((remoteObject.width || 0) - localTransform.width) >= 1
          ) {
            matches = false;
          }
          if (
            localTransform.height !== undefined &&
            Math.abs((remoteObject.height || 0) - localTransform.height) >= 1
          ) {
            matches = false;
          }
          if (
            localTransform.radius !== undefined &&
            Math.abs((remoteObject.radius || 0) - localTransform.radius) >= 1
          ) {
            matches = false;
          }
          if (
            localTransform.fontSize !== undefined &&
            Math.abs((remoteObject.fontSize || 16) - localTransform.fontSize) >= 0.5
          ) {
            matches = false;
          }
          if (
            localTransform.rotation !== undefined &&
            Math.abs((remoteObject.rotation || 0) - localTransform.rotation) >= 0.5
          ) {
            matches = false;
          }

          if (matches) {
            store.clearLocalObjectTransform(objectId);
          }
        }
      }
    }
  }, [objects, transformingObjectId]);
}
