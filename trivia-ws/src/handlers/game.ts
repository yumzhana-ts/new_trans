import type { WebSocket } from "ws";
import type { AnswerPayload } from "../types/message.js";
import { getSessionByWs } from "../services/sessionManager.js";
import { getRoom, send } from "../services/roomManager.js";
import { setReady, startGame, submitAnswer } from "../services/gameEngine.js";

function err(ws: WebSocket, code: string, message: string, requestId?: string): void {
  send(ws, { type: "error", requestId, ts: Date.now(), payload: { code, message } });
}

function reply(ws: WebSocket, type: string, payload: object, requestId?: string): void {
  send(ws, { type, requestId, ts: Date.now(), payload });
}

// game:ready

export function handleReady(ws: WebSocket, userId: string, requestId?: string): void {
  const session = getSessionByWs(ws);
  if (!session?.roomCode) {
    err(ws, "NOT_IN_ROOM", "You are not in a room", requestId);
    return;
  }

  const room = getRoom(session.roomCode);
  if (!room) {
    err(ws, "ROOM_NOT_FOUND", "Room not found", requestId);
    return;
  }

  if (room.state !== "waiting" && room.state !== "voting") {
    err(ws, "WRONG_STATE", "Game is already in progress", requestId);
    return;
  }

  const allReady = setReady(room, userId);

  reply(ws, "game:ready_ack", { userId }, requestId);

  if (allReady) {
    startGame(room);
  }
}

// game:answer

export function handleAnswer(
  ws: WebSocket,
  userId: string,
  payload: AnswerPayload,
  requestId?: string
): void {
  const session = getSessionByWs(ws);
  if (!session?.roomCode) {
    err(ws, "NOT_IN_ROOM", "You are not in a room", requestId);
    return;
  }

  const room = getRoom(session.roomCode);
  if (!room) {
    err(ws, "ROOM_NOT_FOUND", "Room not found", requestId);
    return;
  }

  const { questionId, answerIndex } = payload ?? {};

  if (questionId === undefined || answerIndex === undefined) {
    err(ws, "INVALID_PAYLOAD", "questionId and answerIndex are required", requestId);
    return;
  }

  if (typeof answerIndex !== "number" || answerIndex < 0 || answerIndex > 3) {
    err(ws, "INVALID_PAYLOAD", "answerIndex must be 0–3", requestId);
    return;
  }

  const result = submitAnswer(room, userId, questionId, answerIndex);

  switch (result) {
    case "ok":
      reply(ws, "game:answer_ack", { questionId, answerIndex }, requestId);
      break;
    case "already_answered":
      err(ws, "ALREADY_ANSWERED", "You already answered this question", requestId);
      break;
    case "wrong_question":
      err(ws, "WRONG_QUESTION", "questionId does not match the active question", requestId);
      break;
    case "not_your_turn":
      err(ws, "NOT_YOUR_TURN", "No active question right now", requestId);
      break;
  }
}
