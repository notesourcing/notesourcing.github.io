import React, { useContext, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
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
} from "firebase/firestore";

export default function Community() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [community, setCommunity] = useState(null);
  const [sharedNotes, setSharedNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !id) return;

    const fetchCommunity = async () => {
      try {
        const communityDoc = await getDoc(doc(db, "communities", id));
        if (communityDoc.exists()) {
          const communityData = { id: communityDoc.id, ...communityDoc.data() };
          // Check if user is a member
          if (
            !communityData.members ||
            !communityData.members.includes(user.uid)
          ) {
            setError("Non hai accesso a questa community.");
            setLoading(false);
            return;
          }
          setCommunity(communityData);
        } else {
          setError("Community non trovata.");
          setLoading(false);
          return;
        }
      } catch (err) {
        setError("Errore nel caricamento della community.");
        setLoading(false);
        return;
      }

      // Fetch shared notes for this community
      const q = query(
        collection(db, "sharedNotes"),
        where("communityId", "==", id),
        orderBy("created", "desc")
      );

      const unsub = onSnapshot(
        q,
        (snapshot) => {
          setSharedNotes(
            snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
          setLoading(false);
        },
        (err) => {
          console.error("Error loading shared notes:", err);
          // If it's an index error, we can still show the community but without ordering
          if (
            err.code === "failed-precondition" ||
            err.code === "unimplemented"
          ) {
            // Try without ordering
            const simpleQuery = query(
              collection(db, "sharedNotes"),
              where("communityId", "==", id)
            );
            const simpleUnsub = onSnapshot(
              simpleQuery,
              (snapshot) => {
                setSharedNotes(
                  snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
                );
                setLoading(false);
              },
              (simpleErr) => {
                console.error(
                  "Error loading shared notes (simple query):",
                  simpleErr
                );
                // Just show empty notes if query fails
                setSharedNotes([]);
                setLoading(false);
              }
            );
            return () => simpleUnsub();
          } else {
            console.error("Permission or other error:", err);
            // Still show the community, just without shared notes
            setSharedNotes([]);
            setLoading(false);
          }
        }
      );

      return () => unsub();
    };

    fetchCommunity();
  }, [user, id]);

  const handleAddSharedNote = async (e) => {
    e.preventDefault();
    setError("");
    if (!newNote.trim()) return;

    try {
      await addDoc(collection(db, "sharedNotes"), {
        communityId: id,
        authorId: user.uid,
        authorEmail: user.email,
        text: newNote,
        created: Timestamp.now(),
      });
      setNewNote("");
    } catch (err) {
      console.error("Error creating shared note:", err);
      setError(
        "Errore durante la creazione della nota condivisa: " + err.message
      );
    }
  };

  if (!user) {
    return <div>Effettua il login per accedere alle community.</div>;
  }

  if (loading) {
    return <div>Caricamento community...</div>;
  }

  if (error) {
    return (
      <div style={{ maxWidth: 600, margin: "2rem auto", padding: "2rem" }}>
        <div style={{ color: "red", marginBottom: 16 }}>{error}</div>
        <Link to="/dashboard">← Torna al Dashboard</Link>
      </div>
    );
  }

  if (!community) {
    return (
      <div style={{ maxWidth: 600, margin: "2rem auto", padding: "2rem" }}>
        <div>Community non trovata.</div>
        <Link to="/dashboard">← Torna al Dashboard</Link>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "2rem auto",
        padding: "2rem",
        background: "#fff",
        borderRadius: 8,
        boxShadow: "0 2px 8px #0001",
      }}
    >
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          to="/dashboard"
          style={{ textDecoration: "none", color: "#2a5d8f" }}
        >
          ← Dashboard
        </Link>
        <h2 style={{ margin: 0 }}>{community.name}</h2>
        <div></div>
      </div>

      <div
        style={{
          marginBottom: 24,
          padding: 16,
          background: "#f8f9fa",
          borderRadius: 6,
        }}
      >
        <p style={{ margin: 0, marginBottom: 8 }}>
          <strong>Descrizione:</strong> {community.description}
        </p>
        <p style={{ margin: 0, fontSize: 14, color: "#666" }}>
          <strong>Membri:</strong>{" "}
          {community.members ? community.members.length : 0}
        </p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <strong>Note Condivise ({sharedNotes.length})</strong>
        <form
          onSubmit={handleAddSharedNote}
          style={{ display: "flex", gap: 8, marginTop: 12 }}
        >
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Condividi una nota con la community..."
            style={{ flex: 1, padding: 8 }}
          />
          <button type="submit">Condividi</button>
        </form>
        {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
      </div>

      {sharedNotes.length === 0 ? (
        <div style={{ textAlign: "center", color: "#666", padding: "2rem" }}>
          Nessuna nota condivisa ancora. Sii il primo a condividere qualcosa!
        </div>
      ) : (
        <ul style={{ padding: 0, listStyle: "none" }}>
          {sharedNotes.map((note) => (
            <li
              key={note.id}
              style={{
                background: "#f3f6fa",
                marginBottom: 8,
                padding: 12,
                borderRadius: 6,
                border: "1px solid #e9ecef",
              }}
            >
              <div style={{ marginBottom: 8 }}>
                <strong>{note.authorEmail}</strong>
                <span style={{ fontSize: 12, color: "#888", marginLeft: 8 }}>
                  {note.created && note.created.toDate
                    ? note.created.toDate().toLocaleString()
                    : ""}
                </span>
              </div>
              <div style={{ whiteSpace: "pre-wrap" }}>{note.text}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
