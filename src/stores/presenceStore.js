import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  ref,
  set,
  onDisconnect,
  serverTimestamp,
  onValue,
} from "firebase/database";
import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  query,
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

      // Connection state actions
      setConnectionState: (isConnected, isOffline = false) =>
        set(
          (state) => ({
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
          await set(presenceRef, {
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

          await set(presenceRef, {
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
          await set(presenceRef, null);
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
            lastSeen: serverTimestamp(),
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

      // Helper methods
      getOnlineUsers: () => {
        const state = get();
        return state.presence.onlineUsers;
      },

      getRemoteCursors: () => {
        const state = get();
        return state.cursors.remoteCursors;
      },

      getLocalCursorPosition: () => {
        const state = get();
        return state.cursors.localPosition;
      },

      isPresenceLoading: () => {
        const state = get();
        return state.presence.isLoading;
      },

      isCursorsLoading: () => {
        const state = get();
        return state.cursors.isLoading;
      },

      getPresenceLastSyncTime: () => {
        const state = get();
        return state.presence.lastSyncTime;
      },

      getCursorsLastSyncTime: () => {
        const state = get();
        return state.cursors.lastSyncTime;
      },

      // Filter cursors to only show users who are in the presence list (online)
      getVisibleCursors: () => {
        const state = get();
        const onlineUserIds = state.presence.onlineUsers.map(
          (user) => user.userId
        );
        return state.cursors.remoteCursors.filter((cursor) =>
          onlineUserIds.includes(cursor.userId)
        );
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
