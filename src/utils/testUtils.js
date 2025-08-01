/**
 * Test utilities for sequential ID functionality
 * These functions help test the sequential ID system
 */
import { createDocumentWithSequentialId } from "./sequentialIds.js";
import { db } from "../firebase.js";
import { Timestamp } from "firebase/firestore";

/**
 * Create a test community with sequential ID
 */
export const createTestCommunity = async (user) => {
  if (!user) {
    console.error("User must be logged in to create test community");
    return null;
  }

  try {
    const result = await createDocumentWithSequentialId("communities", {
      name: `Test Community ${Date.now()}`,
      description: "This is a test community created with sequential ID",
      visibility: "public",
      creatorId: user.uid,
      creatorEmail: user.email,
      members: [user.uid],
      created: Timestamp.now(),
    });

    console.log("✅ Created test community:", result);
    return result;
  } catch (error) {
    console.error("❌ Error creating test community:", error);
    return null;
  }
};

/**
 * Create a test note with sequential ID
 */
export const createTestNote = async (
  user,
  type = "personal",
  communityId = null
) => {
  if (!user) {
    console.error("User must be logged in to create test note");
    return null;
  }

  try {
    const baseData = {
      fields: [
        { name: "Title", value: `Test Note ${Date.now()}` },
        {
          name: "Content",
          value: "This is a test note created with sequential ID",
        },
      ],
      created: Timestamp.now(),
      attribution: { type: "self" },
    };

    let collectionName, noteData;

    if (type === "shared" && communityId) {
      collectionName = "sharedNotes";
      noteData = {
        ...baseData,
        communityId,
        authorId: user.uid,
        authorEmail: user.email,
      };
    } else {
      collectionName = "notes";
      noteData = {
        ...baseData,
        uid: user.uid,
      };
    }

    const result = await createDocumentWithSequentialId(
      collectionName,
      noteData
    );
    console.log("✅ Created test note:", result);
    return result;
  } catch (error) {
    console.error("❌ Error creating test note:", error);
    return null;
  }
};

// For browser console usage
if (typeof window !== "undefined") {
  window.createTestCommunity = createTestCommunity;
  window.createTestNote = createTestNote;
  console.log("💡 Test functions available:");
  console.log("  - window.createTestCommunity(user)");
  console.log("  - window.createTestNote(user, type, communityId)");
}
