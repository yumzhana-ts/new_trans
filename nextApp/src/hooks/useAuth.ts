import { useState } from "react";

type User = {
  id: string;
  username?: string;
  email?: string;
  role?: string;
  created_at?: string;
};

type AuthSuccess = {
  id: string;
  redirectTo: string;
};

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string): Promise<AuthSuccess | null> => {
    setLoading(true);
    setErrorMessage(null);
    setPendingVerificationEmail(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403 && data.code === "EMAIL_NOT_VERIFIED") {
          setPendingVerificationEmail(data.email || email.trim().toLowerCase());
        }
        setErrorMessage(data.error || "Login failed");
        return null;
      }

      setUser({ id: data.id });
      setSuccessMessage("Login successful");
      return {
        id: data.id,
        redirectTo: typeof data.redirect_to === "string" ? data.redirect_to : "/profile",
      };
    } catch (err: any) {
      setErrorMessage(err.message || "Login failed");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: { username: string; email: string; password: string }) => {
    setLoading(true);
    setErrorMessage(null);
    setPendingVerificationEmail(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Registration failed");
        return false;
      }

      setUser({
        id: data.id,
        username: data.username,
        email: data.email,
        role: data.role,
        created_at: data.created_at,
      });
      setSuccessMessage("Registration successful. Check your email before logging in.");
      return true;
    } catch (err: any) {
      setErrorMessage(err.message || "Registration failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async (email: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Could not resend verification email");
        return false;
      }

      setSuccessMessage(data.message || "Verification email sent");
      setPendingVerificationEmail(email.trim().toLowerCase());
      return true;
    } catch (err: any) {
      setErrorMessage(err.message || "Could not resend verification email");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setPendingVerificationEmail(null);
    setSuccessMessage("Logged out");
  };

  return {
    user,
    loading,
    successMessage,
    errorMessage,
    pendingVerificationEmail,
    setSuccessMessage,
    setErrorMessage,
    login,
    logout,
    register,
    resendVerification,
  };
}
