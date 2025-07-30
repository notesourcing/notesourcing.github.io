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
  const [editFields, setEditFields] = useState([]);
  const [error, setError] = useState("");
  const availableReactions = ["👍", "❤️", "😂", "😮", "😢", "😠"];

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
          setEditFields(
            noteData.fields || [{ name: "text", value: noteData.text }]
          );
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
    if (editFields.every((field) => !field.value.trim())) {
      setError("Inserisci almeno un valore in uno dei campi.");
      return;
    }
    try {
      await updateDoc(doc(db, "notes", id), {
        fields: editFields,
        lastModified: Timestamp.now(),
      });
      setNote({ ...note, fields: editFields, lastModified: Timestamp.now() });
      setEditing(false);
    } catch (err) {
      setError("Errore durante il salvataggio.");
    }
  };

  const handleFieldChange = (index, fieldName, value) => {
    const updatedFields = [...editFields];
    updatedFields[index] = { ...updatedFields[index], [fieldName]: value };
    setEditFields(updatedFields);
  };

  const handleReaction = async (reaction) => {
    if (!user) return;
    const noteRef = doc(db, "notes", id);
    const currentReactions = note.reactions || {};
    const reactionUids = currentReactions[reaction] || [];
    const userUid = user.uid;

    let updatedReactions = { ...currentReactions };

    if (reactionUids.includes(userUid)) {
      // User is removing their reaction
      updatedReactions[reaction] = reactionUids.filter(
        (uid) => uid !== userUid
      );
      // If no one is left for this reaction, remove the reaction key
      if (updatedReactions[reaction].length === 0) {
        delete updatedReactions[reaction];
      }
    } else {
      // User is adding their reaction
      updatedReactions[reaction] = [...reactionUids, userUid];
    }

    try {
      await updateDoc(noteRef, { reactions: updatedReactions });
      setNote({ ...note, reactions: updatedReactions });
    } catch (err) {
      console.error("Error updating reaction:", err);
      setError("Errore nell'aggiornare la reazione.");
    }
  };

  const addField = () => {
    setEditFields([...editFields, { name: "", value: "" }]);
  };

  const removeField = (index) => {
    const updatedFields = [...editFields];
    updatedFields.splice(index, 1);
    setEditFields(updatedFields);
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
                  setEditFields(
                    note.fields || [{ name: "text", value: note.text }]
                  );
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
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {editFields.map((field, index) => (
            <div key={index} style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={field.name}
                onChange={(e) =>
                  handleFieldChange(index, "name", e.target.value)
                }
                placeholder="Nome campo"
                style={{ flex: 1, padding: 8, border: "1px solid #ccc" }}
              />
              <input
                type="text"
                value={field.value}
                onChange={(e) =>
                  handleFieldChange(index, "value", e.target.value)
                }
                placeholder="Valore campo"
                style={{ flex: 2, padding: 8, border: "1px solid #ccc" }}
              />
              <button onClick={() => removeField(index)}>✕</button>
            </div>
          ))}
          <button onClick={addField}>Aggiungi Campo</button>
        </div>
      ) : (
        <div
          style={{
            padding: 12,
            background: "#f8f9fa",
            borderRadius: 4,
            minHeight: 200,
            fontSize: 16,
            lineHeight: 1.5,
          }}
        >
          {note.fields ? (
            note.fields.map((field, index) => (
              <div key={index} style={{ marginBottom: 8 }}>
                <strong>{field.name}:</strong>{" "}
                <span style={{ whiteSpace: "pre-wrap" }}>{field.value}</span>
              </div>
            ))
          ) : (
            <div style={{ whiteSpace: "pre-wrap" }}>{note.text}</div>
          )}
        </div>
      )}

      <div
        style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #eee" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {availableReactions.map((reaction) => {
            const uids = (note.reactions && note.reactions[reaction]) || [];
            const count = uids.length;
            const userReacted = uids.includes(user.uid);
            return (
              <button
                key={reaction}
                onClick={() => handleReaction(reaction)}
                style={{
                  padding: "4px 8px",
                  borderRadius: 16,
                  border: userReacted ? "2px solid #007bff" : "1px solid #ccc",
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
