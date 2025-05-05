import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Events.css';
import { auth } from "../firebase";

export default function Events() {
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) return; // 🔒 Don't fetch if not authenticated
  
      try {
        const token = await user.getIdToken(true);
  
        const res = await fetch("http://127.0.0.1:8000/api/events/", {
          method: "GET",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });
  
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setEvents(data);
      } catch (err) {
        console.error("Failed to load events:", err);
      }
    });
  
    return () => unsubscribe();
  }, []);

  return (
    <div className="events-container">
      <h1 className="events-title">Upcoming Events</h1>
      <p className="events-subtitle">
        Stay connected with the latest campus activities and educational opportunities
      </p>

      <div className="events-button-wrapper">
        {auth.currentUser && (
          <button
            className="events-add-btn"
            onClick={() => navigate('/events/new')}
          >
            Add Event
          </button>
        )}
      </div>

      <div className="events-grid">
        {events.map(event => (
          <div key={event.id} className="events-card">
            {event.image && (
              <img
                src={event.image}
                alt={event.title}
                className="events-image"
              />
            )}
            <div className="events-info">
              <h3 className="events-name">{event.title}</h3>
              <p className="events-date">📅 {event.date}</p>
              <p className="events-location">📍 {event.location}</p>
              <p className="events-description">{event.description}</p>
            </div>
            <button
              className="events-view-btn"
              onClick={() => navigate(`/events/${event.id}`)}
            >
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
