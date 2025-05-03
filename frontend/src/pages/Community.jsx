import React, { useState } from 'react';
import './Community.css';

const testimonials = [
  {
    id: 1,
    name: 'Priya Patel',
    major: 'Data Science Graduate',
    university: 'UC Berkeley',
    quote:
      "As a mentor on StudentConnect, I've been able to guide younger students while reinforcing my own knowledge. It's a rewarding experience that benefits everyone involved.",
    initial: 'P',
  },
  {
    id: 2,
    name: 'Alex Johnson',
    major: 'Computer Science Major',
    initial: 'A',
    quote:
      "StudentConnect helped me find study partners for my advanced algorithms course. The peer-to-peer learning approach has significantly improved my understanding of complex topics.",
    university: 'Stanford University',
  },
  {
    id: 3,
    name: 'Samantha Lee',
    major: 'Biology Student',
    initial: 'S',
    quote: 
      "I've been able to connect with other pre-med students through this platform. We regularly share resources and help each other prepare for exams. It's been invaluable!",
    university: 'Harvard University',
  },
  {
    id: 4,
    name: 'Marcus Williams',
    major: 'Business Administration',
    initial: 'M',
    quote:
      "StudentConnect has transformed the way I study. I can easily find peers who are willing to help me with my coursework, and I've made some great friends along the way.",
    university: 'University of Michigan',
  },
];

export default function Community() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = testimonials[activeIndex];

  return (
    <div className="community-page-wrapper">
      <h2 className="community-heading">
        Hear from our <span className="highlight">community</span>
      </h2>

      <div className="testimonial-card">
        <div className="testimonial-left">
          <div className="initial-circle">{active.initial}</div>
          <p className="name">{active.name}</p>
          <p className="major">{active.major}</p>
          {active.university && (
            <p className="university">{active.university}</p>
          )}
        </div>

        <div className="testimonial-right">
          <p className="quote">“{active.quote}”</p>
        </div>
      </div>
      <div className="card-list">
        {testimonials.map((t, i) => (
          <div
            key={t.id}
            className={`card ${i === activeIndex ? 'selected' : ''}`}
            onClick={() => setActiveIndex(i)}
          >
            <div className="initial-circle small">{t.initial}</div>
            <p className="name">{t.name}</p>
            <p className="major">{t.major}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
