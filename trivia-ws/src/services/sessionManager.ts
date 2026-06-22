import type { WebSocket } from "ws";
import type { Session } from "../types/session.js";

const sessions = new Map<string, Session>();

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export function upsertSession(
  userId: string,
  displayName: string,
  ws: WebSocket
): { session: Session; reconnected: boolean } {
  const existing = sessions.get(userId);
  const now = Date.now();

  if (existing) {
    existing.ws = ws;
    existing.displayName = displayName;
    existing.lastSeenAt = now;
    return { session: existing, reconnected: true };
  }

  const session: Session = {
    userId,
    displayName,
    ws,
    roomCode: null,
    connectedAt: now,
    lastSeenAt: now,
  };
  sessions.set(userId, session);
  return { session, reconnected: false };
}

export function getSession(userId: string): Session | undefined {
  return sessions.get(userId);
}

export function getSessionByWs(ws: WebSocket): Session | undefined {
  for (const session of sessions.values()) {
    if (session.ws === ws) return session;
  }
}

export function updateSessionRoom(userId: string, roomCode: string | null): void {
  const session = sessions.get(userId);
  if (session) session.roomCode = roomCode;
}
