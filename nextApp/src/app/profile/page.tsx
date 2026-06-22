'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useProfile } from '@/hooks/useProfile';
import '@/styles/admin.css';

export default function ProfilePage() {
  const { user, loading, error, updateProfile, deleteProfile } = useProfile();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
  const [twoFactorUrl, setTwoFactorUrl] = useState<string | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorMessage, setTwoFactorMessage] = useState<string | null>(null);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);

  // Заполняем поля при загрузке профиля
  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
      setTwoFactorEnabled(user.two_factor_enabled);
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ username, email });
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your profile?')) return;
    await deleteProfile();
    window.location.href = '/';
  };

  const handleTwoFactorSetup = async () => {
    setTwoFactorLoading(true);
    setTwoFactorError(null);
    setTwoFactorMessage(null);
    try {
      const res = await fetch('/api/auth/2fa/setup', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setTwoFactorError(data.error || 'Unable to start 2FA setup.');
        return;
      }
      setTwoFactorSecret(data.secret);
      setTwoFactorUrl(data.otpauth_url);
      setTwoFactorMessage('2FA secret created. Add it to your authenticator app, then enter the current code to enable it.');
    } catch {
      setTwoFactorError('Unable to start 2FA setup.');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleTwoFactorEnable = async () => {
    setTwoFactorLoading(true);
    setTwoFactorError(null);
    setTwoFactorMessage(null);
    try {
      const res = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: twoFactorCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTwoFactorError(data.error || 'Unable to enable 2FA.');
        return;
      }
      setTwoFactorEnabled(true);
      setTwoFactorSecret(null);
      setTwoFactorUrl(null);
      setTwoFactorCode('');
      setTwoFactorMessage(data.message || '2FA enabled successfully.');
    } catch {
      setTwoFactorError('Unable to enable 2FA.');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleTwoFactorDisable = async () => {
    setTwoFactorLoading(true);
    setTwoFactorError(null);
    setTwoFactorMessage(null);
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: twoFactorCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTwoFactorError(data.error || 'Unable to disable 2FA.');
        return;
      }
      setTwoFactorEnabled(false);
      setTwoFactorCode('');
      setTwoFactorSecret(null);
      setTwoFactorUrl(null);
      setTwoFactorMessage(data.message || '2FA disabled successfully.');
    } catch {
      setTwoFactorError('Unable to disable 2FA.');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (error) return <div className="alert alert-danger mt-5 text-center">{error}</div>;
  if (!user) return null;

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow" style={{ width: '360px' }}>
        <h3 className="mb-3 text-center">My Profile</h3>

        <form onSubmit={handleUpdate}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm" /> : 'Update Profile'}
          </button>
        </form>

        <hr />

        <div className="mb-3">
          <h5 className="mb-2">Two-Factor Authentication</h5>
          {twoFactorError && <div className="alert alert-danger py-2">{twoFactorError}</div>}
          {twoFactorMessage && <div className="alert alert-success py-2">{twoFactorMessage}</div>}

          {!twoFactorEnabled && !twoFactorSecret && (
            <button
              className="btn btn-outline-secondary w-100 mb-2"
              onClick={handleTwoFactorSetup}
              disabled={twoFactorLoading}
            >
              {twoFactorLoading ? 'Preparing…' : 'Set up 2FA'}
            </button>
          )}

          {twoFactorSecret && (
            <div className="mb-3">
              {twoFactorUrl && (
                <div className="text-center mb-3">
                  <div className="small text-muted mb-2">Scan with your authenticator app</div>
                  <div className="d-inline-block bg-white p-3 rounded">
                    <QRCodeSVG value={twoFactorUrl} size={180} />
                  </div>
                </div>
              )}
              <div className="small text-muted mb-2">Manual setup key</div>
              <div className="form-control mb-2" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {twoFactorSecret}
              </div>
            </div>
          )}

          {(twoFactorSecret || twoFactorEnabled) && (
            <div className="mb-3">
              <label className="form-label">{twoFactorEnabled ? 'Current 2FA code to disable' : 'Current 2FA code to enable'}</label>
              <input
                type="text"
                className="form-control"
                value={twoFactorCode}
                onChange={e => setTwoFactorCode(e.target.value)}
                inputMode="numeric"
                placeholder="123456"
              />
            </div>
          )}

          {twoFactorSecret && !twoFactorEnabled && (
            <button
              className="btn btn-primary w-100 mb-2"
              onClick={handleTwoFactorEnable}
              disabled={twoFactorLoading || !twoFactorCode.trim()}
            >
              {twoFactorLoading ? 'Enabling…' : 'Enable 2FA'}
            </button>
          )}

          {twoFactorEnabled && (
            <button
              className="btn btn-outline-danger w-100 mb-2"
              onClick={handleTwoFactorDisable}
              disabled={twoFactorLoading || !twoFactorCode.trim()}
            >
              {twoFactorLoading ? 'Disabling…' : 'Disable 2FA'}
            </button>
          )}
        </div>

        <hr />

        <button
          className="btn btn-danger w-100"
          onClick={handleDelete}
          disabled={loading}
        >
          Delete Profile
        </button>
      </div>
    </div>
  );
}
