import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../App";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  deleteDoc,
} from "firebase/firestore";
import Comments from "../components/Comments";
import styles from "./Note.module.css";

export default function Note() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editFields, setEditFields] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !id) return;

    const fetchNote = async () => {
      setLoading(true);
      try {
        // Try personal note first
        let noteDoc = await getDoc(doc(db, "notes", id));
        let noteData = null;
        if (noteDoc.exists()) {
          noteData = { id: noteDoc.id, ...noteDoc.data(), type: "personal" };
        } else {
          // Try shared note
          noteDoc = await getDoc(doc(db, "sharedNotes", id));
          if (noteDoc.exists()) {
            noteData = { id: noteDoc.id, ...noteDoc.data(), type: "shared" };
          }
        }
        if (noteData) {
          // Notes are publicly viewable (as seen in Home page)
          // Only editing should be restricted to authors
          setNote(noteData);
          setEditFields(
            noteData.fields || [{ name: "text", value: noteData.text || "" }]
          );
        } else {
          setError("Nota non trovata.");
        }
      } catch (err) {
        console.error("Error fetching note:", err);
        setError("Errore nel caricamento della nota.");
      }
      setLoading(false);
    };

    fetchNote();
  }, [user, id]);

  const handleSave = async () => {
    if (!canEditNote()) {
      setError("Non hai il permesso di modificare questa nota.");
      return;
    }
    if (editFields.every((field) => !field.value.trim())) {
      setError("Inserisci almeno un valore in uno dei campi.");
      return;
    }
    setError("");
    try {
      const collectionName = note.type === "shared" ? "sharedNotes" : "notes";
      await updateDoc(doc(db, collectionName, id), {
        fields: editFields,
        lastModified: Timestamp.now(),
      });
      setNote((prev) => ({
        ...prev,
        fields: editFields,
        lastModified: Timestamp.now(),
      }));
      setEditing(false);
    } catch (err) {
      console.error("Error saving note:", err);
      setError("Errore durante il salvataggio.");
    }
  };

  const handleDelete = async () => {
    if (!canEditNote()) {
      setError("Non hai il permesso di eliminare questa nota.");
      return;
    }
    if (window.confirm("Sei sicuro di voler eliminare questa nota?")) {
      try {
        const collectionName = note.type === "shared" ? "sharedNotes" : "notes";
        await deleteDoc(doc(db, collectionName, id));
        navigate("/dashboard");
      } catch (err) {
        console.error("Error deleting note:", err);
        setError("Errore durante l'eliminazione della nota.");
      }
    }
  };

  const handleFieldChange = (index, fieldName, value) => {
    const updatedFields = [...editFields];
    updatedFields[index] = { ...updatedFields[index], [fieldName]: value };
    setEditFields(updatedFields);
  };

  const addField = () => {
    setEditFields([...editFields, { name: "", value: "" }]);
  };

  const removeField = (index) => {
    const updatedFields = editFields.filter((_, i) => i !== index);
    setEditFields(updatedFields);
  };

  // Check if current user can edit/delete this note
  const canEditNote = () => {
    if (!user || !note) return false;
    if (note.type === "personal" && note.uid === user.uid) return true;
    if (note.type === "shared" && note.authorId === user.uid) return true;
    return false;
  };

  if (loading) {
    return <div className={styles.loading}>Caricamento nota...</div>;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>{error}</p>
        <Link to="/dashboard" className={styles.backLink}>
          ← Torna al Dashboard
        </Link>
      </div>
    );
  }

  if (!note) {
    return null; // Or a 'not found' component
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {editing ? "Modifica Nota" : "Dettaglio Nota"}
        </h1>
        <Link to="/dashboard" className={styles.backLink}>
          ← Torna al Dashboard
        </Link>
      </div>

      {!canEditNote() && (
        <div className={styles.readOnlyNotice}>
          👁️ Stai visualizzando questa nota in modalità sola lettura
        </div>
      )}

      {editing ? (
        <div className={styles.form}>
          {editFields.map((field, index) => (
            <div key={index} className={styles.field}>
              <input
                type="text"
                value={field.name}
                onChange={(e) =>
                  handleFieldChange(index, "name", e.target.value)
                }
                placeholder="Nome campo"
                className={styles.input}
              />
              <textarea
                value={field.value}
                onChange={(e) =>
                  handleFieldChange(index, "value", e.target.value)
                }
                placeholder="Valore campo"
                className={styles.textarea}
              />
              <button
                onClick={() => removeField(index)}
                className={styles.deleteButton}
              >
                Rimuovi Campo
              </button>
            </div>
          ))}
          <button onClick={addField} className={styles.button}>
            Aggiungi Campo
          </button>
        </div>
      ) : (
        <div>
          {note.fields?.map((field, index) => (
            <div key={index} className={styles.field}>
              <strong className={styles.label}>{field.name}:</strong>
              <p className={styles.textarea}>{field.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className={styles.buttonContainer}>
        {canEditNote() && (
          <>
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  className={`${styles.button} ${styles.saveButton}`}
                >
                  Salva
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className={`${styles.button} ${styles.cancelButton}`}
                >
                  Annulla
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className={`${styles.button} ${styles.saveButton}`}
              >
                Modifica
              </button>
            )}
            <button
              onClick={handleDelete}
              className={`${styles.button} ${styles.deleteButton}`}
            >
              Elimina
            </button>
          </>
        )}
      </div>
      {error && <p className={styles.error}>{error}</p>}

      {/* Comments Section */}
      {note && note.id && note.type && (
        <Comments noteId={note.id} noteType={note.type} />
      )}
    </div>
  );
}
