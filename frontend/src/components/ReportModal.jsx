import React, { useState } from 'react';
import { reportPost } from '../services/api';
import toast from 'react-hot-toast';

const REASONS = [
  { value: 'spam', label: 'Spam or fake post' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'misleading', label: 'Misleading or wrong info' },
  { value: 'other', label: 'Something else' },
];

export default function ReportModal({ isOpen, post, onClose }) {
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !post) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await reportPost(post._id, { reason, details: details.trim() });
      toast.success('Thanks. A moderator will review this post.');
      setDetails('');
      setReason('spam');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="overlay">
      <div className="modal">
        <div className="modal-head">
          <div>
            <div className="modal-eyebrow">Moderation</div>
            <h2>Report this post</h2>
          </div>
          <button type="button" onClick={onClose} className="btn btn-secondary btn-icon" title="Close">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <div className="field">
            <label className="label" htmlFor="reason">Reason</label>
            <select id="reason" value={reason} onChange={(e) => setReason(e.target.value)} className="select plain">
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label" htmlFor="report-details">Details (optional)</label>
            <textarea
              id="report-details"
              rows={3}
              maxLength={200}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Anything that helps a moderator review this"
              className="input plain"
              style={{ resize: 'vertical' }}
            />
            <span className="muted-text" style={{ fontSize: 12 }}>{details.length}/200</span>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn btn-danger">
              {submitting ? 'Sending…' : 'Submit report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}