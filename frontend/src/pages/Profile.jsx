// src/pages/Profile.jsx
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Camera } from 'lucide-react';
import { auth } from '../firebase';
import './Profile.css';

const Profile = () => {
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    about: '',
    interests: '',
    graduation_date: '',
    profile_picture: null,
  });
  const [initialProfile, setInitialProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const hiddenFileInput = useRef(null);

  // Helper to get Firebase auth header
  const getAuthHeaders = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not signed in');
    const idToken = await user.getIdToken();
    return { Authorization: `Bearer ${idToken}` };
  };

  // Fetch profile once on mount
  useEffect(() => {
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const { data } = await axios.get('/api/profile/', { headers });
        setProfile(data);
        setInitialProfile(data);
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    })();
  }, []);

  const handleAvatarClick = () => hiddenFileInput.current.click();

  // Upload new avatar
  const handleFileChange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const form = new FormData();
      form.append('profile_picture', file);
      const headers = await getAuthHeaders();
      const { data } = await axios.patch('/api/profile/', form, { headers });
      setProfile(data);
      setInitialProfile(data);
    } catch (err) {
      console.error('Failed to upload avatar:', err);
    }
  };

  // Text inputs handler
  const handleChange = e => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  // Save profile edits
  const handleSave = async () => {
    try {
      const headers = await getAuthHeaders();
      const updateData = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        about: profile.about,
        interests: profile.interests,
        graduation_date: profile.graduation_date,
      };
      const { data } = await axios.patch('/api/profile/', updateData, { headers });
      setProfile(data);
      setInitialProfile(data);
      setEditMode(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  // Cancel edits & revert
  const handleCancel = () => {
    if (initialProfile) setProfile(initialProfile);
    setEditMode(false);
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1 className="welcome">Welcome back!</h1>

        <div className="profile-card">
          {/* HEADER */}
          <div className={`card-header ${editMode ? 'editing' : ''}`}>
            <div className="avatar-wrapper" onClick={handleAvatarClick}>
              {profile.profile_picture
                ? <img src={profile.profile_picture} alt="avatar" className="avatar-img" />
                : <div className="avatar-fallback" />
              }
              <div className="avatar-overlay"><Camera /></div>
              <input
                type="file"
                ref={hiddenFileInput}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            {/* Live-updating full name */}
            <div className="user-info">
              <h2 className="user-name">
                {profile.first_name}
                {profile.last_name && ` ${profile.last_name}`}
              </h2>
            </div>

            <div className="header-buttons">
              {!editMode ? (
                <button className="edit-btn" onClick={() => setEditMode(true)}>
                  Edit
                </button>
              ) : (
                <>
                  <button className="save-btn" onClick={handleSave}>Save</button>
                  <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
                </>
              )}
            </div>
          </div>

          {/* BODY */}
          <div className="card-body">
            {/* First/Last inputs appear here when editing */}
            {editMode && (
              <>
                <div className="detail">
                  <h3>First Name</h3>
                  <input
                    type="text"
                    name="first_name"
                    value={profile.first_name}
                    onChange={handleChange}
                  />
                </div>
                <div className="detail">
                  <h3>Last Name</h3>
                  <input
                    type="text"
                    name="last_name"
                    value={profile.last_name}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}

            <div className="detail">
              <h3>About</h3>
              {editMode
                ? <textarea name="about" value={profile.about} onChange={handleChange} rows={3} />
                : <p>{profile.about}</p>
              }
            </div>

            <div className="detail">
              <h3>Interests</h3>
              {editMode
                ? <input type="text" name="interests" value={profile.interests} onChange={handleChange} />
                : <p>{profile.interests}</p>
              }
            </div>

            <div className="detail">
              <h3>Graduation Date</h3>
              {editMode
                ? <input type="date" name="graduation_date" value={profile.graduation_date} onChange={handleChange} />
                : <p>{profile.graduation_date}</p>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
