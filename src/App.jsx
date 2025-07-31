import React, { useEffect, useState, createContext, useContext } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";
import { useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Note from "./pages/Note";
import Community from "./pages/Community";
import Communities from "./pages/Communities";
import UserRoles from "./pages/UserRoles";
import Logo from "./components/Logo";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import styles from "./App.module.css";

export const AuthContext = createContext(null);

function Layout() {
  const { user, isSuperAdmin } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <Link
          to="/landing"
          className={styles.logoContainer}
          title="Pagina principale di NoteSourcing"
        >
          <Logo size="medium" showText={true} />
        </Link>
        <nav className={styles.nav}>
          <Link
            to="/"
            className={
              location.pathname === "/"
                ? `${styles.navLink} ${styles.activeNavLink}`
                : styles.navLink
            }
          >
            🗒️ All notes
          </Link>
          <Link
            to="/dashboard"
            className={
              location.pathname === "/dashboard"
                ? `${styles.navLink} ${styles.activeNavLink}`
                : styles.navLink
            }
          >
            📊 Dashboard
          </Link>
          <Link
            to="/communities"
            className={
              location.pathname === "/communities"
                ? `${styles.navLink} ${styles.activeNavLink}`
                : styles.navLink
            }
          >
            👥 Communities
          </Link>
          {isSuperAdmin && (
            <Link
              to="/user-roles"
              className={
                location.pathname === "/user-roles"
                  ? `${styles.navLink} ${styles.activeNavLink}`
                  : styles.navLink
              }
            >
              🛡️ Gestione Utenti
            </Link>
          )}
          {user ? (
            <div className={styles.userInfo}>
              <span className={styles.userEmail}>{user.email}</span>
              <button onClick={handleLogout} className={styles.logoutButton}>
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className={
                location.pathname === "/login"
                  ? `${styles.navLink} ${styles.activeNavLink}`
                  : styles.navLink
              }
            >
              🔑 Login
            </Link>
          )}
        </nav>
      </header>
      <main className={styles.mainContent}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/note/:id" element={<Note />} />
          <Route path="/community/:id" element={<Community />} />
          <Route path="/communities" element={<Communities />} />
          <Route path="/user-roles" element={<UserRoles />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (u) {
        const userDoc = await getDoc(doc(db, "users", u.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          u.role = userData.role;
          setIsAdmin(
            userData.role === "admin" || userData.role === "superadmin"
          );
          setIsSuperAdmin(userData.role === "superadmin");
        }
        setUser(u);

        // Expose to feature monitor (development only)
        if (import.meta.env.DEV) {
          window.currentUser = u;
          window.AuthContext = { user: u, isAdmin, isSuperAdmin };
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        setIsSuperAdmin(false);

        // Clear from feature monitor
        if (import.meta.env.DEV) {
          window.currentUser = null;
          window.AuthContext = {
            user: null,
            isAdmin: false,
            isSuperAdmin: false,
          };
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isAdmin, isSuperAdmin]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, isAdmin, isSuperAdmin }}>
      <Router>
        <Layout />
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
