import React from 'react';
import { Link } from 'react-router-dom';
import { FaUsers, FaComments, FaFileAlt, FaChalkboardTeacher, FaCalendarAlt, FaExclamationCircle } from 'react-icons/fa';
import './Features.css';

const features = [
  {
    icon: <FaUsers />,
    title: "Peer-to-Peer Learning",
    description: "Connect with fellow students for collaborative learning experiences and knowledge sharing.",
    link: "/peer-learning",
  },
  {
    icon: <FaComments />,
    title: "Chat Support Globally",
    description: "Connect with peers and mentors worldwide through real-time chat support for academic and personal growth.",
    link: "/chat-support",
  },
  {
    icon: <FaFileAlt />,
    title: "Resource Sharing",
    description: "Exchange notes, study materials, and resources to enhance your learning experience.",
    link: "/resource-sharing",
  },
  {
    icon: <FaChalkboardTeacher />,
    title: "AI Summerizer",
    description: "Have the most important parts of a syllabus shown to you.",
    link: "/ai-summarizer",
  },
  {
    icon: <FaCalendarAlt />,
    title: "Event Planning",
    description: "Organize and participate in student-led events, workshops, and study sessions.",
    link: "/event-planning",
  },
  {
    icon: <FaExclamationCircle />,
    title: "Assessment Reminder",
    description: "Stay on top of your assignments and exams with timely reminders and notifications.",
    link: "/assessment-reminder",
  },
];

const Features = () => {
  return (
    <div className="features-container">
      <h1 className="features-title">
        Everything you need to <span>succeed together</span>
      </h1>
      <div className="features-grid">
        {features.map((feature, index) => (
          <Link to={feature.link} key={index} className="feature-card">
            <div className="feature-icon">{feature.icon}</div>
            <div className="feature-title">{feature.title}</div>
            <div className="feature-description">{feature.description}</div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Features;
