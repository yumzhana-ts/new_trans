import type { WebSocket } from "ws";
import type { RoomCreatePayload, RoomJoinPayload } from "../types/message.js";
import { getSessionByWs } from "../services/sessionManager.js";
import {
  send,
  broadcast,
  createRoom,
  joinRoom,
  leaveRoom,
  getPublicRooms,
  toRoomDTO,
} from "../services/roomManager.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function err(ws: WebSocket, code: string, message: string, requestId?: string): void {
  send(ws, { type: "error", requestId, ts: Date.now(), payload: { code, message } });
}

function reply(ws: WebSocket, type: string, payload: object, requestId?: string): void {
  send(ws, { type, requestId, ts: Date.now(), payload });
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

export function handleRoomCreate(
  ws: WebSocket,
  userId: string,
  displayName: string,
  payload: RoomCreatePayload,
  requestId?: string
): void {
  const { packId, isPublic, maxPlayers } = payload ?? {};

  if (!packId) {
    err(ws, "INVALID_PAYLOAD", "packId is required", requestId);
    return;
  }

  if (!maxPlayers || maxPlayers < 2 || maxPlayers > 8) {
    err(ws, "INVALID_PAYLOAD", "maxPlayers must be between 2 and 8", requestId);
    return;
  }

  const result = createRoom(userId, displayName, packId, isPublic ?? true, maxPlayers);

  if (!result.ok) {
    err(ws, result.error, result.error, requestId);
    return;
  }

  reply(ws, "room:created", toRoomDTO(result.room), requestId);
}

export function handleRoomJoin(
  ws: WebSocket,
  userId: string,
  displayName: string,
  payload: RoomJoinPayload,
  requestId?: string
): void {
  const { code } = payload ?? {};

  if (!code || typeof code !== "string") {
    err(ws, "INVALID_PAYLOAD", "code is required", requestId);
    return;
  }

  const result = joinRoom(userId, displayName, code.toUpperCase());

  if (!result.ok) {
    err(ws, result.error, result.error, requestId);
    return;
  }

  const { room, asSpectator } = result;

  // Tell the joining player their full room state
  reply(ws, "room:joined", { ...toRoomDTO(room), asSpectator }, requestId);

  // Tell everyone else a new player arrived
  broadcast(room.code, {
    type: "room:updated",
    ts: Date.now(),
    payload: toRoomDTO(room),
  }, userId);
}

export function handleRoomLeave(
  ws: WebSocket,
  userId: string,
  requestId?: string
): void {
  const session = getSessionByWs(ws);

  if (!session?.roomCode) {
    err(ws, "NOT_IN_ROOM", "You are not in a room", requestId);
    return;
  }

  const code = session.roomCode;
  leaveRoom(userId, code);
  reply(ws, "room:left", { code }, requestId);
}

export function handleRoomList(ws: WebSocket, requestId?: string): void {
  reply(ws, "room:list", { rooms: getPublicRooms() }, requestId);
}
