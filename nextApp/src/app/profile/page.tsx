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
  // Заполняем поля при загрузке профиля
  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
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
