import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Note from './pages/Note';
import Community from './pages/Community';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/note/:id" element={<Note />} />
        <Route path="/community/:id" element={<Community />} />
      </Routes>
    </Router>
  );
}

export default App;
