import React, { useState, useContext, useEffect } from "react";
import { auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  GithubAuthProvider,
} from "firebase/auth";
import { db } from "../firebase";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../App";
import styles from "./Login.module.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleAuthSuccess = async (userAuth) => {
    const userRef = doc(db, "users", userAuth.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        email: userAuth.email,
        displayName: userAuth.displayName,
        photoURL: userAuth.photoURL,
        createdAt: serverTimestamp(),
        role: "user",
      });
    }
    navigate("/");
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Inserisci email e password.");
      return;
    }
    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        await handleAuthSuccess(userCredential.user);
      } else {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        await handleAuthSuccess(userCredential.user);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOAuthLogin = async (provider) => {
    setError("");
    try {
      const result = await signInWithPopup(auth, provider);
      await handleAuthSuccess(result.user);
    } catch (err) {
      setError(err.message);
    }
  };

  if (user) return null;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        {isRegistering ? "Registrati" : "Accedi"}
      </h2>
      {error && <div className={styles.error}>{error}</div>}

      <button
        className={`${styles.button} ${styles.googleButton}`}
        onClick={() => handleOAuthLogin(new GoogleAuthProvider())}
      >
        Accedi con Google
      </button>
      <button
        className={`${styles.button} ${styles.githubButton}`}
        onClick={() => handleOAuthLogin(new GithubAuthProvider())}
      >
        Accedi con GitHub
      </button>

      <div className={styles.separator}>
        <span>OR</span>
      </div>

      <form onSubmit={handleEmailAuth} className={styles.form}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className={styles.input}
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className={styles.input}
          required
        />
        <button
          type="submit"
          className={`${styles.button} ${styles.emailButton}`}
        >
          {isRegistering ? "Registrati" : "Accedi"} con l'Email
        </button>
      </form>

      <button
        onClick={() => setIsRegistering(!isRegistering)}
        className={styles.toggleLink}
      >
        {isRegistering
          ? "Hai già un account? Accedi"
          : "Non hai un account? Registrati"}
      </button>
    </div>
  );
}
