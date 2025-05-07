// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import EventDetails from "./components/EventDetails";
import EditEventForm from "./components/EditEventForm";
import AISummarizer from "./pages/AISummarizer";
import AssessmentReminders from "./pages/AssessmentReminders";
import Login from "./Auth/Login";
import Register from "./Auth/Register";
import Profile from "./pages/Profile";
import Home from "./pages/Home";
import Community from "./pages/Community";
import Events from "./pages/Events";
import Features from "./pages/Features";
import Resources from "./pages/Resources";
import AddEventForm from "./components/AddEventForm";
import Notifications from "./components/Notifications";
import Chat from "./pages/Chat";

import PrivateRoute from "./PrivateRoute";
import Navbar from "./Navbar";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const stripePromise = loadStripe("pk_test_YourPublishableKeyHere");

export default function App() {
  const token = localStorage.getItem("token");
  const currentUser = localStorage.getItem("username");

  return (
    <Elements stripe={stripePromise}>
      <Router>
        <Navbar />
        <ToastContainer position="top-right" autoClose={3000} />

        <Routes>
          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Public pages */}
          <Route path="/" element={<Home />} />
          <Route path="/ai-summarizer" element={<AISummarizer />} />
          <Route path="/community" element={<Community />} />
          <Route path="/events" element={<Events />} />
          <Route path="/features" element={<Features />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/reminders" element={<AssessmentReminders />} />

          {/* Protected */}
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <PrivateRoute>
                <Notifications />
              </PrivateRoute>
            }
          />

          {/* Chat */}
          <Route path="/chat" element={<Chat token={token} currentUser={currentUser} />} />
          <Route path="/chat/:recipient" element={<Chat token={token} currentUser={currentUser} />} />

          {/* Event CRUD */}
          <Route
            path="/events/new"
            element={
              <PrivateRoute>
                <AddEventForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/events/:id"
            element={
              <PrivateRoute>
                <EventDetails />
              </PrivateRoute>
            }
          />
          <Route
            path="/events/:id/edit"
            element={
              <PrivateRoute>
                <EditEventForm />
              </PrivateRoute>
            }
          />

          {/* Fallback to home */}
          <Route path="*" element={<Home />} />
        </Routes>
      </Router>
    </Elements>
  );
}
