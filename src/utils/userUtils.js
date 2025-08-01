import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Fetches user display information and enriches a note with author display data
 * @param {Object} note - The note object to enrich
 * @param {string} userIdField - The field name that contains the user ID (e.g., 'uid', 'authorId')
 * @returns {Object} The enriched note with authorEmail and authorDisplayName fields
 */
export const enrichNoteWithUserData = async (
  note,
  userIdField = "authorId"
) => {
  const userId = note[userIdField];
  let authorEmail = userId;
  let authorDisplayName = null;

  if (userId) {
    try {
      const userDocSnap = await getDoc(doc(db, "users", userId));
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        authorEmail = userData.email || userId;
        authorDisplayName = userData.displayName || null;
      }
    } catch (err) {
      console.log("Could not fetch user data for note:", err);
    }
  }

  return {
    ...note,
    authorEmail,
    authorDisplayName,
  };
};

/**
 * Enriches multiple notes with user display data
 * @param {Array} notes - Array of note objects to enrich
 * @param {string} userIdField - The field name that contains the user ID
 * @returns {Array} Array of enriched notes
 */
export const enrichNotesWithUserData = async (
  notes,
  userIdField = "authorId"
) => {
  return Promise.all(
    notes.map((note) => enrichNoteWithUserData(note, userIdField))
  );
};

/**
 * Formats a user's display name from note data with community-specific customization
 * @param {Object} note - Note object with authorDisplayName and authorEmail
 * @param {string} communityId - Optional community ID to check for custom display name
 * @param {Object} userData - Optional user data containing communityCustomNames
 * @returns {string} Formatted display name
 */
export const formatUserDisplayName = (
  note,
  communityId = null,
  userData = null
) => {
  // Check for community-specific custom name first
  if (communityId && userData?.communityCustomNames?.[communityId]) {
    return userData.communityCustomNames[communityId];
  }

  // Fall back to standard display name logic
  if (note.authorDisplayName) {
    return note.authorDisplayName;
  }
  if (note.authorEmail) {
    return note.authorEmail.split("@")[0];
  }
  return "Utente Sconosciuto";
};

/**
 * Original formatUserDisplayName function for backwards compatibility
 * @param {Object} note - Note object with authorDisplayName and authorEmail
 * @returns {string} Formatted display name
 */
export const formatUserDisplayNameSimple = (note) => {
  if (note.authorDisplayName) {
    return note.authorDisplayName;
  }
  if (note.authorEmail) {
    return note.authorEmail.split("@")[0];
  }
  return "Utente Sconosciuto";
};

/**
 * Enriches notes with community-specific custom display names
 * @param {Array} notes - Array of note objects to enrich
 * @param {string} communityId - Community ID to get custom names for
 * @param {string} userIdField - The field name that contains the user ID
 * @returns {Array} Array of enriched notes with community-specific display names
 */
export const enrichNotesWithCommunityNames = async (
  notes,
  communityId,
  userIdField = "authorId"
) => {
  const enrichedNotes = await Promise.all(
    notes.map(async (note) => {
      const userId = note[userIdField];
      let communityDisplayName = null;

      if (userId && communityId) {
        try {
          const userDocSnap = await getDoc(doc(db, "users", userId));
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const communityCustomNames = userData.communityCustomNames || {};
            communityDisplayName = communityCustomNames[communityId] || null;
          }
        } catch (err) {
          console.log("Could not fetch community custom name for note:", err);
        }
      }

      return {
        ...note,
        communityDisplayName,
      };
    })
  );

  return enrichedNotes;
};

/**
 * Gets a user's community custom names
 * @param {string} userId - User ID
 * @returns {Object} Object with community IDs as keys and custom names as values
 */
export const getUserCommunityCustomNames = async (userId) => {
  if (!userId) return {};

  try {
    const userDocSnap = await getDoc(doc(db, "users", userId));
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      return userData.communityCustomNames || {};
    }
  } catch (err) {
    console.log("Could not fetch user community custom names:", err);
  }

  return {};
};

/**
 * Creates a real-time listener for user data changes
 * @param {string} userId - User ID to listen to
 * @param {Function} callback - Function to call when user data changes
 * @returns {Function} Unsubscribe function
 */
export const createUserDataListener = (userId, callback) => {
  if (!userId) {
    return () => {}; // Return empty unsubscribe function
  }

  const userDocRef = doc(db, "users", userId);

  // Use onSnapshot to listen for real-time changes
  const unsubscribe = onSnapshot(
    userDocRef,
    (docSnapshot) => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        callback(userData);
      } else {
        // User document doesn't exist
        callback(null);
      }
    },
    (error) => {
      console.error("Error listening to user data changes:", error);
      callback(null);
    }
  );

  return unsubscribe;
};

/**
 * Enhanced note enrichment with real-time user data updates
 * @param {Array} notes - Array of note objects to enrich
 * @param {string} communityId - Community ID for custom names (optional)
 * @param {string} userIdField - The field name that contains the user ID
 * @param {Function} onNotesUpdate - Callback when notes are updated due to user changes
 * @returns {Object} Object with enriched notes and cleanup function
 */
export const createRealTimeNotesEnrichment = (
  notes,
  communityId = null,
  userIdField = "authorId",
  onNotesUpdate = () => {}
) => {
  let enrichedNotes = [...notes];
  const userListeners = new Map(); // Map of userId -> unsubscribe function
  const userDataCache = new Map(); // Map of userId -> user data

  // Function to re-enrich and update notes when user data changes
  const updateNotesWithUserData = (userId, userData) => {
    userDataCache.set(userId, userData);

    // Update all notes that belong to this user
    enrichedNotes = enrichedNotes.map((note) => {
      if (note[userIdField] === userId) {
        return enrichNoteWithUserDataSync(
          note,
          userData,
          communityId,
          userIdField
        );
      }
      return note;
    });

    // Notify callback of the updated notes
    onNotesUpdate([...enrichedNotes]);
  };

  // Function to enrich a single note with cached or provided user data
  const enrichNoteWithUserDataSync = (
    note,
    userData = null,
    communityId = null,
    userIdField = "authorId"
  ) => {
    const userId = note[userIdField];
    const cachedUserData = userData || userDataCache.get(userId);

    let authorEmail = userId;
    let authorDisplayName = null;
    let communityDisplayName = null;

    if (cachedUserData) {
      authorEmail = cachedUserData.email || userId;
      authorDisplayName = cachedUserData.displayName || null;

      // Check for community-specific custom name
      if (communityId && cachedUserData.communityCustomNames) {
        communityDisplayName =
          cachedUserData.communityCustomNames[communityId] || null;
      }
    }

    return {
      ...note,
      authorEmail,
      authorDisplayName,
      communityDisplayName,
    };
  };

  // Set up listeners for all unique users in the notes
  const uniqueUserIds = [
    ...new Set(notes.map((note) => note[userIdField]).filter(Boolean)),
  ];

  uniqueUserIds.forEach((userId) => {
    const unsubscribe = createUserDataListener(userId, (userData) => {
      updateNotesWithUserData(userId, userData);
    });
    userListeners.set(userId, unsubscribe);
  });

  // Initial enrichment with cached data (will be updated by listeners)
  enrichedNotes = notes.map((note) =>
    enrichNoteWithUserDataSync(note, null, communityId, userIdField)
  );

  // Cleanup function to remove all listeners
  const cleanup = () => {
    userListeners.forEach((unsubscribe) => unsubscribe());
    userListeners.clear();
    userDataCache.clear();
  };

  return {
    enrichedNotes,
    cleanup,
    // Method to add new notes and set up listeners for new users
    addNotes: (newNotes) => {
      const newUserIds = [
        ...new Set(newNotes.map((note) => note[userIdField]).filter(Boolean)),
      ];

      // Set up listeners for any new users
      newUserIds.forEach((userId) => {
        if (!userListeners.has(userId)) {
          const unsubscribe = createUserDataListener(userId, (userData) => {
            updateNotesWithUserData(userId, userData);
          });
          userListeners.set(userId, unsubscribe);
        }
      });

      // Add new notes to the enriched list
      enrichedNotes = [
        ...enrichedNotes,
        ...newNotes.map((note) =>
          enrichNoteWithUserDataSync(note, null, communityId, userIdField)
        ),
      ];

      onNotesUpdate([...enrichedNotes]);
    },
    // Method to update the notes list completely
    updateNotes: (updatedNotes) => {
      // Clean up old listeners
      userListeners.forEach((unsubscribe) => unsubscribe());
      userListeners.clear();

      // Set up new listeners
      const uniqueUserIds = [
        ...new Set(
          updatedNotes.map((note) => note[userIdField]).filter(Boolean)
        ),
      ];
      uniqueUserIds.forEach((userId) => {
        const unsubscribe = createUserDataListener(userId, (userData) => {
          updateNotesWithUserData(userId, userData);
        });
        userListeners.set(userId, unsubscribe);
      });

      // Update enriched notes
      enrichedNotes = updatedNotes.map((note) =>
        enrichNoteWithUserDataSync(note, null, communityId, userIdField)
      );
      onNotesUpdate([...enrichedNotes]);
    },
  };
};
