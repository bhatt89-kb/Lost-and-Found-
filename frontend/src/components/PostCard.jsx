import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ClockIcon, CheckIcon, TrashIcon, UsersIcon } from './Icons';
import { timeAgo, splitLocation, toneFor } from '../utils/time';

const STATUS = {
  active: { label: 'Active', tone: 'green' },
  claim_pending: { label: 'Claim pending', tone: 'blue' },
  resolved: { label: 'Resolved', tone: 'gray' },
};

export function statusMeta(status) {
  return STATUS[status] || STATUS.active;
}

// One row of the item list — modelled on the Figma "Checklist" row:
// status box · text with a highlighted entity · inline tags · time pill.
export default function PostCard({ post, onOpen, onClaimClick, onManageClick, onDeleteClick }) {
  const { user } = useAuth();
  if (!post) return null;

  const isOwner = user?.studentId === post.finder_id;
  const { building, floor } = splitLocation(post.location_found);
  const status = statusMeta(post.status);
  const stop = (fn) => (e) => { e.stopPropagation(); fn(post); };

  return (
    <div
      className="row"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(post)}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onOpen(post);
        }
      }}
      aria-label={`${post.category || 'Item'} found at ${building}. Open details`}
    >
      <span className={`row-box ${post.status === 'resolved' ? 'done' : post.status === 'claim_pending' ? 'pending' : ''}`}>
        {post.status === 'resolved' && <CheckIcon size={14} />}
      </span>

      {post.image_url && <img className="row-thumb" src={post.image_url} alt="" loading="lazy" />}

      <div className="row-main">
        <div className="row-title">
          {post.category || 'Item'} found at <em>{building}</em>
        </div>
        {post.description && (
          <div
            className="row-sub"
            style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 420 }}
          >
            {post.description}
          </div>
        )}
        <div className="row-tags">
          <span className={`tag ${toneFor(post.category)}`}>{post.category || 'Other'}</span>
          <span className={`tag ${status.tone}`}>{status.label}</span>
          {floor && <span className="row-sub">{floor}</span>}
        </div>
      </div>

      <div className="row-end">
        <span className="chip hide-sm">
          <ClockIcon size={15} />
          {timeAgo(post.createdAt) || 'recently'}
        </span>
        <div className="row-actions">
          {isOwner ? (
            <>
              <button type="button" className="btn btn-secondary btn-sm btn-icon" onClick={stop(onManageClick)} title="Review claims" aria-label="Review claims">
                <UsersIcon size={16} />
              </button>
              <button type="button" className="btn btn-secondary btn-sm btn-icon" onClick={stop(onDeleteClick)} title="Delete post" aria-label="Delete post" style={{ color: 'var(--danger)' }}>
                <TrashIcon size={16} />
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-primary btn-sm" onClick={stop(onClaimClick)}>
              Claim
            </button>
          )}
        </div>
      </div>
    </div>
  );
}