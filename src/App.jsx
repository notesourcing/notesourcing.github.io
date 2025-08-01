import React, { useEffect, useState, createContext, useContext } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Note from "./pages/Note";
import Community from "./pages/Community";
import Communities from "./pages/Communities";
import UserRoles from "./pages/UserRoles";
import Profile from "./pages/Profile";
import Logo from "./components/Logo";
import LanguageSwitcher from "./components/LanguageSwitcher";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { getAppName, updateDocumentTitle } from "./utils/appName";
import styles from "./App.module.css";

export const AuthContext = createContext(null);

function Layout() {
  const { user, isSuperAdmin, userDisplayName } = useContext(AuthContext);
  const { t } = useTranslation();
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

  // Function to get display name for profile link
  const getProfileDisplayName = () => {
    if (userDisplayName) {
      return userDisplayName;
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return user?.email || "Profile";
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <Link
          to="/landing"
          className={styles.logoContainer}
          title={`Pagina principale di ${getAppName()}`}
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
            📝 {t("home")}
          </Link>
          <Link
            to="/communities"
            className={
              location.pathname === "/communities"
                ? `${styles.navLink} ${styles.activeNavLink}`
                : styles.navLink
            }
          >
            👥 {t("communities")}
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
              🛡️ {t("manageUsers")}
            </Link>
          )}
          {user ? (
            <div className={styles.userInfo}>
              <Link
                to="/profile"
                className={
                  location.pathname === "/profile"
                    ? `${styles.navLink} ${styles.activeNavLink}`
                    : styles.navLink
                }
                title={t("profile")}
              >
                👤 {getProfileDisplayName()}
              </Link>
              <button onClick={handleLogout} className={styles.logoutButton}>
                {t("logout")}
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
              🔑 {t("login")}
            </Link>
          )}
          <LanguageSwitcher />
        </nav>
      </header>
      <main className={styles.mainContent}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          {/* Redirect dashboard to home */}
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/note/:id" element={<Note />} />
          <Route path="/shared-note/:id" element={<Note />} />
          <Route path="/community/:id" element={<Community />} />
          <Route path="/communities" element={<Communities />} />
          <Route path="/user-roles" element={<UserRoles />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState(null);
  const [userCommunityCustomNames, setUserCommunityCustomNames] = useState({});
  const [loading, setLoading] = useState(true);

  // Update document title with app name
  useEffect(() => {
    updateDocumentTitle();
  }, []);

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
          setUserDisplayName(userData.displayName || null);
          setUserCommunityCustomNames(userData.communityCustomNames || {});
        } else {
          setUserDisplayName(null);
          setUserCommunityCustomNames({});
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
        setUserDisplayName(null);
        setUserCommunityCustomNames({});

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
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isSuperAdmin,
        userDisplayName,
        userCommunityCustomNames,
      }}
    >
      <Router>
        <Layout />
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
