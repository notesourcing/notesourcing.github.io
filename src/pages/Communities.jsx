import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  Timestamp,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { AuthContext } from "../App";
import {
  enrichNoteWithUserData,
  formatUserDisplayName,
} from "../utils/userUtils";
import styles from "./Communities.module.css";

export default function Communities() {
  const { user } = useContext(AuthContext);
  const [adminCommunities, setAdminCommunities] = useState([]);
  const [userCommunities, setUserCommunities] = useState([]);
  const [otherCommunities, setOtherCommunities] = useState([]);
  const [overallStats, setOverallStats] = useState({
    totalCommunities: 0,
    totalNotes: 0,
    totalComments: 0,
    totalReactions: 0,
    totalMembers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState("");
  const [newCommunityDescription, setNewCommunityDescription] = useState("");
  const [newCommunityVisibility, setNewCommunityVisibility] =
    useState("public");

  useEffect(() => {
    setLoading(true);
    setError("");

    // State to hold real-time data
    let allCommunities = [];
    let allNotes = [];
    let allComments = [];

    const updateCommunityStats = () => {
      try {
        const communitiesData = allCommunities.map((community) => {
          // Get notes for this community
          const communityNotes = allNotes.filter(
            (note) => note.communityId === community.id
          );

          // Calculate total reactions for all community notes
          const totalReactions = communityNotes.reduce((sum, note) => {
            if (!note.reactions) return sum;
            return (
              sum +
              Object.values(note.reactions).reduce(
                (reactionSum, userArray) =>
                  reactionSum +
                  (Array.isArray(userArray) ? userArray.length : 0),
                0
              )
            );
          }, 0);

          // Get comments for community notes
          const communityComments = allComments.filter((comment) =>
            communityNotes.some((note) => note.id === comment.noteId)
          );

          // Find last activity
          let lastActivity = community.created?.toDate
            ? community.created.toDate()
            : null;
          if (communityNotes.length > 0) {
            const sortedNotes = [...communityNotes].sort((a, b) => {
              const dateA = a.created?.toDate
                ? a.created.toDate()
                : new Date(0);
              const dateB = b.created?.toDate
                ? b.created.toDate()
                : new Date(0);
              return dateB - dateA;
            });
            const lastNoteDate = sortedNotes[0]?.created?.toDate
              ? sortedNotes[0].created.toDate()
              : null;
            if (
              lastNoteDate &&
              (!lastActivity || lastNoteDate > lastActivity)
            ) {
              lastActivity = lastNoteDate;
            }
          }

          return {
            ...community,
            memberCount: community.members?.length || 0,
            noteCount: communityNotes.length,
            commentCount: communityComments.length,
            reactionCount: totalReactions,
            lastActivity,
            isUserCreator: community.creatorId === user?.uid,
            isUserMember: community.members?.includes(user?.uid) || false,
          };
        });

        // Calculate overall statistics
        const stats = {
          totalCommunities: communitiesData.length,
          totalNotes: communitiesData.reduce((sum, c) => sum + c.noteCount, 0),
          totalComments: communitiesData.reduce(
            (sum, c) => sum + c.commentCount,
            0
          ),
          totalReactions: communitiesData.reduce(
            (sum, c) => sum + c.reactionCount,
            0
          ),
          totalMembers: communitiesData.reduce((sum, c) => {
            const uniqueMembers = new Set(c.members || []);
            return sum + uniqueMembers.size;
          }, 0),
        };
        setOverallStats(stats);

        // Separate communities into three groups (works for both logged-in and non-logged users)
        if (user) {
          // Filter communities based on visibility for the current user
          const visibleCommunities = communitiesData.filter((community) => {
            const visibility = community.visibility || "public"; // default to public for existing communities

            // Hidden communities are only visible to members
            if (visibility === "hidden") {
              return community.members?.includes(user.uid);
            }

            // Private and public communities are discoverable
            return true;
          });

          const adminComms = visibleCommunities.filter(
            (community) => community.creatorId === user.uid
          );
          const memberComms = visibleCommunities.filter(
            (community) =>
              community.members?.includes(user.uid) &&
              community.creatorId !== user.uid
          );
          const otherComms = visibleCommunities.filter(
            (community) => !community.members?.includes(user.uid)
          );

          setAdminCommunities(adminComms);
          setUserCommunities(memberComms);
          setOtherCommunities(otherComms);
        } else {
          // For non-logged users, show public and private communities (but not hidden)
          const visibleCommunities = communitiesData.filter((community) => {
            const visibility = community.visibility || "public";
            return visibility === "public" || visibility === "private";
          });

          setAdminCommunities([]);
          setUserCommunities([]);
          setOtherCommunities(visibleCommunities);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error updating community stats:", err);
        setError("Errore nell'aggiornamento delle statistiche.");
        setLoading(false);
      }
    };

    // Set up real-time listener for communities
    const communitiesQuery = query(
      collection(db, "communities"),
      orderBy("created", "desc")
    );

    const unsubscribeCommunities = onSnapshot(
      communitiesQuery,
      async (communitiesSnapshot) => {
        // Get raw community data
        const rawCommunities = communitiesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Enrich communities with creator display data
        const enrichedCommunities = await Promise.all(
          rawCommunities.map(async (community) => {
            try {
              const enrichedCommunity = await enrichNoteWithUserData(
                community,
                "creatorId"
              );
              return {
                ...enrichedCommunity,
                creatorDisplayName: formatUserDisplayName(enrichedCommunity),
              };
            } catch (err) {
              console.error("Error enriching community creator data:", err);
              return {
                ...community,
                creatorDisplayName: "Creatore Sconosciuto",
              };
            }
          })
        );

        allCommunities = enrichedCommunities;
        updateCommunityStats();
      },
      (err) => {
        console.error("Error with communities listener:", err);
        setError("Errore nel caricamento delle community.");
        setLoading(false);
      }
    );

    // Set up real-time listener for ALL shared notes
    const notesQuery = query(
      collection(db, "sharedNotes"),
      orderBy("created", "desc")
    );

    const unsubscribeNotes = onSnapshot(
      notesQuery,
      (notesSnapshot) => {
        allNotes = notesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        updateCommunityStats();
      },
      (err) => {
        console.error("Error with notes listener:", err);
        setError("Errore nel caricamento delle note.");
      }
    );

    // Set up real-time listener for ALL comments
    const commentsQuery = query(collection(db, "comments"));

    const unsubscribeComments = onSnapshot(
      commentsQuery,
      (commentsSnapshot) => {
        allComments = commentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        updateCommunityStats();
      },
      (err) => {
        console.error("Error with comments listener:", err);
        setError("Errore nel caricamento dei commenti.");
      }
    );

    return () => {
      unsubscribeCommunities();
      unsubscribeNotes();
      unsubscribeComments();
    };
  }, [user]);

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    if (!user) {
      setError("Devi essere loggato per creare una community.");
      return;
    }
    if (!newCommunityName.trim()) {
      setError("Il nome della community non può essere vuoto.");
      return;
    }

    setError("");
    try {
      await addDoc(collection(db, "communities"), {
        name: newCommunityName,
        description: newCommunityDescription,
        visibility: newCommunityVisibility,
        creatorId: user.uid,
        creatorEmail: user.email,
        members: [user.uid],
        created: Timestamp.now(),
      });

      // No need to manually update state - the real-time listener will handle it
      setNewCommunityName("");
      setNewCommunityDescription("");
      setNewCommunityVisibility("public");
      setShowCreateForm(false);
    } catch (err) {
      console.error("Error creating community:", err);
      setError("Errore nella creazione della community.");
    }
  };

  const getVisibilityBadge = (visibility) => {
    switch (visibility) {
      case "public":
        return { text: "🌍 Pubblica", className: styles.publicBadge };
      case "private":
        return { text: "🔒 Privata", className: styles.privateBadge };
      case "hidden":
        return { text: "👁️‍🗨️ Nascosta", className: styles.hiddenBadge };
      default:
        return { text: "🌍 Pubblica", className: styles.publicBadge };
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return date.toLocaleDateString("it-IT", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderCommunityCard = (community) => {
    const isCreator = community.creatorId === user?.uid;
    const isMember = community.members?.includes(user?.uid);
    const visibilityBadge = getVisibilityBadge(community.visibility);

    return (
      <li key={community.id} className={styles.communityCard}>
        <Link to={`/community/${community.id}`} className={styles.cardLink}>
          <div className={styles.cardHeader}>
            <h3 className={styles.communityName}>{community.name}</h3>
            <div className={styles.badges}>
              <span className={visibilityBadge.className}>
                {visibilityBadge.text}
              </span>
              {isCreator && (
                <span className={styles.creatorBadge}>👑 Admin</span>
              )}
              {isMember && !isCreator && (
                <span className={styles.memberBadge}>👤 Membro</span>
              )}
            </div>
          </div>

          <div className={styles.creatorInfo}>
            <span className={styles.creatorLabel}>Creata da:</span>
            <span className={styles.creatorName}>
              {community.creatorDisplayName || "Creatore Sconosciuto"}
            </span>
          </div>

          <p className={styles.communityDescription}>
            {community.description || "Nessuna descrizione disponibile"}
          </p>

          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{community.memberCount}</span>
              <span className={styles.statLabel}>Membri</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{community.noteCount}</span>
              <span className={styles.statLabel}>Note</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>
                {community.commentCount}
              </span>
              <span className={styles.statLabel}>Commenti</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>
                {community.reactionCount}
              </span>
              <span className={styles.statLabel}>Reazioni</span>
            </div>
          </div>

          <div className={styles.cardFooter}>
            <div className={styles.metaInfo}>
              <span className={styles.createdDate}>
                📅 Creata: {formatDate(community.created)}
              </span>
              {community.lastActivity && (
                <span className={styles.lastActivity}>
                  ⚡ Ultima attività: {formatDate(community.lastActivity)}
                </span>
              )}
            </div>
            <div className={styles.activityIndicator}>
              {community.lastActivity &&
                Date.now() - community.lastActivity.getTime() <
                  7 * 24 * 60 * 60 * 1000 && (
                  <span className={styles.activeIndicator}>🟢 Attiva</span>
                )}
            </div>
          </div>
        </Link>
      </li>
    );
  };

  if (loading) {
    return <div className={styles.loading}>Caricamento delle community...</div>;
  }

  if (error) {
    return <div className={`${styles.container} ${styles.error}`}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Community</h1>
        {user && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className={styles.createButton}
          >
            {showCreateForm ? "Annulla" : "Crea Community"}
          </button>
        )}
      </div>

      {/* Overall Statistics */}
      <div className={styles.overallStats}>
        <h2 className={styles.statsTitle}>📊 Statistiche Globali</h2>
        <div className={styles.statsContainer}>
          <div className={styles.globalStatItem}>
            <span className={styles.globalStatNumber}>
              {overallStats.totalCommunities}
            </span>
            <span className={styles.globalStatLabel}>Community Totali</span>
          </div>
          <div className={styles.globalStatItem}>
            <span className={styles.globalStatNumber}>
              {overallStats.totalNotes}
            </span>
            <span className={styles.globalStatLabel}>Note Totali</span>
          </div>
          <div className={styles.globalStatItem}>
            <span className={styles.globalStatNumber}>
              {overallStats.totalComments}
            </span>
            <span className={styles.globalStatLabel}>Commenti Totali</span>
          </div>
          <div className={styles.globalStatItem}>
            <span className={styles.globalStatNumber}>
              {overallStats.totalReactions}
            </span>
            <span className={styles.globalStatLabel}>Reazioni Totali</span>
          </div>
        </div>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateCommunity} className={styles.form}>
          <input
            type="text"
            value={newCommunityName}
            onChange={(e) => setNewCommunityName(e.target.value)}
            placeholder="Nome della tua community"
            required
            className={styles.input}
          />
          <textarea
            value={newCommunityDescription}
            onChange={(e) => setNewCommunityDescription(e.target.value)}
            placeholder="Descrivi la tua community"
            className={styles.textarea}
          />
          <div className={styles.visibilitySelector}>
            <label className={styles.visibilityLabel}>Visibilità:</label>
            <select
              value={newCommunityVisibility}
              onChange={(e) => setNewCommunityVisibility(e.target.value)}
              className={styles.select}
            >
              <option value="public">
                🌍 Pubblica - Tutti possono vedere le note
              </option>
              <option value="private">
                🔒 Privata - Solo i membri possono vedere le note
              </option>
              <option value="hidden">
                👁️‍🗨️ Nascosta - Solo su invito, non scopribile
              </option>
            </select>
            <small className={styles.visibilityHint}>
              {newCommunityVisibility === "public" &&
                "Chiunque può vedere le note di questa community."}
              {newCommunityVisibility === "private" &&
                "Solo i membri possono vedere le note, ma la community è visibile a tutti."}
              {newCommunityVisibility === "hidden" &&
                "La community è completamente nascosta e accessibile solo su invito."}
            </small>
          </div>
          <div className={styles.buttonGroup}>
            <button type="submit" className={styles.createButton}>
              Conferma
            </button>
          </div>
        </form>
      )}

      {loading && (
        <div className={styles.loading}>Caricamento delle community...</div>
      )}
      {error && (
        <div className={`${styles.container} ${styles.error}`}>{error}</div>
      )}

      {!loading && !error && (
        <>
          {/* Admin Communities Section */}
          {user && adminCommunities.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                👑 Le tue Community (Admin)
                <span className={styles.sectionCount}>
                  ({adminCommunities.length})
                </span>
              </h2>
              <ul className={styles.communitiesGrid}>
                {adminCommunities.map(renderCommunityCard)}
              </ul>
            </div>
          )}

          {/* User's Communities Section */}
          {user && userCommunities.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                👤 Le tue Community (Membro)
                <span className={styles.sectionCount}>
                  ({userCommunities.length})
                </span>
              </h2>
              <ul className={styles.communitiesGrid}>
                {userCommunities.map(renderCommunityCard)}
              </ul>
            </div>
          )}

          {/* Other Communities Section */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              🌍{" "}
              {user &&
              (adminCommunities.length > 0 || userCommunities.length > 0)
                ? "Altre Community"
                : "Tutte le Community"}
              <span className={styles.sectionCount}>
                ({otherCommunities.length})
              </span>
            </h2>
            {otherCommunities.length === 0 ? (
              <p className={styles.emptyState}>
                Non ci sono altre community disponibili.
              </p>
            ) : (
              <ul className={styles.communitiesGrid}>
                {otherCommunities.map(renderCommunityCard)}
              </ul>
            )}
          </div>

          {/* Empty state when no communities exist */}
          {adminCommunities.length === 0 &&
            userCommunities.length === 0 &&
            otherCommunities.length === 0 && (
              <div className={styles.emptyState}>
                <p>
                  Non ci sono ancora community.{" "}
                  {user
                    ? "Creane una tu!"
                    : "Effettua il login per creare una community."}
                </p>
              </div>
            )}
        </>
      )}
    </div>
  );
}
