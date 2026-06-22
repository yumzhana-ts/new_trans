import type { Room, Player } from "../types/room.js";
import type { Question } from "../types/pack.js";
import type { QuestionPayload, QuestionResultPayload, GameOverPayload } from "../types/message.js";
import { config } from "../config/index.js";
import { broadcast } from "./roomManager.js";
import { buildQuestionQueue, getRoom, destroyRoom, toRoomDTO } from "./roomManager.js";

// Ready system

/**
 * Marks a player as ready. Returns true if all non-spectator players
 * are now ready and the game should start.
 */
export function setReady(room: Room, userId: string): boolean {
  const player = room.players.get(userId);
  if (!player || player.isSpectator) return false;

  player.isReady = true;

  // Broadcast updated ready state to the room
  broadcast(room.code, {
    type: "room:updated",
    ts: Date.now(),
    payload: toRoomDTO(room),
  });

  const activePlayers = activePlyrs(room);
  return activePlayers.length > 0 && activePlayers.every((p) => p.isReady);
}

// Game loop

export function startGame(room: Room): void {
  const questions = buildQuestionQueue(room.packId);
  if (!questions || questions.length === 0) {
    broadcast(room.code, {
      type: "error",
      ts: Date.now(),
      payload: { code: "NO_QUESTIONS", message: "Pack has no questions" },
    });
    return;
  }

  room.state = "in_progress";
  room.questions = questions;
  room.currentQuestionIndex = 0;
  room.lastActivityAt = Date.now();

  // Promote spectators to active players at game start
  for (const player of room.players.values()) {
    player.isSpectator = false;
    player.isReady = false;
    player.score = 0;
  }

  console.log(`[game] Room ${room.code} — game started (${questions.length} questions)`);

  broadcast(room.code, {
    type: "game:started",
    ts: Date.now(),
    payload: { totalQuestions: questions.length },
  });

  sendQuestion(room);
}

function sendQuestion(room: Room): void {
  const { questions, currentQuestionIndex } = room;
  if (!questions) return;

  const question = questions[currentQuestionIndex];
  room.answersThisRound = new Map();
  room.questionSentAt = Date.now();
  room.lastActivityAt = Date.now();

  // Shuffle answer display order — server owns this so correctIndex in the
  // result payload refers to the shuffled position, not always index 0
  const { shuffledAnswers, correctIndex } = shuffleAnswers(question.answers);

  // Store the shuffled correct index on the question for result resolution
  (question as Question & { _correctIndex: number })._correctIndex = correctIndex;

  const payload: QuestionPayload = {
    questionIndex: currentQuestionIndex,
    totalQuestions: questions.length,
    questionId: question.id,
    question: question.question,
    answers: shuffledAnswers,
    timerMs: config.questionTimerMs,
  };

  broadcast(room.code, { type: "game:question", ts: Date.now(), payload });

  // Auto-advance when timer expires
  room.questionTimer = setTimeout(() => {
    resolveQuestion(room, question, correctIndex);
  }, config.questionTimerMs);
}

function resolveQuestion(room: Room, question: Question, correctIndex: number): void {
  if (room.questionTimer) {
    clearTimeout(room.questionTimer);
    room.questionTimer = null;
  }

  // Build score deltas and apply them
  const scores = Array.from(room.players.values())
    .filter((p) => !p.isSpectator)
    .map((player) => {
      const answer = room.answersThisRound.get(player.userId);
      const scoreDelta = answer?.scoreDelta ?? 0;
      player.score += scoreDelta;
      return {
        userId: player.userId,
        displayName: player.displayName,
        scoreDelta,
        totalScore: player.score,
      };
    });

  const result: QuestionResultPayload = {
    questionId: question.id,
    correctIndex,
    comment: question.comment,
    taunt: question.taunt,
    scores,
  };

  broadcast(room.code, { type: "game:question_result", ts: Date.now(), payload: result });

  room.lastActivityAt = Date.now();

  // Advance to next question after a short reveal delay
  const REVEAL_DELAY_MS = 3_000;

  setTimeout(() => {
    room.currentQuestionIndex++;

    if (room.currentQuestionIndex >= room.questions!.length) {
      endGame(room);
    } else {
      sendQuestion(room);
    }
  }, REVEAL_DELAY_MS);
}

function endGame(room: Room): void {
  room.state = "voting";
  room.lastActivityAt = Date.now();

  const scores = Array.from(room.players.values())
    .filter((p) => !p.isSpectator)
    .sort((a, b) => b.score - a.score)
    .map((p) => ({ userId: p.userId, displayName: p.displayName, totalScore: p.score }));

  const payload: GameOverPayload = { scores };
  broadcast(room.code, { type: "game:over", ts: Date.now(), payload });

  console.log(`[game] Room ${room.code} — game over. Winner: ${scores[0]?.displayName ?? "nobody"}`);

  // Reset ready state for next round vote
  for (const player of room.players.values()) {
    player.isReady = false;
  }
}

// Answer submission

export function submitAnswer(
  room: Room,
  userId: string,
  questionId: string,
  answerIndex: number
): "ok" | "wrong_question" | "already_answered" | "not_your_turn" {
  if (room.state !== "in_progress") return "not_your_turn";

  const { questions, currentQuestionIndex, questionSentAt } = room;
  if (!questions || !questionSentAt) return "not_your_turn";

  const currentQuestion = questions[currentQuestionIndex];
  if (currentQuestion.id !== questionId) return "wrong_question";

  if (room.answersThisRound.has(userId)) return "already_answered";

  const elapsed = Date.now() - questionSentAt;
  const correct = answerIndex === (currentQuestion as Question & { _correctIndex: number })._correctIndex;
  const scoreDelta = correct
    ? Math.max(0, Math.round(1000 * (1 - elapsed / config.questionTimerMs)))
    : 0;

  room.answersThisRound.set(userId, { answerIndex, scoreDelta });
  room.lastActivityAt = Date.now();

  // If everyone active has answered, resolve early
  const activePlayers = activePlyrs(room).filter((p) => !p.isSpectator);
  const allAnswered = activePlayers.every((p) => room.answersThisRound.has(p.userId));

  if (allAnswered) {
    const correctIndex = (currentQuestion as Question & { _correctIndex: number })._correctIndex;
    resolveQuestion(room, currentQuestion, correctIndex);
  }

  return "ok";
}

// Helpers

function activePlyrs(room: Room): Player[] {
  return Array.from(room.players.values()).filter((p) => !p.isSpectator);
}

function shuffleAnswers(answers: [string, string, string, string]): {
  shuffledAnswers: string[];
  correctIndex: number;
} {
  // answers[0] is always correct per pack schema
  const indices = [0, 1, 2, 3];
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const shuffledAnswers = indices.map((i) => answers[i]);
  const correctIndex = indices.indexOf(0); // where did index 0 (correct) land?
  return { shuffledAnswers, correctIndex };
}

// Cleanup

/** Call when a room is destroyed to cancel any pending timers */
export function clearGameTimers(room: Room): void {
  if (room.questionTimer) {
    clearTimeout(room.questionTimer);
    room.questionTimer = null;
  }
}
