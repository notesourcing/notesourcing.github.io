import React, { useEffect, useState, createContext } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Note from "./pages/Note";
import Community from "./pages/Community";
import AllNotes from "./pages/AllNotes";
import { auth } from "./firebase";

export const AuthContext = createContext(null);

function App() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <Router>
        <div
          style={{
            background: "#e3eaf2",
            padding: "0.5rem 1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontWeight: 600 }}>Notesourcing</span>
          {user ? (
            <span>
              {user.email}{" "}
              <button onClick={handleLogout} style={{ marginLeft: 12 }}>
                Logout
              </button>
            </span>
          ) : null}
        </div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/note/:id" element={<Note />} />
          <Route path="/community/:id" element={<Community />} />
          <Route path="/all-notes" element={<AllNotes />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
