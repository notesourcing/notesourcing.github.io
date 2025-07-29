import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { AuthContext } from "../App";

export default function AllNotes() {
  const { user } = useContext(AuthContext);
  const [allNotes, setAllNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const availableReactions = ["👍", "❤️", "😂", "😮", "😢", "😠"];

  useEffect(() => {
    const fetchAllNotes = async () => {
      setLoading(true);
      try {
        // Fetch all personal notes
        const personalNotesSnapshot = await getDocs(collection(db, "notes"));
        const personalNotes = personalNotesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          type: "personal",
        }));

        // Fetch all shared notes
        const sharedNotesSnapshot = await getDocs(
          collection(db, "sharedNotes")
        );
        let sharedNotes = sharedNotesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          type: "shared",
        }));

        // Fetch community names for shared notes
        const communityPromises = sharedNotes.map(async (note) => {
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

        sharedNotes = await Promise.all(communityPromises);

        // Combine and sort all notes
        const combinedNotes = [...personalNotes, ...sharedNotes];
        combinedNotes.sort((a, b) => {
          const dateA = a.created?.toDate ? a.created.toDate() : new Date(0);
          const dateB = b.created?.toDate ? b.created.toDate() : new Date(0);
          return dateB - dateA;
        });

        setAllNotes(combinedNotes);
      } catch (err) {
        console.error("Error fetching all notes:", err);
        setError("Errore nel caricamento di tutte le note.");
      }
      setLoading(false);
    };

    fetchAllNotes();
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
          <li
            key={note.id}
            style={{
              background: "#fff",
              marginBottom: 16,
              padding: 16,
              borderRadius: 8,
              boxShadow: "0 2px 8px #0001",
              borderLeft: `5px solid ${
                note.type === "personal" ? "#007bff" : "#28a745"
              }`,
            }}
          >
            <div style={{ marginBottom: 8 }}>
              {note.fields ? (
                note.fields.map((field, index) => (
                  <div key={index}>
                    <strong>{field.name}:</strong> {field.value}
                  </div>
                ))
              ) : (
                <div>{note.text}</div> // Fallback for old notes
              )}
            </div>
            <div
              style={{
                marginTop: 12,
                paddingTop: 8,
                borderTop: "1px solid #eee",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                {availableReactions.map((reaction) => {
                  const uids =
                    (note.reactions && note.reactions[reaction]) || [];
                  const count = uids.length;
                  const userReacted = user && uids.includes(user.uid);
                  return (
                    <button
                      key={reaction}
                      onClick={() =>
                        handleReaction(note.id, note.type, reaction)
                      }
                      style={{
                        padding: "4px 8px",
                        borderRadius: 16,
                        border: userReacted
                          ? "2px solid #007bff"
                          : "1px solid #ccc",
                        background: userReacted ? "#e7f3ff" : "white",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <span>{reaction}</span>
                      {count > 0 && (
                        <span style={{ fontSize: 12, fontWeight: "bold" }}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#666",
                marginTop: 12,
                paddingTop: 8,
                borderTop: "1px solid #eee",
              }}
            >
              <p style={{ margin: "4px 0" }}>
                <strong>Autore:</strong> {note.authorEmail || note.uid}
              </p>
              {note.type === "shared" && (
                <p style={{ margin: "4px 0" }}>
                  <strong>Community:</strong>{" "}
                  <Link to={`/community/${note.communityId}`}>
                    {note.communityName}
                  </Link>
                </p>
              )}
              <p style={{ margin: "4px 0" }}>
                <strong>Tipo:</strong>{" "}
                {note.type === "personal" ? "Personale" : "Condivisa"}
              </p>
              <p style={{ margin: "4px 0" }}>
                <strong>Data:</strong>{" "}
                {note.created?.toDate
                  ? note.created.toDate().toLocaleString()
                  : "N/A"}
              </p>
              <Link to={`/note/${note.id}`}>Visualizza Dettagli</Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
