import React, { useState } from "react";
imimport { db, auth, getNextSequence } from "../firebase";
import { collection, addDoc, serverTimestamp, doc, setDoc } from "firebase/firestore";

// ... existing code ...

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert("Please fill in all fields.");
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to create a note.");
      return;
    }

    try {
      const numericId = await getNextSequence('notes');
      const noteId = numericId.toString();
      await setDoc(doc(db, "notes", noteId), {
        title,
        description,
        communityId,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        numericId: numericId,
      });
      setTitle("");
      setDescription("");
      setCommunityId("");
      if (onNoteCreated) {
        onNoteCreated();
      }
    } catch (error) {
      console.error("Error creating note: ", error);
      alert("Failed to create note. Please try again.");
    }
  };rom "./NewNoteForm.module.css";

export default function NewNoteForm({
  onSubmit,
  onCancel,
  loading,
  error,
  initialFields,
  communities,
  showCommunitySelector = false,
}) {
  const [fields, setFields] = useState(
    initialFields && initialFields.length > 0
      ? initialFields
      : [
          { name: "Title", value: "" },
          { name: "Description", value: "" },
        ]
  );

  const [selectedCommunityId, setSelectedCommunityId] = useState("");

  // Attribution fields
  const [attributionType, setAttributionType] = useState("self"); // "self", "other", "pseudonym", "eteronym", "anonymous"
  const [attributionName, setAttributionName] = useState("");
  const [revealPseudonym, setRevealPseudonym] = useState(false); // For pseudonym/eteronym reveal option

  const handleFieldChange = (index, fieldName, value) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], [fieldName]: value };
    setFields(updatedFields);
  };

  const addField = () => {
    setFields([...fields, { name: "", value: "" }]);
  };

  const removeField = (index) => {
    const updatedFields = fields.filter((_, i) => i !== index);
    setFields(updatedFields);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (fields.every((f) => !f.value.trim())) return;

    // Prepare attribution data
    const attributionData = {
      type: attributionType,
      name: attributionName,
      revealPseudonym: revealPseudonym,
    };

    onSubmit(fields, selectedCommunityId, attributionData);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {showCommunitySelector && (
        <div className={styles.communitySelector}>
          <label className={styles.label}>
            Seleziona Community (opzionale):
          </label>
          {communities && communities.length > 0 ? (
            <>
              <select
                value={selectedCommunityId}
                onChange={(e) => setSelectedCommunityId(e.target.value)}
                className={styles.select}
              >
                <option value="">📝 Nota Personale</option>
                {communities.map((community) => (
                  <option key={community.id} value={community.id}>
                    👥 {community.name}
                  </option>
                ))}
              </select>
              {selectedCommunityId && (
                <div className={styles.selectionInfo}>
                  ℹ️ Questa nota sarà condivisa nella community selezionata
                </div>
              )}
            </>
          ) : (
            <div className={styles.noCommunities}>
              Non fai parte di nessuna community.
              <a href="#/communities" className={styles.link}>
                {" "}
                Esplora le community
              </a>
              o creane una nuova!
            </div>
          )}
        </div>
      )}

      {/* Attribution Section */}
      <div className={styles.attributionSection}>
        <label className={styles.label}>Attribuire questa nota a:</label>
        <div className={styles.attributionOptions}>
          <div className={styles.radioGroup}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="attribution"
                value="self"
                checked={attributionType === "self"}
                onChange={(e) => setAttributionType(e.target.value)}
                className={styles.radioInput}
              />
              <span>👤 A me stesso/a</span>
            </label>

            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="attribution"
                value="other"
                checked={attributionType === "other"}
                onChange={(e) => setAttributionType(e.target.value)}
                className={styles.radioInput}
              />
              <span>👥 Ad un'altra persona</span>
            </label>

            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="attribution"
                value="pseudonym"
                checked={attributionType === "pseudonym"}
                onChange={(e) => setAttributionType(e.target.value)}
                className={styles.radioInput}
              />
              <span>🎭 Ad uno pseudonimo</span>
            </label>

            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="attribution"
                value="eteronym"
                checked={attributionType === "eteronym"}
                onChange={(e) => setAttributionType(e.target.value)}
                className={styles.radioInput}
              />
              <span>✍️ Ad un eteronimo</span>
            </label>

            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="attribution"
                value="anonymous"
                checked={attributionType === "anonymous"}
                onChange={(e) => setAttributionType(e.target.value)}
                className={styles.radioInput}
              />
              <span>❓ Anonima</span>
            </label>
          </div>

          {(attributionType === "other" ||
            attributionType === "pseudonym" ||
            attributionType === "eteronym") && (
            <div className={styles.attributionNameField}>
              <input
                type="text"
                value={attributionName}
                onChange={(e) => setAttributionName(e.target.value)}
                placeholder={
                  attributionType === "other"
                    ? "Nome della persona"
                    : attributionType === "pseudonym"
                    ? "Nome dello pseudonimo"
                    : "Nome dell'eteronimo"
                }
                className={styles.input}
                required
              />
            </div>
          )}

          {(attributionType === "pseudonym" ||
            attributionType === "eteronym") &&
            attributionName && (
              <div className={styles.revealOption}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={revealPseudonym}
                    onChange={(e) => setRevealPseudonym(e.target.checked)}
                    className={styles.checkboxInput}
                  />
                  <span>
                    🔍 Rivelare che "{attributionName}" è un{" "}
                    {attributionType === "pseudonym"
                      ? "pseudonimo"
                      : "eteronimo"}
                  </span>
                </label>
              </div>
            )}
        </div>
      </div>

      {fields.map((field, index) => (
        <div key={index} className={styles.field}>
          <input
            type="text"
            value={field.name}
            onChange={(e) => handleFieldChange(index, "name", e.target.value)}
            placeholder="Nome campo (es. Titolo)"
            className={styles.input}
          />
          <textarea
            value={field.value}
            onChange={(e) => handleFieldChange(index, "value", e.target.value)}
            placeholder="Valore campo"
            className={styles.textarea}
          />
          <button
            type="button"
            onClick={() => removeField(index)}
            className={`${styles.button} ${styles.removeButton}`}
          >
            Rimuovi
          </button>
        </div>
      ))}
      <div className={styles.buttonContainer}>
        <button
          type="button"
          onClick={addField}
          className={`${styles.button} ${styles.addFieldButton}`}
        >
          Aggiungi Campo
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`${styles.button} ${styles.submitButton}`}
        >
          {loading ? "Salvataggio..." : "Salva Nota"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={`${styles.button} ${styles.cancelButton}`}
          >
            Annulla
          </button>
        )}
      </div>
      {error && <div className={styles.error}>{error}</div>}
    </form>
  );
}
