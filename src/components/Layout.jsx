import React, { useContext } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { AuthContext } from "../App";
import { auth } from "../firebase";
import styles from "./Layout.module.css";

const Layout = () => {
  const { user, isSuperAdmin } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    auth
      .signOut()
      .then(() => {
        navigate("/");
      })
      .catch((error) => {
        console.error("Error signing out: ", error);
      });
  };

  return (
    <>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>
          NoteSourcing
        </Link>
        <nav className={styles.nav}>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/communities">Communities</Link>
            </li>
            {user ? (
              <>
                <li>
                  <Link to="/dashboard">Dashboard</Link>
                </li>
                {isSuperAdmin && (
                  <li>
                    <Link to="/user-roles">User Roles</Link>
                  </li>
                )}
                <li>
                  <button
                    onClick={handleLogout}
                    className={styles.logoutButton}
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link to="/login" className={styles.loginButton}>
                  Login
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </>
  );
};

export default Layout;
