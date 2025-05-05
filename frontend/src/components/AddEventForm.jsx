// src/components/AddEventForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddEventForm.css';

export default function AddEventForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    description: '',
    image: null,
  });

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
    if (!token) {
      alert("You must be signed in to create an event.");
      return;
    }
    

    const payload = new FormData();
    for (let key in formData) {
      payload.append(key, formData[key]);
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/events/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      if (res.ok) {
        navigate("/events");
      } else {
        const errorData = await res.json();
        console.error("Server validation error:", errorData); 
        alert("Error creating event.");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Something went wrong.");
    }
  };

  return (
    <div className="add-event-container">
      <h2>Create a New Event</h2>
      <form className="add-event-form" onSubmit={handleSubmit}>
        <input type="text" name="title" placeholder="Event Title" value={formData.title} onChange={handleChange} required />
        <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            />
            <input
            type="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            required
        />
        <input type="text" name="location" placeholder="Location" value={formData.location} onChange={handleChange} required />
        <textarea name="description" placeholder="Event Description" value={formData.description} onChange={handleChange} rows={4} />
        <input type="file" name="image" accept="image/*" onChange={handleChange} />
        <button type="submit">Submit Event</button>
      </form>
    </div>
  );
}
