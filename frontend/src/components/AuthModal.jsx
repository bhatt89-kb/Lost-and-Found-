import React, { useState, useEffect } from 'react';
import { loginUser, registerUser, loginWithGoogle, forgotPassword, resetPassword } from '../services/api';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import DitherColumns from './DitherColumns';
import { PinIcon } from './Icons';
import toast from 'react-hot-toast';

const UserIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const MailIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M3 8l9 6 9-6M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const LockIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const EyeIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const EyeOffIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const HEADINGS = {
  login: 'Institutional Gateway',
  register: 'Request Credential',
  forgot: 'Reset Access Key',
  reset: 'Set New Access Key',
};

const LEDES = {
  login: 'Cryptographically masked portal for university property recovery and provenance claims.',
  register: 'Cryptographically masked portal for university property recovery and provenance claims.',
  forgot: 'Enter your campus email and we will send you a link to choose a new access key.',
  reset: 'Choose a new access key (at least 8 characters). The link works once.',
};

export default function AuthModal({ isOpen, onClose, resetToken = '', onResetDone }) {
  const { login } = useAuth();
  const [mode, setMode] = useState(resetToken ? 'reset' : 'login'); // login | register | forgot | reset
  const [formData, setFormData] = useState({ studentId: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // If the page was opened from a reset link, jump straight to the new-password screen
  useEffect(() => {
    if (resetToken) setMode('reset');
  }, [resetToken]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (resetToken && onResetDone) onResetDone();
    onClose();
  };

  const goTo = (next) => {
    setMode(next);
    setShowPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'register') {
        const { data } = await registerUser(formData);
        login(data.token, data.studentId);
        toast.success(`Welcome, ${data.studentId}! Account created.`);
        onClose();
      } else if (mode === 'login') {
        const { data } = await loginUser({ studentId: formData.studentId, password: formData.password });
        login(data.token, data.studentId);
        toast.success(`Logged in as ${data.studentId}`);
        onClose();
      } else if (mode === 'forgot') {
        const { data } = await forgotPassword(formData.email);
        toast.success(data.message);
        goTo('login');
      } else if (mode === 'reset') {
        const { data } = await resetPassword(resetToken, formData.password);
        toast.success(data.message);
        setFormData({ ...formData, password: '' });
        if (onResetDone) onResetDone(); // removes the token from the address bar
        goTo('login');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const { data } = await loginWithGoogle(credentialResponse.credential);
      login(data.token, data.studentId);
      toast.success(`Logged in as ${data.studentId}`);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const showStudentId = mode === 'login' || mode === 'register';
  const showEmail = mode === 'register' || mode === 'forgot';
  const showPasswordField = mode !== 'forgot';
  const showGoogle = mode === 'login' || mode === 'register';

  const submitLabel = {
    login: 'Authenticate Portal',
    register: 'Create Credential',
    forgot: 'Send Reset Link',
    reset: 'Save New Access Key',
  }[mode];

  return (
    <div className="gateway">
      {/* LEFT: auth panel */}
      <div className="gateway-left">
        <div>
          <div className="gateway-top">
            <div className="brand">
              <div className="brand-mark"><PinIcon size={18} /></div>
              <div className="brand-name"><b>Campus Lost & Found</b></div>
            </div>
            <button type="button" className="gateway-close" onClick={handleClose}>Continue as guest</button>
          </div>
          <h1 className="gateway-h1">{HEADINGS[mode]}</h1>
          <p className="gateway-lede">{LEDES[mode]}</p>
        </div>

        <div className="gateway-form-wrap">
          <form className="form" onSubmit={handleSubmit}>
            {showStudentId && (
              <div className="field">
                <label className="label" htmlFor="studentId">Student ID</label>
                <div className="input-wrap">
                  <UserIcon />
                  <input
                    id="studentId"
                    className="input"
                    type="text"
                    required
                    autoComplete="username"
                    placeholder="e.g. student_101"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  />
                </div>
              </div>
            )}

            {showEmail && (
              <div className="field">
                <label className="label" htmlFor="email">Campus Email</label>
                <div className="input-wrap">
                  <MailIcon />
                  <input
                    id="email"
                    className="input"
                    type="email"
                    required
                    placeholder="student@university.ac.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
            )}

            {showPasswordField && (
              <div className="field">
                <label className="label" htmlFor="password">
                  {mode === 'reset' ? 'New Access Key' : 'Access Key / Passphrase'}
                </label>
                <div className="input-wrap">
                  <LockIcon />
                  <input
                    id="password"
                    className="input"
                    style={{ paddingRight: 40 }}
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={mode === 'login' ? undefined : 8}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button type="button" className="toggle" onClick={() => setShowPassword((s) => !s)} title="Toggle visibility">
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {mode === 'login' && (
                  <div style={{ textAlign: 'right', marginTop: 6 }}>
                    <button type="button" className="link-btn" onClick={() => goTo('forgot')}>
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary btn-block" style={{ marginTop: 8 }}>
              {loading ? 'Verifying…' : submitLabel}
              {!loading && (
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            {/* Google sign-in */}
            {showGoogle && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0', opacity: 0.6, fontSize: 12 }}>
                  <div style={{ flex: 1, height: 1, background: 'currentColor', opacity: 0.3 }} />
                  OR
                  <div style={{ flex: 1, height: 1, background: 'currentColor', opacity: 0.3 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => toast.error('Google sign-in failed')}
                    theme="outline"
                    size="large"
                    text="continue_with"
                    shape="rectangular"
                  />
                </div>
              </>
            )}

            <p className="switch-line">
              {mode === 'login' && (
                <>
                  Don't have an authenticated token?{' '}
                  <button type="button" className="link-btn" onClick={() => goTo('register')}>
                    Request Blind Credential
                  </button>
                </>
              )}
              {mode === 'register' && (
                <>
                  Already have a token?{' '}
                  <button type="button" className="link-btn" onClick={() => goTo('login')}>
                    Authenticate
                  </button>
                </>
              )}
              {(mode === 'forgot' || mode === 'reset') && (
                <>
                  Remembered it?{' '}
                  <button type="button" className="link-btn" onClick={() => goTo('login')}>
                    Back to login
                  </button>
                </>
              )}
            </p>
          </form>
        </div>

        <div className="gateway-footer">
          <div className="row-flex">
            <span>SEC-GATE: TIER-4 CERTIFIED</span>
            <span><i className="beacon" /> GATEWAY ONLINE</span>
          </div>
          <p>SHA-256 ZK-HASH MASKS • FERPA STRICT COMPLIANT</p>
        </div>
      </div>

      {/* RIGHT: dithered columns */}
      <div className="gateway-art">
        <div className="stipple" />
        <DitherColumns />
        <div className="telemetry">
          <div><span>NODE CLUSTER:</span><b>US-EAST-CAMPUS-01</b></div>
          <div><span>ZERO-KNOWLEDGE ROOT:</span><b>0x9F4b...21B8</b></div>
          <div><span>STATE VALIDITY:</span><span className="g">100% BLIND CONFIRM</span></div>
        </div>
        <div className="art-caption">
          <div>Foundation // Repositorium</div>
          <div>ARCHITECTURA ET FIDELITAS MMXXV</div>
        </div>
      </div>
    </div>
  );
}