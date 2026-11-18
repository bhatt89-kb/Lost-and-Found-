import React, { useState } from 'react';
import { createPost } from '../services/api';
import { campusHierarchy } from '../data/campusData';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Example questions shown as the placeholder, so finders ask something only the owner can answer
const QUESTION_HINTS = {
  Electronics: 'e.g. What is the wallpaper / lock-screen on it?',
  Keys: 'e.g. What keychain or tag is attached?',
  'ID Cards': 'e.g. Which course or year is printed on it?',
  Clothing: 'e.g. What brand or size is the tag?',
  Other: 'e.g. What is written or stuck on it?',
};

const CUSTODY_OPTIONS = [
  { value: 'with_finder', label: 'I have it with me' },
  { value: 'security_office', label: 'Handed to Security Office' },
  { value: 'left_in_place', label: 'Left where I found it' },
];

export default function CreatePostModal({ isOpen, onClose, onPostCreated }) {
  const { user } = useAuth();
  const [selectedBuilding, setSelectedBuilding] = useState(Object.keys(campusHierarchy)[0]);
  const [selectedFloor, setSelectedFloor] = useState(campusHierarchy[Object.keys(campusHierarchy)[0]][0]);
  const [category, setCategory] = useState('Electronics');
  const [itemName, setItemName] = useState('');
  const [custody, setCustody] = useState('with_finder');
  const [verificationQuestion, setVerificationQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleBuildingChange = (e) => {
    const building = e.target.value;
    setSelectedBuilding(building);
    setSelectedFloor(campusHierarchy[building][0]); // Auto-select first floor of selected building
  };

  // Only letters, numbers and "-" are allowed, so a space can never be typed (one word only)
  const handleItemNameChange = (e) => {
    setItemName(e.target.value.replace(/[^\p{L}\p{N}-]/gu, ''));
  };

  const resetForm = () => {
    setItemName('');
    setCustody('with_finder');
    setVerificationQuestion('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const word = itemName.trim();
    const question = verificationQuestion.trim();

    if (word.length < 2) {
      toast.error('Please enter the object as one word, e.g. Wallet.');
      return;
    }
    if (question.length < 8) {
      toast.error('Please write a proper verification question.');
      return;
    }
    // The question must not give the answer away
    if (question.toLowerCase().includes(word.toLowerCase())) {
      // allowed, but warn so the finder can rethink
      toast('Tip: the question should ask for a detail only the owner knows.', { icon: '💡' });
    }

    setSubmitting(true);
    try {
      await createPost({
        item_name: word,
        custody,
        location_found: `${selectedBuilding} - ${selectedFloor}`,
        category,
        verification_question: question,
      });
      toast.success('Found item reported successfully!');
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
              readOnly
              value={user?.studentId || ''}
              className="input plain"
              style={{ background: '#f7f7f7', color: '#6b6b6b', cursor: 'not-allowed' }}
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="itemName">Object (one word only)</label>
            <input
              id="itemName"
              type="text"
              required
              minLength={2}
              maxLength={20}
              autoComplete="off"
              value={itemName}
              onChange={handleItemNameChange}
              placeholder="e.g. Wallet, Earbuds, Umbrella"
              className="input plain"
            />
            <span className="muted-text" style={{ fontSize: 12 }}>
              Just the name of the object. No colour, brand or other details, so nobody can pretend to be the owner.
            </span>
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
            <label className="label" htmlFor="custody">Where is the item right now?</label>
            <select
              id="custody"
              value={custody}
              onChange={(e) => setCustody(e.target.value)}
              className="select plain"
            >
              {CUSTODY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label" htmlFor="question">Verification Question (for item owner)</label>
            <input
              id="question"
              type="text"
              required
              minLength={8}
              maxLength={200}
              value={verificationQuestion}
              onChange={(e) => setVerificationQuestion(e.target.value)}
              placeholder={QUESTION_HINTS[category] || QUESTION_HINTS.Other}
              className="input plain"
            />
            <span className="muted-text" style={{ fontSize: 12 }}>
              Ask about something you can see on the item that only the real owner would know.
            </span>
          </div>

          <div className="note">
            <b>Privacy Notice</b>
            <p>Only the object word is shown publicly. The photo is not uploaded, and the answer to your question stays private until you review claims.</p>
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