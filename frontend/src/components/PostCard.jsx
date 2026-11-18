import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ClockIcon, CheckIcon, TrashIcon, UsersIcon } from './Icons';
import { timeAgo, splitLocation, toneFor } from '../utils/time';

const STATUS = {
  active: { label: 'Active', tone: 'green' },
  claim_pending: { label: 'Claim pending', tone: 'blue' },
  resolved: { label: 'Resolved', tone: 'gray' },
};

const CUSTODY = {
  with_finder: 'With the finder',
  security_office: 'At Security Office',
  left_in_place: 'Left where found',
};

export function statusMeta(status) {
  return STATUS[status] || STATUS.active;
}

export function custodyLabel(custody) {
  return CUSTODY[custody] || CUSTODY.with_finder;
}

// One row of the item list: status box, object word + place, tags, time pill.
// No photo and no description are shown, only the object word.
export default function PostCard({ post, onOpen, onClaimClick, onManageClick, onDeleteClick }) {
  const { user } = useAuth();
  if (!post) return null;

  const isOwner = user?.studentId === post.finder_id;
  const { building, floor } = splitLocation(post.location_found);
  const status = statusMeta(post.status);
  const objectWord = post.item_name || post.category || 'Item'; // old posts fall back to category
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
      aria-label={`${objectWord} found at ${building}. Open details`}
    >
      <span className={`row-box ${post.status === 'resolved' ? 'done' : post.status === 'claim_pending' ? 'pending' : ''}`}>
        {post.status === 'resolved' && <CheckIcon size={14} />}
      </span>

      <div className="row-main">
        <div className="row-title">
          <strong>{objectWord}</strong> found at <em>{building}</em>
        </div>
        <div className="row-tags">
          <span className={`tag ${toneFor(post.category)}`}>{post.category || 'Other'}</span>
          <span className={`tag ${status.tone}`}>{status.label}</span>
          <span className="row-sub">{custodyLabel(post.custody)}</span>
          {floor && <span className="row-sub">· {floor}</span>}
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