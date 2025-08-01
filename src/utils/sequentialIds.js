/**
 * Sequential ID utilities for user-friendly URLs
 * Maps Firebase document IDs to sequential numbers and vice versa
 */
import { db, getNextSequence } from "../firebase.js";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  runTransaction,
} from "firebase/firestore";

/**
 * Create a new document with sequential ID
 * @param {string} collectionName - The collection name (e.g., 'notes', 'communities')
 * @param {Object} data - The document data
 * @returns {Promise<{docId: string, sequentialId: number}>}
 */
export const createDocumentWithSequentialId = async (collectionName, data) => {
  try {
    // Get next sequential ID
    const sequentialId = await getNextSequence(collectionName);

    // Create the document
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      sequentialId,
    });

    // Try to create the mapping in the sequentialMaps collection
    try {
      await setDoc(
        doc(db, "sequentialMaps", `${collectionName}_${sequentialId}`),
        {
          collectionName,
          sequentialId,
          firebaseId: docRef.id,
          createdAt: new Date(),
        }
      );
    } catch (mappingError) {
      console.warn(
        "Could not create sequential ID mapping (permissions issue):",
        mappingError
      );
      // Re-throw the error to let the caller handle it
      throw mappingError;
    }

    return {
      docId: docRef.id,
      sequentialId,
    };
  } catch (error) {
    console.error("Error creating document with sequential ID:", error);
    // Fallback to regular document creation without sequential ID
    try {
      const docRef = await addDoc(collection(db, collectionName), data);
      console.warn("Fallback: Created document without sequential ID");
      return {
        docId: docRef.id,
        sequentialId: null,
      };
    } catch (fallbackError) {
      console.error("Fallback creation also failed:", fallbackError);
      throw fallbackError;
    }
  }
};

/**
 * Get Firebase document ID from sequential ID
 * @param {string} collectionName - The collection name
 * @param {number} sequentialId - The sequential ID
 * @returns {Promise<string|null>} - Firebase document ID or null if not found
 */
export const getFirebaseIdFromSequential = async (
  collectionName,
  sequentialId
) => {
  try {
    // First try the mapping collection
    const mapDoc = await getDoc(
      doc(db, "sequentialMaps", `${collectionName}_${sequentialId}`)
    );
    if (mapDoc.exists()) {
      return mapDoc.data().firebaseId;
    }

    // If mapping doesn't exist, search documents directly by sequentialId field
    console.log(
      `No mapping found for ${collectionName}:${sequentialId}, searching documents directly`
    );
    const q = query(
      collection(db, collectionName),
      where("sequentialId", "==", sequentialId)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0];
      console.log(
        `Found document with sequentialId ${sequentialId}:`,
        docData.id
      );
      return docData.id;
    }

    return null;
  } catch (error) {
    console.warn(
      "Error getting Firebase ID from sequential (permissions issue):",
      error
    );
    // Return null so the system can fallback to treating the ID as a Firebase ID
    return null;
  }
};

/**
 * Get sequential ID from Firebase document ID
 * @param {string} collectionName - The collection name
 * @param {string} firebaseId - The Firebase document ID
 * @returns {Promise<number|null>} - Sequential ID or null if not found
 */
export const getSequentialIdFromFirebase = async (
  collectionName,
  firebaseId
) => {
  try {
    const q = query(
      collection(db, "sequentialMaps"),
      where("collectionName", "==", collectionName),
      where("firebaseId", "==", firebaseId)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return doc.data().sequentialId;
    }
    return null;
  } catch (error) {
    console.warn(
      "Error getting sequential ID from Firebase (permissions issue):",
      error
    );
    // Return null so the system can fallback to using Firebase IDs
    return null;
  }
};

/**
 * Initialize sequential IDs for existing documents
 * This should be run once to migrate existing data
 * @param {string} collectionName - The collection name
 */
export const initializeSequentialIds = async (collectionName) => {
  try {
    console.log(`Initializing sequential IDs for ${collectionName}...`);

    // Get all documents from the collection
    const querySnapshot = await getDocs(collection(db, collectionName));
    const docs = querySnapshot.docs;

    // Check which documents already have sequential IDs
    const docsNeedingIds = [];
    for (const docSnap of docs) {
      const data = docSnap.data();
      if (!data.sequentialId) {
        docsNeedingIds.push({
          id: docSnap.id,
          data,
          ref: docSnap.ref,
        });
      }
    }

    console.log(
      `Found ${docsNeedingIds.length} documents needing sequential IDs`
    );

    // Process documents in batches
    for (const docInfo of docsNeedingIds) {
      await runTransaction(db, async (transaction) => {
        // Get next sequential ID
        const sequentialId = await getNextSequence(collectionName);

        // Update the document with sequential ID
        transaction.update(docInfo.ref, { sequentialId });

        // Create the mapping
        const mapRef = doc(
          db,
          "sequentialMaps",
          `${collectionName}_${sequentialId}`
        );
        transaction.set(mapRef, {
          collectionName,
          sequentialId,
          firebaseId: docInfo.id,
          createdAt: new Date(),
        });
      });

      console.log(
        `Assigned sequential ID ${docInfo.sequentialId} to document ${docInfo.id}`
      );
    }

    console.log(`Sequential ID initialization complete for ${collectionName}`);
  } catch (error) {
    console.error("Error initializing sequential IDs:", error);
    throw error;
  }
};

/**
 * Get all collection names that need sequential IDs
 */
export const getCollectionsForSequentialIds = () => {
  return ["notes", "sharedNotes", "communities"];
};

/**
 * Add sequential IDs to a list of documents
 * @param {Array} documents - Array of documents with Firebase IDs
 * @param {string} collectionName - The collection name
 * @returns {Promise<Array>} - Documents with sequential IDs added
 */
export const addSequentialIdsToDocuments = async (
  documents,
  collectionName
) => {
  if (!documents || documents.length === 0) return documents;

  return Promise.all(
    documents.map(async (doc) => {
      const sequentialId = await getSequentialIdFromFirebase(
        collectionName,
        doc.id
      );
      return {
        ...doc,
        sequentialId: sequentialId || doc.id, // fallback to Firebase ID if no sequential ID
      };
    })
  );
};
