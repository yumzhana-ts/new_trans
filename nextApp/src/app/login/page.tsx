'use client'

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@/styles/admin.css';

export default function AuthPage() {
  const {
    login,
    register,
    resendVerification,
    loading,
    errorMessage,
    successMessage,
    pendingVerificationEmail,
    setErrorMessage,
    setSuccessMessage,
  } = useAuth();
  const [isLogin, setIsLogin] = useState(true); // toggle state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [username, setUsername] = useState(''); // only for registration
  
  useEffect(() => {
    let cancelled = false;

    async function redirectAuthenticatedUser() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!cancelled && res.ok) window.location.replace("/dashboard");
      } catch {
        // Stay on login when the session check is unavailable.
      }
    }

    redirectAuthenticatedUser();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setErrorMessage(null);
    if (params.get('reset') === 'success') {
      setSuccessMessage('Password reset successful. You can now log in with your new password.');
    }
    const verificationStatus = params.get('verification');
    if (verificationStatus === 'success') {
      setSuccessMessage('Email verified successfully. You can now log in.');
    } else if (verificationStatus === 'used') {
      setSuccessMessage(null);
      setErrorMessage('This verification link was already used. Try logging in.');
    } else if (verificationStatus === 'expired') {
      setSuccessMessage(null);
      setErrorMessage('This verification link has expired. Request a new one from the login page.');
    } else if (verificationStatus === 'invalid') {
      setSuccessMessage(null);
      setErrorMessage('This verification link is invalid.');
    } else if (verificationStatus === 'error') {
      setSuccessMessage(null);
      setErrorMessage('We could not verify your email. Please try again.');
    }

    params.delete('reset');
    params.delete('verification');

    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `/login?${nextQuery}` : '/login';
    window.history.replaceState({}, '', nextUrl);
  }, [setErrorMessage, setSuccessMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      const authResult = await login(email, password);
      if (authResult) window.location.href = authResult.redirectTo;
    } else {
      if (password !== confirmPassword) {
        return;
      }
      const success = await register({ username, email, password }); // username вместо name
      if (success) {
        setSuccessMessage('Registration successful! Check your email, then login.');
        setIsLogin(true);
        setPassword('');
        setConfirmPassword('');
        setShowPassword(false);
        setShowConfirmPassword(false);
      }
    }
  };

  return (
    <div className="dashboard-shell min-vh-100 w-100 text-white overflow-hidden">
      <div className="position-relative min-vh-100">
        <div className="dashboard-bg-1 position-absolute top-0 start-0 end-0 bottom-0" />
        <div className="dashboard-bg-2 position-absolute top-0 start-0 end-0 bottom-0" />
        <div className="dashboard-bg-3 position-absolute top-0 start-0 end-0 bottom-0" />

        <main className="position-relative mx-auto d-flex flex-column min-vh-100 w-100 dashboard-max-width px-3 py-3 align-items-center justify-content-center">

          <div className="d-flex align-items-center justify-content-center">
            <div className="login-layout d-flex w-100 gap-4 align-items-center justify-content-center">
              <div className="login-glass-soft d-flex flex-column justify-content-center p-4 p-lg-5"
                  style={{ maxWidth: '380px', width: '100%' }}
              >
                <h1 className="login-title mb-3">TRIVIAAPP</h1>
                <p className="login-description">
                  Challenge your friends, test your knowledge, and compete in real-time trivia games.
                  Create games, join sessions, and see who comes out on top.
                </p>
              </div>
              
              <div className="login-glass-strong p-4 p-lg-5" style={{ width: '100%', maxWidth: '420px' }}>
                <h3 className="mb-3 text-center text-white">
                  {isLogin ? 'Login' : 'Register'}
                </h3>

                {errorMessage && <div className="alert alert-danger py-2">{errorMessage}</div>}
                {!isLogin && password && confirmPassword && password !== confirmPassword && (
                  <div className="alert alert-danger py-2">Passwords do not match.</div>
                )}
                {isLogin && pendingVerificationEmail && (
                  <div className="alert alert-warning py-2">
                    <div className="mb-2">Your email is not verified yet.</div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-warning"
                      disabled={loading}
                      onClick={() => resendVerification(pendingVerificationEmail)}
                    >
                      Resend verification email
                    </button>
                  </div>
                )}
                {successMessage && (
                  <div className="alert alert-success py-2">
                    {successMessage}
                    <button className="btn-close float-end" onClick={() => setSuccessMessage(null)} />
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {!isLogin && (
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
                  )}

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

                    <div className="mb-3">
                      <label className="form-label">Password</label>
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

                  {!isLogin && (
                    <div className="mb-3">
                      <label className="form-label">Confirm password</label>
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
                  )}

                  <button
                    type="submit"
                    className="btn login-primary-btn w-100"
                    disabled={loading || (!isLogin && password !== confirmPassword)}
                  >
                    {loading ? <span className="spinner-border spinner-border-sm" /> : isLogin ? 'Login' : 'Register'}
                  </button>
                </form>

                <div className="mt-3 text-center">
                  {isLogin && (
                    <div className="mb-2">
                      <a href="/reset-password" className="login-link">
                        Forgot password?
                      </a>
                    </div>
                  )}
                  {(
                  <button
                    className="login-link border-0 bg-transparent"
                    onClick={() => setIsLogin(!isLogin)}
                    disabled={loading}
                  >
                    {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
                  </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-4 pb-3">
            <a
              href="/legal"
              className="login-footer-link "
            >
              Privacy Policy/Terms of Use
            </a>
          </div>

        </main>
      </div>
    </div>
  );
}
