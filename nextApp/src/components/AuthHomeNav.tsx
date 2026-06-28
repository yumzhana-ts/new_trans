import Link from "next/link";

type AuthHomeNavProps = {
  variant?: "dark" | "light";
};

export default function AuthHomeNav({ variant = "dark" }: AuthHomeNavProps) {
  return (
    <nav className={`auth-home-nav auth-home-nav-${variant}`} aria-label="Primary navigation">
      <Link href="/dashboard" className="auth-home-brand" aria-label="Go to dashboard">
        <span className="auth-home-mark">T</span>
        <span className="auth-home-name">TRIVIAAPP</span>
      </Link>
      <Link href="/dashboard" className="auth-home-link">
        Home
      </Link>
    </nav>
  );
}
