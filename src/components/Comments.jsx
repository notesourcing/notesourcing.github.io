import React, { useState, useEffect, useContext } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  Timestamp,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { AuthContext } from "../App";
import {
  enrichNotesWithUserData,
  formatUserDisplayName,
  getUserCommunityCustomNames,
} from "../utils/userUtils";
import styles from "./Comments.module.css";

export default function Comments({ noteId, noteType, communityId }) {
  const { user, userDisplayName, userCommunityCustomNames } =
    useContext(AuthContext);
  const [comments, setComments] = useState([]);
  const [commentAuthorsData, setCommentAuthorsData] = useState({}); // Store authors' user data keyed by authorId
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  console.log("Comments component received props:", { noteId, noteType });

  // Real-time listener for comments
  useEffect(() => {
    if (!noteId || !noteType) {
      console.warn("Comments component missing required props:", {
        noteId,
        noteType,
      });
      setError("Impossibile caricare i commenti: ID nota mancante.");
      return;
    }

    console.log("Setting up comments listener for:", noteId, noteType);

    // Start with just the collection to test basic access
    const commentsCollection = collection(db, "comments");

    const unsubscribe = onSnapshot(
      commentsCollection,
      (snapshot) => {
        console.log(
          "All comments snapshot received:",
          snapshot.size,
          "total comments"
        );
        // Filter on client side for debugging
        const allComments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const filteredComments = allComments.filter(
          (comment) =>
            comment.noteId === noteId && comment.noteType === noteType
        );

        console.log(
          "Filtered comments for this note:",
          filteredComments.length
        );

        // Sort on client side
        filteredComments.sort((a, b) => {
          const dateA = a.created?.toDate ? a.created.toDate() : new Date(0);
          const dateB = b.created?.toDate ? b.created.toDate() : new Date(0);
          return dateA - dateB;
        });

        // Enrich comments with user data and fetch authors' community custom names
        enrichCommentsWithUserData(filteredComments);

        setComments(filteredComments);
        setError(""); // Clear any previous errors
      },
      (err) => {
        console.error("Error fetching comments:", err);
        setError("Errore nel caricamento dei commenti: " + err.message);
      }
    );

    return () => unsubscribe();
  }, [noteId, noteType]);

  const handleAddComment = async (e, parentId = null) => {
    e.preventDefault();
    if (!user) {
      setError("Devi essere loggato per commentare.");
      return;
    }

    const commentText = parentId ? replyText : newComment;
    if (!commentText.trim()) {
      setError("Il commento non può essere vuoto.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await addDoc(collection(db, "comments"), {
        noteId,
        noteType,
        authorId: user.uid,
        authorEmail: user.email,
        content: commentText.trim(),
        parentId: parentId || null,
        created: Timestamp.now(),
      });

      if (parentId) {
        setReplyText("");
        setReplyingTo(null);
      } else {
        setNewComment("");
      }
    } catch (err) {
      console.error("Error adding comment:", err);
      setError("Errore durante l'aggiunta del commento.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId, authorId) => {
    if (!user) return;

    // Only the comment author or the note author can delete comments
    if (user.uid !== authorId) {
      setError("Non puoi eliminare questo commento.");
      return;
    }

    if (!window.confirm("Sei sicuro di voler eliminare questo commento?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "comments", commentId));
    } catch (err) {
      console.error("Error deleting comment:", err);
      setError("Errore durante l'eliminazione del commento.");
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return "N/A";
    return timestamp.toDate().toLocaleDateString("it-IT", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Function to enrich comments with user data
  const enrichCommentsWithUserData = async (comments) => {
    try {
      // Get unique author IDs
      const authorIds = [
        ...new Set(comments.map((comment) => comment.authorId).filter(Boolean)),
      ];

      // Fetch user data for all authors
      const authorsData = {};
      await Promise.all(
        authorIds.map(async (authorId) => {
          try {
            // Enrich a dummy comment to get author data
            const enrichedComment = await enrichNotesWithUserData(
              [{ authorId }],
              "authorId"
            );
            if (enrichedComment && enrichedComment[0]) {
              const authorData = {
                authorEmail: enrichedComment[0].authorEmail,
                authorDisplayName: enrichedComment[0].authorDisplayName,
              };

              // Fetch community custom names if this is a community
              if (communityId) {
                const communityCustomNames = await getUserCommunityCustomNames(
                  authorId
                );
                authorData.communityCustomNames = communityCustomNames;
              }

              authorsData[authorId] = authorData;
            }
          } catch (error) {
            console.warn(`Could not fetch data for author ${authorId}:`, error);
          }
        })
      );

      setCommentAuthorsData(authorsData);
    } catch (error) {
      console.warn("Could not enrich comments with user data:", error);
    }
  };

  const formatUserName = (comment) => {
    // If this is the current user's comment, use their display names
    if (comment.authorId === user?.uid) {
      // Priority: 1. Community custom name, 2. Profile display name, 3. Email username
      if (
        communityId &&
        userCommunityCustomNames &&
        userCommunityCustomNames[communityId]
      ) {
        return userCommunityCustomNames[communityId];
      }
      if (userDisplayName) {
        return userDisplayName;
      }
      if (user?.email) {
        return user.email.split("@")[0];
      }
    }

    // For other users' comments, use their enriched data
    const authorData = commentAuthorsData[comment.authorId];
    if (authorData) {
      // Create a mock note object for the formatUserDisplayName function
      const mockNote = {
        authorEmail: authorData.authorEmail,
        authorDisplayName: authorData.authorDisplayName,
      };

      const mockUserData = {
        communityCustomNames: authorData.communityCustomNames || {},
      };

      return formatUserDisplayName(mockNote, communityId, mockUserData);
    }

    // Fallback to comment data
    if (comment.authorEmail) {
      return comment.authorEmail.split("@")[0];
    }

    return "Utente Sconosciuto";
  };

  // Organize comments into a threaded structure
  const organizeComments = (comments) => {
    const commentMap = new Map();
    const rootComments = [];

    // First, create a map of all comments
    comments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Then, organize them into a tree structure
    comments.forEach((comment) => {
      if (comment.parentId && commentMap.has(comment.parentId)) {
        // This is a reply
        commentMap
          .get(comment.parentId)
          .replies.push(commentMap.get(comment.id));
      } else {
        // This is a root comment
        rootComments.push(commentMap.get(comment.id));
      }
    });

    return rootComments;
  };

  const handleReply = (commentId) => {
    setReplyingTo(commentId);
    setReplyText("");
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyText("");
  };

  // Recursive component to render a comment and its replies
  const renderComment = (comment, depth = 0) => {
    const maxDepth = 3; // Limit nesting depth to avoid UI issues

    return (
      <div
        key={comment.id}
        className={styles.comment}
        style={{ marginLeft: `${depth * 1.5}rem` }}
      >
        <div className={styles.commentHeader}>
          <span className={styles.commentAuthor}>
            👤 {formatUserName(comment)}
          </span>
          <span className={styles.commentDate}>
            📅 {formatDate(comment.created)}
          </span>
          <div className={styles.commentActions}>
            {user && depth < maxDepth && (
              <button
                onClick={() => handleReply(comment.id)}
                className={styles.replyButton}
                title="Rispondi a questo commento"
              >
                💬 Rispondi
              </button>
            )}
            {user && user.uid === comment.authorId && (
              <button
                onClick={() =>
                  handleDeleteComment(comment.id, comment.authorId)
                }
                className={styles.deleteCommentButton}
                title="Elimina commento"
              >
                🗑️
              </button>
            )}
          </div>
        </div>

        <div className={styles.commentContent}>{comment.content}</div>

        {/* Reply form for this comment */}
        {replyingTo === comment.id && (
          <form
            onSubmit={(e) => handleAddComment(e, comment.id)}
            className={styles.replyForm}
          >
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Scrivi una risposta..."
              className={styles.replyTextarea}
              rows={2}
              disabled={loading}
            />
            <div className={styles.replyFormActions}>
              <button
                type="submit"
                disabled={loading || !replyText.trim()}
                className={styles.addReplyButton}
              >
                {loading ? "Pubblicazione..." : "Rispondi"}
              </button>
              <button
                type="button"
                onClick={cancelReply}
                className={styles.cancelReplyButton}
              >
                Annulla
              </button>
            </div>
          </form>
        )}

        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className={styles.replies}>
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.commentsSection}>
      <h3 className={styles.commentsTitle}>💬 Commenti ({comments.length})</h3>

      {/* Add comment form */}
      {user && (
        <form onSubmit={handleAddComment} className={styles.commentForm}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Scrivi un commento..."
            className={styles.commentTextarea}
            rows={3}
            disabled={loading}
          />
          <div className={styles.commentFormActions}>
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className={styles.addCommentButton}
            >
              {loading ? "Pubblicazione..." : "Pubblica Commento"}
            </button>
          </div>
        </form>
      )}

      {!user && (
        <p className={styles.loginPrompt}>
          Effettua il login per aggiungere commenti.
        </p>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {/* Comments list */}
      <div className={styles.commentsList}>
        {comments.length === 0 ? (
          <p className={styles.noComments}>Nessun commento ancora.</p>
        ) : (
          organizeComments(comments).map((comment) => renderComment(comment))
        )}
      </div>
    </div>
  );
}
