import React from 'react';
import './Events.css';

const events = [
  {
    id: 1,
    title: 'Annual Student Conference',
    date: 'May 14, 2025',
    location: 'Main Campus Auditorium',
  },
  {
    id: 2,
    title: 'Tech Workshop Series',
    date: 'May 14, 2025',
    location: 'Innovation Center, Building B',
  },
  {
    id: 3,
    title: 'Career Development Day',
    date: 'May 09, 2025',
    location: 'Student Center, Room 201',
  },
];

const Events = () => {
  return (
    <div className="events-container">
      <h1 className="events-title">Upcoming Events</h1>
      <p className="events-subtitle">
        Stay connected with the latest campus activities and educational opportunities
      </p>
      <div className="events-button-wrapper">
        <button className="events-add-btn">Add Event</button>
      </div>

      <div className="events-grid">
        {events.map((event) => (
          <div key={event.id} className="events-card">
            <div className="events-info">
              <h3 className="events-name">{event.title}</h3>
              <p className="events-date">
                📅 {event.date}
              </p>
              <p className="events-location">
                📍 {event.location}
              </p>
            </div>
            <button className="events-view-btn">View Details</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Events;
