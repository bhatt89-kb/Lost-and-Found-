import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowLeftIcon, TrashIcon, UsersIcon } from './Icons';
import { statusMeta } from './PostCard';
import { timeAgo, splitLocation, toneFor } from '../utils/time';

// Slide-over detail view — modelled on the Figma "Task Details" screen:
// Back pill, big title, property table with tags, description text.
export default function PostDetail({ post, onClose, onClaim, onManage, onDelete, onReport }) {
  const { user } = useAuth();

  useEffect(() => {
    if (!post) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [post, onClose]);

  if (!post) return null;

  const isOwner = user?.studentId === post.finder_id;
  const { building, floor } = splitLocation(post.location_found);
  const status = statusMeta(post.status);

  return (
    <div className="overlay right" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={`${post.category} details`}>
        <div className="drawer-top">
          <button type="button" className="back-btn" onClick={onClose}>
            <ArrowLeftIcon size={16} /> Back
          </button>
          <span className="muted-text">Posted {timeAgo(post.createdAt) || 'recently'}</span>
        </div>

        <h2 className="drawer-title">{post.category || 'Item'} found</h2>

        {post.image_url && <img className="drawer-img" src={post.image_url} alt={`${post.category || 'Found item'} photo`} />}

        <div className="props">
          <div className="prop"><span>Type</span><span><span className={`tag ${toneFor(post.category)}`}>{post.category || 'Other'}</span></span></div>
          <div className="prop"><span>Status</span><span><span className={`tag ${status.tone}`}>{status.label}</span></span></div>
          <div className="prop"><span>Building</span><span>{building}</span></div>
          {floor && <div className="prop"><span>Area</span><span>{floor}</span></div>}
          <div className="prop"><span>Found by</span><span>{post.finder_id || 'Anonymous'}</span></div>
        </div>

        {post.description && (
          <div className="drawer-section">
            <h3>Description</h3>
            <p>{post.description}</p>
          </div>
        )}

        <div className="drawer-section">
          <h3>Verification question</h3>
          <p className="drawer-quote">“{post.verification_question || 'No question provided'}”</p>
          {!isOwner && (
            <p className="muted-text">Answer this correctly in a claim to prove the item is yours.</p>
          )}
        </div>

        <div className="drawer-actions">
          {isOwner ? (
            <>
              <button type="button" className="btn btn-secondary" onClick={() => onManage(post)}>
                <UsersIcon size={16} /> Review claims
              </button>
              <button type="button" className="btn btn-danger" onClick={() => onDelete(post)}>
                <TrashIcon size={16} /> Delete
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-primary" onClick={() => onClaim(post)}>Submit claim</button>
              {onReport && (
                <button type="button" className="btn btn-secondary" onClick={() => onReport(post)}>
                  Report
                </button>
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}