// Configurazione Firebase (da completare con le proprie credenziali)
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  doc,
  runTransaction,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCGAPhYVpGgEcYYQWcNnZBiN-cbsCYAUlo",
  authDomain: "notesourcinggithub.firebaseapp.com",
  projectId: "notesourcinggithub",
  storageBucket: "notesourcinggithub.firebasestorage.app",
  messagingSenderId: "887759217393",
  appId: "1:887759217393:web:bb277d58e6711e8b81bf50",
  measurementId: "G-8JCQWEWBZT",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

export const getNextSequence = async (collectionName) => {
  try {
    const counterRef = doc(db, "counters", collectionName);
    let nextId;
    await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      if (!counterDoc.exists()) {
        nextId = 1;
        transaction.set(counterRef, { lastId: nextId });
      } else {
        nextId = counterDoc.data().lastId + 1;
        transaction.update(counterRef, { lastId: nextId });
      }
    });
    return nextId;
  } catch (error) {
    console.warn("Error getting next sequence (permissions issue):", error);

    // Better fallback: find the highest existing sequential ID and increment it
    try {
      const q = query(
        collection(db, collectionName),
        orderBy("sequentialId", "desc"),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const highestDoc = querySnapshot.docs[0];
        const highestId = highestDoc.data().sequentialId;

        if (typeof highestId === "number" && highestId < 1000000) {
          // Only use this if it's a reasonable number (not a timestamp)
          console.log(`Using incremental fallback: ${highestId + 1}`);
          return highestId + 1;
        }
      }

      // If no existing documents or unreasonable IDs, start from 1
      console.log("Using default fallback: starting from 1");
      return 1;
    } catch (fallbackError) {
      console.warn("Fallback sequence generation failed:", fallbackError);
      // Last resort: timestamp, but limited to reasonable range
      return Math.floor(Date.now() / 1000) % 100000; // Convert to smaller number
    }
  }
};
