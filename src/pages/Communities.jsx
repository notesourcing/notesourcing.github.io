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
import styles from "./Communities.module.css";

export default function Communities() {
  const { user } = useContext(AuthContext);
  const [userCommunities, setUserCommunities] = useState([]);
  const [otherCommunities, setOtherCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState("");
  const [newCommunityDescription, setNewCommunityDescription] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    // Set up real-time listener for communities
    const q = query(collection(db, "communities"), orderBy("created", "desc"));

    const unsubscribeCommunities = onSnapshot(
      q,
      async (communitiesSnapshot) => {
        try {
          const communitiesData = await Promise.all(
            communitiesSnapshot.docs.map(async (doc) => {
              const community = { id: doc.id, ...doc.data() };

              // Get notes count for each community (could also use real-time here)
              const notesQuery = query(
                collection(db, "sharedNotes"),
                where("communityId", "==", community.id)
              );
              const notesSnapshot = await getDocs(notesQuery);

              return {
                ...community,
                memberCount: community.members?.length || 0,
                noteCount: notesSnapshot.size,
              };
            })
          );

          // Separate communities based on user membership
          if (user) {
            const userComms = communitiesData.filter((community) =>
              community.members?.includes(user.uid)
            );
            const otherComms = communitiesData.filter(
              (community) => !community.members?.includes(user.uid)
            );
            setUserCommunities(userComms);
            setOtherCommunities(otherComms);
          } else {
            setUserCommunities([]);
            setOtherCommunities(communitiesData);
          }
          setLoading(false);
        } catch (err) {
          console.error("Error fetching communities:", err);
          setError("Errore nel caricamento delle community.");
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error with communities listener:", err);
        setError("Errore nel caricamento delle community.");
        setLoading(false);
      }
    );

    return () => {
      unsubscribeCommunities();
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
        creatorId: user.uid,
        creatorEmail: user.email,
        members: [user.uid],
        created: Timestamp.now(),
      });

      // No need to manually update state - the real-time listener will handle it
      setNewCommunityName("");
      setNewCommunityDescription("");
      setShowCreateForm(false);
    } catch (err) {
      console.error("Error creating community:", err);
      setError("Errore nella creazione della community.");
    }
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
          <div className={styles.buttonGroup}>
            <button type="submit" className={styles.createButton}>
              Conferma
            </button>
          </div>
        </form>
      )}

      {/* User's Communities Section */}
      {user && userCommunities.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Le tue Community</h2>
          <ul className={styles.list}>
            {userCommunities.map((community) => (
              <li key={community.id} className={styles.listItem}>
                <Link to={`/community/${community.id}`} className={styles.link}>
                  <h3 className={styles.communityName}>{community.name}</h3>
                  <p className={styles.communityDescription}>
                    {community.description}
                  </p>
                  <div className={styles.communityMeta}>
                    <span>
                      <strong>{community.memberCount}</strong> Membri
                    </span>
                    <span>
                      <strong>{community.noteCount}</strong> Note
                    </span>
                    <span>
                      Creato il:{" "}
                      {community.created?.toDate().toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Other Communities Section */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          {user && userCommunities.length > 0
            ? "Altre Community"
            : "Tutte le Community"}
        </h2>
        {otherCommunities.length === 0 ? (
          <p>Non ci sono altre community disponibili.</p>
        ) : (
          <ul className={styles.list}>
            {otherCommunities.map((community) => (
              <li key={community.id} className={styles.listItem}>
                <Link to={`/community/${community.id}`} className={styles.link}>
                  <h3 className={styles.communityName}>{community.name}</h3>
                  <p className={styles.communityDescription}>
                    {community.description}
                  </p>
                  <div className={styles.communityMeta}>
                    <span>
                      <strong>{community.memberCount}</strong> Membri
                    </span>
                    <span>
                      <strong>{community.noteCount}</strong> Note
                    </span>
                    <span>
                      Creato il:{" "}
                      {community.created?.toDate().toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Empty state when no communities exist */}
      {userCommunities.length === 0 && otherCommunities.length === 0 && (
        <p>
          Non ci sono ancora community.{" "}
          {user
            ? "Creane una tu!"
            : "Effettua il login per creare una community."}
        </p>
      )}
    </div>
  );
}
