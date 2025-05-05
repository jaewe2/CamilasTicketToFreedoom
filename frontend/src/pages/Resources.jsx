// src/pages/ResourceSharing.jsx
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { auth } from '../firebase'
import './Resources.css'

export default function ResourceSharing() {
  const [resources, setResources] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', file: null })

  const getAuthHeaders = async () => {
    const user = auth.currentUser
    if (!user) throw new Error('Not signed in')
    const token = await user.getIdToken()
    return { Authorization: `Bearer ${token}` }
  }

  useEffect(() => {
    ;(async () => {
      try {
        const headers = await getAuthHeaders()
        const { data } = await axios.get('/api/resources/', { headers })
        setResources(data)
      } catch (e) {
        console.error('Failed loading resources', e)
      }
    })()
  }, [])

  const onChange = e => {
    const { name, value, files } = e.target
    if (name === 'file') {
      setForm(f => ({ ...f, file: files[0] }))
    } else {
      setForm(f => ({ ...f, [name]: value }))
    }
  }

  const save = async () => {
    try {
      const headers = await getAuthHeaders()
      const payload = new FormData()
      payload.append('title', form.title)
      payload.append('description', form.description)
      payload.append('file', form.file)

      const { data } = await axios.post('/api/resources/', payload, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data'
        }
      })
      setResources(r => [data, ...r])
      setShowForm(false)
      setForm({ title: '', description: '', file: null })
    } catch (e) {
      console.error('Save failed', e.response?.data || e)
    }
  }

  const del = async id => {
    try {
      const headers = await getAuthHeaders()
      await axios.delete(`/api/resources/${id}/`, { headers })
      setResources(r => r.filter(x => x.id !== id))
    } catch (e) {
      console.error('Delete failed', e)
    }
  }

  const handleDelete = id => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      del(id)
    }
  }

  const download = async url => {
    try {
      const headers = await getAuthHeaders()
      const response = await axios.get(url, { headers, responseType: 'blob' })
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = blobUrl
      const filename = url.split('/').pop().split('?')[0]
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(blobUrl)
    } catch (e) {
      console.error('Download failed', e)
    }
  }

  return (
    <div className="resources-container">
      <h1 className="resources-title">
        Exchange <span>Resources</span>
      </h1>
      <div style={{ textAlign: 'center', margin: '1rem 0' }}>
        <button className="resources-add-btn" onClick={() => setShowForm(true)}>
          Add Resource
        </button>
      </div>

      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add Resource</h3>
            <label>Title</label>
            <input name="title" value={form.title} onChange={onChange} />
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={onChange} rows={3} />
            <label>File</label>
            <input type="file" name="file" onChange={onChange} />
            <div className="form-buttons">
              <button className="save-btn" onClick={save}>Save</button>
              <button className="cancel-btn" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="resources-grid">
        {resources.map(res => (
          <div key={res.id} className="resources-card">
            <div className="resources-card-header">
              <div className="resources-avatar">{res.title[0].toUpperCase()}</div>
              <h3>{res.title}</h3>
            </div>
            <p>{res.description}</p>
            <div className="resources-btn-group">
              {res.file_url ? (
                <button
                  className="resources-download-btn"
                  onClick={() => download(res.file_url)}
                >
                  Download
                </button>
              ) : (
                <button className="resources-download-btn" disabled>
                  No File
                </button>
              )}
              <button
                className="resources-delete-btn"
                onClick={() => handleDelete(res.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
