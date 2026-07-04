"use client";

// ====================
// 1. Imports
// ====================
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@/styles/admin.css';

import AdminLayout from '@/components/admin/AdminLayout';
import UsersTable from '@/components/admin/UsersTable';
import UserModals from '@/components/admin/UserModals';
import { useUsers } from '@/hooks/useUsers';
import { useState } from 'react';

// ====================
// 2. Users Page Component
// ====================
export default function UsersPage() {
  const {
    users,
    roles,
    loading,
    successMessage,
    setSuccessMessage,
    currentUserId,
    deleteUser,
    updateUser,
    createUser
  } = useUsers();

  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserData, setNewUserData] = useState({
    username: '',
    email: '',
    password: '',
    role: ''
  });

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    await updateUser(editingUser.id, {
      username: editingUser.username,
      email: editingUser.email,
      role: editingUser.role,
    });

    setEditingUser(null);
  };

  const handleAddUser = async () => {
    await createUser(newUserData);

    setShowAddUser(false);
    setNewUserData({
      username: '',
      email: '',
      password: '',
      role: ''
    });
  };

  return (
    <AdminLayout title="Users">
      {successMessage && (
        <div className="alert alert-success py-2">
          {successMessage}
        </div>
      )}

      <div className="mb-3 text-end">
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={() => setShowAddUser(true)}
        >
          <i className="bi bi-plus-lg me-1" /> Add user
        </button>
      </div>

      <div className="admin-card">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" />
          </div>
        ) : (
          <UsersTable
            users={users}
            currentUserId={currentUserId}
            onEdit={setEditingUser}
            onDelete={deleteUser}
          />
        )}
      </div>

      <UserModals
        roles={roles}
        editingUser={editingUser}
        setEditingUser={setEditingUser}
        handleSaveEdit={handleSaveEdit}
        showAddUser={showAddUser}
        setShowAddUser={setShowAddUser}
        newUserData={newUserData}
        setNewUserData={setNewUserData}
        handleAddUser={handleAddUser}
      />
    </AdminLayout>
  );
}
