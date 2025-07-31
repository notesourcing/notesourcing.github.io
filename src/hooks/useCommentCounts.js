import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

// Custom hook to get comment counts for notes
export function useCommentCounts(notes) {
  const [commentCounts, setCommentCounts] = useState({});

  useEffect(() => {
    if (!notes || notes.length === 0) {
      setCommentCounts({});
      return;
    }

    // Use a single listener for all comments and filter client-side
    // This avoids needing multiple Firestore indexes
    const commentsCollection = collection(db, "comments");

    const unsubscribe = onSnapshot(
      commentsCollection,
      (snapshot) => {
        const allComments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const newCommentCounts = {};
        notes.forEach((note) => {
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
  }, [notes]);

  return commentCounts;
}
