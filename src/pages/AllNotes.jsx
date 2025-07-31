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
import NoteCard from "../components/NoteCard";
import { useCommentCounts } from "../hooks/useCommentCounts";

export default function AllNotes() {
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
    if (personalNotes.length > 0 || sharedNotes.length > 0) {
      setLoading(false);
    }
  }, [personalNotes, sharedNotes]);

  useEffect(() => {
    setLoading(true);

    // Set up real-time listener for personal notes
    const personalNotesQuery = query(
      collection(db, "notes"),
      orderBy("created", "desc")
    );
    const unsubPersonalNotes = onSnapshot(
      personalNotesQuery,
      (snapshot) => {
        const notes = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          type: "personal",
        }));
        setPersonalNotes(notes);
      },
      (err) => {
        console.error("Error with personal notes listener:", err);
        setError("Errore nel caricamento delle note personali.");
        setLoading(false);
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
          let notes = sharedSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            type: "shared",
          }));

          // Fetch community names for shared notes
          const communityPromises = notes.map(async (note) => {
            if (note.communityId) {
              const communityDoc = await getDoc(
                doc(db, "communities", note.communityId)
              );
              return {
                ...note,
                communityName: communityDoc.exists()
                  ? communityDoc.data().name
                  : "Comunità Sconosciuta",
              };
            }
            return note;
          });

          const notesWithCommunities = await Promise.all(communityPromises);
          setSharedNotes(notesWithCommunities);
        } catch (err) {
          console.error("Error processing shared notes:", err);
          setError("Errore nel caricamento delle note condivise.");
        }
      },
      (err) => {
        console.error("Error with shared notes listener:", err);
        setError("Errore nel caricamento delle note condivise.");
        setLoading(false);
      }
    );

    return () => {
      unsubPersonalNotes();
      unsubSharedNotes();
    };
  }, []);

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
    return <div>Caricamento di tutte le note...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!user) {
    return <div>Effettua il login per visualizzare questa pagina.</div>;
  }

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto", padding: "2rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1>Tutte le Note</h1>
        <Link to="/dashboard">← Torna al Dashboard</Link>
      </div>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {allNotes.map((note) => (
          <li key={note.id} style={{ marginBottom: "1rem" }}>
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
    </div>
  );
}
