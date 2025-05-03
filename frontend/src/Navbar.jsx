// src/Navbar.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
// import { auth } from "./firebase";
// import { signOut } from "firebase/auth";
// import { toast } from "react-toastify";
// import { useAuth } from "./Auth/AuthContext";
// import { FaBell, FaEnvelope } from "react-icons/fa";
import "./Navbar.css";


export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">StudentConnect</Link>
      </div>
      <div className="navbar-links">
        <Link to="/features">Features</Link>
        <Link to="/community">Community</Link>
        <Link to="/resources">Resources</Link>
        <Link to="/events">Events</Link>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    padding: "10px 20px",
    borderBottom: "1px solid #ccc",
    backgroundColor: "#f8f8f8",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
  },
  left: { display: "flex", gap: "15px" },
  right: { display: "flex", alignItems: "center", gap: "15px" },
  link: { textDecoration: "none", color: "#007bff", fontWeight: "bold" },
  searchForm: { display: "flex", alignItems: "center", gap: "8px" },
  searchInput: {
    padding: "6px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    minWidth: "180px",
  },
  searchButton: {
    background: "#007bff",
    color: "#fff",
    padding: "6px 10px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  iconButton: { position: "relative", color: "#333", textDecoration: "none" },
  badge: {
    position: "absolute",
    top: "-4px",
    right: "-4px",
    background: "#dc3545",
    color: "#fff",
    borderRadius: "50%",
    padding: "2px 6px",
    fontSize: "0.7rem",
    lineHeight: 1,
  },
  user: { fontSize: "0.9rem", color: "#333" },
  logout: {
    background: "#dc3545",
    color: "#fff",
    padding: "6px 12px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
};
