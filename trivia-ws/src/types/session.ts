import type { WebSocket } from "ws";

export interface Session {
  userId: string;
  displayName: string;
  ws: WebSocket;
  roomCode: string | null;
  connectedAt: number;
  lastSeenAt: number;
}
