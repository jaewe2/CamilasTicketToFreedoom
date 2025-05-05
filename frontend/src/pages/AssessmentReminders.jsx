// src/pages/AssessmentReminders.jsx

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { auth } from '../firebase';
import './AssessmentReminders.css';

function generateCalendar(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks = [];
  let day = 1 - firstDay;
  while (day <= daysInMonth) {
    const week = [];
    for (let i = 0; i < 7; i++, day++) {
      week.push(day > 0 && day <= daysInMonth ? day : null);
    }
    weeks.push(week);
  }
  return weeks;
}


function getTimeRemaining(dueDate) {
  const total = Date.parse(dueDate) - Date.now();
  if (total <= 0) return 'Time is up';

  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((total / (1000 * 60)) % 60);
  const seconds = Math.floor((total / 1000) % 60);

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

const AssessmentReminders = () => {
  const today = new Date();
  const [current, setCurrent] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [reminders, setReminders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ id: null, title: '', course: '', due_date: '', notes: '' });
  const [openNoteId, setOpenNoteId] = useState(null);
  const isMounted = useRef(false);

  const getAuthHeaders = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not signed in');
    const token = await user.getIdToken();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };
  const [countdowns, setCountdowns] = useState({});

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdowns(() =>
        reminders.reduce((acc, r) => {
          if (r.due_date) {
            acc[r.id] = getTimeRemaining(r.due_date);
          }
          return acc;
        }, {})
      );
    }, 1000);
  
    return () => clearInterval(interval);
  }, [reminders]);


  useEffect(() => {
    isMounted.current = true;
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const { data } = await axios.get('/api/reminders/', { headers });
        if (isMounted.current) setReminders(data);
      } catch (e) {
        console.error('Failed to load reminders', e);
      }
    })();
    return () => { isMounted.current = false; };
  }, []);

  const prevMonth = () => setCurrent(c => {
    const m = c.month - 1;
    return m < 0
      ? { year: c.year - 1, month: 11 }
      : { year: c.year, month: m };
  });

  const nextMonth = () => setCurrent(c => {
    const m = c.month + 1;
    return m > 11
      ? { year: c.year + 1, month: 0 }
      : { year: c.year, month: m };
  });

  const openAdd = () => {
    setForm({ id: null, title: '', course: '', due_date: '', notes: '' });
    setShowForm(true);
  };

  const openEdit = r => {
    setForm({
      id: r.id,
      title: r.title,
      course: r.course,
      due_date: r.due_date?.split('T')[0] || '',
      notes: r.notes,
    });
    setShowForm(true);
  };

  const del = async id => {
    try {
      const headers = await getAuthHeaders();
      await axios.post(`/api/reminders/${id}/soft-delete/`, null, { headers });
      setReminders(rs => rs.filter(r => r.id !== id));
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  const markComplete = async id => {
    try {
      const headers = await getAuthHeaders();
      await axios.post(`/api/reminders/${id}/mark-complete/`, null, { headers });
      setReminders(rs =>
        rs.map(r => (r.id === id ? { ...r, status: 'COMPLETED' } : r))
      );
    } catch (e) {
      console.error('Mark complete failed', e);
    }
  };

  const save = async () => {
    try {
      const headers = await getAuthHeaders();
      const formattedForm = {
        ...form,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
      };

      let res;
      if (form.id == null) {
        res = await axios.post('/api/reminders/', formattedForm, { headers });
        setReminders(rs => [...rs, res.data]);
      } else {
        res = await axios.put(`/api/reminders/${form.id}/`, formattedForm, { headers });
        setReminders(rs => rs.map(r => (r.id === form.id ? res.data : r)));
      }
      setShowForm(false);
    } catch (e) {
      console.error('Save failed', e.response?.data || e);
    }
  };

  const onChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const weeks = generateCalendar(current.year, current.month);

  return (
    <div className="reminders-page">
      <header className="reminders-header">
        <button onClick={prevMonth}>&lt;</button>
        <h2>
          {new Date(current.year, current.month)
            .toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={nextMonth}>&gt;</button>
        <button className="add-btn" onClick={openAdd}>
          <FaPlus /> Add Reminder
        </button>
      </header>

      <div className="reminders-container">
        <div className="calendar-section">
          <div className="calendar">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="day-header">{d}</div>
            ))}

            {weeks.map((week, wi) =>
              week.map((day, di) => {
                const dateStr = day
                  ? `${current.year}-${String(current.month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                  : null;
                const dayRems = dateStr ? reminders.filter(r => r.due_date?.startsWith(dateStr)) : [];
                return (
                  <div key={`${wi}-${di}`} className="cell">
                    {day && <div className="cell-number">{day}</div>}
                    {dayRems.map(r => (
                      <div
                        key={r.id}
                        className={`reminder ${r.status === 'COMPLETED' ? 'done' : ''}`}
                        onClick={() => setOpenNoteId(openNoteId === r.id ? null : r.id)}
                      >
                        <strong>{r.title}</strong><br/>
                        <small>{r.course}</small>
                        <div className="r-actions" onClick={e => e.stopPropagation()}>
                          {r.status !== 'COMPLETED' && (
                            <button onClick={() => markComplete(r.id)} title="Mark as complete">✔️</button>
                          )}
                          <FaEdit onClick={() => openEdit(r)} />
                          <FaTrash onClick={() => del(r.id)} />
                        </div>

                        {openNoteId === r.id && (
                          <div className="notes-popover">
                            <button
                              className="close-popover"
                              onClick={e => { e.stopPropagation(); setOpenNoteId(null); }}
                            >×</button>
                            <p>{r.notes || 'No extra notes'}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="countdown-panel">
          <h3>Next Assignment</h3>
          {reminders.length > 0 ? (
            (() => {
              const upcoming = reminders
                .filter(r => r.due_date && new Date(r.due_date) > new Date())
                .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
              const next = upcoming[0];
              return next ? (
                <div className="countdown-box">
                  <strong>{next.title}</strong>
                  <p>{next.course}</p>
                  <p>{countdowns[next.id] || 'Calculating...'}</p>
                </div>
              ) : <p>No upcoming assignments</p>;
            })()
          ) : (
            <p>No reminders</p>
          )}
        </div>
      </div>

      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <h3>{form.id == null ? 'Add' : 'Edit'} Reminder</h3>
            <label>Title</label>
            <input name="title" value={form.title} onChange={onChange} />
            <label>Course</label>
            <input name="course" value={form.course} onChange={onChange} />
            <label>Due Date</label>
            <input type="date" name="due_date" value={form.due_date} onChange={onChange} />
            <label>Notes</label>
            <textarea name="notes" value={form.notes} onChange={onChange} rows={3} />
            <div className="form-buttons">
              <button className="save-btn" onClick={save}>Save</button>
              <button className="cancel-btn" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentReminders;

