import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { auth } from '../firebase';
import { FaTrash, FaSearch } from 'react-icons/fa';
import './ChatInbox.css';

export default function ChatInbox({ token, currentUser }) {
  // Search & selection state
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [selectedUsername, setSelectedUsername] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);

  // Chat state
  const [recipientInfo, setRecipientInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [theirTyping, setTheirTyping] = useState(false);

  // Inbox threads
  const [conversations, setConversations] = useState({});
  const [replyText, setReplyText] = useState('');

  // Refs for typing/websocket/scroll
  const isTyping = useRef(false);
  const typingTimeoutRef = useRef();
  const wsRef = useRef();
  const messagesEndRef = useRef();

  // Error state
  const [error, setError] = useState(null);

  // WebSocket: typing & new‐message events
  useEffect(() => {
    if (!selectedUsername) return;
    const ws = new WebSocket('wss://your-server.com/ws/chat/');
    wsRef.current = ws;
    ws.onmessage = e => {
      const d = JSON.parse(e.data);
      if (d.type === 'typing' && d.from === selectedUsername) {
        setTheirTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setTheirTyping(false);
        }, 2000);
      }
      if (d.type === 'new_message' && d.from === selectedUsername) {
        loadChatByEmail(selectedEmail);
      }
    };
    return () => {
      clearTimeout(typingTimeoutRef.current);
      ws.close();
    };
  }, [selectedUsername, selectedEmail]);

  // Initial load: users + inbox
  useEffect(() => {
    loadUsers();
    fetchInbox();
    const iv = setInterval(() => {
      if (!isTyping.current) fetchInbox();
    }, 30000);
    return () => clearInterval(iv);
  }, [token]);

  // Auto‐scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedThread, conversations]);

  // Fetch users
  const loadUsers = async () => {
    try {
      const res = await axios.get('/api/users/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      handleError(err, 'Failed to load users.');
    }
  };

  // Fetch inbox threads
  const fetchInbox = async () => {
    try {
      const tok = await auth.currentUser.getIdToken();
      const res = await fetch('/api/messages/inbox/', {
        headers: { Authorization: `Bearer ${tok}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const grouped = {};
      data.forEach(m => {
        if (m.listing == null) return;
        const lid = m.listing;
        if (!grouped[lid]) grouped[lid] = { title: m.listing_title, messages: [] };
        grouped[lid].messages.push({
          ...m,
          isOwn: m.sender_username === currentUser
        });
      });
      setConversations(grouped);
    } catch {
      setError('Could not load inbox');
    }
  };

  // Error handler
  const handleError = (err, fallback) => {
    console.error(err);
    setError(err?.response?.status === 403
      ? 'Authentication error. Please log in again.'
      : fallback);
  };

  // 1:1 chat by email
  const loadChatByEmail = async email => {
    try {
      setSelectedThread(null);
      setSelectedEmail(email);
      const u = users.find(u => u.email === email);
      if (!u) throw new Error('User not found');
      setSelectedUsername(u.username);
      setRecipientInfo(u);
      const res = await axios.get('/api/messages/', {
        params: { recipient: u.username },
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
      setTheirTyping(false);
    } catch (err) {
      handleError(err, 'Failed to load conversation.');
    }
  };

  // Send message
  const handleSend = async () => {
    if (!input.trim()) return;
    try {
      const res = await axios.post('/api/messages/', {
        recipient_username: selectedUsername,
        content: input
      }, { headers: { Authorization: `Bearer ${token}` }});
      setMessages(prev => [...prev, res.data]);
      setInput('');
      wsRef.current?.send(JSON.stringify({ type: 'new_message', to: selectedUsername }));
    } catch (err) {
      handleError(err, 'Failed to send message.');
    }
  };

  // Typing notify
  const handleInputChange = e => {
    setInput(e.target.value);
    isTyping.current = true;
    wsRef.current?.send(JSON.stringify({ type: 'typing', to: selectedUsername }));
  };

  // Delete single message
  const deleteMessage = async id => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await axios.delete(`/api/messages/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      handleError(err, 'Failed to delete message.');
    }
  };

  // Select thread
  const selectThread = lid => {
    setSelectedEmail(null);
    setSelectedUsername(null);
    setSelectedThread(lid);
  };

  // Delete entire thread
  const deleteThread = async lid => {
    if (!window.confirm('Delete this conversation?')) return;
    try {
      const tok = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/messages/conversation/${lid}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tok}` }
      });
      if (!res.ok) throw new Error();
      setConversations(prev => {
        const o = { ...prev };
        delete o[lid];
        return o;
      });
      setSelectedThread(null);
    } catch {
      handleError(null, 'Failed to delete conversation.');
    }
  };

  // Reply in thread
  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      const last = conversations[selectedThread].messages.slice(-1)[0];
      await axios.post(
        `/api/messages/${last.id}/reply/`,
        { content: replyText },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setReplyText('');
      fetchInbox();
    } catch {
      handleError(null, 'Reply failed.');
    }
  };

  // Filter users
  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="chat-inbox-layout">

      <aside className="sidebar">
        <h2>Users</h2>
        {error && <div className="error-alert">{error}</div>}

        <div className="search-box">
          <FaSearch className="search-icon"/>
          <input
            placeholder="Search users…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <ul>
          {filteredUsers.map(u => (
            <li key={u.id} className={u.email===selectedEmail?'active':''}>
              <button onClick={()=>loadChatByEmail(u.email)}>
                {u.first_name ? `${u.first_name} ${u.last_name}` : u.email}
              </button>
            </li>
          ))}
        </ul>

        <h2>Inbox Threads</h2>
        {Object.entries(conversations).map(([lid,{title}])=>(
          <div key={lid} className={`thread ${lid===selectedThread?'active':''}`}>
            <span onClick={()=>selectThread(lid)}>{title}</span>
            <button
              className="delete-thread-btn"
              onClick={()=>deleteThread(lid)}
              title="Delete conversation"
            ><FaTrash/></button>
          </div>
        ))}
      </aside>

      <main className="chat-container">
        {!selectedEmail && !selectedThread ? (
          <div className="chat-placeholder">
            <p>Select a user to start a conversation.</p>
          </div>
        ) : selectedEmail ? (
          <>
            <h2>Chat with {recipientInfo?.display_name||selectedEmail}</h2>
            <div className="messages">
              {messages.map(m=>(
                <div key={m.id} className={m.sender_username===currentUser?'sent':'received'}>
                  <span className="bubble-text">
                    <strong>{m.sender_display_name||m.sender_username}</strong>: {m.content}
                  </span>
                  {m.sender_username===currentUser && (
                    <button
                      className="delete-msg-btn"
                      onClick={()=>deleteMessage(m.id)}
                    ><FaTrash size="0.8em"/></button>
                  )}
                </div>
              ))}
              {theirTyping && (
                <div className="typing-indicator">
                  {recipientInfo?.display_name||selectedEmail} is typing…
                </div>
              )}
              <div ref={messagesEndRef}/>
            </div>
            <div className="input-row">
              <input
                value={input}
                onChange={handleInputChange}
                onKeyPress={e=>e.key==='Enter'&&handleSend()}
                placeholder="Type a message…"
              />
              <button onClick={handleSend} disabled={!input.trim()}>
                Send
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="chat-header-with-delete">
              <h2>Thread: {conversations[selectedThread].title}</h2>
              <button
                className="delete-thread-btn"
                onClick={()=>deleteThread(selectedThread)}
              ><FaTrash/></button>
            </div>
            <div className="messages">
              {conversations[selectedThread].messages.map(m=>(
                <div key={m.id} className={m.isOwn?'sent':'received'}>
                  <strong>{m.isOwn?'You':m.sender}</strong>: {m.content}
                </div>
              ))}
              <div ref={messagesEndRef}/>
            </div>
            <div className="input-row">
              <input
                value={replyText}
                onChange={e=>setReplyText(e.target.value)}
                placeholder="Type your reply…"
              />
              <button onClick={handleReply} disabled={!replyText.trim()}>
                Reply
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
