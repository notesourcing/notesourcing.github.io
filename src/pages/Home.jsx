/**
 * 🚨 CRITICAL COMPONENT - DO NOT REMOVE FEATURES WITHOUT CHECKING FEATURES.md
 * This file contains real-time listeners essential for live note updates.
 * Before modifying, run: npm run features
 */
import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../App";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  Timestamp,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import {
  enrichNotesWithUserData,
  createRealTimeNotesEnrichment,
} from "../utils/userUtils";
import {
  createDocumentWithSequentialId,
  getSequentialIdFromFirebase,
  addSequentialIdsToDocuments,
} from "../utils/sequentialIds";
import NewNoteForm from "../components/NewNoteForm";
import NoteCard from "../components/NoteCard";
import { useCommentCounts } from "../hooks/useCommentCounts";
import styles from "./Home.module.css";

export default function Home() {
  const { user, isSuperAdmin } = useContext(AuthContext);
  const navigate = useNavigate();
  const [allNotes, setAllNotes] = useState([]);
  const [personalNotes, setPersonalNotes] = useState([]);
  const [sharedNotes, setSharedNotes] = useState([]);
  const [publicPersonalNotes, setPublicPersonalNotes] = useState([]);
  const [userCommunities, setUserCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [filterType, setFilterType] = useState("all"); // "all", "my", "shared", "personal"
  const [notesEnrichmentCleanup, setNotesEnrichmentCleanup] = useState(null);
  const availableReactions = ["👍", "❤️", "😂", "😮", "😢", "😠"];

  // Get comment counts for all notes
  const commentCounts = useCommentCounts(allNotes);

  // Combine and filter notes whenever personal or shared notes change
  useEffect(() => {
    // Start with a base of shared (community) notes and public personal notes
    let combinedNotes = [...sharedNotes, ...publicPersonalNotes];

    // If the user is logged in, add their private personal notes
    if (user) {
      combinedNotes = [...combinedNotes, ...personalNotes];
    }

    // Deduplicate notes to prevent showing the same note twice
    // (e.g., a user's own public note appearing in both personal and public lists)
    const uniqueNotes = Array.from(
      new Map(combinedNotes.map((note) => [note.id, note])).values()
    );

    // Apply filtering based on user authentication and filter type
    let filteredNotes = uniqueNotes;
    if (user) {
      // Authenticated user filtering
      if (filterType === "my") {
        filteredNotes = uniqueNotes.filter(
          (note) =>
            (note.type === "personal" && note.uid === user?.uid) ||
            (note.type === "shared" && note.authorId === user?.uid)
        );
      } else if (filterType === "personal") {
        // Show user's private notes + all public personal notes
        filteredNotes = uniqueNotes.filter((note) => note.type === "personal");
      } else if (filterType === "shared") {
        filteredNotes = sharedNotes;
      }
      // "all" shows everything (default)
    } else {
      // Unauthenticated user - only show shared notes from public communities and public personal notes
      filteredNotes = uniqueNotes.filter(
        (note) =>
          note.type === "shared" ||
          (note.type === "personal" && !note.isPrivate)
      );
    }

    filteredNotes.sort((a, b) => {
      const dateA = a.created?.toDate ? a.created.toDate() : new Date(0);
      const dateB = b.created?.toDate ? b.created.toDate() : new Date(0);
      return dateB - dateA;
    });
    setAllNotes(filteredNotes);
    setLoading(false);
  }, [personalNotes, sharedNotes, publicPersonalNotes, filterType, user]);

  useEffect(() => {
    setLoading(true);
    setError("");

    // Set up real-time listener for user's personal notes (only if user is logged in)
    let unsubPersonalNotes = () => {};
    if (user && user.uid) {
      const personalNotesQuery = query(
        collection(db, "notes"),
        where("uid", "==", user.uid),
        orderBy("created", "desc")
      );
      unsubPersonalNotes = onSnapshot(
        personalNotesQuery,
        async (snapshot) => {
          try {
            const rawNotes = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              type: "personal",
            }));

            // Add sequential IDs
            const notesWithSeqIds = await addSequentialIdsToDocuments(
              rawNotes,
              "notes"
            );

            // Enrich with user display data
            const enrichedNotes = await enrichNotesWithUserData(
              notesWithSeqIds,
              "uid"
            );
            setPersonalNotes(enrichedNotes);
          } catch (err) {
            console.error("Error processing personal notes:", err);
            setError("Errore nel caricamento delle note personali.");
          }
        },
        (err) => {
          console.error("Error with personal notes listener:", err);
          setError("Errore nel caricamento delle note personali.");
        }
      );
    } else {
      // Clear personal notes if user is not logged in
      setPersonalNotes([]);
    }

    // Set up real-time listener for ALL shared notes (community notes)
    // For unauthenticated users, we'll filter to only public communities later
    const sharedNotesQuery = query(
      collection(db, "sharedNotes"),
      orderBy("created", "desc")
    );
    const unsubSharedNotes = onSnapshot(
      sharedNotesQuery,
      async (sharedSnapshot) => {
        try {
          const rawNotes = await Promise.all(
            sharedSnapshot.docs.map(async (docSnap) => {
              const noteData = {
                id: docSnap.id,
                ...docSnap.data(),
                type: "shared",
              };

              // Also fetch community name and visibility
              let communityName = "Comunità Sconosciuta";
              let communityVisibility = "public"; // default to public
              if (noteData.communityId) {
                try {
                  const communityDocSnap = await getDoc(
                    doc(db, "communities", noteData.communityId)
                  );
                  if (communityDocSnap.exists()) {
                    const communityData = communityDocSnap.data();
                    communityName = communityData.name;
                    communityVisibility = communityData.visibility || "public";
                  }
                } catch (err) {
                  console.log("Could not fetch community data:", err);
                }
              }

              return {
                ...noteData,
                communityName,
                communityVisibility,
              };
            })
          );

          // Add sequential IDs to notes
          const notesWithSeqIds = await addSequentialIdsToDocuments(
            rawNotes,
            "sharedNotes"
          );

          // Clean up previous enrichment if it exists
          if (notesEnrichmentCleanup) {
            notesEnrichmentCleanup();
          }

          // Set up real-time enrichment for shared notes
          const enrichmentSystem = createRealTimeNotesEnrichment(
            notesWithSeqIds,
            null, // no specific community context for home page
            "authorId",
            (updatedNotes) => {
              // This callback is called whenever user data changes
              // Apply filtering based on community visibility for all users
              const filteredNotes = updatedNotes.filter((note) => {
                const visibility = note.communityVisibility;
                // Show notes if:
                // 1. Visibility is explicitly "public"
                // 2. Visibility is undefined/null (default to public)
                // 3. Note has no communityId (standalone public note)
                return (
                  !visibility || visibility === "public" || !note.communityId
                );
              });
              setSharedNotes(filteredNotes);
            }
          );

          // Apply initial filtering and set notes
          const initialFilteredNotes = enrichmentSystem.enrichedNotes.filter(
            (note) => {
              const visibility = note.communityVisibility;
              // Show notes if:
              // 1. Visibility is explicitly "public"
              // 2. Visibility is undefined/null (default to public)
              // 3. Note has no communityId (standalone public note)
              return (
                !visibility || visibility === "public" || !note.communityId
              );
            }
          );
          setSharedNotes(initialFilteredNotes); // Store cleanup function
          setNotesEnrichmentCleanup(() => enrichmentSystem.cleanup);
        } catch (err) {
          console.error("Error processing shared notes:", err);
          setError("Errore nel caricamento delle note condivise.");
        }
      },
      (err) => {
        console.error("Error with shared notes listener:", err);
        setError("Errore nel caricamento delle note condivise.");
      }
    );

    // Set up real-time listener for all public personal notes
    const publicPersonalNotesQuery = query(
      collection(db, "notes"),
      where("isPrivate", "==", false)
    );
    const unsubPublicPersonalNotes = onSnapshot(
      publicPersonalNotesQuery,
      async (snapshot) => {
        try {
          const rawNotes = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            type: "personal",
          }));

          // Sort by creation date on the client side
          rawNotes.sort((a, b) => {
            const dateA = a.created?.toDate ? a.created.toDate() : new Date(0);
            const dateB = b.created?.toDate ? b.created.toDate() : new Date(0);
            return dateB - dateA;
          });

          const notesWithSeqIds = await addSequentialIdsToDocuments(
            rawNotes,
            "notes"
          );

          const enrichedNotes = await enrichNotesWithUserData(
            notesWithSeqIds,
            "uid"
          );
          setPublicPersonalNotes(enrichedNotes);
        } catch (err) {
          console.error("Error processing public personal notes:", err);
          setError("Errore nel caricamento delle note pubbliche.");
        }
      },
      (err) => {
        console.error("Error with public personal notes listener:", err);
        setError("Errore nel caricamento delle note pubbliche.");
      }
    );
    return () => {
      if (unsubPersonalNotes) unsubPersonalNotes();
      unsubSharedNotes();
      unsubPublicPersonalNotes();
      // Clean up enrichment listeners
      if (notesEnrichmentCleanup) {
        notesEnrichmentCleanup();
      }
    };
  }, [user]);

  // Fetch user communities for note creation
  useEffect(() => {
    if (!user || !user.uid) return;

    const q = query(
      collection(db, "communities"),
      where("members", "array-contains", user.uid)
    );

    const unsubscribeCommunities = onSnapshot(
      q,
      (snapshot) => {
        const communities = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUserCommunities(communities);
      },
      (err) => {
        console.error("Error fetching user communities:", err);
        setError("Errore nel caricamento delle community.");
      }
    );

    return () => unsubscribeCommunities();
  }, [user]);

  const handleAddNote = async (
    fields,
    selectedCommunityId,
    attributionData,
    isPrivate = false
  ) => {
    setError("");
    try {
      const baseNoteData = {
        fields,
        created: Timestamp.now(),
        attribution: attributionData || { type: "self" }, // Default to self attribution
      };

      let result;
      if (selectedCommunityId) {
        // Create shared note in community
        result = await createDocumentWithSequentialId("sharedNotes", {
          ...baseNoteData,
          communityId: selectedCommunityId,
          authorId: user.uid,
          authorEmail: user.email,
        });
      } else {
        // Create personal note
        result = await createDocumentWithSequentialId("notes", {
          ...baseNoteData,
          uid: user.uid,
          isPrivate: isPrivate, // Add privacy flag
        });
      }

      setAddingNote(false);

      // Navigate to the newly created note using sequential ID if available
      if (selectedCommunityId) {
        // Shared note - use shared-note URL pattern
        if (result.sequentialId) {
          navigate(`/shared-note/${result.sequentialId}`);
        } else {
          navigate(`/shared-note/${result.docId}`);
        }
      } else {
        // Personal note - use note URL pattern
        if (result.sequentialId) {
          navigate(`/note/${result.sequentialId}`);
        } else {
          navigate(`/note/${result.docId}`);
        }
      }
    } catch (err) {
      console.error("Error handling notes:", err);
      setError("Errore durante la creazione della nota.");
    }
  };

  const handleReaction = async (noteId, noteType, reaction) => {
    if (!user) return;

    const collectionName = noteType === "personal" ? "notes" : "sharedNotes";
    const noteRef = doc(db, collectionName, noteId);

    const note = allNotes.find((n) => n.id === noteId);
    if (!note) return;

    const currentReactions = note.reactions || {};
    const reactionUids = currentReactions[reaction] || [];
    const userUid = user.uid;

    let updatedReactions = { ...currentReactions };

    if (reactionUids.includes(userUid)) {
      // Remove user's reaction
      updatedReactions[reaction] = reactionUids.filter(
        (uid) => uid !== userUid
      );
      if (updatedReactions[reaction].length === 0) {
        delete updatedReactions[reaction];
      }
    } else {
      // Add user's reaction
      updatedReactions[reaction] = [...reactionUids, userUid];
    }

    try {
      await updateDoc(noteRef, { reactions: updatedReactions });
      // Update local state immediately for better UX
      setAllNotes(
        allNotes.map((n) =>
          n.id === noteId ? { ...n, reactions: updatedReactions } : n
        )
      );
    } catch (err) {
      console.error("Error updating reaction:", err);
      setError("Errore nell'aggiornare la reazione.");
    }
  };

  const handleDeleteNote = async (noteId, noteType) => {
    const note = allNotes.find((n) => n.id === noteId);
    if (!note) return;

    // Check if user can delete this note
    const canDelete =
      isSuperAdmin ||
      (noteType === "personal" && note.uid === user.uid) ||
      (noteType === "shared" && note.authorId === user.uid);

    if (!canDelete) return;

    if (!window.confirm("Sei sicuro di voler eliminare questa nota?")) {
      return;
    }

    try {
      const collectionName = noteType === "personal" ? "notes" : "sharedNotes";
      await deleteDoc(doc(db, collectionName, noteId));

      // Update local state
      setAllNotes(allNotes.filter((note) => note.id !== noteId));
    } catch (err) {
      console.error("Error deleting note:", err);
      setError("Errore durante l'eliminazione della nota: " + err.message);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Caricamento delle note...</div>;
  }

  if (error) {
    return <div className={`${styles.container} ${styles.error}`}>{error}</div>;
  }

  return (
    <div
      className={styles.container}
      data-page="home"
      data-realtime-active="true"
    >
      <div className={styles.header}>
        <h1 className={styles.title}>Tutte le Note</h1>
        <div className={styles.subtitle}>
          <p>
            Esplora tutte le note della community e le tue note personali. Crea,
            condividi e trova ispirazione!
          </p>
        </div>
      </div>

      {/* Note Creation Section - only for logged in users */}
      {user && (
        <div className={styles.noteCreation}>
          {addingNote ? (
            <NewNoteForm
              onSubmit={handleAddNote}
              onCancel={() => setAddingNote(false)}
              communities={userCommunities}
              showCommunitySelector={true}
            />
          ) : (
            <button
              className={styles.addButton}
              onClick={() => setAddingNote(true)}
            >
              ✨ Crea Nuova Nota
            </button>
          )}
        </div>
      )}

      {/* Filter Controls */}
      {user && (
        <div className={styles.filterControls}>
          <div className={styles.filterGroup}>
            <label>Mostra:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">Tutte le Note</option>
              <option value="my">Le Mie Note</option>
              <option value="personal">Solo Note Personali</option>
              <option value="shared">Solo Note Community</option>
            </select>
          </div>
        </div>
      )}

      {/* Welcome message for unauthenticated users */}
      {!user && (
        <div className={styles.welcomeMessage}>
          <div className={styles.welcomeContent}>
            <h3>🌟 Benvenuto nella community!</h3>
            <p>
              Stai visualizzando le note pubbliche della community. Accedi per
              vedere tutte le note e iniziare a contribuire.
            </p>
            <Link to="/login" className={styles.loginButton}>
              🔑 Accedi per iniziare
            </Link>
          </div>
        </div>
      )}

      {/* Stats - show different stats for unauthenticated users */}
      {allNotes.length > 0 && (
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statNumber}>{allNotes.length}</span>
            <span className={styles.statLabel}>
              {user ? "Note Mostrate" : "Note Pubbliche"}
            </span>
          </div>
          {user && (
            <>
              <div className={styles.stat}>
                <span className={styles.statNumber}>
                  {allNotes.filter((note) => note.type === "shared").length}
                </span>
                <span className={styles.statLabel}>Note Community</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>
                  {allNotes.filter((note) => note.type === "personal").length}
                </span>
                <span className={styles.statLabel}>Note Personali</span>
              </div>
            </>
          )}
        </div>
      )}

      {allNotes.length === 0 && (
        <div className={styles.noNotes}>
          {user ? (
            <>
              <h3>📝 Nessuna nota trovata</h3>
              <p>
                {filterType === "my" && "Non hai ancora creato alcuna nota."}
                {filterType === "personal" && "Non hai note personali."}
                {filterType === "shared" &&
                  "Non ci sono note della community accessibili."}
                {filterType === "all" &&
                  "Non ci sono ancora note da visualizzare."}
              </p>
              <p>Inizia creando la tua prima nota!</p>
            </>
          ) : (
            <>
              <h3>📝 Nessuna nota pubblica disponibile</h3>
              <p>Al momento non ci sono note pubbliche da visualizzare.</p>
              <p>
                Le note vengono mostrate solo dalle community pubbliche o senza
                restrizioni di visibilità.
              </p>
              <p>Accedi per vedere tutte le note e iniziare a contribuire!</p>
              <Link to="/login" className={styles.loginButton}>
                🔑 Accedi ora
              </Link>
            </>
          )}
        </div>
      )}

      {allNotes.length > 0 && (
        <ul className={styles.notesList}>
          {allNotes.map((note) => (
            <li key={note.id} className={styles.noteItem}>
              <NoteCard
                note={note}
                user={user}
                isSuperAdmin={isSuperAdmin}
                onReaction={user ? handleReaction : undefined}
                onDelete={user ? handleDeleteNote : undefined}
                availableReactions={availableReactions}
                showDeleteButton={
                  user &&
                  (isSuperAdmin ||
                    (note.type === "personal" && note.uid === user.uid) ||
                    (note.type === "shared" && note.authorId === user.uid))
                }
                showReactions={!!user} // Only show reactions for logged-in users
                commentCount={commentCounts[note.id] || 0}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
