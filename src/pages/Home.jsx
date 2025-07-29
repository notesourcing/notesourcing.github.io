import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div
      style={{
        maxWidth: 500,
        margin: "2rem auto",
        padding: "2rem",
        border: "1px solid #eee",
        borderRadius: 8,
        background: "#fafbfc",
      }}
    >
      <h1>Notesourcing</h1>
      <p>Piattaforma collaborativa per note, semplice e flessibile.</p>
      <nav style={{ marginTop: 32 }}>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li style={{ margin: "1rem 0" }}>
            <Link to="/login">Login / Registrazione</Link>
          </li>
          <li style={{ margin: "1rem 0" }}>
            <Link to="/dashboard">Dashboard</Link>
          </li>
          <li style={{ margin: "1rem 0" }}>
            <Link to="/community/1">Community</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
