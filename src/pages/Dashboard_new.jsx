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
} from "firebase/firestore";
import NewNoteForm from "../components/NewNoteForm";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const { user, isSuperAdmin } = useContext(AuthContext);
  const [notes, setNotes] = useState([]);
  const [sharedNotes, setSharedNotes] = useState([]);
  const [allUserNotes, setAllUserNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingNote, setAddingNote] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !user.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);

    // Fetch user's personal notes
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

    // Fetch user's shared notes (notes they authored in communities)
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

        // Fetch community names for shared notes
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

  const handleAddNote = async (fields) => {
    setError("");
    try {
      await addDoc(collection(db, "notes"), {
        uid: user.uid,
        fields,
        created: Timestamp.now(),
      });
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
    <div className={styles.container}>
      <h2 className={styles.welcomeMessage}>Benvenuto, {user.email}</h2>

      {isSuperAdmin && (
        <div className={styles.adminLinkContainer}>
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
        {addingNote && <NewNoteForm onAddNote={handleAddNote} />}
      </div>

      <div className={styles.section}>
        {allUserNotes.length > 0 ? (
          <ul className={styles.notesList}>
            {allUserNotes.map((note) => (
              <li key={note.id} className={styles.noteItem}>
                <div className={styles.noteInfo}>
                  <Link to={`/note/${note.id}`} className={styles.noteLink}>
                    {note.fields && note.fields.length > 0
                      ? note.fields[0].value
                      : note.text || "Nota senza titolo"}
                  </Link>
                  <div className={styles.noteMeta}>
                    <span
                      className={`${styles.noteType} ${
                        note.type === "personal"
                          ? styles.personal
                          : styles.shared
                      }`}
                    >
                      {note.type === "personal" ? "Personale" : "Condivisa"}
                    </span>
                    {note.type === "shared" && note.communityName && (
                      <span className={styles.communityName}>
                        in {note.communityName}
                      </span>
                    )}
                    <span className={styles.noteDate}>
                      {note.created?.toDate
                        ? note.created.toDate().toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                </div>
                <div className={styles.noteActions}>
                  <Link to={`/note/${note.id}`} className={styles.actionButton}>
                    Modifica
                  </Link>
                  <button
                    onClick={() => handleDeleteNote(note.id, note.type)}
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                  >
                    Elimina
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>Non hai ancora creato nessuna nota.</p>
        )}
      </div>

      <div className={styles.section}>
        <p>
          <Link to="/communities">Visualizza le tue Community →</Link>
        </p>
      </div>
    </div>
  );
}
