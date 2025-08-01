import React from "react";
import { Link } from "react-router-dom";
import { formatUserDisplayName } from "../utils/userUtils";
import styles from "./NoteCard.module.css";

export default function NoteCard({
  note,
  user,
  isSuperAdmin = false,
  isAdmin = false,
  onReaction,
  onDelete,
  availableReactions = ["👍", "❤️", "😂", "😮", "😢", "😠"],
  showReactions = true,
  showDeleteButton = true,
  commentCount = 0,
}) {
  const canDelete = () => {
    if (isSuperAdmin) return true;
    if (note.type === "personal" && note.uid === user?.uid) return true;
    if (note.type === "shared" && (note.authorId === user?.uid || isAdmin))
      return true;
    return false;
  };

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return "N/A";
    return timestamp.toDate().toLocaleDateString("it-IT", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAttribution = (note) => {
    if (!note.attribution) {
      // Use community-specific display name if available, otherwise fall back to standard display
      return note.communityDisplayName || formatUserDisplayName(note);
    }

    const { type, name, revealPseudonym } = note.attribution;

    switch (type) {
      case "self":
        return note.communityDisplayName || formatUserDisplayName(note);
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
        return formatUserDisplayName(note);
    }
  };

  return (
    <div className={styles.noteCard}>
      {/* Delete button in bottom right if user can delete */}
      {showDeleteButton && canDelete() && onDelete && (
        <button
          className={styles.deleteButton}
          title="Elimina nota"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDelete(note.id, note.type);
          }}
        >
          🗑️
        </button>
      )}

      {/* Clickable note content */}
      <Link
        to={
          note.type === "shared"
            ? `/shared-note/${note.sequentialId || note.id}`
            : `/note/${note.sequentialId || note.id}`
        }
        className={styles.noteLink}
      >
        <div className={styles.noteContent}>
          {note.fields && note.fields.length > 0 ? (
            note.fields.map((field, index) => (
              <div key={index} className={styles.field}>
                <strong className={styles.fieldName}>{field.name}:</strong>
                <span className={styles.fieldValue}>{field.value}</span>
              </div>
            ))
          ) : (
            <div className={styles.noteText}>
              {note.text || "Nota senza contenuto"}
            </div>
          )}
        </div>

        <div className={styles.noteMetadata}>
          <div className={styles.metadataRow}>
            <span className={styles.author}>👤 {formatAttribution(note)}</span>
            <span className={styles.noteType}>
              {note.type === "personal" ? "📝 Personale" : "🌐 Condivisa"}
            </span>
          </div>

          <div className={styles.metadataRow}>
            <span className={styles.date}>📅 {formatDate(note.created)}</span>
            {commentCount > 0 && (
              <span className={styles.commentCount}>
                💬 {commentCount} commenti
              </span>
            )}
            {note.lastModified && (
              <span className={styles.lastModified}>
                ✏️ Aggiornato: {formatDate(note.lastModified)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Community link outside the main note link to avoid nested <a> tags */}
      {note.type === "shared" && note.communityId && note.communityName && (
        <div className={styles.communityContainer}>
          <Link
            to={`/community/${note.communityId}`}
            className={styles.communityLink}
            onClick={(e) => e.stopPropagation()}
          >
            🏠 {note.communityName}
          </Link>
        </div>
      )}

      {/* Reactions */}
      {showReactions && user && onReaction && (
        <div className={styles.reactions}>
          {availableReactions.map((reaction) => {
            const uids = (note.reactions && note.reactions[reaction]) || [];
            const count = uids.length;
            const userReacted = user && uids.includes(user.uid);
            return (
              <button
                key={reaction}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onReaction(note.id, note.type, reaction);
                }}
                className={`${styles.reactionButton} ${
                  userReacted ? styles.reacted : ""
                }`}
                title={userReacted ? "Rimuovi reazione" : "Aggiungi reazione"}
              >
                <span className={styles.emoji}>{reaction}</span>
                {count > 0 && <span className={styles.count}>{count}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
