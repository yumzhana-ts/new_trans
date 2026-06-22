import { useState, useEffect, useCallback } from "react";

type UserProfile = {
  id: number;
  username: string;
  email: string;
  two_factor_enabled: boolean;
};

type UseProfileHook = {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (data: { username: string; email: string }) => Promise<void>;
  deleteProfile: () => Promise<void>;
};

export function useProfile(): UseProfileHook {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Получение профиля
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setUser({
        id: data.id,
        username: data.username,
        email: data.email,
        two_factor_enabled: Boolean(data.two_factor_enabled),
      });
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Обновление профиля
  const updateProfile = useCallback(
    async (data: { username: string; email: string }) => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/auth/${user.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to update profile");
        }
        const updated = await res.json();
        setUser(prev => prev ? {
          ...prev,
          id: updated.id,
          username: updated.username,
          email: updated.email,
        } : null);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Удаление профиля
  const deleteProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${user.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete profile");
      }
      setUser(null);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [user]);

  return { user, loading, error, updateProfile, deleteProfile };
}
