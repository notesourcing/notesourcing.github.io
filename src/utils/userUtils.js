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
 * Formats a user's display name from note data
 * @param {Object} note - Note object with authorDisplayName and authorEmail
 * @returns {string} Formatted display name
 */
export const formatUserDisplayName = (note) => {
  if (note.authorDisplayName) {
    return note.authorDisplayName;
  }
  if (note.authorEmail) {
    return note.authorEmail.split("@")[0];
  }
  return "Utente Sconosciuto";
};
