// Configurazione Firebase (da completare con le proprie credenziali)
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, runTransaction } from "firebase/firestore";
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
};
