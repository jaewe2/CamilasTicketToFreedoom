// src/pages/ViewEvent.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ViewEvent.css'; 

export default function ViewEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      const token = localStorage.getItem("token");

      const res = await fetch(`http://127.0.0.1:8000/api/events/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setEvent(data);

      // OPTIONAL: If backend returns event.creator.id, check ownership
      const currentUserId = localStorage.getItem("user_id"); // ← you'd have to set this on login
      setIsCreator(currentUserId === data.creator_id);
    };

    fetchEvent();
  }, [id]);

  const handleDelete = async () => {
    const token = localStorage.getItem("token");
    const confirmed = window.confirm("Delete this event?");
    if (!confirmed) return;

    await fetch(`http://127.0.0.1:8000/api/events/${id}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    navigate("/events");
  };

  if (!event) return <p>Loading...</p>;

  return (
    <div className="view-event-container">
      <h2 className="view-event-title">{event.title}</h2>
      {event.image && <img src={event.image} alt="Event" className="view-event-image" />}
      <p className="view-event-info"><span className="view-event-label">Date:</span>{event.date}</p>
      <p className="view-event-info"><span className="view-event-label">Time:</span>{event.time}</p>
      <p className="view-event-info"><span className="view-event-label">Location:</span>{event.location}</p>
      <p className="view-event-info">{event.description}</p>
      
      
      {isCreator && (
        <div className="view-event-buttons">
          <button className="view-event-btn edit" onClick={() => navigate(`/events/${event.id}/edit`)}>Edit</button>
          <button className="view-event-btn delete" onClick={handleDelete}>Delete</button>
        </div>
      )}
    </div>
  );
}
