import type { Question } from "./pack.js";

export type RoomState = "waiting" | "in_progress" | "voting" | "ended";

export interface Player {
  userId: string;
  displayName: string;
  score: number;
  isSpectator: boolean;
  isReady: boolean;
}

export interface Room {
  code: string;
  isPublic: boolean;
  state: RoomState;
  players: Map<string, Player>; // userId → Player
  packId: string;
  maxPlayers: number;

  questions: Question[] | null;
  currentQuestionIndex: number;

  questionSentAt: number | null;

  answersThisRound: Map<string, { answerIndex: number; scoreDelta: number }>;

  questionTimer: ReturnType<typeof setTimeout> | null;

  createdAt: number;
  lastActivityAt: number;
}
