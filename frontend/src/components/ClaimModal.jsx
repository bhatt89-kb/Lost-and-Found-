import React, { useState, useEffect } from 'react';
import { submitClaim } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function ClaimModal({ isOpen, post, onClose, onClaimSubmitted }) {
  const { user } = useAuth();
  const [claimantId, setClaimantId] = useState(user?.studentId || '');
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.studentId) {
      setClaimantId(user.studentId);
    }
  }, [user, isOpen]);

  if (!isOpen || !post) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitClaim({
        post_id: post._id,
        claimant_id: claimantId,
        verification_answer: answer
      });
      toast.success('Claim submitted! The finder has been notified.');
      onClaimSubmitted();
      onClose();
    } catch (error) {
      console.error('Failed to submit claim:', error);
      toast.error(error.response?.data?.error || 'Error submitting claim.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="overlay">
      <div className="modal">
        <div className="modal-head">
          <div>
            <div className="modal-eyebrow">Zero-Knowledge Claim</div>
            <h2>Submit Ownership Proof</h2>
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

        <div className="note" style={{ marginBottom: '16px' }}>
          <b>Item Location</b>
          <p>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}>
              <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {post.location_found}
          </p>
        </div>

        <div className="challenge" style={{ marginBottom: '20px' }}>
          <b>Verification Challenge</b>
          <p>"{post.verification_question}"</p>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <div className="field">
            <label className="label" htmlFor="claimantId">Your Student ID</label>
            <input
              id="claimantId"
              type="text"
              required
              value={claimantId}
              onChange={(e) => setClaimantId(e.target.value)}
              placeholder="e.g. student_202"
              className="input plain"
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="answer">Your Verification Answer</label>
            <input
              id="answer"
              type="text"
              required
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Provide proof of ownership..."
              className="input plain"
            />
          </div>

          <div className="note">
            <b>Privacy Notice</b>
            <p>Your answer will be cryptographically submitted to the finder. If verified, handover coordinates will be shared via secure channel.</p>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Submitting...' : 'Submit Claim'}
              {!submitting && (
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}