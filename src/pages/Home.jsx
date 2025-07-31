/**
 * 🚨 CRITICAL COMPONENT - DO NOT REMOVE FEATURES WITHOUT CHECKING FEATURES.md
 * This file contains real-time listeners essential for live note updates.
 * Before modifying, run: npm run features
 */
import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../App";
import { db } from "../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import NoteCard from "../components/NoteCard";
import { useCommentCounts } from "../hooks/useCommentCounts";
import styles from "./Home.module.css";

export default function Home() {
  const { user, isSuperAdmin } = useContext(AuthContext);
  const [allNotes, setAllNotes] = useState([]);
  const [personalNotes, setPersonalNotes] = useState([]);
  const [sharedNotes, setSharedNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const availableReactions = ["👍", "❤️", "😂", "😮", "😢", "😠"];

  // Get comment counts for all notes
  const commentCounts = useCommentCounts(allNotes);

  // Combine notes whenever personal or shared notes change
  useEffect(() => {
    const combinedNotes = [...personalNotes, ...sharedNotes];
    combinedNotes.sort((a, b) => {
      const dateA = a.created?.toDate ? a.created.toDate() : new Date(0);
      const dateB = b.created?.toDate ? b.created.toDate() : new Date(0);
      return dateB - dateA;
    });
    setAllNotes(combinedNotes);
    setLoading(false);
  }, [personalNotes, sharedNotes]);

  useEffect(() => {
    setLoading(true);
    setError("");

    // Set up real-time listener for personal notes
    const personalNotesQuery = query(
      collection(db, "notes"),
      orderBy("created", "desc")
    );
    const unsubPersonalNotes = onSnapshot(
      personalNotesQuery,
      async (snapshot) => {
        try {
          const notes = await Promise.all(
            snapshot.docs.map(async (docSnap) => {
              const noteData = {
                id: docSnap.id,
                ...docSnap.data(),
                type: "personal",
              };

              // Always fetch user by uid to get email for display
              let authorEmail = noteData.uid;
              if (noteData.uid) {
                try {
                  const userDocSnap = await getDoc(
                    doc(db, "users", noteData.uid)
                  );
                  if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    // Prefer email, then displayName, then name, then uid
                    authorEmail =
                      userData.email ||
                      userData.displayName ||
                      userData.name ||
                      noteData.uid;
                  }
                } catch (err) {
                  console.log("Could not fetch author email:", err);
                }
              }

              return { ...noteData, authorEmail };
            })
          );
          setPersonalNotes(notes);
        } catch (err) {
          console.error("Error processing personal notes:", err);
          setError("Errore nel caricamento delle note personali.");
        }
      },
      (err) => {
        console.error("Error with personal notes listener:", err);
        setError("Errore nel caricamento delle note personali.");
      }
    );

    // Set up real-time listener for shared notes
    const sharedNotesQuery = query(
      collection(db, "sharedNotes"),
      orderBy("created", "desc")
    );
    const unsubSharedNotes = onSnapshot(
      sharedNotesQuery,
      async (sharedSnapshot) => {
        try {
          const notes = await Promise.all(
            sharedSnapshot.docs.map(async (docSnap) => {
              const noteData = {
                id: docSnap.id,
                ...docSnap.data(),
                type: "shared",
              };

              // Always fetch user by uid (authorId) to get email for display
              let authorEmail = noteData.authorId;
              let communityName = "Comunità Sconosciuta";

              if (noteData.authorId) {
                try {
                  const userDocSnap = await getDoc(
                    doc(db, "users", noteData.authorId)
                  );
                  if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    // Prefer email, then displayName, then name, then authorId
                    authorEmail =
                      userData.email ||
                      userData.displayName ||
                      userData.name ||
                      noteData.authorId;
                  }
                } catch (err) {
                  console.log("Could not fetch author email:", err);
                }
              }

              if (noteData.communityId) {
                try {
                  const communityDocSnap = await getDoc(
                    doc(db, "communities", noteData.communityId)
                  );
                  if (communityDocSnap.exists()) {
                    communityName = communityDocSnap.data().name;
                  }
                } catch (err) {
                  console.log("Could not fetch community name:", err);
                }
              }

              return { ...noteData, authorEmail, communityName };
            })
          );
          setSharedNotes(notes);
        } catch (err) {
          console.error("Error processing shared notes:", err);
          setError("Errore nel caricamento delle note condivise.");
        }
      },
      (err) => {
        console.error("Error with shared notes listener:", err);
        setError("Errore nel caricamento delle note condivise.");
      }
    );

    return () => {
      unsubPersonalNotes();
      unsubSharedNotes();
    };
  }, [user]);

  const handleReaction = async (noteId, noteType, reaction) => {
    if (!user) return;

    const collectionName = noteType === "personal" ? "notes" : "sharedNotes";
    const noteRef = doc(db, collectionName, noteId);

    const note = allNotes.find((n) => n.id === noteId);
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
      setAllNotes(
        allNotes.map((n) =>
          n.id === noteId ? { ...n, reactions: updatedReactions } : n
        )
      );
    } catch (err) {
      console.error("Error updating reaction:", err);
      setError("Errore nell'aggiornare la reazione.");
    }
  };

  const handleDeleteNote = async (noteId, noteType) => {
    if (!isSuperAdmin) return;

    if (
      !window.confirm(
        "Sei sicuro di voler eliminare questa nota? (Solo Superadmin)"
      )
    ) {
      return;
    }

    try {
      const collectionName = noteType === "personal" ? "notes" : "sharedNotes";
      await deleteDoc(doc(db, collectionName, noteId));

      // Update local state
      setAllNotes(allNotes.filter((note) => note.id !== noteId));
    } catch (err) {
      console.error("Error deleting note:", err);
      setError("Errore durante l'eliminazione della nota: " + err.message);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Caricamento delle note...</div>;
  }

  if (error) {
    return <div className={`${styles.container} ${styles.error}`}>{error}</div>;
  }

  return (
    <div
      className={styles.container}
      data-page="home"
      data-realtime-active="true"
    >
      <h1 className={styles.title}>Note Pubbliche della Community</h1>
      <div className={styles.subtitle}>
        <p>
          Esplora tutte le note pubbliche e condivise dalla community. Scopri
          nuove idee, contribuisci con le tue reazioni e trova ispirazione!
        </p>
        {allNotes.length > 0 && (
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statNumber}>{allNotes.length}</span>
              <span className={styles.statLabel}>Note Totali</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>
                {allNotes.filter((note) => note.type === "shared").length}
              </span>
              <span className={styles.statLabel}>Note Community</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>
                {allNotes.filter((note) => note.type === "personal").length}
              </span>
              <span className={styles.statLabel}>Note Personali</span>
            </div>
          </div>
        )}
        {!user && (
          <div className={styles.loginPrompt}>
            <Link to="/login" className={styles.loginButton}>
              🔑 Accedi per iniziare
            </Link>
          </div>
        )}
      </div>

      {allNotes.length === 0 ? (
        <div className={styles.noNotes}>
          <h3>🌟 Benvenuto nella community!</h3>
          <p>Non ci sono ancora note pubbliche da visualizzare.</p>
          {user ? (
            <p>
              Sii il primo a condividere qualcosa di interessante! <br />
              <Link to="/dashboard" className={styles.createNoteLink}>
                ✨ Crea la tua prima nota
              </Link>
            </p>
          ) : (
            <p>
              <Link to="/login" className={styles.createNoteLink}>
                🔑 Accedi per iniziare a contribuire
              </Link>
            </p>
          )}
        </div>
      ) : (
        <ul className={styles.notesList}>
          {allNotes.map((note) => (
            <li key={note.id} className={styles.noteItem}>
              <NoteCard
                note={note}
                user={user}
                isSuperAdmin={isSuperAdmin}
                onReaction={handleReaction}
                onDelete={handleDeleteNote}
                availableReactions={availableReactions}
                showDeleteButton={isSuperAdmin}
                commentCount={commentCounts[note.id] || 0}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
