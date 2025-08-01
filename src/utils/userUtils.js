import { doc, getDoc } from "firebase/firestore";
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
