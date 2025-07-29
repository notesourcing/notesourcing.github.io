import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../App";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";

export default function Note() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !id) return;

    const fetchNote = async () => {
      try {
        const noteDoc = await getDoc(doc(db, "notes", id));
        if (noteDoc.exists()) {
          const noteData = { id: noteDoc.id, ...noteDoc.data() };
          // Check if user owns this note
          if (noteData.uid !== user.uid) {
            setError("Non hai il permesso di visualizzare questa nota.");
            setLoading(false);
            return;
          }
          setNote(noteData);
          setEditText(noteData.text);
        } else {
          setError("Nota non trovata.");
        }
      } catch (err) {
        setError("Errore nel caricamento della nota.");
      }
      setLoading(false);
    };

    fetchNote();
  }, [user, id]);

  const handleSave = async () => {
    if (!editText.trim()) return;
    try {
      await updateDoc(doc(db, "notes", id), {
        text: editText,
        lastModified: Timestamp.now(),
      });
      setNote({ ...note, text: editText, lastModified: Timestamp.now() });
      setEditing(false);
    } catch (err) {
      setError("Errore durante il salvataggio.");
    }
  };

  if (!user) {
    return <div>Effettua il login per visualizzare le note.</div>;
  }

  if (loading) {
    return <div>Caricamento nota...</div>;
  }

  if (error) {
    return (
      <div style={{ maxWidth: 600, margin: "2rem auto", padding: "2rem" }}>
        <div style={{ color: "red", marginBottom: 16 }}>{error}</div>
        <Link to="/dashboard">← Torna al Dashboard</Link>
      </div>
    );
  }

  if (!note) {
    return (
      <div style={{ maxWidth: 600, margin: "2rem auto", padding: "2rem" }}>
        <div>Nota non trovata.</div>
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
        <div style={{ display: "flex", gap: 8 }}>
          {editing ? (
            <>
              <button
                onClick={handleSave}
                style={{
                  background: "#28a745",
                  color: "white",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Salva
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setEditText(note.text);
                }}
                style={{
                  background: "#6c757d",
                  color: "white",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Annulla
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              style={{
                background: "#007bff",
                color: "white",
                border: "none",
                padding: "6px 12px",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Modifica
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          style={{
            width: "100%",
            minHeight: 200,
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 4,
            fontSize: 16,
            fontFamily: "inherit",
            resize: "vertical",
          }}
          placeholder="Scrivi il contenuto della nota..."
        />
      ) : (
        <div
          style={{
            padding: 12,
            background: "#f8f9fa",
            borderRadius: 4,
            minHeight: 200,
            whiteSpace: "pre-wrap",
            fontSize: 16,
            lineHeight: 1.5,
          }}
        >
          {note.text}
        </div>
      )}

      <div
        style={{
          marginTop: 16,
          fontSize: 12,
          color: "#888",
          borderTop: "1px solid #eee",
          paddingTop: 12,
        }}
      >
        <div>
          Creato:{" "}
          {note.created && note.created.toDate
            ? note.created.toDate().toLocaleString()
            : ""}
        </div>
        {note.lastModified && (
          <div>
            Ultima modifica:{" "}
            {note.lastModified.toDate
              ? note.lastModified.toDate().toLocaleString()
              : ""}
          </div>
        )}
      </div>

      {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
    </div>
  );
}
