import type { WebSocket } from "ws";
import type { Room, Player, RoomState } from "../types/room.js";
import type { Question } from "../types/pack.js";
import type { PlayerDTO, RoomDTO } from "../types/message.js";
import { config } from "../config/index.js";
import { getSession, updateSessionRoom } from "./sessionManager.js";
import { getPackById } from "./packLoader.js";

const rooms = new Map<string, Room>();

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // destroy room after 30min of no activity

// ─── Serialisation ────────────────────────────────────────────────────────────

export function toPlayerDTO(player: Player): PlayerDTO {
  return {
    userId: player.userId,
    displayName: player.displayName,
    score: player.score,
    isSpectator: player.isSpectator,
    isReady: player.isReady,
  };
}

export function toRoomDTO(room: Room): RoomDTO {
  return {
    code: room.code,
    isPublic: room.isPublic,
    packId: room.packId,
    maxPlayers: room.maxPlayers,
    state: room.state,
    players: Array.from(room.players.values()).map(toPlayerDTO),
  };
}

// ─── Send / broadcast ─────────────────────────────────────────────────────────

export function send(ws: WebSocket, message: object): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

export function broadcast(roomCode: string, message: object, excludeUserId?: string): void {
  const room = rooms.get(roomCode);
  if (!room) return;
  for (const player of room.players.values()) {
    if (player.userId === excludeUserId) continue;
    const session = getSession(player.userId);
    if (session) send(session.ws, message);
  }
}

// ─── Room code ────────────────────────────────────────────────────────────────

function generateCode(): string {
  let code: string;
  do {
    code = Array.from(
      { length: 4 },
      () => CHARS[Math.floor(Math.random() * CHARS.length)]
    ).join("");
  } while (rooms.has(code));
  return code;
}

// ─── Question queue ───────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pickRandom<T>(arr: T[], count: number): T[] {
  return shuffle(arr).slice(0, Math.min(count, arr.length));
}

/**
 * Builds the question queue for a game.
 * Pulls config.questions.easy/medium/hard questions from each difficulty tier,
 * shuffles each tier independently, then interleaves them so the game
 * naturally ramps: easy → medium → hard.
 */
export function buildQuestionQueue(packId: string): Question[] | null {
  const pack = getPackById(packId);
  if (!pack) return null;

  const easy   = pickRandom(pack.easy,   config.questions.easy);
  const medium = pickRandom(pack.medium, config.questions.medium);
  const hard   = pickRandom(pack.hard,   config.questions.hard);

  // Interleave: all easy first, then medium, then hard
  // The client always shows question N of total so the player knows where they are
  return [...easy, ...medium, ...hard];
}

// ─── Room CRUD ────────────────────────────────────────────────────────────────

export type CreateRoomResult =
  | { ok: true; room: Room }
  | { ok: false; error: string };

export function createRoom(
  userId: string,
  displayName: string,
  packId: string,
  isPublic: boolean,
  maxPlayers: number
): CreateRoomResult {
  const pack = getPackById(packId);
  if (!pack) return { ok: false, error: "PACK_NOT_FOUND" };

  const code = generateCode();
  const now = Date.now();

  const player: Player = {
    userId,
    displayName,
    score: 0,
    isSpectator: false,
    isReady: false,
  };

  const room: Room = {
    code,
    isPublic,
    state: "waiting",
    players: new Map([[userId, player]]),
    packId,
    maxPlayers,
    questions: null,
    currentQuestionIndex: 0,
    questionSentAt: null,
    answersThisRound: new Map(),
    questionTimer: null,
    createdAt: now,
    lastActivityAt: now,
  };

  rooms.set(code, room);
  updateSessionRoom(userId, code);

  console.log(`[rooms] ${displayName} created room ${code} (pack: ${packId}, public: ${isPublic})`);
  return { ok: true, room };
}

export type JoinRoomResult =
  | { ok: true; room: Room; asSpectator: boolean }
  | { ok: false; error: string };

export function joinRoom(
  userId: string,
  displayName: string,
  code: string
): JoinRoomResult {
  const room = rooms.get(code);
  if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };

  // Already in room — reconnect case
  if (room.players.has(userId)) {
    updateSessionRoom(userId, code);
    return { ok: true, room, asSpectator: room.players.get(userId)!.isSpectator };
  }

  const isFull = room.players.size >= room.maxPlayers;

  if (isFull) return { ok: false, error: "ROOM_FULL" };

  // Joining mid-game → spectator until next round
  const asSpectator = room.state === "in_progress" || room.state === "voting";

  const player: Player = {
    userId,
    displayName,
    score: 0,
    isSpectator: asSpectator,
    isReady: false,
  };

  room.players.set(userId, player);
  room.lastActivityAt = Date.now();
  updateSessionRoom(userId, code);

  console.log(`[rooms] ${displayName} joined room ${code}${asSpectator ? " as spectator" : ""}`);
  return { ok: true, room, asSpectator };
}

export function leaveRoom(userId: string, code: string): void {
  const room = rooms.get(code);
  if (!room) return;

  const player = room.players.get(userId);
  room.players.delete(userId);
  updateSessionRoom(userId, null);
  room.lastActivityAt = Date.now();

  if (room.players.size === 0) {
    destroyRoom(code);
    return;
  }

  broadcast(code, {
    type: "room:updated",
    ts: Date.now(),
    payload: toRoomDTO(room),
  });

  console.log(`[rooms] ${player?.displayName ?? userId} left room ${code}`);
}

export function destroyRoom(code: string): void {
  const room = rooms.get(code);
  if (room?.questionTimer) {
    clearTimeout(room.questionTimer);
    room.questionTimer = null;
  }
  rooms.delete(code);
  console.log(`[rooms] Destroyed room ${code}`);
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function getRoom(code: string): Room | undefined {
  return rooms.get(code);
}

export function getPublicRooms(): RoomDTO[] {
  return Array.from(rooms.values())
    .filter((r) => r.isPublic && r.state === "waiting")
    .map(toRoomDTO);
}

export function updateRoomState(code: string, state: RoomState): void {
  const room = rooms.get(code);
  if (room) {
    room.state = state;
    room.lastActivityAt = Date.now();
  }
}

// ─── Idle cleanup ─────────────────────────────────────────────────────────────

export function startIdleCleanup(): void {
  setInterval(() => {
    const now = Date.now();
    for (const [code, room] of rooms) {
      if (now - room.lastActivityAt > IDLE_TIMEOUT_MS) {
        console.log(`[rooms] Removing idle room ${code}`);
        broadcast(code, {
          type: "room:closed",
          ts: now,
          payload: { reason: "IDLE_TIMEOUT" },
        });
        destroyRoom(code);
      }
    }
  }, 5 * 60 * 1000);
}
