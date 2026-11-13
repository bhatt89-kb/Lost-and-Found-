import React, { useState, useEffect } from 'react';
import { fetchClaimsByPost, resolveHandover } from '../services/api';
import { CloseIcon } from './Icons';
import toast from 'react-hot-toast';

const DROPOFFS = ['Main Security Desk', 'Library Front Desk', 'Student Union Office', 'Hostel Warden Office'];

export default function PendingClaimsModal({ isOpen, post, onClose, onHandoverComplete }) {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropoffLocation, setDropoffLocation] = useState(DROPOFFS[0]);

  useEffect(() => {
    if (isOpen && post) {
      loadClaims();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, post]);

  const loadClaims = async () => {
    setLoading(true);
    try {
      const { data } = await fetchClaimsByPost(post._id);
      setClaims(data);
    } catch (error) {
      toast.error('Error fetching incoming proof attempts.');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (claimId, isVerified) => {
    try {
      // Send the selected drop-off location to the backend if verified
      await resolveHandover({
        claim_id: claimId,
        is_verified: isVerified,
        dropoff_location: isVerified ? dropoffLocation : null,
      });

      if (isVerified) {
        toast.success(`Handover verified! Please drop item at: ${dropoffLocation}`);
      } else {
        toast('Claim rejected. Item is active again.', { icon: 'ℹ️' });
      }
      onHandoverComplete();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Resolution failed.');
    }
  };

  if (!isOpen || !post) return null;

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="claims-title">
        <div className="modal-head">
          <div>
            <div className="modal-eyebrow">Pending verification</div>
            <h2 id="claims-title">Review claim attempts</h2>
          </div>
          <button type="button" onClick={onClose} className="btn btn-secondary btn-icon" title="Close" aria-label="Close">
            <CloseIcon size={16} />
          </button>
        </div>

        <div className="field" style={{ marginBottom: 16 }}>
          <label className="label" htmlFor="dropoff">If verified, choose a drop-off point</label>
          <select id="dropoff" className="select plain" value={dropoffLocation} onChange={(e) => setDropoffLocation(e.target.value)}>
            {DROPOFFS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {loading ? (
          <p className="muted-text" style={{ textAlign: 'center', padding: 20 }}>Fetching submitted proofs…</p>
        ) : claims.length === 0 ? (
          <p className="muted-text" style={{ textAlign: 'center', padding: 20 }}>No active claim submissions for this item.</p>
        ) : (
          <div className="claim-list">
            {claims.map((claim) => (
              <div className="claim" key={claim._id}>
                <div className="row-line">Claimant <span>{claim.claimant_id}</span></div>
                <div className="answer"><strong>Response:</strong> “{claim.verification_answer}”</div>
                <div className="claim-actions">
                  <button type="button" onClick={() => handleResolve(claim._id, true)} className="btn btn-success btn-sm">Verify & set drop-off</button>
                  <button type="button" onClick={() => handleResolve(claim._id, false)} className="btn btn-danger btn-sm">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary">Close</button>
        </div>
      </div>
    </div>
  );
}
