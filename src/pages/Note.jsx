import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { AuthContext } from "../App";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  deleteDoc,
} from "firebase/firestore";
import { getFirebaseIdFromSequential } from "../utils/sequentialIds";
import Comments from "../components/Comments";
import styles from "./Note.module.css";

export default function Note() {
  const { id: sequentialId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userDisplayName, userCommunityCustomNames } =
    useContext(AuthContext);
  const [note, setNote] = useState(null);
  const [noteId, setNoteId] = useState(null); // Firebase document ID
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editFields, setEditFields] = useState([]);
  const [error, setError] = useState("");

  // Attribution state for editing
  const [editAttributionType, setEditAttributionType] = useState("self");
  const [editAttributionName, setEditAttributionName] = useState("");
  const [editRevealPseudonym, setEditRevealPseudonym] = useState(false);

  // Privacy state for editing personal notes
  const [editIsPrivate, setEditIsPrivate] = useState(false);

  // Fetch user's community custom names
  useEffect(() => {
    if (!user || !sequentialId) return;

    const fetchNote = async () => {
      setLoading(true);
      try {
        // Determine which collection to prioritize based on URL
        const isSharedNoteRoute = location.pathname.startsWith("/shared-note");
        let noteData = null;
        let firebaseId = null;
        let noteDoc = null;

        if (isSharedNoteRoute) {
          // For /shared-note/* routes, try shared notes first
          firebaseId = await getFirebaseIdFromSequential(
            "sharedNotes",
            parseInt(sequentialId)
          );
          if (firebaseId) {
            noteDoc = await getDoc(doc(db, "sharedNotes", firebaseId));
            if (noteDoc.exists()) {
              noteData = { id: noteDoc.id, ...noteDoc.data(), type: "shared" };
              setNoteId(firebaseId);
            }
          }

          // If not found, try personal notes as fallback
          if (!noteData) {
            firebaseId = await getFirebaseIdFromSequential(
              "notes",
              parseInt(sequentialId)
            );
            if (firebaseId) {
              noteDoc = await getDoc(doc(db, "notes", firebaseId));
              if (noteDoc.exists()) {
                noteData = {
                  id: noteDoc.id,
                  ...noteDoc.data(),
                  type: "personal",
                };
                setNoteId(firebaseId);
              }
            }
          }
        } else {
          // For /note/* routes, try personal notes first
          firebaseId = await getFirebaseIdFromSequential(
            "notes",
            parseInt(sequentialId)
          );
          if (firebaseId) {
            noteDoc = await getDoc(doc(db, "notes", firebaseId));
            if (noteDoc.exists()) {
              noteData = {
                id: noteDoc.id,
                ...noteDoc.data(),
                type: "personal",
              };
              setNoteId(firebaseId);
            }
          }

          // If not found, try shared notes as fallback
          if (!noteData) {
            firebaseId = await getFirebaseIdFromSequential(
              "sharedNotes",
              parseInt(sequentialId)
            );
            if (firebaseId) {
              noteDoc = await getDoc(doc(db, "sharedNotes", firebaseId));
              if (noteDoc.exists()) {
                noteData = {
                  id: noteDoc.id,
                  ...noteDoc.data(),
                  type: "shared",
                };
                setNoteId(firebaseId);
              }
            }
          }
        }

        // If still no note found, try treating sequentialId as Firebase ID (backward compatibility)
        if (!noteData) {
          console.log("No sequential mapping found, trying as Firebase ID");

          if (isSharedNoteRoute) {
            // Try shared notes first for shared-note routes
            noteDoc = await getDoc(doc(db, "sharedNotes", sequentialId));
            if (noteDoc.exists()) {
              noteData = { id: noteDoc.id, ...noteDoc.data(), type: "shared" };
              setNoteId(sequentialId);
            } else {
              // Try personal notes as fallback
              noteDoc = await getDoc(doc(db, "notes", sequentialId));
              if (noteDoc.exists()) {
                noteData = {
                  id: noteDoc.id,
                  ...noteDoc.data(),
                  type: "personal",
                };
                setNoteId(sequentialId);
              }
            }
          } else {
            // Try personal notes first for note routes
            noteDoc = await getDoc(doc(db, "notes", sequentialId));
            if (noteDoc.exists()) {
              noteData = {
                id: noteDoc.id,
                ...noteDoc.data(),
                type: "personal",
              };
              setNoteId(sequentialId);
            } else {
              // Try shared notes as fallback
              noteDoc = await getDoc(doc(db, "sharedNotes", sequentialId));
              if (noteDoc.exists()) {
                noteData = {
                  id: noteDoc.id,
                  ...noteDoc.data(),
                  type: "shared",
                };
                setNoteId(sequentialId);
              }
            }
          }
        }

        if (noteData) {
          // Notes are publicly viewable (as seen in Home page)
          // Only editing should be restricted to authors
          setNote(noteData);
          setEditFields(
            noteData.fields || [{ name: "text", value: noteData.text || "" }]
          );

          // Initialize attribution editing state
          const attribution = noteData.attribution || { type: "self" };
          setEditAttributionType(attribution.type);
          setEditAttributionName(attribution.name || "");
          setEditRevealPseudonym(attribution.revealPseudonym || false);

          // Initialize privacy editing state for personal notes
          setEditIsPrivate(noteData.isPrivate || false);
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
  }, [user, sequentialId]);

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

      const attributionData = {
        type: editAttributionType,
        name: editAttributionName,
        revealPseudonym: editRevealPseudonym,
      };

      const updateData = {
        fields: editFields,
        attribution: attributionData,
        lastModified: Timestamp.now(),
      };

      // Add privacy field for personal notes
      if (note.type === "personal") {
        updateData.isPrivate = editIsPrivate;
      }

      await updateDoc(doc(db, collectionName, noteId), updateData);

      setNote((prev) => ({
        ...prev,
        ...updateData,
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
        await deleteDoc(doc(db, collectionName, noteId));
        navigate("/");
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

  const formatAttribution = (note) => {
    if (!note.attribution) {
      // Fallback for notes without attribution
      return (
        note.authorEmail?.split("@")[0] || note.uid || "Utente sconosciuto"
      );
    }

    const { type, name, revealPseudonym } = note.attribution;

    switch (type) {
      case "self":
        // For self attribution, use current user's display names if this is the user's own note
        if (note.type === "personal" && note.uid === user?.uid) {
          // Priority: 1. Community custom name, 2. Profile display name, 3. Email username
          if (note.communityId && userCommunityCustomNames[note.communityId]) {
            return userCommunityCustomNames[note.communityId];
          }
          if (userDisplayName) {
            return userDisplayName;
          }
          if (user?.email) {
            return user.email.split("@")[0];
          }
        }
        // For shared notes, check if current user is the author
        if (note.type === "shared" && note.authorId === user?.uid) {
          // Priority: 1. Community custom name, 2. Profile display name, 3. Email username
          if (note.communityId && userCommunityCustomNames[note.communityId]) {
            return userCommunityCustomNames[note.communityId];
          }
          if (userDisplayName) {
            return userDisplayName;
          }
          if (user?.email) {
            return user.email.split("@")[0];
          }
        }
        // Otherwise fall back to note data
        return (
          note.authorEmail?.split("@")[0] || note.uid || "Utente sconosciuto"
        );
      case "other":
        return name || "Persona sconosciuta";
      case "pseudonym":
        if (revealPseudonym) {
          return `${name} (pseudonimo)`;
        }
        return name || "Pseudonimo";
      case "eteronym":
        if (revealPseudonym) {
          return `${name} (eteronimo)`;
        }
        return name || "Eteronimo";
      case "anonymous":
        return "Anonimo";
      default:
        return (
          note.authorEmail?.split("@")[0] || note.uid || "Utente sconosciuto"
        );
    }
  };

  // Determine the appropriate back link
  const getBackLink = () => {
    // Check if this is a shared note with a community
    if (note?.type === "shared" && note?.communityId) {
      // Check if user came from a community page
      const referrer = document.referrer;
      const fromCommunity =
        referrer.includes(`/community/${note.communityId}`) ||
        location.state?.fromCommunity;

      if (fromCommunity) {
        return {
          to: `/community/${note.communityId}`,
          text: "← Torna alla Community",
        };
      }
    }

    // Default back to all notes
    return {
      to: "/",
      text: "← Torna alle Note",
    };
  };

  const backLink = getBackLink();

  if (loading) {
    return <div className={styles.loading}>Caricamento nota...</div>;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>{error}</p>
        <Link to={backLink.to} className={styles.backLink}>
          {backLink.text}
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
        <Link to={backLink.to} className={styles.backLink}>
          {backLink.text}
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

          {/* Attribution editing section */}
          <div className={styles.attributionSection}>
            <h3 className={styles.sectionTitle}>Attribuzione della Nota</h3>
            <div className={styles.attributionOptions}>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="attribution"
                    value="self"
                    checked={editAttributionType === "self"}
                    onChange={(e) => setEditAttributionType(e.target.value)}
                    className={styles.radioInput}
                  />
                  <span>👤 A me stesso/a</span>
                </label>

                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="attribution"
                    value="other"
                    checked={editAttributionType === "other"}
                    onChange={(e) => setEditAttributionType(e.target.value)}
                    className={styles.radioInput}
                  />
                  <span>👥 Ad un'altra persona</span>
                </label>

                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="attribution"
                    value="pseudonym"
                    checked={editAttributionType === "pseudonym"}
                    onChange={(e) => setEditAttributionType(e.target.value)}
                    className={styles.radioInput}
                  />
                  <span>🎭 Ad uno pseudonimo</span>
                </label>

                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="attribution"
                    value="eteronym"
                    checked={editAttributionType === "eteronym"}
                    onChange={(e) => setEditAttributionType(e.target.value)}
                    className={styles.radioInput}
                  />
                  <span>✍️ Ad un eteronimo</span>
                </label>

                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="attribution"
                    value="anonymous"
                    checked={editAttributionType === "anonymous"}
                    onChange={(e) => setEditAttributionType(e.target.value)}
                    className={styles.radioInput}
                  />
                  <span>❓ Anonima</span>
                </label>
              </div>

              {(editAttributionType === "other" ||
                editAttributionType === "pseudonym" ||
                editAttributionType === "eteronym") && (
                <div className={styles.attributionNameField}>
                  <input
                    type="text"
                    value={editAttributionName}
                    onChange={(e) => setEditAttributionName(e.target.value)}
                    placeholder={
                      editAttributionType === "other"
                        ? "Nome della persona"
                        : editAttributionType === "pseudonym"
                        ? "Nome dello pseudonimo"
                        : "Nome dell'eteronimo"
                    }
                    className={styles.input}
                  />
                </div>
              )}

              {(editAttributionType === "pseudonym" ||
                editAttributionType === "eteronym") &&
                editAttributionName && (
                  <div className={styles.revealOption}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={editRevealPseudonym}
                        onChange={(e) =>
                          setEditRevealPseudonym(e.target.checked)
                        }
                        className={styles.checkboxInput}
                      />
                      <span>
                        🔍 Rivelare che "{editAttributionName}" è un{" "}
                        {editAttributionType === "pseudonym"
                          ? "pseudonimo"
                          : "eteronimo"}
                      </span>
                    </label>
                  </div>
                )}
            </div>
          </div>

          {/* Privacy editing section - only for personal notes */}
          {note.type === "personal" && (
            <div className={styles.privacySection}>
              <h3 className={styles.sectionTitle}>Privacy della Nota</h3>
              <div className={styles.privacyOptions}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="privacy"
                    value="public"
                    checked={!editIsPrivate}
                    onChange={() => setEditIsPrivate(false)}
                    className={styles.radioInput}
                  />
                  <span>🌍 Pubblica - Visibile a tutti gli utenti</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="privacy"
                    value="private"
                    checked={editIsPrivate}
                    onChange={() => setEditIsPrivate(true)}
                    className={styles.radioInput}
                  />
                  <span>🔒 Privata - Visibile solo a te</span>
                </label>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Attribution display */}
          <div className={styles.attributionDisplay}>
            <h3 className={styles.sectionTitle}>Attribuita a:</h3>
            <p className={styles.attributionText}>
              👤 {formatAttribution(note)}
            </p>
          </div>

          {/* Privacy display - only for personal notes */}
          {note.type === "personal" && (
            <div className={styles.privacyDisplay}>
              <h3 className={styles.sectionTitle}>Privacy:</h3>
              <p className={styles.privacyText}>
                {note.isPrivate ? "🔒 Nota Privata" : "🌍 Nota Pubblica"}
              </p>
            </div>
          )}

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
      {note && noteId && note.type && (
        <Comments
          noteId={noteId}
          noteType={note.type}
          communityId={note.communityId}
        />
      )}
    </div>
  );
}
