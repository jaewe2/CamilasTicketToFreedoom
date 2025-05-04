// src/pages/Features.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaUsers,
  FaComments,
  FaFileAlt,
  FaChalkboardTeacher,
  FaCalendarAlt,
  FaExclamationCircle
} from 'react-icons/fa';

import './Features.css';

const features = [
  {
    icon: <FaUsers />,
    title: "Peer-to-Peer Learning",
    description: "Connect with fellow students for collaborative learning experiences and knowledge sharing.",
  },
  {
    icon: <FaComments />,
    title: "Chat Support Globally",
    description: "Connect with peers and mentors worldwide through real-time chat support for academic and personal growth.",
  },
  {
    icon: <FaFileAlt />,
    title: "Resource Sharing",
    description: "Exchange notes, study materials, and resources to enhance your learning experience.",
  },
  {
    icon: <FaChalkboardTeacher />,
    title: "Mentorship",
    description: "Connect with experienced students for guidance, advice, and academic support.",
  },
  {
    icon: <FaCalendarAlt />,
    title: "Event Planning",
    description: "Organize and participate in student-led events, workshops, and study sessions.",
  },
  {
    icon: <FaExclamationCircle />,
    title: "Assessment Reminder",
    description: "Stay on top of your assignments and exams with timely reminders and notifications.",
    path: "/reminders",  // ← new path
  },
];

const Features = () => {
  return (
    <div className="features-container">
      <h1 className="features-title">
        Everything you need to <span>succeed together</span>
      </h1>
      <div className="features-grid">
        {features.map((feature, idx) => {
          const card = (
            <div className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <div className="feature-title">{feature.title}</div>
              <div className="feature-description">{feature.description}</div>
            </div>
          );

          // If this feature has a `path`, wrap in a Link
          return feature.path ? (
            <Link to={feature.path} className="feature-link" key={idx}>
              {card}
            </Link>
          ) : (
            <React.Fragment key={idx}>{card}</React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default Features;
