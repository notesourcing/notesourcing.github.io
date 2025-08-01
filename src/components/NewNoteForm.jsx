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

  // Privacy field for personal notes
  const [isPrivate, setIsPrivate] = useState(false);

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

    onSubmit(fields, selectedCommunityId, attributionData, isPrivate);
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

      {/* Privacy Selector - only show for personal notes */}
      {!selectedCommunityId && (
        <div className={styles.privacySelectorCompact}>
          <label className={styles.label} htmlFor="privacySelect">
            Privacy della nota:
          </label>
          <select
            id="privacySelect"
            className={styles.selectCompact}
            value={isPrivate ? "private" : "public"}
            onChange={(e) => setIsPrivate(e.target.value === "private")}
          >
            <option value="public">
              🌍 Pubblica - Visibile a tutti gli utenti
            </option>
            <option value="private">🔒 Privata - Visibile solo a te</option>
          </select>
          {isPrivate && (
            <div className={styles.privacyInfo}>
              ℹ️ Le note private sono visibili solo a te e non compaiono nelle
              pagine pubbliche
            </div>
          )}
        </div>
      )}

      {/* Attribution Section */}
      <div className={styles.attributionSectionCompact}>
        <label className={styles.label} htmlFor="attributionSelect">
          Attribuire questa nota a:
        </label>
        <select
          id="attributionSelect"
          className={styles.selectCompact}
          value={attributionType}
          onChange={(e) => setAttributionType(e.target.value)}
        >
          <option value="self">👤 A me stesso/a</option>
          <option value="other">👥 Ad un'altra persona</option>
          <option value="pseudonym">🎭 Ad uno pseudonimo</option>
          <option value="eteronym">✍️ Ad un eteronimo</option>
          <option value="anonymous">❓ Anonima</option>
        </select>
        {(attributionType === "other" ||
          attributionType === "pseudonym" ||
          attributionType === "eteronym") && (
          <div className={styles.attributionNameFieldCompact}>
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
              className={styles.inputCompact}
              required
            />
          </div>
        )}
        {(attributionType === "pseudonym" || attributionType === "eteronym") &&
          attributionName && (
            <div className={styles.revealOptionCompact}>
              <label className={styles.checkboxLabelCompact}>
                <input
                  type="checkbox"
                  checked={revealPseudonym}
                  onChange={(e) => setRevealPseudonym(e.target.checked)}
                  className={styles.checkboxInputCompact}
                />
                <span>
                  🔍 Rivelare che "{attributionName}" è un{" "}
                  {attributionType === "pseudonym" ? "pseudonimo" : "eteronimo"}
                </span>
              </label>
            </div>
          )}
      </div>

      {fields.map((field, index) => (
        <div key={index} className={styles.fieldCard}>
          <button
            type="button"
            onClick={() => removeField(index)}
            className={styles.removeButtonX}
            title="Rimuovi campo"
          >
            ×
          </button>
          <div className={styles.fieldContent}>
            <div className={styles.fieldNameSection}>
              <label className={styles.fieldLabelCompact}>Nome del campo</label>
              <input
                type="text"
                value={field.name}
                onChange={(e) =>
                  handleFieldChange(index, "name", e.target.value)
                }
                placeholder="es. Titolo"
                className={styles.inputCompact}
              />
            </div>
            <div className={styles.fieldValueSection}>
              <label className={styles.fieldLabelCompact}>
                Valore del campo
              </label>
              <textarea
                value={field.value}
                onChange={(e) =>
                  handleFieldChange(index, "value", e.target.value)
                }
                placeholder="Valore campo"
                className={styles.textareaResizable}
              />
            </div>
          </div>
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
