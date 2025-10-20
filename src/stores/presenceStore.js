import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  ref,
  set as dbSet,
  onDisconnect,
  serverTimestamp,
} from "firebase/database";
import {
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp as firestoreServerTimestamp,
} from "firebase/firestore";
import { realtimeDb, db } from "../lib/firebase";
import { getUserColor } from "../utils/userColors";

const usePresenceStore = create(
  devtools(
    (set, get) => ({
      // Presence state
      presence: {
        // Map of userId -> user presence data
        onlineUsers: [],
        // Loading state
        isLoading: true,
        // Error state
        error: null,
        // Last sync timestamp
        lastSyncTime: null,
      },

      // Cursor state
      cursors: {
        // Map of userId -> cursor data (excluding current user)
        remoteCursors: [],
        // Local cursor position (for current user)
        localPosition: { x: 0, y: 0 },
        // Loading state
        isLoading: true,
        // Error state
        error: null,
        // Last sync timestamp
        lastSyncTime: null,
      },

      // Selection state (PR #19)
      selections: {
        // Array of remote user selections: { userId, objectId, userName, userColor, timestamp }
        remoteSelections: [],
        // Loading state
        isLoading: true,
        // Error state
        error: null,
        // Last sync timestamp
        lastSyncTime: null,
      },

      // Object positions state (PR #18)
      objectPositions: {
        // Map of objectId -> { x, y, timestamp }
        data: {},
        // Loading state
        isLoading: true,
        // Error state
        error: null,
        // Last sync timestamp
        lastSyncTime: null,
      },

      // Connection state
      connection: {
        isConnected: true,
        isOffline: false,
      },

      // Presence actions
      setOnlineUsers: (users) =>
        set(
          (state) => ({
            presence: {
              ...state.presence,
              onlineUsers: users,
              isLoading: false,
              lastSyncTime: new Date(),
              error: null,
            },
          }),
          false,
          "setOnlineUsers"
        ),

      setPresenceLoading: (isLoading) =>
        set(
          (state) => ({
            presence: { ...state.presence, isLoading },
          }),
          false,
          "setPresenceLoading"
        ),

      setPresenceError: (error) =>
        set(
          (state) => ({
            presence: { ...state.presence, error, isLoading: false },
          }),
          false,
          "setPresenceError"
        ),

      // Cursor actions
      setRemoteCursors: (cursors) =>
        set(
          (state) => ({
            cursors: {
              ...state.cursors,
              remoteCursors: cursors,
              isLoading: false,
              lastSyncTime: new Date(),
              error: null,
            },
          }),
          false,
          "setRemoteCursors"
        ),

      setLocalCursorPosition: (position) =>
        set(
          (state) => ({
            cursors: {
              ...state.cursors,
              localPosition: position,
            },
          }),
          false,
          "setLocalCursorPosition"
        ),

      setCursorsLoading: (isLoading) =>
        set(
          (state) => ({
            cursors: { ...state.cursors, isLoading },
          }),
          false,
          "setCursorsLoading"
        ),

      setCursorsError: (error) =>
        set(
          (state) => ({
            cursors: { ...state.cursors, error, isLoading: false },
          }),
          false,
          "setCursorsError"
        ),

      // Selection actions (PR #19)
      setRemoteSelections: (selections) =>
        set(
          (state) => ({
            selections: {
              ...state.selections,
              remoteSelections: selections,
              isLoading: false,
              lastSyncTime: new Date(),
              error: null,
            },
          }),
          false,
          "setRemoteSelections"
        ),

      setSelectionsLoading: (isLoading) =>
        set(
          (state) => ({
            selections: { ...state.selections, isLoading },
          }),
          false,
          "setSelectionsLoading"
        ),

      setSelectionsError: (error) =>
        set(
          (state) => ({
            selections: { ...state.selections, error, isLoading: false },
          }),
          false,
          "setSelectionsError"
        ),

      // Object positions actions (PR #18)
      setObjectPositions: (positions) =>
        set(
          (state) => ({
            objectPositions: {
              ...state.objectPositions,
              data: positions,
              isLoading: false,
              lastSyncTime: Date.now(),
            },
          }),
          false,
          "setObjectPositions"
        ),

      setPositionsLoading: (isLoading) =>
        set(
          (state) => ({
            objectPositions: { ...state.objectPositions, isLoading },
          }),
          false,
          "setPositionsLoading"
        ),

      setPositionsError: (error) =>
        set(
          (state) => ({
            objectPositions: {
              ...state.objectPositions,
              error,
              isLoading: false,
            },
          }),
          false,
          "setPositionsError"
        ),

      // Connection state actions
      setConnectionState: (isConnected, isOffline = false) =>
        set(
          () => ({
            connection: { isConnected, isOffline },
          }),
          false,
          "setConnectionState"
        ),

      // Presence operations (async)
      initializePresence: async (currentUser) => {
        try {
          const userColor = getUserColor(currentUser.uid);
          const presenceRef = ref(
            realtimeDb,
            `presence/shared-canvas/${currentUser.uid}`
          );

          // Set up onDisconnect to remove presence when user disconnects
          await onDisconnect(presenceRef).remove();

          // Write presence data
          await dbSet(presenceRef, {
            userName: currentUser.displayName || "Anonymous",
            userEmail: currentUser.email || "",
            userColor: userColor,
            isOnline: true,
            lastSeen: serverTimestamp(),
          });
        } catch (error) {
          console.error("Error initializing presence:", error);
          get().setPresenceError(error);
        }
      },

      updatePresence: async (currentUser) => {
        try {
          const userColor = getUserColor(currentUser.uid);
          const presenceRef = ref(
            realtimeDb,
            `presence/shared-canvas/${currentUser.uid}`
          );

          await dbSet(presenceRef, {
            userName: currentUser.displayName || "Anonymous",
            userEmail: currentUser.email || "",
            userColor: userColor,
            isOnline: true,
            lastSeen: serverTimestamp(),
          });
        } catch (error) {
          console.error("Error updating presence:", error);
          get().setPresenceError(error);
        }
      },

      removePresence: async (currentUser) => {
        try {
          const presenceRef = ref(
            realtimeDb,
            `presence/shared-canvas/${currentUser.uid}`
          );
          await dbSet(presenceRef, null);
        } catch (error) {
          console.error("Error removing presence:", error);
          get().setPresenceError(error);
        }
      },

      // Cursor operations (async)
      updateCursorPosition: async (currentUser, position) => {
        try {
          const userColor = getUserColor(currentUser.uid);
          const cursorRef = doc(
            db,
            "projects",
            "shared-canvas",
            "cursors",
            currentUser.uid
          );

          await setDoc(cursorRef, {
            x: position.x,
            y: position.y,
            userName: currentUser.displayName || "Anonymous",
            userColor: userColor,
            lastSeen: firestoreServerTimestamp(),
          });
        } catch (error) {
          console.error("Error updating cursor position:", error);
          get().setCursorsError(error);
        }
      },

      removeCursor: async (currentUser) => {
        try {
          const cursorRef = doc(
            db,
            "projects",
            "shared-canvas",
            "cursors",
            currentUser.uid
          );
          await deleteDoc(cursorRef);
        } catch (error) {
          console.error("Error removing cursor:", error);
          get().setCursorsError(error);
        }
      },

      // Selection operations (async) - PR #19
      updateSelection: async (currentUser, objectId) => {
        try {
          const userColor = getUserColor(currentUser.uid);
          const selectionRef = ref(realtimeDb, `selections/${currentUser.uid}`);

          // Set up onDisconnect to remove selection when user disconnects
          await onDisconnect(selectionRef).remove();

          // Write selection data
          await dbSet(selectionRef, {
            objectId: objectId,
            userName: currentUser.displayName || "Anonymous",
            userColor: userColor,
            timestamp: serverTimestamp(),
          });
        } catch (error) {
          console.error("Error updating selection:", error);
          get().setSelectionsError(error);
        }
      },

      removeSelection: async (currentUser) => {
        try {
          const selectionRef = ref(realtimeDb, `selections/${currentUser.uid}`);
          await dbSet(selectionRef, null);
        } catch (error) {
          console.error("Error removing selection:", error);
          get().setSelectionsError(error);
        }
      },

      // Clear all state (for cleanup)
      clearAll: () =>
        set(
          () => ({
            presence: {
              onlineUsers: [],
              isLoading: true,
              error: null,
              lastSyncTime: null,
            },
            cursors: {
              remoteCursors: [],
              localPosition: { x: 0, y: 0 },
              isLoading: true,
              error: null,
              lastSyncTime: null,
            },
            selections: {
              remoteSelections: [],
              isLoading: true,
              error: null,
              lastSyncTime: null,
            },
            objectPositions: {
              data: {},
              isLoading: true,
              error: null,
              lastSyncTime: null,
            },
            connection: {
              isConnected: true,
              isOffline: false,
            },
          }),
          false,
          "clearAll"
        ),
    }),
    {
      name: "presence-store",
    }
  )
);

export default usePresenceStore;
