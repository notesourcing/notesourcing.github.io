import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../App";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { getUserCommunityCustomNames } from "../utils/userUtils";
import styles from "./Profile.module.css";

export default function Profile() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    displayName: "",
    email: "",
    photoURL: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [communities, setCommunities] = useState([]);
  const [communityCustomNames, setCommunityCustomNames] = useState({});
  const [editingCommunityNames, setEditingCommunityNames] = useState(false);
  const [tempCommunityNames, setTempCommunityNames] = useState({});

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setProfile({
            displayName: userData.displayName || "",
            email: userData.email || user.email || "",
            photoURL: userData.photoURL || "",
          });
          // Load community custom names
          const customNames = userData.communityCustomNames || {};
          setCommunityCustomNames(customNames);
          setTempCommunityNames(customNames);
        } else {
          // Initialize with auth data if user document doesn't exist
          setProfile({
            displayName: user.displayName || "",
            email: user.email || "",
            photoURL: user.photoURL || "",
          });
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Errore nel caricamento del profilo.");
      } finally {
        setLoading(false);
      }
    };

    // Fetch user's communities
    const fetchCommunities = () => {
      const communitiesQuery = query(
        collection(db, "communities"),
        where("members", "array-contains", user.uid)
      );

      const unsubscribe = onSnapshot(
        communitiesQuery,
        (snapshot) => {
          const userCommunities = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setCommunities(userCommunities);
        },
        (err) => {
          console.error("Error fetching user communities:", err);
        }
      );

      return unsubscribe;
    };

    fetchProfile();
    const unsubscribeCommunities = fetchCommunities();

    return () => {
      unsubscribeCommunities();
    };
  }, [user, navigate]);

  const handleSave = async () => {
    if (!user) return;

    if (!profile.displayName.trim()) {
      setError("Il nome visualizzato non può essere vuoto.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        displayName: profile.displayName.trim(),
        updatedAt: serverTimestamp(),
      });

      setIsEditing(false);
      setSuccess("Profilo aggiornato con successo!");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Errore durante l'aggiornamento del profilo.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCommunityNames = async () => {
    if (!user) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        communityCustomNames: tempCommunityNames,
        updatedAt: serverTimestamp(),
      });

      setCommunityCustomNames(tempCommunityNames);
      setEditingCommunityNames(false);
      setSuccess("Nomi personalizzati aggiornati con successo!");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error updating community names:", err);
      setError("Errore durante l'aggiornamento dei nomi personalizzati.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError("");
    // Reset form to original values
    // You might want to re-fetch here, but for simplicity we'll assume no changes
  };

  const handleCancelCommunityNames = () => {
    setEditingCommunityNames(false);
    setTempCommunityNames(communityCustomNames);
    setError("");
  };

  const handleCommunityNameChange = (communityId, newName) => {
    setTempCommunityNames((prev) => ({
      ...prev,
      [communityId]: newName.trim(),
    }));
  };

  if (loading) {
    return <div className={styles.loading}>Caricamento profilo...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Il Mio Profilo</h1>
        {!isEditing && (
          <button
            className={styles.editButton}
            onClick={() => setIsEditing(true)}
          >
            ✏️ Modifica Profilo
          </button>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.profileCard}>
        {profile.photoURL && (
          <div className={styles.avatarSection}>
            <img
              src={profile.photoURL}
              alt="Avatar"
              className={styles.avatar}
            />
          </div>
        )}

        <div className={styles.fieldsSection}>
          <div className={styles.field}>
            <label className={styles.label}>Email:</label>
            <div className={styles.value}>{profile.email}</div>
            <small className={styles.hint}>
              L'email non può essere modificata qui
            </small>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Nome Visualizzato:</label>
            {isEditing ? (
              <input
                type="text"
                value={profile.displayName}
                onChange={(e) =>
                  setProfile({ ...profile, displayName: e.target.value })
                }
                placeholder="Come vuoi apparire agli altri utenti?"
                className={styles.input}
                maxLength={50}
              />
            ) : (
              <div className={styles.value}>
                {profile.displayName || (
                  <span className={styles.noValue}>Non impostato</span>
                )}
              </div>
            )}
            <small className={styles.hint}>
              Questo nome verrà mostrato nelle tue note e nei commenti
            </small>
          </div>
        </div>

        {isEditing && (
          <div className={styles.buttonSection}>
            <button
              className={styles.saveButton}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Salvataggio..." : "💾 Salva Modifiche"}
            </button>
            <button className={styles.cancelButton} onClick={handleCancel}>
              ❌ Annulla
            </button>
          </div>
        )}
      </div>

      {/* Community Custom Names Section */}
      <div className={styles.profileCard}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            🏘️ Nomi Personalizzati nelle Community
          </h3>
          {!editingCommunityNames && communities.length > 0 && (
            <button
              className={styles.editButton}
              onClick={() => setEditingCommunityNames(true)}
            >
              ✏️ Modifica Nomi
            </button>
          )}
        </div>

        {communities.length === 0 ? (
          <p className={styles.emptyMessage}>
            Non sei ancora membro di nessuna community.
          </p>
        ) : (
          <div className={styles.communityNamesSection}>
            {communities.map((community) => (
              <div key={community.id} className={styles.communityNameField}>
                <div className={styles.communityInfo}>
                  <strong className={styles.communityName}>
                    {community.name}
                  </strong>
                  <span className={styles.communityVisibility}>
                    {community.visibility === "public" && "🌍 Pubblica"}
                    {community.visibility === "private" && "🔒 Privata"}
                    {community.visibility === "hidden" && "👁️‍🗨️ Nascosta"}
                    {!community.visibility && "🌍 Pubblica"}
                  </span>
                </div>

                {editingCommunityNames ? (
                  <div className={styles.nameInputContainer}>
                    <input
                      type="text"
                      value={tempCommunityNames[community.id] || ""}
                      onChange={(e) =>
                        handleCommunityNameChange(community.id, e.target.value)
                      }
                      placeholder="Nome personalizzato per questa community"
                      className={styles.communityNameInput}
                      maxLength={50}
                    />
                    <small className={styles.inputHint}>
                      Lascia vuoto per usare il nome profilo predefinito
                    </small>
                  </div>
                ) : (
                  <div className={styles.currentName}>
                    <span className={styles.nameLabel}>Nome visualizzato:</span>
                    <span className={styles.nameValue}>
                      {communityCustomNames[community.id] ||
                        profile.displayName ||
                        profile.email.split("@")[0] ||
                        "Nome non impostato"}
                    </span>
                    {communityCustomNames[community.id] && (
                      <span className={styles.customIndicator}>
                        (personalizzato)
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {editingCommunityNames && (
          <div className={styles.buttonSection}>
            <button
              className={styles.saveButton}
              onClick={handleSaveCommunityNames}
              disabled={saving}
            >
              {saving ? "Salvataggio..." : "💾 Salva Nomi Personalizzati"}
            </button>
            <button
              className={styles.cancelButton}
              onClick={handleCancelCommunityNames}
            >
              ❌ Annulla
            </button>
          </div>
        )}
      </div>

      <div className={styles.infoSection}>
        <h3 className={styles.infoTitle}>ℹ️ Informazioni</h3>
        <ul className={styles.infoList}>
          <li>
            Il nome visualizzato verrà usato al posto della tua email quando
            altri utenti vedranno le tue note
          </li>
          <li>Puoi modificare il nome visualizzato in qualsiasi momento</li>
          <li>
            Se non imposti un nome visualizzato, verrà mostrata la parte prima
            della @ della tua email
          </li>
          <li>Il nome visualizzato può essere lungo massimo 50 caratteri</li>
          <li>
            Puoi impostare nomi personalizzati diversi per ogni community a cui
            partecipi
          </li>
          <li>
            I nomi personalizzati delle community hanno la priorità sul nome
            profilo generale
          </li>
        </ul>
      </div>
    </div>
  );
}
