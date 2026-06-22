import { useEffect, useState } from 'react';

export function useUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/users', {
        credentials: 'include', 
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const res = await fetch('/api/auth/roles', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch roles');
      const data = await res.json();
      setRoles(data);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUser = async (id: number) => {
    if (!window.confirm('Delete user?')) return;
    await fetch(`/api/auth/${id}`, { method: 'DELETE' });
    setUsers(u => u.filter(user => user.id !== id));
    setSuccessMessage('User deleted');
  };

  const updateUser = async (id: number, payload: any) => {
    const { role, ...profilePayload } = payload;

    const res = await fetch(`/api/auth/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profilePayload),
    });
    const updated = await res.json();

    if (!res.ok) {
      throw new Error(updated.error || 'Failed to update user');
    }

    let nextUser = updated;

    if (role !== undefined) {
      const roleRes = await fetch(`/api/auth/users/${id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const roleUpdated = await roleRes.json();

      if (!roleRes.ok) {
        throw new Error(roleUpdated.error || 'Failed to update role');
      }

      nextUser = roleUpdated;
    }

    setUsers(u =>
      u.map(user =>
        user.id === id
          ? {
              ...user,
              ...nextUser,
              created_at: user.created_at
            }
          : user
      )
    );
    setSuccessMessage('User updated');
  };

  const createUser = async (payload: any) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const created = await res.json();

    if (!res.ok) {
      throw new Error(created.error || 'Failed to create user');
    }

    const newUser = created.user ?? created;

    setUsers(u => [
      ...u,
      {
        ...newUser,
        created_at: newUser.created_at || new Date().toISOString(),
      },
    ]);

    setSuccessMessage('User created');
  };

  return {
    users,
    roles,
    loading,
    successMessage,
    setSuccessMessage,
    deleteUser,
    updateUser,
    createUser,
  };
}
