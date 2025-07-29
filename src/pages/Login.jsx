import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { AuthContext } from "../App";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!email || !password) {
      setMessage("Inserisci email e password.");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // AuthContext will update and redirect via useEffect
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        setMessage("Utente non trovato.");
      } else if (error.code === "auth/wrong-password") {
        setMessage("Password errata.");
      } else if (error.code === "auth/invalid-email") {
        setMessage("Email non valida.");
      } else {
        setMessage("Errore durante il login: " + error.message);
      }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!email || !password) {
      setMessage("Inserisci email e password.");
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setMessage(
        "Registrazione avvenuta con successo! Ora puoi effettuare il login."
      );
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setMessage("Email già registrata.");
      } else if (error.code === "auth/invalid-email") {
        setMessage("Email non valida.");
      } else if (error.code === "auth/weak-password") {
        setMessage("La password deve contenere almeno 6 caratteri.");
      } else {
        setMessage("Errore durante la registrazione: " + error.message);
      }
    }
  };

  if (user) {
    // Optionally, show a loading or redirect message
    return null;
  }
  return (
    <div
      style={{
        maxWidth: 400,
        margin: "2rem auto",
        padding: "2rem",
        border: "1px solid #eee",
        borderRadius: 8,
        background: "#fafbfc",
      }}
    >
      <h2>Login / Registrazione</h2>
      <form>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="email">Email</label>
          <br />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 4 }}
            autoComplete="username"
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="password">Password</label>
          <br />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 4 }}
            autoComplete="current-password"
          />
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <button onClick={handleLogin} type="submit" style={{ flex: 1 }}>
            Login
          </button>
          <button onClick={handleRegister} type="button" style={{ flex: 1 }}>
            Registrati
          </button>
        </div>
        {message && (
          <div style={{ color: "#555", marginTop: 8 }}>{message}</div>
        )}
      </form>
    </div>
  );
}
