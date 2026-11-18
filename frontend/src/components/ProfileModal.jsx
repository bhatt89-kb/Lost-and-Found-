import React, { useEffect, useRef, useState } from 'react';
import { fetchMe, updateProfile, uploadAvatar, removeAvatar } from '../services/api';
import toast from 'react-hot-toast';

const BRANCHES = [
  'Computer Science (CSE)',
  'Information Technology (IT)',
  'AI & Machine Learning',
  'Data Science',
  'Electronics & Communication (ECE)',
  'Electrical (EE)',
  'Mechanical (ME)',
  'Civil (CE)',
  'Management (BBA / MBA)',
  'Other',
];

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate / Other'];

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const readOnlyStyle = { background: '#f7f7f7', color: '#6b6b6b', cursor: 'not-allowed' };

export default function ProfileModal({ isOpen, onClose, onAvatarChange }) {
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [info, setInfo] = useState({ studentId: '', email: '' });
  const [form, setForm] = useState({ fullName: '', branch: '', year: '' });

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetchMe()
      .then(({ data }) => {
        setInfo({ studentId: data.studentId, email: data.email });
        setForm({ fullName: data.fullName || '', branch: data.branch || '', year: data.year || '' });
        setAvatarUrl(data.avatarUrl || '');
        if (onAvatarChange) onAvatarChange(data.avatarUrl || '');
      })
      .catch(() => toast.error('Could not load your profile.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const initials = (form.fullName || info.studentId || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // lets the same file be picked again
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error('Image must be under 5 MB.');
      return;
    }
    setPhotoBusy(true);
    try {
      const { data } = await uploadAvatar(file);
      setAvatarUrl(data.avatarUrl);
      if (onAvatarChange) onAvatarChange(data.avatarUrl);
      toast.success('Profile photo updated');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not upload photo.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleRemovePhoto = async () => {
    setPhotoBusy(true);
    try {
      await removeAvatar();
      setAvatarUrl('');
      if (onAvatarChange) onAvatarChange('');
      toast.success('Profile photo removed');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not remove photo.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      toast.success('Profile updated');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay">
      <div className="modal">
        <div className="modal-head">
          <div>
            <div className="modal-eyebrow">Account</div>
            <h2>My profile</h2>
          </div>
          <button type="button" onClick={onClose} className="btn btn-secondary btn-icon" title="Close">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {loading ? (
          <p className="muted-text">Loading…</p>
        ) : (
          <form onSubmit={handleSubmit} className="form">
            {/* Photo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 4 }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  style={{
                    width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', flex: 'none',
                    opacity: photoBusy ? 0.5 : 1,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 72, height: 72, borderRadius: '50%', background: '#1c1c1c', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, fontWeight: 600, flex: 'none', opacity: photoBusy ? 0.5 : 1,
                  }}
                >
                  {initials}
                </div>
              )}

              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 600 }}>{form.fullName || 'Add your name'}</div>
                <div className="muted-text" style={{ marginBottom: 8 }}>{info.studentId}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    disabled={photoBusy}
                    onClick={() => fileRef.current && fileRef.current.click()}
                  >
                    {photoBusy ? 'Working…' : avatarUrl ? 'Change photo' : 'Upload photo'}
                  </button>
                  {avatarUrl && (
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      disabled={photoBusy}
                      onClick={handleRemovePhoto}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFile}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
            <span className="muted-text" style={{ fontSize: 12 }}>
              JPG, PNG or WebP, up to 5 MB. Photos save instantly.
            </span>

            <div className="field">
              <label className="label" htmlFor="pf-name">Full name</label>
              <input
                id="pf-name"
                className="input plain"
                type="text"
                maxLength={60}
                placeholder="e.g. Kapil Sharma"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="pf-id">Student ID</label>
              <input id="pf-id" className="input plain" type="text" value={info.studentId} disabled style={readOnlyStyle} />
            </div>

            <div className="field">
              <label className="label" htmlFor="pf-email">Email</label>
              <input id="pf-email" className="input plain" type="email" value={info.email} disabled style={readOnlyStyle} />
            </div>

            <div className="field">
              <label className="label" htmlFor="pf-branch">Branch</label>
              <select
                id="pf-branch"
                className="select plain"
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
              >
                <option value="">Select your branch</option>
                {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div className="field">
              <label className="label" htmlFor="pf-year">Year</label>
              <select
                id="pf-year"
                className="select plain"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
              >
                <option value="">Select your year</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div className="form-actions">
              <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
              <button type="submit" disabled={saving || photoBusy} className="btn btn-primary">
                {saving ? 'Saving…' : 'Save profile'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}