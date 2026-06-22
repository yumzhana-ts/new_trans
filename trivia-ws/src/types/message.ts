// Envelope

export interface ClientMessage<T = unknown> {
  type: string;
  requestId?: string;
  ts: number;
  payload: T;
}

export interface ServerMessage<T = unknown> {
  type: string;
  requestId?: string;
  ts: number;
  payload: T;
}

// Client -> Server

export interface RoomCreatePayload {
  packId: string;
  isPublic: boolean;
  maxPlayers: number;
}

export interface RoomJoinPayload {
  code: string;
}

export interface AnswerPayload {
  questionId: string;
  answerIndex: number;
}

// Server -> Client

export interface PlayerDTO {
  userId: string;
  displayName: string;
  score: number;
  isSpectator: boolean;
  isReady: boolean;
}

export interface RoomDTO {
  code: string;
  isPublic: boolean;
  packId: string;
  maxPlayers: number;
  state: string;
  players: PlayerDTO[];
}

// Sent to all players when a question starts
export interface QuestionPayload {
  questionIndex: number;
  totalQuestions: number;
  questionId: string;
  question: string;
  answers: string[];
  timerMs: number;
}

// Sent to all players when a question ends (timer expired or everyone answered)
export interface QuestionResultPayload {
  questionId: string;
  correctIndex: number;    // index in the shuffled answers array the client received
  comment: string;
  taunt: string;
  scores: { userId: string; displayName: string; scoreDelta: number; totalScore: number }[];
}

// Sent to all players when the game ends
export interface GameOverPayload {
  scores: { userId: string; displayName: string; totalScore: number }[];
}
