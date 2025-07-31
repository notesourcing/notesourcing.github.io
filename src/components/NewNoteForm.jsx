import React, { useState } from "react";
import styles from "./NewNoteForm.module.css";

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
    onSubmit(fields, selectedCommunityId);
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
