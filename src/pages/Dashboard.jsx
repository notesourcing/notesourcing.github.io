import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../App";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  Timestamp,
  orderBy,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [notes, setNotes] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [communityStats, setCommunityStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [error, setError] = useState("");
  const [showCommunityForm, setShowCommunityForm] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState("");
  const [newCommunityDescription, setNewCommunityDescription] = useState("");
  const [invitations, setInvitations] = useState([]);

  useEffect(() => {
    if (!user || !user.uid) return;
    setLoading(true);
    console.log("Fetching notes for user:", user);

    // Fetch user's notes
    const notesQuery = query(
      collection(db, "notes"),
      where("uid", "==", user.uid),
      orderBy("created", "desc")
    );
    const unsubNotes = onSnapshot(
      notesQuery,
      (snapshot) => {
        const loadedNotes = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotes(loadedNotes);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching notes:", err);
        setError("Errore nel caricamento delle note.");
        setLoading(false);
      }
    );

    // Fetch user's communities
    const communitiesQuery = query(
      collection(db, "communities"),
      where("members", "array-contains", user.uid)
    );
    const unsubCommunities = onSnapshot(communitiesQuery, async (snapshot) => {
      const communitiesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCommunities(communitiesData);

      // Fetch statistics for each community
      const stats = {};
      for (const community of communitiesData) {
        try {
          // Count shared notes for this community
          const sharedNotesQuery = query(
            collection(db, "sharedNotes"),
            where("communityId", "==", community.id)
          );
          const sharedNotesSnapshot = await getDocs(sharedNotesQuery);
          const sharedNotes = sharedNotesSnapshot.docs.map((doc) => doc.data());

          // Get the latest note date
          let latestNoteDate = null;
          if (sharedNotes.length > 0) {
            const sortedNotes = sharedNotes.sort((a, b) => {
              const dateA = a.created?.toDate
                ? a.created.toDate()
                : new Date(0);
              const dateB = b.created?.toDate
                ? b.created.toDate()
                : new Date(0);
              return dateB - dateA;
            });
            latestNoteDate = sortedNotes[0].created;
          }

          stats[community.id] = {
            memberCount: community.members ? community.members.length : 0,
            noteCount: sharedNotes.length,
            latestNoteDate: latestNoteDate,
            createdAt: community.created,
          };
        } catch (err) {
          console.error(
            `Error fetching stats for community ${community.id}:`,
            err
          );
          stats[community.id] = {
            memberCount: community.members ? community.members.length : 0,
            noteCount: 0,
            latestNoteDate: null,
            createdAt: community.created,
          };
        }
      }
      setCommunityStats(stats);
    });

    // Fetch user's invitations
    const invitationsQuery = query(
      collection(db, "invitations"),
      where("toId", "==", user.uid),
      where("status", "==", "pending")
    );
    const unsubInvitations = onSnapshot(invitationsQuery, (snapshot) => {
      setInvitations(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    });

    return () => {
      unsubNotes();
      unsubCommunities();
      unsubInvitations();
    };
  }, [user]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    setError("");
    if (!newNote.trim()) return;
    try {
      await addDoc(collection(db, "notes"), {
        uid: user.uid,
        text: newNote,
        created: Timestamp.now(),
      });
      setNewNote("");
    } catch (err) {
      console.error("Error handling notes:", err);
      setError("Errore durante la creazione della nota.");
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await deleteDoc(doc(db, "notes", noteId));
    } catch (err) {
      console.error("Error deleting note:", err);
      setError("Errore durante l'eliminazione della nota.");
    }
  };

  const createDemoCommunity = async () => {
    try {
      const communityRef = await addDoc(collection(db, "communities"), {
        name: "Demo Community",
        description:
          "Una community di esempio per testare le funzionalità collaborative",
        members: [user.uid],
        createdBy: user.uid,
        created: Timestamp.now(),
      });
      console.log("Demo community created with ID:", communityRef.id);
    } catch (err) {
      console.error("Error creating demo community:", err);
      setError("Errore durante la creazione della community demo.");
    }
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    setError("");
    if (!newCommunityName.trim()) return;

    try {
      await addDoc(collection(db, "communities"), {
        name: newCommunityName,
        description: newCommunityDescription || "Nessuna descrizione",
        creatorId: user.uid,
        creatorEmail: user.email,
        members: [user.uid],
        created: Timestamp.now(),
      });
      setNewCommunityName("");
      setNewCommunityDescription("");
      setShowCommunityForm(false);
    } catch (err) {
      setError("Errore nella creazione della community: " + err.message);
    }
  };

  const handleInvitation = async (invitationId, communityId, accept) => {
    const invitationRef = doc(db, "invitations", invitationId);
    try {
      if (accept) {
        // Auto-approve invitations: add user directly to community
        const communityRef = doc(db, "communities", communityId);
        await updateDoc(communityRef, {
          members: arrayUnion(user.uid),
        });
        // Update invitation status to completed
        await updateDoc(invitationRef, { status: "completed" });
      } else {
        await updateDoc(invitationRef, { status: "declined" });
      }
    } catch (err) {
      console.error("Error handling invitation:", err);
      setError("Errore nella gestione dell'invito: " + err.message);
    }
  };

  if (!user) {
    return <div>Effettua il login per vedere la dashboard.</div>;
  }

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "2rem auto",
        background: "#fff",
        borderRadius: 8,
        boxShadow: "0 2px 8px #0001",
        padding: 24,
      }}
    >
      <h2>Benvenuto, {user.email}</h2>

      {/* Invitations Section */}
      {invitations.length > 0 && (
        <div
          style={{
            marginBottom: 32,
            background: "#fffbe6",
            padding: 16,
            borderRadius: 8,
            border: "1px solid #ffe58f",
          }}
        >
          <strong>Inviti in attesa ({invitations.length})</strong>
          <ul style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
            {invitations.map((invitation) => (
              <li
                key={invitation.id}
                style={{
                  marginBottom: 8,
                  padding: 12,
                  background: "white",
                  borderRadius: 6,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <p style={{ margin: 0 }}>
                    Sei stato invitato a unirti a{" "}
                    <strong>{invitation.communityName}</strong>
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: "#666" }}>
                    Da: {invitation.fromEmail}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() =>
                      handleInvitation(
                        invitation.id,
                        invitation.communityId,
                        true
                      )
                    }
                    style={{
                      padding: "6px 12px",
                      background: "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  >
                    Accetta
                  </button>
                  <button
                    onClick={() =>
                      handleInvitation(
                        invitation.id,
                        invitation.communityId,
                        false
                      )
                    }
                    style={{
                      padding: "6px 12px",
                      background: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  >
                    Rifiuta
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Communities Section */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <strong>Le tue Community ({communities.length})</strong>
          <button
            onClick={() => setShowCommunityForm(!showCommunityForm)}
            style={{
              padding: "6px 12px",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            {showCommunityForm ? "Annulla" : "Nuova Community"}
          </button>
        </div>

        {showCommunityForm && (
          <div
            style={{
              background: "#f8f9fa",
              padding: 16,
              borderRadius: 6,
              marginBottom: 16,
              border: "1px solid #dee2e6",
            }}
          >
            <form onSubmit={handleCreateCommunity}>
              <div style={{ marginBottom: 12 }}>
                <input
                  type="text"
                  value={newCommunityName}
                  onChange={(e) => setNewCommunityName(e.target.value)}
                  placeholder="Nome della community..."
                  style={{
                    width: "100%",
                    padding: 8,
                    marginBottom: 8,
                    border: "1px solid #ccc",
                    borderRadius: 4,
                  }}
                  required
                />
                <textarea
                  value={newCommunityDescription}
                  onChange={(e) => setNewCommunityDescription(e.target.value)}
                  placeholder="Descrizione (opzionale)..."
                  style={{
                    width: "100%",
                    padding: 8,
                    minHeight: 60,
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    resize: "vertical",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="submit"
                  style={{
                    padding: "8px 16px",
                    background: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  Crea Community
                </button>
                <button
                  type="button"
                  onClick={() => setShowCommunityForm(false)}
                  style={{
                    padding: "8px 16px",
                    background: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        )}

        {communities.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
            {communities.map((community) => {
              const stats = communityStats[community.id] || {};
              return (
                <li key={community.id} style={{ marginBottom: 12 }}>
                  <Link
                    to={`/community/${community.id}`}
                    style={{
                      textDecoration: "none",
                      color: "#2a5d8f",
                      display: "block",
                      padding: 16,
                      background: "#e3eaf2",
                      borderRadius: 8,
                      border: "1px solid #d1d9e0",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "#d4e6f1";
                      e.target.style.borderColor = "#aed6f1";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "#e3eaf2";
                      e.target.style.borderColor = "#d1d9e0";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 8,
                      }}
                    >
                      <strong style={{ fontSize: 16, color: "#1a365d" }}>
                        {community.name}
                      </strong>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#718096",
                          textAlign: "right",
                        }}
                      >
                        {stats.createdAt && stats.createdAt.toDate ? (
                          <>
                            Creata il{" "}
                            {stats.createdAt.toDate().toLocaleDateString()}
                          </>
                        ) : (
                          <>Creata di recente</>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        color: "#4a5568",
                        marginBottom: 10,
                        lineHeight: "1.4",
                      }}
                    >
                      {community.description}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 16,
                        fontSize: 12,
                        color: "#718096",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "#48bb78",
                          }}
                        ></span>
                        <strong>{stats.memberCount || 0}</strong> membri
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "#4299e1",
                          }}
                        ></span>
                        <strong>{stats.noteCount || 0}</strong> note condivise
                      </div>

                      {stats.latestNoteDate && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: "#ed8936",
                            }}
                          ></span>
                          Ultima nota:{" "}
                          {(() => {
                            if (stats.latestNoteDate.toDate) {
                              const date = stats.latestNoteDate.toDate();
                              const now = new Date();
                              const diffTime = Math.abs(now - date);
                              const diffDays = Math.ceil(
                                diffTime / (1000 * 60 * 60 * 24)
                              );

                              if (diffDays === 1) return "oggi";
                              if (diffDays === 2) return "ieri";
                              if (diffDays <= 7)
                                return `${diffDays - 1} giorni fa`;
                              return date.toLocaleDateString();
                            }
                            return "sconosciuta";
                          })()}
                        </div>
                      )}

                      {!stats.latestNoteDate && stats.noteCount === 0 && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "#a0aec0",
                            fontStyle: "italic",
                          }}
                        >
                          Nessuna attività ancora
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div style={{ marginTop: 12, color: "#666" }}>
            Non fai ancora parte di nessuna community.
          </div>
        )}
      </div>

      {/* Notes Section */}
      <div style={{ marginBottom: 24 }}>
        <strong>Le tue note ({notes.length})</strong>
        <form
          onSubmit={handleAddNote}
          style={{ display: "flex", gap: 8, marginTop: 12 }}
        >
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Scrivi una nuova nota..."
            style={{ flex: 1, padding: 8 }}
          />
          <button type="submit">Aggiungi</button>
        </form>
        {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
      </div>
      {loading ? (
        <div>Caricamento note...</div>
      ) : notes.length === 0 ? (
        <div>Nessuna nota trovata.</div>
      ) : (
        <ul style={{ padding: 0, listStyle: "none" }}>
          {notes.map((note) => (
            <li
              key={note.id}
              style={{
                background: "#f3f6fa",
                marginBottom: 8,
                padding: 12,
                borderRadius: 6,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div style={{ flex: 1 }}>
                <Link
                  to={`/note/${note.id}`}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    display: "block",
                  }}
                >
                  <div style={{ cursor: "pointer" }}>
                    {note.text}
                    <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                      {(() => {
                        if (!note.created) return "";
                        // Firestore Timestamp object
                        if (note.created.toDate) {
                          try {
                            return note.created.toDate().toLocaleString();
                          } catch {
                            return JSON.stringify(note.created);
                          }
                        }
                        // If it's a string or number
                        if (
                          typeof note.created === "string" ||
                          typeof note.created === "number"
                        ) {
                          return new Date(note.created).toLocaleString();
                        }
                        return JSON.stringify(note.created);
                      })()}
                    </div>
                  </div>
                </Link>
              </div>
              <button
                onClick={() => handleDeleteNote(note.id)}
                style={{
                  background: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  padding: "4px 8px",
                  cursor: "pointer",
                  fontSize: 12,
                  marginLeft: 8,
                }}
                title="Elimina nota"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
