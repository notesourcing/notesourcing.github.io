import React, { useContext, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../App";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  Timestamp,
  orderBy,
  getDocs,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";

export default function Community() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [community, setCommunity] = useState(null);
  const [sharedNotes, setSharedNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [error, setError] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (!user || !id) return;

    const fetchCommunity = async () => {
      try {
        const communityDoc = await getDoc(doc(db, "communities", id));
        if (communityDoc.exists()) {
          const communityData = { id: communityDoc.id, ...communityDoc.data() };
          // Check if user is a member
          if (
            !communityData.members ||
            !communityData.members.includes(user.uid)
          ) {
            setError("Non hai accesso a questa community.");
            setLoading(false);
            return;
          }
          setCommunity(communityData);

          // Fetch member details if user is creator
          if (user.uid === communityData.creatorId && communityData.members) {
            const memberPromises = communityData.members.map(
              async (memberId) => {
                try {
                  const memberDoc = await getDoc(doc(db, "users", memberId));
                  if (memberDoc.exists()) {
                    return { id: memberId, ...memberDoc.data() };
                  }
                  return { id: memberId, email: "Unknown user" };
                } catch (err) {
                  return { id: memberId, email: "Unknown user" };
                }
              }
            );

            const memberDetails = await Promise.all(memberPromises);
            setMembers(memberDetails);
          }
        } else {
          setError("Community non trovata.");
          setLoading(false);
          return;
        }
      } catch (err) {
        setError("Errore nel caricamento della community.");
        setLoading(false);
        return;
      }

      // Fetch shared notes for this community
      const q = query(
        collection(db, "sharedNotes"),
        where("communityId", "==", id),
        orderBy("created", "desc")
      );

      const unsub = onSnapshot(
        q,
        (snapshot) => {
          setSharedNotes(
            snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
          setLoading(false);
        },
        (err) => {
          console.error("Error loading shared notes:", err);
          // If it's an index error, we can still show the community but without ordering
          if (
            err.code === "failed-precondition" ||
            err.code === "unimplemented"
          ) {
            // Try without ordering
            const simpleQuery = query(
              collection(db, "sharedNotes"),
              where("communityId", "==", id)
            );
            const simpleUnsub = onSnapshot(
              simpleQuery,
              (snapshot) => {
                setSharedNotes(
                  snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
                );
                setLoading(false);
              },
              (simpleErr) => {
                console.error(
                  "Error loading shared notes (simple query):",
                  simpleErr
                );
                // Just show empty notes if query fails
                setSharedNotes([]);
                setLoading(false);
              }
            );
            return () => simpleUnsub();
          } else {
            console.error("Permission or other error:", err);
            // Still show the community, just without shared notes
            setSharedNotes([]);
            setLoading(false);
          }
        }
      );

      return () => unsub();
    };

    fetchCommunity();

    // Fetch pending invitations for this community (if user is creator)
    if (user && id) {
      const joinRequestsQuery = query(
        collection(db, "joinRequests"),
        where("communityId", "==", id),
        where("status", "==", "pending")
      );
      const unsubJoinRequests = onSnapshot(joinRequestsQuery, (snapshot) => {
        setPendingInvitations(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      });

      return () => {
        unsubJoinRequests();
      };
    }
  }, [user, id]);

  const handleAddSharedNote = async (e) => {
    e.preventDefault();
    setError("");
    if (!newNote.trim()) return;

    try {
      await addDoc(collection(db, "sharedNotes"), {
        communityId: id,
        authorId: user.uid,
        authorEmail: user.email,
        text: newNote,
        created: Timestamp.now(),
      });
      setNewNote("");
    } catch (err) {
      console.error("Error creating shared note:", err);
      setError(
        "Errore durante la creazione della nota condivisa: " + err.message
      );
    }
  };

  const handleDeleteSharedNote = async (noteId) => {
    try {
      await deleteDoc(doc(db, "sharedNotes", noteId));
    } catch (err) {
      console.error("Error deleting shared note:", err);
      setError("Errore durante l'eliminazione della nota: " + err.message);
    }
  };

  const handleDeleteCommunity = async () => {
    if (
      !window.confirm(
        "Sei sicuro di voler eliminare questa community? Questa azione è irreversibile e eliminerà anche tutte le note condivise."
      )
    ) {
      return;
    }

    try {
      console.log("Starting community deletion...");

      // First, delete all shared notes in this community
      console.log("Deleting shared notes...");
      const sharedNotesQuery = query(
        collection(db, "sharedNotes"),
        where("communityId", "==", id)
      );
      const sharedNotesSnapshot = await getDocs(sharedNotesQuery);
      console.log(
        `Found ${sharedNotesSnapshot.docs.length} shared notes to delete`
      );

      // Delete all shared notes
      const deleteNotesPromises = sharedNotesSnapshot.docs.map((noteDoc) =>
        deleteDoc(doc(db, "sharedNotes", noteDoc.id))
      );
      await Promise.all(deleteNotesPromises);
      console.log("Shared notes deleted successfully");

      // Delete all invitations for this community
      console.log("Deleting invitations...");
      const invitationsQuery = query(
        collection(db, "invitations"),
        where("communityId", "==", id)
      );
      const invitationsSnapshot = await getDocs(invitationsQuery);
      console.log(
        `Found ${invitationsSnapshot.docs.length} invitations to delete`
      );

      const deleteInvitationsPromises = invitationsSnapshot.docs.map(
        (inviteDoc) => deleteDoc(doc(db, "invitations", inviteDoc.id))
      );
      await Promise.all(deleteInvitationsPromises);
      console.log("Invitations deleted successfully");

      // Delete all join requests for this community
      console.log("Deleting join requests...");
      const joinRequestsQuery = query(
        collection(db, "joinRequests"),
        where("communityId", "==", id)
      );
      const joinRequestsSnapshot = await getDocs(joinRequestsQuery);
      console.log(
        `Found ${joinRequestsSnapshot.docs.length} join requests to delete`
      );

      const deleteJoinRequestsPromises = joinRequestsSnapshot.docs.map(
        (requestDoc) => deleteDoc(doc(db, "joinRequests", requestDoc.id))
      );
      await Promise.all(deleteJoinRequestsPromises);
      console.log("Join requests deleted successfully");

      // Finally, delete the community itself
      console.log("Deleting community...");
      await deleteDoc(doc(db, "communities", id));
      console.log("Community deleted successfully");

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error("Error deleting community:", err);
      setError("Errore durante l'eliminazione della community: " + err.message);
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    setError("");
    setInviteMessage("");
    if (!inviteEmail.trim()) {
      setError("Inserisci un indirizzo email valido.");
      return;
    }

    try {
      // Check if user exists
      const userQuery = query(
        collection(db, "users"),
        where("email", "==", inviteEmail)
      );
      const userSnapshot = await getDocs(userQuery);
      if (userSnapshot.empty) {
        setError("Nessun utente trovato con questa email.");
        return;
      }
      const invitedUser = userSnapshot.docs[0].data();
      const invitedUserId = userSnapshot.docs[0].id;

      // Check if user is already a member
      if (community.members.includes(invitedUserId)) {
        setError("Questo utente è già membro della community.");
        return;
      }

      // Create invitation
      await addDoc(collection(db, "invitations"), {
        communityId: id,
        communityName: community.name,
        fromId: user.uid,
        fromEmail: user.email,
        toId: invitedUserId,
        toEmail: inviteEmail,
        status: "pending",
        created: Timestamp.now(),
      });

      setInviteMessage(`Invito inviato a ${inviteEmail}!`);
      setInviteEmail("");
    } catch (err) {
      console.error("Error sending invitation:", err);
      setError("Errore durante l'invio dell'invito: " + err.message);
    }
  };

  const handleApproveJoinRequest = async (requestId, userId) => {
    try {
      // Add user to community members
      const communityRef = doc(db, "communities", id);
      await updateDoc(communityRef, {
        members: arrayUnion(userId),
      });

      // Update join request status to approved
      const requestRef = doc(db, "joinRequests", requestId);
      await updateDoc(requestRef, { status: "approved" });

      setInviteMessage("Richiesta di adesione approvata!");
    } catch (err) {
      console.error("Error approving join request:", err);
      setError("Errore durante l'approvazione: " + err.message);
    }
  };

  const handleRejectJoinRequest = async (requestId) => {
    try {
      await deleteDoc(doc(db, "joinRequests", requestId));
    } catch (error) {
      console.error("Errore durante il rifiuto della richiesta:", error);
    }
  };

  // Request to join community
  const handleJoinRequest = async () => {
    try {
      // Check if user already has a pending request
      const existingRequestQuery = query(
        collection(db, "joinRequests"),
        where("communityId", "==", id),
        where("userId", "==", user.uid),
        where("status", "==", "pending")
      );
      const existingRequestSnapshot = await getDocs(existingRequestQuery);

      if (!existingRequestSnapshot.empty) {
        alert("Hai già una richiesta in sospeso per questa community.");
        return;
      }

      await addDoc(collection(db, "joinRequests"), {
        communityId: id,
        userId: user.uid,
        userEmail: user.email,
        status: "pending",
        createdAt: new Date(),
      });

      alert("Richiesta di adesione inviata!");
    } catch (error) {
      console.error("Errore durante l'invio della richiesta:", error);
      alert("Errore durante l'invio della richiesta");
    }
  };
  const handleRemoveMember = async (memberId) => {
    if (memberId === user.uid) {
      setError("Non puoi rimuovere te stesso dalla community.");
      return;
    }

    if (
      window.confirm(
        "Sei sicuro di voler rimuovere questo membro dalla community?"
      )
    ) {
      try {
        const communityRef = doc(db, "communities", id);
        await updateDoc(communityRef, {
          members: arrayRemove(memberId),
        });

        // Update local members list
        setMembers(members.filter((member) => member.id !== memberId));

        // Update local community state to reflect the change
        setCommunity((prev) => ({
          ...prev,
          members: prev.members.filter((id) => id !== memberId),
        }));

        setInviteMessage("Membro rimosso dalla community.");
      } catch (err) {
        console.error("Error removing member:", err);
        setError("Errore durante la rimozione del membro: " + err.message);
      }
    }
  };

  const isMember = community?.members?.includes(user.uid);

  if (!user) {
    return <div>Effettua il login per accedere alle community.</div>;
  }

  if (loading) {
    return <div>Caricamento community...</div>;
  }

  if (error) {
    return (
      <div style={{ maxWidth: 600, margin: "2rem auto", padding: "2rem" }}>
        <div style={{ color: "red", marginBottom: 16 }}>{error}</div>
        <Link to="/dashboard">← Torna al Dashboard</Link>
      </div>
    );
  }

  if (!community) {
    return (
      <div style={{ maxWidth: 600, margin: "2rem auto", padding: "2rem" }}>
        <div>Community non trovata.</div>
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
        <h2 style={{ margin: 0 }}>{community.name}</h2>
        <div>
          {community.creatorId === user.uid && (
            <button
              onClick={handleDeleteCommunity}
              style={{
                background: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: 4,
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: "bold",
              }}
              title="Elimina community"
            >
              🗑️ Elimina Community
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          marginBottom: 24,
          padding: 16,
          background: "#f8f9fa",
          borderRadius: 6,
        }}
      >
        <p style={{ margin: 0, marginBottom: 8 }}>
          <strong>Descrizione:</strong> {community.description}
        </p>
        <p style={{ margin: 0, fontSize: 14, color: "#666" }}>
          <strong>Membri:</strong>{" "}
          {community.members ? community.members.length : 0}
        </p>
      </div>

      {/* Invite Section */}
      {user.uid === community.creatorId && (
        <div
          style={{
            marginBottom: 24,
            padding: 16,
            background: "#f0f4f8",
            borderRadius: 6,
          }}
        >
          <strong style={{ display: "block", marginBottom: 8 }}>
            Invita un nuovo membro
          </strong>
          <form onSubmit={handleInviteUser} style={{ display: "flex", gap: 8 }}>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Email del nuovo membro..."
              style={{ flex: 1, padding: 8 }}
              required
            />
            <button type="submit">Invia Invito</button>
          </form>
          {inviteMessage && (
            <div style={{ color: "green", marginTop: 8 }}>{inviteMessage}</div>
          )}
        </div>
      )}

      {/* Join Request Section for non-members */}
      {!isMember && user.uid !== community.creatorId && (
        <div
          style={{
            marginBottom: 24,
            padding: 16,
            background: "#f8f9fa",
            borderRadius: 6,
            border: "1px solid #dee2e6",
            textAlign: "center",
          }}
        >
          <p style={{ marginBottom: 16 }}>
            Non sei membro di questa community. Vuoi richiedere di unirti?
          </p>
          <button
            onClick={handleJoinRequest}
            style={{
              padding: "8px 16px",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Richiedi di unirti
          </button>
        </div>
      )}

      {/* Join Requests Section */}
      {user.uid === community.creatorId && pendingInvitations.length > 0 && (
        <div
          style={{
            marginBottom: 24,
            padding: 16,
            background: "#fff3cd",
            borderRadius: 6,
            border: "1px solid #ffeaa7",
          }}
        >
          <strong style={{ display: "block", marginBottom: 12 }}>
            Richieste di adesione ({pendingInvitations.length})
          </strong>
          {pendingInvitations.map((request) => (
            <div
              key={request.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 8,
                background: "white",
                borderRadius: 4,
                marginBottom: 8,
              }}
            >
              <div>
                <strong>{request.userEmail}</strong> vuole unirsi alla community
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() =>
                    handleApproveJoinRequest(request.id, request.userId)
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
                  Approva
                </button>
                <button
                  onClick={() => handleRejectJoinRequest(request.id)}
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
            </div>
          ))}
        </div>
      )}

      {/* Member Management Section */}
      {user.uid === community.creatorId && members.length > 0 && (
        <div
          style={{
            marginBottom: 24,
            padding: 16,
            background: "#f8f9fa",
            borderRadius: 6,
            border: "1px solid #dee2e6",
          }}
        >
          <strong style={{ display: "block", marginBottom: 12 }}>
            Gestione Membri ({members.length})
          </strong>
          {members.map((member) => (
            <div
              key={member.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 8,
                background: "white",
                borderRadius: 4,
                marginBottom: 8,
              }}
            >
              <div>
                <strong>{member.email}</strong>
                {member.id === community.creatorId && (
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 12,
                      color: "#28a745",
                      fontWeight: "bold",
                    }}
                  >
                    (Creatore)
                  </span>
                )}
              </div>
              {member.id !== community.creatorId && (
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  style={{
                    padding: "4px 8px",
                    background: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  Rimuovi
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <strong>Note Condivise ({sharedNotes.length})</strong>
        <form
          onSubmit={handleAddSharedNote}
          style={{ display: "flex", gap: 8, marginTop: 12 }}
        >
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Condividi una nota con la community..."
            style={{ flex: 1, padding: 8 }}
          />
          <button type="submit">Condividi</button>
        </form>
        {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
      </div>

      {sharedNotes.length === 0 ? (
        <div style={{ textAlign: "center", color: "#666", padding: "2rem" }}>
          Nessuna nota condivisa ancora. Sii il primo a condividere qualcosa!
        </div>
      ) : (
        <ul style={{ padding: 0, listStyle: "none" }}>
          {sharedNotes.map((note) => (
            <li
              key={note.id}
              style={{
                background: "#f3f6fa",
                marginBottom: 8,
                padding: 12,
                borderRadius: 6,
                border: "1px solid #e9ecef",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 8 }}>
                  <strong>{note.authorEmail}</strong>
                  <span style={{ fontSize: 12, color: "#888", marginLeft: 8 }}>
                    {note.created && note.created.toDate
                      ? note.created.toDate().toLocaleString()
                      : ""}
                  </span>
                </div>
                <div>
                  {note.fields ? (
                    note.fields.map((field, index) => (
                      <div key={index} style={{ marginBottom: 4 }}>
                        <strong>{field.name}:</strong>{" "}
                        <span style={{ whiteSpace: "pre-wrap" }}>
                          {field.value}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ whiteSpace: "pre-wrap" }}>{note.text}</div>
                  )}
                </div>
              </div>
              {/* Show delete button for note author or community admin */}
              {(note.authorId === user.uid ||
                community.creatorId === user.uid) && (
                <button
                  onClick={() => handleDeleteSharedNote(note.id)}
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
                  title={
                    note.authorId === user.uid
                      ? "Elimina la tua nota"
                      : "Elimina nota (Admin)"
                  }
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
