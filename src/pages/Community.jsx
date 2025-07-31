/**
 * 🚨 CRITICAL COMPONENT - DO NOT REMOVE FEATURES WITHOUT CHECKING FEATURES.md
 * This file manages community shared notes and real-time functionality.
 * Before modifying, run: npm run features
 */
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
  serverTimestamp,
} from "firebase/firestore";
import NewNoteForm from "../components/NewNoteForm";
import NoteCard from "../components/NoteCard";
import JoinRequestManager from "../components/JoinRequestManager";
import { useCommentCounts } from "../hooks/useCommentCounts";
import styles from "./Community.module.css";

export default function Community() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useContext(AuthContext);
  const [community, setCommunity] = useState(null);
  const [sharedNotes, setSharedNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingNote, setAddingNote] = useState(false);
  const [error, setError] = useState("");
  const [isMember, setIsMember] = useState(false);
  const [hasRequestedJoin, setHasRequestedJoin] = useState(false);
  const [requestingJoin, setRequestingJoin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [leavingCommunity, setLeavingCommunity] = useState(false);
  const [communityStats, setCommunityStats] = useState({
    memberCount: 0,
    noteCount: 0,
    totalComments: 0,
    totalReactions: 0,
    lastActivity: null,
  });
  const availableReactions = ["👍", "❤️", "😂", "😮", "😢", "😠"];

  // Get comment counts for shared notes
  const commentCounts = useCommentCounts(sharedNotes);

  useEffect(() => {
    if (!user || !id) return;

    const fetchCommunityData = async () => {
      setLoading(true);
      try {
        const communityDoc = await getDoc(doc(db, "communities", id));
        if (!communityDoc.exists()) {
          setError("Community non trovata.");
          setLoading(false);
          return;
        }

        const communityData = { id: communityDoc.id, ...communityDoc.data() };
        setCommunity(communityData);

        // Check if user is a member
        const isUserMember =
          communityData.members && communityData.members.includes(user.uid);
        setIsMember(isUserMember);

        // Check if user is the creator
        setIsCreator(communityData.creatorId === user.uid);

        // If not a member, check if user has already requested to join
        if (!isUserMember) {
          const joinRequestsQuery = query(
            collection(db, "joinRequests"),
            where("userId", "==", user.uid),
            where("communityId", "==", id)
          );
          const joinRequestsSnapshot = await getDocs(joinRequestsQuery);
          setHasRequestedJoin(!joinRequestsSnapshot.empty);
        }
      } catch (err) {
        console.error("Error fetching community:", err);
        setError("Errore nel caricamento della community.");
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityData();

    // Only fetch notes if user is a member
    if (isMember) {
      const notesQuery = query(
        collection(db, "sharedNotes"),
        where("communityId", "==", id),
        orderBy("created", "desc")
      );

      const unsubscribe = onSnapshot(
        notesQuery,
        (snapshot) => {
          const notes = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setSharedNotes(notes);
        },
        (err) => {
          console.error("Error fetching shared notes:", err);
          setError("Errore nel caricamento delle note condivise.");
        }
      );

      return () => unsubscribe();
    }
  }, [id, user, isMember]);

  // Calculate community statistics with real-time updates
  useEffect(() => {
    if (!community) return;

    let currentCommunity = community;
    let currentNotes = [];
    let currentCommentCount = 0;

    // Set up real-time listener for the community document (for member count updates)
    const communityDocRef = doc(db, "communities", id);
    const unsubscribeCommunity = onSnapshot(
      communityDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          currentCommunity = { id: docSnapshot.id, ...docSnapshot.data() };
          updateStats();
        }
      },
      (err) => {
        console.error("Error with community listener for stats:", err);
      }
    );

    // Set up real-time listener for ALL notes in the community
    const allNotesQuery = query(
      collection(db, "sharedNotes"),
      where("communityId", "==", id)
    );

    const unsubscribeNotes = onSnapshot(
      allNotesQuery,
      (snapshot) => {
        currentNotes = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        updateStats();
      },
      (err) => {
        console.error("Error with notes listener for stats:", err);
      }
    );

    // Set up real-time listener for ALL comments related to community notes
    const commentsQuery = query(collection(db, "comments"));

    const unsubscribeComments = onSnapshot(
      commentsQuery,
      (snapshot) => {
        // Filter comments that belong to notes in this community
        const noteIds = currentNotes.map((note) => note.id);
        const communityComments = snapshot.docs.filter((doc) =>
          noteIds.includes(doc.data().noteId)
        );
        currentCommentCount = communityComments.length;

        updateStats();
      },
      (err) => {
        console.error("Error with comments listener for stats:", err);
      }
    );

    const updateStats = () => {
      const memberCount = currentCommunity.members
        ? currentCommunity.members.length
        : 0;

      if (currentNotes.length === 0) {
        setCommunityStats({
          memberCount,
          noteCount: 0,
          totalComments: currentCommentCount,
          totalReactions: 0,
          lastActivity: currentCommunity.created?.toDate
            ? currentCommunity.created.toDate()
            : null,
        });
        return;
      }

      // Calculate total reactions for ALL notes (real-time updates)
      const totalReactions = currentNotes.reduce((sum, note) => {
        if (!note.reactions) return sum;
        return (
          sum +
          Object.values(note.reactions).reduce(
            (reactionSum, userArray) =>
              reactionSum + (Array.isArray(userArray) ? userArray.length : 0),
            0
          )
        );
      }, 0);

      // Find last activity (most recent note or community creation)
      let lastActivity = currentCommunity.created?.toDate
        ? currentCommunity.created.toDate()
        : null;
      if (currentNotes.length > 0) {
        // Sort all notes by creation date to find the most recent
        const sortedNotes = [...currentNotes].sort((a, b) => {
          const dateA = a.created?.toDate ? a.created.toDate() : new Date(0);
          const dateB = b.created?.toDate ? b.created.toDate() : new Date(0);
          return dateB - dateA;
        });
        const lastNoteDate = sortedNotes[0]?.created?.toDate
          ? sortedNotes[0].created.toDate()
          : null;
        if (lastNoteDate && (!lastActivity || lastNoteDate > lastActivity)) {
          lastActivity = lastNoteDate;
        }
      }

      setCommunityStats({
        memberCount,
        noteCount: currentNotes.length,
        totalComments: currentCommentCount,
        totalReactions,
        lastActivity,
      });
    };

    return () => {
      unsubscribeCommunity();
      unsubscribeNotes();
      unsubscribeComments();
    };
  }, [community, id]);

  const handleAddSharedNote = async (fields, selectedCommunityId) => {
    if (!user) return;
    setError("");
    try {
      await addDoc(collection(db, "sharedNotes"), {
        communityId: id,
        authorId: user.uid,
        authorEmail: user.email,
        fields,
        created: Timestamp.now(),
      });
      setAddingNote(false);
    } catch (err) {
      console.error("Error creating shared note:", err);
      setError("Errore durante la creazione della nota.");
    }
  };

  const handleDeleteSharedNote = async (noteId, selectedCommunityId) => {
    try {
      await deleteDoc(doc(db, "sharedNotes", noteId));
    } catch (err) {
      console.error("Error deleting shared note:", err);
      setError("Errore durante l'eliminazione della nota.");
    }
  };

  const handleJoinRequest = async () => {
    if (!user || hasRequestedJoin || requestingJoin) return;

    setRequestingJoin(true);
    setError("");

    try {
      await addDoc(collection(db, "joinRequests"), {
        communityId: id,
        userId: user.uid,
        userEmail: user.email,
        status: "pending",
        created: serverTimestamp(),
      });

      setHasRequestedJoin(true);
    } catch (err) {
      console.error("Error submitting join request:", err);
      setError("Errore durante l'invio della richiesta di adesione.");
    } finally {
      setRequestingJoin(false);
    }
  };

  const handleLeaveCommunity = async () => {
    if (!user || !isMember || leavingCommunity || isCreator) return;

    // Confirm with user
    if (!window.confirm("Sei sicuro di voler lasciare questa community?")) {
      return;
    }

    setLeavingCommunity(true);
    setError("");

    try {
      const communityRef = doc(db, "communities", id);
      await updateDoc(communityRef, {
        members: arrayRemove(user.uid),
      });

      // Update local state
      setIsMember(false);
      setCommunity((prev) => ({
        ...prev,
        members: prev.members.filter((memberId) => memberId !== user.uid),
      }));

      // Navigate back to communities page
      navigate("/communities");
    } catch (err) {
      console.error("Error leaving community:", err);
      setError("Errore durante l'uscita dalla community.");
    } finally {
      setLeavingCommunity(false);
    }
  };

  const handleReaction = async (noteId, noteType, reaction) => {
    if (!user) return;

    const noteRef = doc(db, "sharedNotes", noteId);
    const note = sharedNotes.find((n) => n.id === noteId);
    if (!note) return;

    const currentReactions = note.reactions || {};
    const reactionUids = currentReactions[reaction] || [];
    const userUid = user.uid;

    let updatedReactions = { ...currentReactions };

    if (reactionUids.includes(userUid)) {
      updatedReactions[reaction] = reactionUids.filter(
        (uid) => uid !== userUid
      );
      if (updatedReactions[reaction].length === 0) {
        delete updatedReactions[reaction];
      }
    } else {
      updatedReactions[reaction] = [...reactionUids, userUid];
    }

    try {
      await updateDoc(noteRef, { reactions: updatedReactions });
      // Update local state immediately for better UX
      setSharedNotes(
        sharedNotes.map((n) =>
          n.id === noteId ? { ...n, reactions: updatedReactions } : n
        )
      );
    } catch (err) {
      console.error("Error updating reaction:", err);
      setError("Errore nell'aggiornare la reazione.");
    }
  };

  if (loading) {
    return <div className={styles.loading}>Caricamento community...</div>;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  if (!community) {
    return (
      <div className={styles.container}>
        <p>Community non trovata.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{community.name}</h1>
        {/* Leave Community Button - only for non-creator members */}
        {isMember && !isCreator && (
          <button
            className={styles.leaveButton}
            onClick={handleLeaveCommunity}
            disabled={leavingCommunity}
          >
            {leavingCommunity ? "Uscita in corso..." : "Lascia Community"}
          </button>
        )}
      </div>

      {/* Community Description */}
      {community.description && (
        <div className={styles.description}>
          <p>{community.description}</p>
        </div>
      )}

      {/* Community Statistics */}
      <div className={styles.statsSection}>
        <h3 className={styles.statsTitle}>Statistiche della Community</h3>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>
              {communityStats.memberCount}
            </span>
            <span className={styles.statLabel}>Membri</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>
              {communityStats.noteCount}
            </span>
            <span className={styles.statLabel}>Note</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>
              {communityStats.totalComments}
            </span>
            <span className={styles.statLabel}>Commenti</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>
              {communityStats.totalReactions}
            </span>
            <span className={styles.statLabel}>Reazioni</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Creata il</span>
            <span className={styles.statDate}>
              {community.created?.toDate
                ? community.created.toDate().toLocaleDateString("it-IT")
                : "N/A"}
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Ultima Attività</span>
            <span className={styles.statDate}>
              {communityStats.lastActivity
                ? communityStats.lastActivity.toLocaleDateString("it-IT")
                : "N/A"}
            </span>
          </div>
        </div>
      </div>

      {!isMember ? (
        <div className={styles.joinRequest}>
          <p className={styles.notMemberMessage}>
            Non sei membro di questa community.
          </p>
          {hasRequestedJoin ? (
            <p className={styles.pendingMessage}>
              La tua richiesta di adesione è in attesa di approvazione.
            </p>
          ) : (
            <button
              className={styles.joinButton}
              onClick={handleJoinRequest}
              disabled={requestingJoin}
            >
              {requestingJoin ? "Invio richiesta..." : "Richiedi di aderire"}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className={styles.noteForm}>
            {addingNote && (
              <NewNoteForm
                onSubmit={handleAddSharedNote}
                onCancel={() => setAddingNote(false)}
              />
            )}
            {!addingNote && (
              <button
                className={styles.addButton}
                onClick={() => setAddingNote(true)}
              >
                Aggiungi Nota
              </button>
            )}
          </div>

          {isCreator && (
            <JoinRequestManager
              communityId={id}
              user={user}
              onRequestHandled={() => {
                // Optionally refresh community data when a request is handled
                // This would update member counts, etc.
              }}
            />
          )}

          <div className={styles.notesGrid}>
            {sharedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={{ ...note, type: "shared" }}
                user={user}
                isAdmin={isAdmin}
                onReaction={handleReaction}
                onDelete={handleDeleteSharedNote}
                availableReactions={availableReactions}
                commentCount={commentCounts[note.id] || 0}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
