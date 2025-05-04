// src/components/EditEventForm.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./EditEventForm.css";

export default function EditEventForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    description: '',
    image: null,
  });

  useEffect(() => {
    const fetchEvent = async () => {
      const res = await fetch(`http://127.0.0.1:8000/api/events/${id}/`);
      const data = await res.json();
      setFormData({
        title: data.title || '',
        date: data.date || '',
        time: data.time || '',
        location: data.location || '',
        description: data.description || '',
        image: null  // don't prefill file input
      });
    };

    fetchEvent();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    const payload = new FormData();
    payload.append("title", formData.title);
    payload.append("date", formData.date);
    payload.append("time", formData.time);
    payload.append("location", formData.location);
    payload.append("description", formData.description);
    if (formData.image) {
      payload.append("image", formData.image);
    }

    const res = await fetch(`http://127.0.0.1:8000/api/events/${id}/`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: payload,
    });

    if (res.ok) {
      navigate(`/events/${id}`);
    } else {
      const err = await res.json();
      alert("Update failed: " + JSON.stringify(err));
    }
  };

  return (
    <div className="edit-event-container">
      <h2>Edit Event</h2>
      <form className="edit-event-form" onSubmit={handleSubmit}>
        <input type="text" name="title" value={formData.title} onChange={handleChange} required />
        <input type="date" name="date" value={formData.date} onChange={handleChange} required />
        <input type="time" name="time" value={formData.time} onChange={handleChange} required />
        <input type="text" name="location" value={formData.location} onChange={handleChange} required />
        <textarea name="description" value={formData.description} onChange={handleChange} rows={4} />
        <input type="file" name="image" accept="image/*" onChange={handleChange} />
        <button type="submit">Update Event</button>
      </form>
    </div>
  );
}
