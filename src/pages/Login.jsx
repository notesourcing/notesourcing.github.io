import React, { useState, useContext, useEffect } from "react";
import { auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { db } from "../firebase";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../App";
import styles from "./Login.module.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
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
      setError(t("enterEmailPassword"));
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
        {isRegistering ? t("register") : t("signIn")}
      </h2>
      {error && <div className={styles.error}>{error}</div>}

      <button
        className={`${styles.button} ${styles.googleButton}`}
        onClick={() => handleOAuthLogin(new GoogleAuthProvider())}
      >
        {t("signInWithGoogle")}
      </button>

      <div className={styles.separator}>
        <span>{t("or")}</span>
      </div>

      <form onSubmit={handleEmailAuth} className={styles.form}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("email")}
          className={styles.input}
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("password")}
          className={styles.input}
          required
        />
        <button
          type="submit"
          className={`${styles.button} ${styles.emailButton}`}
        >
          {isRegistering ? t("registerWithEmail") : t("signInWithEmail")}
        </button>
      </form>

      <button
        onClick={() => setIsRegistering(!isRegistering)}
        className={styles.toggleLink}
      >
        {isRegistering ? t("alreadyHaveAccount") : t("dontHaveAccount")}
      </button>
    </div>
  );
}
