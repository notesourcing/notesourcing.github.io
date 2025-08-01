import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

// Custom hook to get comment counts for notes
export function useCommentCounts(notes) {
  const [commentCounts, setCommentCounts] = useState({});

  // Stringify notes to create a stable dependency for useEffect
  const notesKey = JSON.stringify(notes);

  useEffect(() => {
    const parsedNotes = JSON.parse(notesKey);
    if (!parsedNotes || parsedNotes.length === 0) {
      setCommentCounts({});
      return;
    }

    // Use a single listener for all comments and filter client-side
    const commentsCollection = collection(db, "comments");

    const unsubscribe = onSnapshot(
      commentsCollection,
      (snapshot) => {
        const allComments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const newCommentCounts = {};
        parsedNotes.forEach((note) => {
          const commentCount = allComments.filter(
            (comment) =>
              comment.noteId === note.id && comment.noteType === note.type
          ).length;
          newCommentCounts[note.id] = commentCount;
        });

        setCommentCounts(newCommentCounts);
      },
      (err) => {
        console.error("Error fetching comment counts:", err);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [notesKey]); // Use the stable stringified key as a dependency

  return commentCounts;
}
