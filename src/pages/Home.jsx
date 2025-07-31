/**
 * 🚨 CRITICAL COMPONENT - DO NOT REMOVE FEATURES WITHOUT CHECKING FEATURES.md
 * This file contains real-time listeners essential for live note updates.
 * Before modifying, run: npm run features
 */
import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { AuthContext } from "../App";
import styles from "./Home.module.css";

// Utility function to format user display name
const formatUserName = (authorEmail) => {
  if (!authorEmail) return "Utente Sconosciuto";

  // If it looks like an email, extract the name part
  if (authorEmail.includes("@")) {
    const namePart = authorEmail.split("@")[0];
    // Convert camelCase or snake_case to proper case
    return namePart
      .replace(/[._]/g, " ")
      .replace(/([A-Z])/g, " $1")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  return authorEmail;
};

export default function Home() {
  const { user, isSuperAdmin } = useContext(AuthContext);
  const [allNotes, setAllNotes] = useState([]);
  const [personalNotes, setPersonalNotes] = useState([]);
  const [sharedNotes, setSharedNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const availableReactions = ["👍", "❤️", "😂", "😮", "😢", "😠"];

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
            snapshot.docs.map(async (doc) => {
              const noteData = { id: doc.id, ...doc.data(), type: "personal" };

              // Try to fetch author email if we have auth, otherwise use uid
              let authorEmail = noteData.uid;
              if (user && noteData.uid) {
                try {
                  const userDoc = await getDoc(doc(db, "users", noteData.uid));
                  if (userDoc.exists()) {
                    const userData = userDoc.data();
                    // Prefer displayName, then email, then uid
                    authorEmail =
                      userData.displayName ||
                      userData.name ||
                      userData.email ||
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
            sharedSnapshot.docs.map(async (doc) => {
              const noteData = { id: doc.id, ...doc.data(), type: "shared" };

              // Try to fetch author email and community name
              let authorEmail = noteData.authorId;
              let communityName = "Comunità Sconosciuta";

              if (user && noteData.authorId) {
                try {
                  const userDoc = await getDoc(
                    doc(db, "users", noteData.authorId)
                  );
                  if (userDoc.exists()) {
                    const userData = userDoc.data();
                    // Prefer displayName, then email, then authorId
                    authorEmail =
                      userData.displayName ||
                      userData.name ||
                      userData.email ||
                      noteData.authorId;
                  }
                } catch (err) {
                  console.log("Could not fetch author email:", err);
                }
              }

              if (noteData.communityId) {
                try {
                  const communityDoc = await getDoc(
                    doc(db, "communities", noteData.communityId)
                  );
                  if (communityDoc.exists()) {
                    communityName = communityDoc.data().name;
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
              <Link to={`/note/${note.id}`} className={styles.noteLink}>
                <div className={styles.noteContent}>
                  {note.fields ? (
                    note.fields.map((field, index) => (
                      <div key={index} className={styles.field}>
                        <strong>{field.name}:</strong> {field.value}
                      </div>
                    ))
                  ) : (
                    <div className={styles.noteText}>{note.text}</div>
                  )}
                </div>

                <div className={styles.noteMetadata}>
                  <div className={styles.metadataRow}>
                    <span className={styles.author}>
                      👤 {formatUserName(note.authorEmail || note.uid)}
                    </span>
                    <span className={styles.date}>
                      📅{" "}
                      {note.created?.toDate
                        ? note.created.toDate().toLocaleDateString("it-IT", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "N/A"}
                    </span>
                  </div>
                  <div className={styles.metadataRow}>
                    {note.type === "shared" && (
                      <span className={styles.community}>
                        🏠 {note.communityName}
                      </span>
                    )}
                    <span className={styles.noteType}>
                      {note.type === "personal"
                        ? "📝 Personale"
                        : "🌐 Condivisa"}
                    </span>
                  </div>
                </div>
              </Link>

              <div className={styles.reactions}>
                {availableReactions.map((reaction) => {
                  const uids =
                    (note.reactions && note.reactions[reaction]) || [];
                  const count = uids.length;
                  const userReacted = user && uids.includes(user.uid);
                  return (
                    <button
                      key={reaction}
                      onClick={(e) => {
                        e.preventDefault();
                        handleReaction(note.id, note.type, reaction);
                      }}
                      className={`${styles.reactionButton} ${
                        userReacted ? styles.reacted : ""
                      }`}
                      disabled={!user}
                      title={
                        !user
                          ? "Accedi per reagire"
                          : userReacted
                          ? "Rimuovi reazione"
                          : "Aggiungi reazione"
                      }
                    >
                      <span className={styles.emoji}>{reaction}</span>
                      {count > 0 && (
                        <span className={styles.count}>{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {isSuperAdmin && (
                <div className={styles.adminActions}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteNote(note.id, note.type);
                    }}
                    className={styles.deleteButton}
                    title="Elimina nota (Solo Superadmin)"
                  >
                    🗑️ Elimina
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
