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
  where,
  orderBy,
  onSnapshot,
  addDoc,
  Timestamp,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { enrichNotesWithUserData } from "../utils/userUtils";
import NewNoteForm from "../components/NewNoteForm";
import NoteCard from "../components/NoteCard";
import { useCommentCounts } from "../hooks/useCommentCounts";
import styles from "./Home.module.css";

export default function Home() {
  const { user, isSuperAdmin } = useContext(AuthContext);
  const [allNotes, setAllNotes] = useState([]);
  const [personalNotes, setPersonalNotes] = useState([]);
  const [sharedNotes, setSharedNotes] = useState([]);
  const [userCommunities, setUserCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [filterType, setFilterType] = useState("all"); // "all", "my", "shared", "personal"
  const availableReactions = ["👍", "❤️", "😂", "😮", "😢", "😠"];

  // Get comment counts for all notes
  const commentCounts = useCommentCounts(allNotes);

  // Combine and filter notes whenever personal or shared notes change
  useEffect(() => {
    let combinedNotes = [...personalNotes, ...sharedNotes];

    // Apply filtering
    if (filterType === "my") {
      combinedNotes = combinedNotes.filter(
        (note) =>
          (note.type === "personal" && note.uid === user?.uid) ||
          (note.type === "shared" && note.authorId === user?.uid)
      );
    } else if (filterType === "personal") {
      combinedNotes = personalNotes;
    } else if (filterType === "shared") {
      combinedNotes = sharedNotes;
    }
    // "all" shows everything (default)

    combinedNotes.sort((a, b) => {
      const dateA = a.created?.toDate ? a.created.toDate() : new Date(0);
      const dateB = b.created?.toDate ? b.created.toDate() : new Date(0);
      return dateB - dateA;
    });
    setAllNotes(combinedNotes);
    setLoading(false);
  }, [personalNotes, sharedNotes, filterType, user]);

  useEffect(() => {
    if (!user || !user.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");

    // Set up real-time listener for user's personal notes
    const personalNotesQuery = query(
      collection(db, "notes"),
      where("uid", "==", user.uid),
      orderBy("created", "desc")
    );
    const unsubPersonalNotes = onSnapshot(
      personalNotesQuery,
      async (snapshot) => {
        try {
          const rawNotes = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            type: "personal",
          }));

          // Enrich with user display data
          const enrichedNotes = await enrichNotesWithUserData(rawNotes, "uid");
          setPersonalNotes(enrichedNotes);
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

    // Set up real-time listener for ALL shared notes (community notes)
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

              // Enrich with user display data
              const enrichedNote = await enrichNotesWithUserData(
                [noteData],
                "authorId"
              );

              // Also fetch community name
              let communityName = "Comunità Sconosciuta";
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

              return { ...enrichedNote[0], communityName };
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

  // Fetch user communities for note creation
  useEffect(() => {
    if (!user || !user.uid) return;

    const q = query(
      collection(db, "communities"),
      where("members", "array-contains", user.uid)
    );

    const unsubscribeCommunities = onSnapshot(
      q,
      (snapshot) => {
        const communities = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUserCommunities(communities);
      },
      (err) => {
        console.error("Error fetching user communities:", err);
        setError("Errore nel caricamento delle community.");
      }
    );

    return () => unsubscribeCommunities();
  }, [user]);

  const handleAddNote = async (fields, selectedCommunityId) => {
    setError("");
    try {
      if (selectedCommunityId) {
        // Create shared note in community
        await addDoc(collection(db, "sharedNotes"), {
          communityId: selectedCommunityId,
          authorId: user.uid,
          authorEmail: user.email,
          fields,
          created: Timestamp.now(),
        });
      } else {
        // Create personal note
        await addDoc(collection(db, "notes"), {
          uid: user.uid,
          fields,
          created: Timestamp.now(),
        });
      }
      setAddingNote(false);
    } catch (err) {
      console.error("Error handling notes:", err);
      setError("Errore durante la creazione della nota.");
    }
  };

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
      // Remove user's reaction
      updatedReactions[reaction] = reactionUids.filter(
        (uid) => uid !== userUid
      );
      if (updatedReactions[reaction].length === 0) {
        delete updatedReactions[reaction];
      }
    } else {
      // Add user's reaction
      updatedReactions[reaction] = [...reactionUids, userUid];
    }

    try {
      await updateDoc(noteRef, { reactions: updatedReactions });
      // Update local state immediately for better UX
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
    const note = allNotes.find((n) => n.id === noteId);
    if (!note) return;

    // Check if user can delete this note
    const canDelete =
      isSuperAdmin ||
      (noteType === "personal" && note.uid === user.uid) ||
      (noteType === "shared" && note.authorId === user.uid);

    if (!canDelete) return;

    if (!window.confirm("Sei sicuro di voler eliminare questa nota?")) {
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
      <div className={styles.header}>
        <h1 className={styles.title}>Tutte le Note</h1>
        <div className={styles.subtitle}>
          <p>
            Esplora tutte le note della community e le tue note personali. Crea,
            condividi e trova ispirazione!
          </p>
        </div>
      </div>

      {/* Note Creation Section - only for logged in users */}
      {user && (
        <div className={styles.noteCreation}>
          {addingNote ? (
            <NewNoteForm
              onSubmit={handleAddNote}
              onCancel={() => setAddingNote(false)}
              communities={userCommunities}
              showCommunitySelector={true}
            />
          ) : (
            <button
              className={styles.addButton}
              onClick={() => setAddingNote(true)}
            >
              ✨ Crea Nuova Nota
            </button>
          )}
        </div>
      )}

      {/* Filter Controls */}
      {user && (
        <div className={styles.filterControls}>
          <div className={styles.filterGroup}>
            <label>Mostra:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">Tutte le Note</option>
              <option value="my">Le Mie Note</option>
              <option value="personal">Solo Note Personali</option>
              <option value="shared">Solo Note Community</option>
            </select>
          </div>
        </div>
      )}

      {/* Stats */}
      {allNotes.length > 0 && (
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statNumber}>{allNotes.length}</span>
            <span className={styles.statLabel}>Note Mostrate</span>
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
          <div className={styles.noNotes}>
            <h3>🌟 Benvenuto nella community!</h3>
            <p>Accedi per vedere tutte le note e iniziare a contribuire.</p>
            <Link to="/login" className={styles.loginButton}>
              🔑 Accedi per iniziare
            </Link>
          </div>
        </div>
      )}

      {user && allNotes.length === 0 && (
        <div className={styles.noNotes}>
          <h3>📝 Nessuna nota trovata</h3>
          <p>
            {filterType === "my" && "Non hai ancora creato alcuna nota."}
            {filterType === "personal" && "Non hai note personali."}
            {filterType === "shared" &&
              "Non ci sono note della community accessibili."}
            {filterType === "all" && "Non ci sono ancora note da visualizzare."}
          </p>
          <p>Inizia creando la tua prima nota!</p>
        </div>
      )}

      {user && allNotes.length > 0 && (
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
                showDeleteButton={
                  isSuperAdmin ||
                  (note.type === "personal" && note.uid === user.uid) ||
                  (note.type === "shared" && note.authorId === user.uid)
                }
                commentCount={commentCounts[note.id] || 0}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
