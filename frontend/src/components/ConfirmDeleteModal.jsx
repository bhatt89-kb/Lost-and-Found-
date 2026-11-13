import React, { useEffect, useState } from 'react';
import { TrashIcon } from './Icons';

// Delete confirmation — modelled on the Figma "Modal" frame
// (white card, gray body copy, divider, white Cancel + red Delete button).
export default function ConfirmDeleteModal({ isOpen, title = 'Delete post?', body, confirmLabel = 'Delete post', onCancel, onConfirm }) {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && !busy && onCancel();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, busy, onCancel]);

  if (!isOpen) return null;

  const confirm = async () => {
    setBusy(true);
    try { await onConfirm(); } finally { setBusy(false); }
  };

  return (
    <div className="overlay" style={{ zIndex: 1100 }} onMouseDown={(e) => e.target === e.currentTarget && !busy && onCancel()}>
      <div className="modal confirm" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title">{title}</h2>
        <p className="modal-text">
          {body || 'You will be unable to recover this post once it is deleted.'}
        </p>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy} autoFocus>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={confirm} disabled={busy}>
            <TrashIcon size={16} /> {busy ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
