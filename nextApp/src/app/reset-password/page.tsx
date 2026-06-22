'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@/styles/admin.css';

export default function ResetPasswordPage() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get('token') ?? '');
  }, []);

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Unable to start password reset.');
        return;
      }

      setSuccessMessage(data.message || 'If the account exists, a password reset email will be sent.');
    } catch {
      setErrorMessage('Unable to start password reset.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Unable to reset password.');
        return;
      }

      setSuccessMessage(data.message || 'Password reset successfully.');
      setPassword('');
      setConfirmPassword('');
      window.setTimeout(() => {
        window.location.href = '/login?reset=success';
      }, 1200);
    } catch {
      setErrorMessage('Unable to reset password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dashboard-shell min-vh-100 w-100 text-white overflow-hidden">
      <div className="position-relative min-vh-100">
        <div className="dashboard-bg-1 position-absolute top-0 start-0 end-0 bottom-0" />
        <div className="dashboard-bg-2 position-absolute top-0 start-0 end-0 bottom-0" />
        <div className="dashboard-bg-3 position-absolute top-0 start-0 end-0 bottom-0" />

        <main className="position-relative mx-auto d-flex flex-column min-vh-100 w-100 dashboard-max-width px-3 py-3">
          <div className="flex-grow-1 d-flex align-items-center justify-content-center">
            <div className="login-glass-strong p-4 p-lg-5" style={{ width: '100%', maxWidth: '420px' }}>
              <h3 className="mb-3 text-center">{token ? 'Set a new password' : 'Forgot password'}</h3>
              {errorMessage && <div className="alert alert-danger py-2">{errorMessage}</div>}
              {successMessage && <div className="alert alert-success py-2">{successMessage}</div>}
              {token && password && confirmPassword && password !== confirmPassword && (
                <div className="alert alert-danger py-2">Passwords do not match.</div>
              )}

              {token ? (
                <form onSubmit={handleResetPassword}>
                  <div className="mb-3">
                    <label className="form-label">New password</label>
                    <div className="input-group">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-control"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="login-input-btn"
                        onClick={() => setShowPassword(prev => !prev)}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Confirm new password</label>
                    <div className="input-group">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="form-control"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="login-input-btn"
                        onClick={() => setShowConfirmPassword(prev => !prev)}
                      >
                        {showConfirmPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn login-primary-btn w-100"
                    disabled={loading || password !== confirmPassword}
                  >
                    {loading ? <span className="spinner-border spinner-border-sm" /> : 'Reset password'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleForgotPassword}>
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

                  <button type="submit" className="btn login-primary-btn w-100" disabled={loading}>
                    {loading ? <span className="spinner-border spinner-border-sm" /> : 'Send reset link'}
                  </button>
                </form>
              )}

              <div className="mt-3 text-center">
                <Link href="/login" className="login-footer-link">
                  Back to login
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
