import React, { useState, useEffect } from 'react';
import { createPost } from '../services/api';
import { campusHierarchy } from '../data/campusData';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function CreatePostModal({ isOpen, onClose, onPostCreated }) {
  const { user } = useAuth();
  const [finderId, setFinderId] = useState(user?.studentId || '');
  const [selectedBuilding, setSelectedBuilding] = useState(Object.keys(campusHierarchy)[0]);
  const [selectedFloor, setSelectedFloor] = useState(campusHierarchy[Object.keys(campusHierarchy)[0]][0]);
  const [category, setCategory] = useState('Electronics');
  const [description, setDescription] = useState('');
  const [verificationQuestion, setVerificationQuestion] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Auto-sync Student ID whenever the logged-in session updates or modal opens
  useEffect(() => {
    if (user?.studentId) {
      setFinderId(user.studentId);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleBuildingChange = (e) => {
    const building = e.target.value;
    setSelectedBuilding(building);
    setSelectedFloor(campusHierarchy[building][0]); // Auto-select first floor of selected building
  };

  const resetForm = () => {
    setDescription('');
    setVerificationQuestion('');
    setImageFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      toast.error('Please upload a photo of the item.');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('finder_id', finderId);
      data.append('location_found', `${selectedBuilding} - ${selectedFloor}`);
      data.append('category', category);
      data.append('description', description.trim());
      data.append('verification_question', verificationQuestion);
      data.append('image', imageFile);

      await createPost(data);
      toast.success('Lost item reported successfully!');
      resetForm();
      onPostCreated();
      onClose();
    } catch (error) {
      console.error('Failed to create post:', error);
      toast.error(error.response?.data?.error || 'Error reporting item.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="overlay">
      <div className="modal">
        <div className="modal-head">
          <div>
            <div className="modal-eyebrow">New Recovery Report</div>
            <h2>Report Found Item</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-icon"
            title="Close"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <div className="field">
            <label className="label" htmlFor="finderId">Your Student ID</label>
            <input
              id="finderId"
              type="text"
              required
              value={finderId}
              onChange={(e) => setFinderId(e.target.value)}
              placeholder="e.g. student_101"
              className="input plain"
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="building">Building Location</label>
            <select
              id="building"
              value={selectedBuilding}
              onChange={handleBuildingChange}
              className="select plain"
            >
              {Object.keys(campusHierarchy).map((building) => (
                <option key={building} value={building}>{building}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label" htmlFor="floor">Floor / Specific Area</label>
            <select
              id="floor"
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="select plain"
            >
              {campusHierarchy[selectedBuilding].map((floor) => (
                <option key={floor} value={floor}>{floor}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label" htmlFor="category">Item Category</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="select plain"
            >
              <option value="Electronics">Electronics</option>
              <option value="Keys">Keys</option>
              <option value="ID Cards">ID Cards / Documents</option>
              <option value="Clothing">Clothing & Accessories</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="field">
            <label className="label" htmlFor="description">Description (optional)</label>
            <textarea
              id="description"
              rows={2}
              maxLength={200}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Black wireless earbuds in a small case"
              className="input plain"
              style={{ resize: 'vertical' }}
            />
            <span className="muted-text" style={{ fontSize: 12 }}>
              {description.length}/200 · Visible to everyone, so don’t include details only the owner would know.
            </span>
          </div>

          <div className="field">
            <label className="label" htmlFor="question">Verification Question (for item owner)</label>
            <input
              id="question"
              type="text"
              required
              maxLength={200}
              value={verificationQuestion}
              onChange={(e) => setVerificationQuestion(e.target.value)}
              placeholder="e.g. What color is the phone cover?"
              className="input plain"
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="image">Upload Photo</label>
            <input
              id="image"
              type="file"
              accept="image/*"
              required
              onChange={(e) => setImageFile(e.target.files[0])}
              className="file-input"
            />
          </div>

          <div className="note">
            <b>Privacy Notice</b>
            <p>All submissions are cryptographically hashed and stored with zero-knowledge protocols. Personal identifiers are masked.</p>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn btn-success">
              {submitting ? 'Submitting...' : 'Submit Report'}
              {!submitting && (
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}