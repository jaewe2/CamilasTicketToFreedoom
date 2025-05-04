// src/Navbar.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import "./Navbar.css";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

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

        {user ? (
          <>
            {/* PROFILE LINK */}
            <Link to="/profile" className="nav-link">
              Profile
            </Link>

            {/* SIGN OUT */}
            <span className="sign-in-link" onClick={handleSignOut}>
              Sign Out
            </span>
          </>
        ) : (
          <Link to="/login" className="sign-in-btn">
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
