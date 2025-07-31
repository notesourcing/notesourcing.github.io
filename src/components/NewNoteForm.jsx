import React, { useState } from "react";
import styles from "./NewNoteForm.module.css";

export default function NewNoteForm({
  onSubmit,
  onCancel,
  loading,
  error,
  initialFields,
}) {
  const [fields, setFields] = useState(
    initialFields && initialFields.length > 0
      ? initialFields
      : [
          { name: "Title", value: "" },
          { name: "URL", value: "" },
        ]
  );

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
    onSubmit(fields);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
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
