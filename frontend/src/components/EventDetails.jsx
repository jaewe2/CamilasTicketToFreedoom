import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./EventDetails.css";

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);

  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    console.log("📌 useEffect triggered for event ID:", id);
    fetch(`http://127.0.0.1:8000/api/events/${id}/`)
      .then(res => res.json())
      .then(data => {
        console.log("📦 Event data:", data);
        setEvent(data);
  
        const currentUserEmail = localStorage.getItem("user_email");
        console.log("🔎 Event creator:", data.creator);
        console.log("👤 Logged-in user:", currentUserEmail);
        if (currentUserEmail === data.creator) {
            console.log("✅ Creator match — showing buttons");
            setIsCreator(true);
        } else {
            console.log("❌ Creator mismatch — hiding buttons");
        }
      })
      .catch(err => console.error("Failed to fetch event:", err));
  }, [id]);

  const handleDelete = async () => {
    const token = localStorage.getItem("token");
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    const res = await fetch(`http://127.0.0.1:8000/api/events/${id}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      alert("Event deleted.");
      navigate("/events");
    } else {
      alert("Failed to delete event.");
    }
  };

  const handleEdit = () => {
    navigate(`/events/${id}/edit`);
  };

  if (!event) return <p>Loading event...</p>;

  return (
    <div className="event-detail-container">
      <h2>{event.title}</h2>
      {event.image && <img src={event.image} alt={event.title} />}
      <p><strong>Date:</strong> {event.date}</p>
      <p><strong>Time:</strong> {event.time}</p>
      <p><strong>Location:</strong> {event.location}</p>
      <p><strong>Description:</strong> {event.description}</p>

      {isCreator && (
        <div className="event-detail-buttons">
            <button className="event-btn edit-btn" onClick={handleEdit}>Edit</button>
            <button className="event-btn delete-btn" onClick={handleDelete}>Delete</button>
        </div>
        )}
    </div>
  );
}
