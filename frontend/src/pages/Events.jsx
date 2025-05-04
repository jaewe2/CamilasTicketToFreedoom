import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Events.css';
//import AddEventForm from "../components/AddEventForm";
import { auth } from "../firebase";

const Events = () => {
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/events/")
      .then(res => res.json())
      .then(data => setEvents(data))
      .catch(err => console.error("Failed to load events:", err));
  }, []);

  return (
    <div className="events-container">
      <h1 className="events-title">Upcoming Events</h1>
      <p className="events-subtitle">
        Stay connected with the latest campus activities and educational opportunities
      </p>
      <div className="events-button-wrapper">
        {auth.currentUser && (
          <button className="events-add-btn" onClick={() => navigate('/events/new')}>
            Add Event
          </button>
        )}
      </div>

      <div className="events-grid">
        {events.map((event) => (
          <div key={event.id} className="events-card">
            {event.image && (
              <img src={event.image} alt={event.title} className="events-image" />
            )}
            <div className="events-info">
              <h3 className="events-name">{event.title}</h3>
              <p className="events-date">📅 {event.date}</p>
              <p className="events-location">📍 {event.location}</p>
              <p className="events-description">{event.description}</p>
            </div>
            <button className="events-view-btn" onClick={() => navigate(`/events/${event.id}`)}>
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Events;
