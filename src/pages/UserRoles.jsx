import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../App";
import { db } from "../firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import styles from "./UserRoles.module.css";

export default function UserRoles() {
  const { user, isSuperAdmin } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      if (!isSuperAdmin) return;

      setLoading(true);
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersData = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersData);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Errore nel caricamento degli utenti.");
      }
      setLoading(false);
    };

    fetchUsers();
  }, [isSuperAdmin]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        role: newRole,
      });

      // Update local state
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      console.error("Error updating user role:", err);
      setError("Errore nell'aggiornamento del ruolo: " + err.message);
    }
  };

  if (!user) {
    return <div>Effettua il login per accedere a questa pagina.</div>;
  }

  if (!isSuperAdmin) {
    return (
      <div className={styles.container}>
        <h2>Accesso Negato</h2>
        <p>Solo i superadmin possono accedere a questa pagina.</p>
        <Link to="/dashboard">← Torna al Dashboard</Link>
      </div>
    );
  }

  if (loading) {
    return <div>Caricamento utenti...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Gestione Ruoli Utenti</h2>
        <Link to="/dashboard">← Torna al Dashboard</Link>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.rolesInfo}>
        <h3>Ruoli Disponibili:</h3>
        <ul>
          <li>
            <strong>user</strong> - Utente normale (predefinito)
          </li>
          <li>
            <strong>admin</strong> - Amministratore. Può eliminare le note della
            comunità.
          </li>
        </ul>
      </div>

      {users.length === 0 ? (
        <div>Nessun utente trovato.</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Nome</th>
                <th>Ruolo Attuale</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {users.map((userData) => (
                <tr key={userData.id}>
                  <td>{userData.email}</td>
                  <td>{userData.displayName || "N/A"}</td>
                  <td>
                    <span
                      className={`${styles.roleSpan} ${
                        userData.role === "admin"
                          ? styles.roleAdmin
                          : styles.roleUser
                      }`}
                    >
                      {userData.role || "user"}
                    </span>
                  </td>
                  <td>
                    <select
                      value={userData.role || "user"}
                      onChange={(e) =>
                        handleRoleChange(userData.id, e.target.value)
                      }
                      className={styles.roleSelect}
                      disabled={userData.id === user.uid} // Can't change own role
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                    {userData.id === user.uid && (
                      <span className={styles.currentUserText}>(Tu)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
