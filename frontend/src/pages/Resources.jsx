import React from 'react';
import './Resources.css';

const resources = [
  {
    id: 1,
    title: 'Computer Science',
    description:
      'Computer science is the study of computers, computational systems, and their applications. It encompasses theoretical and practical aspects, including algorithms, software development, and artificial intelligence.',
    initial: 'C',
  },
  {
    id: 2,
    title: 'Maths',
    description:
      "Physics is a fundamental natural science that explores matter, its motion, and related concepts like energy and force. It's a broad field that encompasses everything from the smallest particles to the largest structures.",
    initial: 'M',
  },
  {
    id: 3,
    title: 'Maths',
    description:
      "Physics is a fundamental natural science that explores matter, its motion, and related concepts like energy and force. It's a broad field that encompasses everything from the smallest particles to the largest structures.",
    initial: 'M',
  },
];

const Resources = () => {
  return (
    <div className="resources-container">
      <h1 className="resources-title">
        Everything you need to <span>succeed together</span>
      </h1>
      <div style={{ textAlign: 'center' }}>
        <button className="resources-add-btn">Add Resource</button>
      </div>
      <div className="resources-grid">
        {resources.map((resource) => (
          <div key={resource.id} className="resources-card">
            <div className="resources-card-header">
              <div className="resources-avatar">{resource.initial}</div>
              <h3>{resource.title}</h3>
            </div>
            <p>{resource.description}</p>
            <div className="resources-btn-group">
              <button className="resources-download-btn">Download</button>
              <button className="resources-delete-btn">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Resources;
