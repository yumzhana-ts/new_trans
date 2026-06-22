import pg from "pg";
import type { IncomingMessage } from "http";
import { config } from "../config/index.js";

const { Pool } = pg;

export interface AuthDbUser {
  id: string;
  username: string;
}

const pool = config.databaseUrl
  ? new Pool({ connectionString: config.databaseUrl })
  : null;

function getCookieValue(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;

  for (const cookie of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = cookie.trim().split("=");
    if (rawName !== name) continue;

    const value = rawValue.join("=");
    if (!value) return null;

    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  return null;
}

export async function findUserBySessionToken(token: string): Promise<AuthDbUser | null> {
  if (!pool) {
    console.warn("[auth-db] DATABASE_URL is not configured");
    return null;
  }

  const result = await pool.query<{ id: number; username: string | null }>(
    `
      SELECT users.id, users.username
      FROM sessions
      JOIN users ON users.id = sessions.user_id
      WHERE sessions.token = $1
        AND sessions.expires_at > NOW()
      LIMIT 1
    `,
    [token]
  );

  const user = result.rows[0];
  if (!user) return null;

  return {
    id: String(user.id),
    username: user.username ?? `User ${user.id}`,
  };
}

export async function authenticateWebSocket(req: IncomingMessage): Promise<AuthDbUser | null> {
  const token = getCookieValue(req.headers.cookie, "session");
  if (!token) return null;

  return findUserBySessionToken(token);
}

export async function closeAuthDb(): Promise<void> {
  await pool?.end();
}
