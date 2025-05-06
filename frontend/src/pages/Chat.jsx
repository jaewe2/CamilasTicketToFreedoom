import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Chat = ({ token, currentUser }) => {
  const { recipient } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [users, setUsers] = useState([]);
  const [recipientInfo, setRecipientInfo] = useState(null);
  const [error, setError] = useState(null);

  // Load users if no recipient selected
  useEffect(() => {
    if (!recipient) {
      // Fixed API path to match backend URL configuration
      axios.get('/api/users/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        setUsers(res.data);
        setError(null);
      })
      .catch(err => {
        console.error('Failed to load users:', err);
        if (err.response && err.response.status === 403) {
          setError('Authentication error. Please log in again.');
        } else {
          setError('Failed to load users. Please try again later.');
        }
      });
    }
  }, [recipient, token]);

  // Load messages if a recipient is selected
  useEffect(() => {
    if (recipient) {
      // Fixed API path to match backend URL configuration
      axios.get(`/api/users/${recipient}/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        setRecipientInfo(res.data);
        setError(null);
        
        // Also load messages for this recipient
        return axios.get(`/api/messages/`, {
          params: { recipient: recipient },
          headers: { Authorization: `Bearer ${token}` }
        });
      })
      .then(res => {
        if (res && res.data) {
          setMessages(res.data);
        }
      })
      .catch(err => {
        console.error('Failed to load recipient info or messages:', err);
        if (err.response && err.response.status === 403) {
          setError('Authentication error. Please log in again.');
        } else if (err.response && err.response.status === 404) {
          setError(`User "${recipient}" not found.`);
        } else {
          setError('Failed to load conversation. Please try again later.');
        }
      });
    }
  }, [recipient, token]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    setError(null);
  
    try {
      // Fixed API path to match backend URL configuration
      const res = await axios.post('/api/messages/', {
        recipient_username: recipient,
        content: input,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      setMessages([...messages, res.data]);
      setInput('');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        setError('Authentication error. Please log in again.');
      } else if (err.response && err.response.status === 400) {
        setError(err.response.data.recipient_username || 'Invalid recipient username.');
      } else if (err.response && err.response.data) {
        setError(`Error: ${JSON.stringify(err.response.data)}`);
        console.error("Backend responded with:", err.response.data);
        console.error("Status:", err.response.status);
      } else {
        setError('Failed to send message. Please try again later.');
        console.error("Failed to send message:", err);
      }
    }
  };

  // Display error message if there is one
  const renderError = () => {
    if (!error) return null;
    
    return (
      <div style={{ 
        padding: '0.5rem 1rem', 
        backgroundColor: '#ffebee', 
        color: '#c62828', 
        borderRadius: '4px',
        marginBottom: '1rem'
      }}>
        {error}
      </div>
    );
  };

  // Render user list if no recipient is selected
  if (!recipient) {
    return (
      <div style={{ padding: '1rem' }}>
        <h2>Select someone to chat with:</h2>
        {renderError()}
        <ul>
          {users.map(user => (
            <li key={user.id} style={{ marginBottom: '0.5rem' }}>
              <button onClick={() => navigate(`/chat/${user.username}`)}>
                {user.first_name && user.last_name 
                  ? `${user.first_name} ${user.last_name}` 
                  : user.company_name && user.display_as_company 
                    ? user.company_name 
                    : user.email || user.username}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Render chat UI
  return (
    <div className="chat-container" style={{ maxWidth: 600, margin: 'auto' }}>
      <h2>Chat with {recipientInfo ? recipientInfo.display_name || recipient : recipient}</h2>
      {renderError()}

      <div className="messages" style={{ height: 300, overflowY: 'scroll', border: '1px solid #ccc', padding: '1rem' }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ 
            textAlign: msg.sender_username === currentUser ? 'right' : 'left',
            marginBottom: '0.5rem',
            padding: '0.5rem',
            backgroundColor: msg.sender_username === currentUser ? '#e3f2fd' : '#f5f5f5',
            borderRadius: '8px'
          }}>
            <strong>
              {msg.sender_first_name && msg.sender_last_name 
                ? `${msg.sender_first_name} ${msg.sender_last_name}` 
                : msg.sender_company_name && msg.sender_display_as_company 
                  ? msg.sender_company_name 
                  : msg.sender_email || msg.sender_username}
            </strong>: {msg.content}
          </div>
        ))}
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#757575', marginTop: '2rem' }}>
            No messages yet. Start the conversation!
          </div>
        )}
      </div>

      <div style={{ marginTop: '1rem' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          style={{ width: '80%', padding: '0.5rem' }}
        />
        <button 
          onClick={handleSend} 
          style={{ padding: '0.5rem', marginLeft: '0.5rem' }}
          disabled={!input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;