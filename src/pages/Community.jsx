/**
 * 🚨 CRITICAL COMPONENT - DO NOT REMOVE FEATURES WITHOUT CHECKING FEATURES.md
 * This file manages community shared notes and real-time functionality.
 * Before modifying, run: npm run features
 */
import React, { useContext, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../App";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  Timestamp,
  orderBy,
  getDocs,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from "firebase/firestore";
import NewNoteForm from "../components/NewNoteForm";
import NoteCard from "../components/NoteCard";
import JoinRequestManager from "../components/JoinRequestManager";
import { useCommentCounts } from "../hooks/useCommentCounts";
import styles from "./Community.module.css";

export default function Community() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useContext(AuthContext);
  const [community, setCommunity] = useState(null);
  const [sharedNotes, setSharedNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingNote, setAddingNote] = useState(false);
  const [error, setError] = useState("");
  const [isMember, setIsMember] = useState(false);
  const [hasRequestedJoin, setHasRequestedJoin] = useState(false);
  const [requestingJoin, setRequestingJoin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const availableReactions = ["👍", "❤️", "😂", "😮", "😢", "😠"];

  // Get comment counts for shared notes
  const commentCounts = useCommentCounts(sharedNotes);

  useEffect(() => {
    if (!user || !id) return;

    const fetchCommunityData = async () => {
      setLoading(true);
      try {
        const communityDoc = await getDoc(doc(db, "communities", id));
        if (!communityDoc.exists()) {
          setError("Community non trovata.");
          setLoading(false);
          return;
        }

        const communityData = { id: communityDoc.id, ...communityDoc.data() };
        setCommunity(communityData);

        // Check if user is a member
        const isUserMember =
          communityData.members && communityData.members.includes(user.uid);
        setIsMember(isUserMember);

        // Check if user is the creator
        setIsCreator(communityData.creatorId === user.uid);

        // If not a member, check if user has already requested to join
        if (!isUserMember) {
          const joinRequestsQuery = query(
            collection(db, "joinRequests"),
            where("userId", "==", user.uid),
            where("communityId", "==", id)
          );
          const joinRequestsSnapshot = await getDocs(joinRequestsQuery);
          setHasRequestedJoin(!joinRequestsSnapshot.empty);
        }
      } catch (err) {
        console.error("Error fetching community:", err);
        setError("Errore nel caricamento della community.");
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityData();

    // Only fetch notes if user is a member
    if (isMember) {
      const notesQuery = query(
        collection(db, "sharedNotes"),
        where("communityId", "==", id),
        orderBy("created", "desc")
      );

      const unsubscribe = onSnapshot(
        notesQuery,
        (snapshot) => {
          const notes = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setSharedNotes(notes);
        },
        (err) => {
          console.error("Error fetching shared notes:", err);
          setError("Errore nel caricamento delle note condivise.");
        }
      );

      return () => unsubscribe();
    }
  }, [id, user, isMember]);

  const handleAddSharedNote = async (fields, selectedCommunityId) => {
    if (!user) return;
    setError("");
    try {
      await addDoc(collection(db, "sharedNotes"), {
        communityId: id,
        authorId: user.uid,
        authorEmail: user.email,
        fields,
        created: Timestamp.now(),
      });
      setAddingNote(false);
    } catch (err) {
      console.error("Error creating shared note:", err);
      setError("Errore durante la creazione della nota.");
    }
  };

  const handleDeleteSharedNote = async (noteId, selectedCommunityId) => {
    try {
      await deleteDoc(doc(db, "sharedNotes", noteId));
    } catch (err) {
      console.error("Error deleting shared note:", err);
      setError("Errore durante l'eliminazione della nota.");
    }
  };

  const handleJoinRequest = async () => {
    if (!user || hasRequestedJoin || requestingJoin) return;

    setRequestingJoin(true);
    setError("");

    try {
      await addDoc(collection(db, "joinRequests"), {
        communityId: id,
        userId: user.uid,
        userEmail: user.email,
        status: "pending",
        created: serverTimestamp(),
      });

      setHasRequestedJoin(true);
    } catch (err) {
      console.error("Error submitting join request:", err);
      setError("Errore durante l'invio della richiesta di adesione.");
    } finally {
      setRequestingJoin(false);
    }
  };

  const handleReaction = async (noteId, noteType, reaction) => {
    if (!user) return;

    const noteRef = doc(db, "sharedNotes", noteId);
    const note = sharedNotes.find((n) => n.id === noteId);
    if (!note) return;

    const currentReactions = note.reactions || {};
    const reactionUids = currentReactions[reaction] || [];
    const userUid = user.uid;

    let updatedReactions = { ...currentReactions };

    if (reactionUids.includes(userUid)) {
      updatedReactions[reaction] = reactionUids.filter(
        (uid) => uid !== userUid
      );
      if (updatedReactions[reaction].length === 0) {
        delete updatedReactions[reaction];
      }
    } else {
      updatedReactions[reaction] = [...reactionUids, userUid];
    }

    try {
      await updateDoc(noteRef, { reactions: updatedReactions });
      // Update local state immediately for better UX
      setSharedNotes(
        sharedNotes.map((n) =>
          n.id === noteId ? { ...n, reactions: updatedReactions } : n
        )
      );
    } catch (err) {
      console.error("Error updating reaction:", err);
      setError("Errore nell'aggiornare la reazione.");
    }
  };

  if (loading) {
    return <div className={styles.loading}>Caricamento community...</div>;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>{error}</p>
        <Link to="/dashboard" className={styles.backLink}>
          ← Torna al Dashboard
        </Link>
      </div>
    );
  }

  if (!community) {
    return (
      <div className={styles.container}>
        <p>Community non trovata.</p>
        <Link to="/dashboard" className={styles.backLink}>
          ← Torna al Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{community.name}</h1>
        <Link to="/dashboard" className={styles.backLink}>
          ← Torna al Dashboard
        </Link>
      </div>

      {!isMember ? (
        <div className={styles.joinRequest}>
          <p className={styles.notMemberMessage}>
            Non sei membro di questa community.
          </p>
          {hasRequestedJoin ? (
            <p className={styles.pendingMessage}>
              La tua richiesta di adesione è in attesa di approvazione.
            </p>
          ) : (
            <button
              className={styles.joinButton}
              onClick={handleJoinRequest}
              disabled={requestingJoin}
            >
              {requestingJoin ? "Invio richiesta..." : "Richiedi di aderire"}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className={styles.noteForm}>
            {addingNote && (
              <NewNoteForm
                onSubmit={handleAddSharedNote}
                onCancel={() => setAddingNote(false)}
              />
            )}
            {!addingNote && (
              <button
                className={styles.addButton}
                onClick={() => setAddingNote(true)}
              >
                Aggiungi Nota
              </button>
            )}
          </div>

          {isCreator && (
            <JoinRequestManager
              communityId={id}
              user={user}
              onRequestHandled={() => {
                // Optionally refresh community data when a request is handled
                // This would update member counts, etc.
              }}
            />
          )}

          <div className={styles.notesGrid}>
            {sharedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={{ ...note, type: "shared" }}
                user={user}
                isAdmin={isAdmin}
                onReaction={handleReaction}
                onDelete={handleDeleteSharedNote}
                availableReactions={availableReactions}
                commentCount={commentCounts[note.id] || 0}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
