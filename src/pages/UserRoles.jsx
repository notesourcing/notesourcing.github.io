import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../App";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";

export default function UserRoles() {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("");

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setCurrentUserRole(userDoc.data().role || "user");
        }
      } catch (err) {
        console.error("Error fetching user role:", err);
      }
    };

    fetchUserRole();
  }, [user]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user || currentUserRole !== "superadmin") return;

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
  }, [user, currentUserRole]);

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

  if (currentUserRole !== "superadmin") {
    return (
      <div style={{ maxWidth: 600, margin: "2rem auto", padding: "2rem" }}>
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
    <div style={{ maxWidth: 800, margin: "2rem auto", padding: "2rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h2>Gestione Ruoli Utenti</h2>
        <Link to="/dashboard">← Torna al Dashboard</Link>
      </div>

      {error && (
        <div
          style={{
            color: "red",
            marginBottom: 16,
            padding: 12,
            background: "#ffebee",
            borderRadius: 4,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          marginBottom: 24,
          padding: 16,
          background: "#e3f2fd",
          borderRadius: 8,
        }}
      >
        <h3>Ruoli Disponibili:</h3>
        <ul>
          <li>
            <strong>user</strong> - Utente normale (predefinito)
          </li>
          <li>
            <strong>admin</strong> - Amministratore con privilegi estesi
          </li>
          <li>
            <strong>superadmin</strong> - Super amministratore con accesso
            completo
          </li>
        </ul>
      </div>

      {users.length === 0 ? (
        <div>Nessun utente trovato.</div>
      ) : (
        <div
          style={{
            background: "#fff",
            borderRadius: 8,
            boxShadow: "0 2px 8px #0001",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  background: "#f8f9fa",
                  borderBottom: "2px solid #dee2e6",
                }}
              >
                <th style={{ padding: 12, textAlign: "left" }}>Email</th>
                <th style={{ padding: 12, textAlign: "left" }}>Nome</th>
                <th style={{ padding: 12, textAlign: "left" }}>
                  Ruolo Attuale
                </th>
                <th style={{ padding: 12, textAlign: "left" }}>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {users.map((userData) => (
                <tr
                  key={userData.id}
                  style={{ borderBottom: "1px solid #dee2e6" }}
                >
                  <td style={{ padding: 12 }}>{userData.email}</td>
                  <td style={{ padding: 12 }}>
                    {userData.displayName || "N/A"}
                  </td>
                  <td style={{ padding: 12 }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: "bold",
                        background:
                          userData.role === "superadmin"
                            ? "#ffcdd2"
                            : userData.role === "admin"
                            ? "#fff3e0"
                            : "#e8f5e8",
                        color:
                          userData.role === "superadmin"
                            ? "#c62828"
                            : userData.role === "admin"
                            ? "#f57c00"
                            : "#2e7d32",
                      }}
                    >
                      {userData.role || "user"}
                    </span>
                  </td>
                  <td style={{ padding: 12 }}>
                    <select
                      value={userData.role || "user"}
                      onChange={(e) =>
                        handleRoleChange(userData.id, e.target.value)
                      }
                      style={{
                        padding: "4px 8px",
                        border: "1px solid #ccc",
                        borderRadius: 4,
                        fontSize: 14,
                      }}
                      disabled={userData.id === user.uid} // Can't change own role
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                      <option value="superadmin">superadmin</option>
                    </select>
                    {userData.id === user.uid && (
                      <span
                        style={{ fontSize: 12, color: "#666", marginLeft: 8 }}
                      >
                        (Tu)
                      </span>
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
