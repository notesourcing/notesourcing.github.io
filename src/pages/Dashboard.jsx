/**
 * 🚨 CRITICAL COMPONENT - DO NOT REMOVE FEATURES WITHOUT CHECKING FEATURES.md
 * This file contains:
 * - Real-time personal notes functionality
 * - SuperAdmin role management
 * - User note management features
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
  onSnapshot,
  addDoc,
  Timestamp,
  orderBy,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import NewNoteForm from "../components/NewNoteForm";
import NoteCard from "../components/NoteCard";
import { useCommentCounts } from "../hooks/useCommentCounts";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const { user, isSuperAdmin } = useContext(AuthContext);
  const [notes, setNotes] = useState([]);
  const [sharedNotes, setSharedNotes] = useState([]);
  const [allUserNotes, setAllUserNotes] = useState([]);
  const [userCommunities, setUserCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingNote, setAddingNote] = useState(false);
  const [error, setError] = useState("");
  const availableReactions = ["👍", "❤️", "😂", "😮", "😢", "😠"];

  // Get comment counts for all user notes
  const commentCounts = useCommentCounts(allUserNotes);

  useEffect(() => {
    if (!user || !user.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);

    // ⚠️ CRITICAL: DO NOT REMOVE - Real-time listeners are essential for live updates
    // This onSnapshot listener ensures personal notes appear immediately when created
    // Replacing with getDocs() will break real-time functionality - see FEATURES.md
    const notesQuery = query(
      collection(db, "notes"),
      where("uid", "==", user.uid),
      orderBy("created", "desc")
    );
    const unsubNotes = onSnapshot(
      notesQuery,
      (snapshot) => {
        const loadedNotes = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          type: "personal",
        }));
        setNotes(loadedNotes);
      },
      (err) => {
        console.error("Error fetching notes:", err);
        setError("Errore nel caricamento delle note.");
      }
    );

    // Fetch user's shared notes in real-time (notes they authored in communities)
    const sharedNotesQuery = query(
      collection(db, "sharedNotes"),
      where("authorId", "==", user.uid),
      orderBy("created", "desc")
    );
    const unsubSharedNotes = onSnapshot(
      sharedNotesQuery,
      async (snapshot) => {
        const loadedSharedNotes = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          type: "shared",
        }));

        // Fetch community names for shared notes in real-time
        const notesWithCommunities = await Promise.all(
          loadedSharedNotes.map(async (note) => {
            if (note.communityId) {
              try {
                const communityDoc = await getDoc(
                  doc(db, "communities", note.communityId)
                );
                if (communityDoc.exists()) {
                  return {
                    ...note,
                    communityName: communityDoc.data().name,
                  };
                }
              } catch (err) {
                console.error("Error fetching community for note:", err);
              }
            }
            return { ...note, communityName: "Comunità Sconosciuta" };
          })
        );

        setSharedNotes(notesWithCommunities);
      },
      (err) => {
        console.error("Error fetching shared notes:", err);
        setError("Errore nel caricamento delle note condivise.");
      }
    );

    return () => {
      unsubNotes();
      unsubSharedNotes();
    };
  }, [user]);

  // Fetch user communities for community selection in note creation
  useEffect(() => {
    if (!user || !user.uid) {
      setUserCommunities([]);
      return;
    }

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

  // Separate useEffect for combining notes
  useEffect(() => {
    const combined = [...notes, ...sharedNotes];
    combined.sort((a, b) => {
      const dateA = a.created?.toDate ? a.created.toDate() : new Date(0);
      const dateB = b.created?.toDate ? b.created.toDate() : new Date(0);
      return dateB - dateA;
    });
    setAllUserNotes(combined);
    if (user) {
      setLoading(false);
    }
  }, [notes, sharedNotes, user]);

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

  const handleDeleteNote = async (noteId, noteType) => {
    if (!window.confirm("Sei sicuro di voler eliminare questa nota?")) {
      return;
    }

    try {
      const collection_name = noteType === "personal" ? "notes" : "sharedNotes";
      await deleteDoc(doc(db, collection_name, noteId));
    } catch (err) {
      console.error("Error deleting note:", err);
      setError("Errore durante l'eliminazione della nota.");
    }
  };

  const handleReaction = async (noteId, noteType, reaction) => {
    if (!user) return;

    const collectionName = noteType === "personal" ? "notes" : "sharedNotes";
    const noteRef = doc(db, collectionName, noteId);

    const note = allUserNotes.find((n) => n.id === noteId);
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
      setAllUserNotes(
        allUserNotes.map((n) =>
          n.id === noteId ? { ...n, reactions: updatedReactions } : n
        )
      );
    } catch (err) {
      console.error("Error updating reaction:", err);
      setError("Errore nell'aggiornare la reazione.");
    }
  };

  if (loading) {
    return <div>Caricamento...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!user) {
    return <div>Effettua il login per vedere la dashboard.</div>;
  }

  return (
    <div
      className={styles.container}
      data-page="dashboard"
      data-realtime-active="true"
    >
      <h2 className={styles.welcomeMessage}>Benvenuto, {user.email}</h2>

      {/* ⚠️ CRITICAL: DO NOT REMOVE - SuperAdmin functionality
          This section provides SuperAdmin users access to:
          - User role management (/user-roles)
          - All notes view (/all-notes)
          Removing this breaks admin capabilities - see FEATURES.md */}
      {isSuperAdmin && (
        <div className={styles.adminLinkContainer} data-superadmin="true">
          <Link to="/user-roles" className={styles.adminLink}>
            🔧 Gestisci Ruoli Utenti
          </Link>
          <Link to="/all-notes" className={styles.adminLink}>
            🔍 Visualizza Tutte le Note
          </Link>
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Le tue Note</h3>
          <button
            onClick={() => setAddingNote(!addingNote)}
            className={styles.toggleButton}
          >
            {addingNote ? "Annulla" : "＋ Nuova Nota"}
          </button>
        </div>
        {addingNote && (
          <NewNoteForm
            onSubmit={handleAddNote}
            onCancel={() => setAddingNote(false)}
            communities={userCommunities}
            showCommunitySelector={true}
          />
        )}
      </div>

      <div className={styles.section}>
        {allUserNotes.length > 0 ? (
          <ul className={styles.notesList}>
            {allUserNotes.map((note) => (
              <li key={note.id} className={styles.noteItem}>
                <NoteCard
                  note={note}
                  user={user}
                  isSuperAdmin={isSuperAdmin}
                  onReaction={handleReaction}
                  onDelete={handleDeleteNote}
                  availableReactions={availableReactions}
                  commentCount={commentCounts[note.id] || 0}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p>Non hai ancora creato nessuna nota.</p>
        )}
      </div>
    </div>
  );
}
