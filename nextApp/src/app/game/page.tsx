"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import "bootstrap/dist/css/bootstrap.min.css";
import "@/styles/admin.css";

type RoomPlayer = {
  userId: string;
  displayName: string;
  score: number;
  isSpectator: boolean;
  isReady: boolean;
};

type RoomCreatedMessage = {
  type: "room:created" | "room:joined";
  payload: {
    code: string;
    players: RoomPlayer[];
  };
};

type GameQuestion = {
  questionIndex: number;
  totalQuestions: number;
  questionId: string;
  question: string;
  answers: string[];
  timerMs: number;
};

type QuestionResult = {
  questionId: string;
  correctIndex: number;
  comment?: string;
  taunt?: string;
  scores: {
    userId: string;
    displayName: string;
    scoreDelta: number;
    totalScore: number;
  }[];
};

type GameOver = {
  scores: {
    userId: string;
    displayName: string;
    totalScore: number;
  }[];
};

type TriviaServerMessage =
  | RoomCreatedMessage
  | {
      type: "room:updated" | "game:started" | "game:ready_ack" | "error";
      payload: unknown;
    }
  | {
      type: "game:question";
      payload: GameQuestion;
    }
  | {
      type: "game:question_result";
      payload: QuestionResult;
    }
  | {
      type: "game:over";
      payload: GameOver;
    };

function sendTriviaMessage(ws: WebSocket | null, type: string, payload: object) {
  ws?.send(JSON.stringify({
    type,
    ts: Date.now(),
    payload,
  }));
}

function getTriviaWsUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws/`;
}

export default function TriviaPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<GameQuestion | null>(null);
  const [lastResult, setLastResult] = useState<QuestionResult | null>(null);
  const [finalScores, setFinalScores] = useState<GameOver["scores"]>([]);
  const [connectionStatus, setConnectionStatus] = useState("Connecting to game server...");
  const wsRef = useRef<WebSocket | null>(null);

  const displayedQuestionCount = totalQuestions || activeQuestion?.totalQuestions || 0;

  function sendReady() {
    setLastResult(null);
    setGameOver(false);
    sendTriviaMessage(wsRef.current, "game:ready", {});
  }

  function sendAnswer(answerIndex: number) {
    setSelectedAnswer(answerIndex);

    if (!activeQuestion) return;

    sendTriviaMessage(wsRef.current, "game:answer", {
      questionId: activeQuestion.questionId,
      answerIndex,
    });
  }

  useEffect(() => {
    if (!activeQuestion) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeQuestion]);

  useEffect(() => {
    let closedByCleanup = false;
    const ws = new WebSocket(getTriviaWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get("mode");
      const code = params.get("code")?.trim().toUpperCase();

      if (mode === "join" && code) {
        setConnectionStatus(`Joining room ${code}...`);
        ws.send(JSON.stringify({
          type: "room:join",
          ts: Date.now(),
          payload: { code },
        }));
        return;
      }

      setConnectionStatus("Creating room...");
      ws.send(JSON.stringify({
        type: "room:create",
        ts: Date.now(),
        payload: {
          packId: "history",
          isPublic: true,
          maxPlayers: 4,
        },
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data) as TriviaServerMessage;
      console.log(message);

      if (message.type === "room:created" || message.type === "room:joined") {
        setRoomCode(message.payload.code);
        setPlayers(message.payload.players);
        setConnectionStatus(message.type === "room:created" ? "Room created" : "Room joined");
        setGameOver(false);
        setLastResult(null);
      }

      if (message.type === "room:updated") {
        const room = message.payload as { players: RoomPlayer[] };
        setPlayers(room.players);
      }

      if (message.type === "game:started") {
        setGameOver(false);
        setFinalScores([]);
        setLastResult(null);
        setConnectionStatus("Game started");
      }

      if (message.type === "game:question") {
        setActiveQuestion(message.payload);
        setCurrentQuestion(message.payload.questionIndex + 1);
        setTotalQuestions(message.payload.totalQuestions);
        setSecondsLeft(Math.ceil(message.payload.timerMs / 1000));
        setSelectedAnswer(null);
        setLastResult(null);
      }

      if (message.type === "game:question_result") {
        setActiveQuestion(null);
        setLastResult(message.payload);
      }

      if (message.type === "game:over") {
        setGameOver(true);
        setActiveQuestion(null);
        setFinalScores(message.payload.scores);
      }

      if (message.type === "error") {
        const error = message.payload as { code?: string; message?: string };
        setConnectionStatus(error.message ?? error.code ?? "Game server error");
      }
    };

    ws.onerror = (event) => {
      console.error("Trivia WebSocket error", event);
      setConnectionStatus("Could not connect to game server");
    };

    ws.onclose = (event) => {
      console.log("Trivia WebSocket closed", event.code, event.reason);
      if (!closedByCleanup) {
        setConnectionStatus(event.reason || `Connection closed (${event.code})`);
      }
    };

    return () => {
      closedByCleanup = true;
      wsRef.current = null;
      ws.close();
    };
  }, []);

  return (
    <div className="game-shell min-vh-100 w-100 text-white overflow-hidden">
      <div className="position-relative min-vh-100">
        <div className="game-bg-1 position-absolute top-0 start-0 end-0 bottom-0" />
        <div className="game-bg-2 position-absolute top-0 start-0 end-0 bottom-0" />
        <div className="game-bg-3 position-absolute top-0 start-0 end-0 bottom-0" />

        <main className="position-relative mx-auto d-flex min-vh-100 w-100 game-max-width px-3 py-3">
          <div className="d-flex w-100 gap-4 flex-column flex-lg-row align-items-stretch">
            {gameOver ? (
              <section className="game-glass flex-grow-1 d-flex align-items-center justify-content-center p-4 p-lg-5">
                <div className="text-center">
                  <h1 className="game-end-title">The End</h1>
                  <p className="mt-3 text-white-50">Thanks for playing.</p>
                  <Link href="/dashboard" className="btn game-link-btn mt-4">
                    Return to dashboard
                  </Link>
                </div>
              </section>
            ) : (
              <section className="game-glass flex-grow-1 d-flex flex-column p-4 p-lg-5 overflow-hidden">
                <div className="d-flex justify-content-center mb-3">
                  <div
                    className={`game-timer ${
                      secondsLeft > 10
                        ? "game-timer-safe"
                        : secondsLeft > 5
                        ? "game-timer-warn"
                        : "game-timer-danger"
                    }`}
                  >
                    {secondsLeft}
                  </div>
                </div>

                <div className="d-flex flex-column flex-grow-1 justify-content-between">
                  <div className="d-flex flex-grow-1 align-items-center justify-content-center">
                    <div className="text-center game-question-wrap">
                      <h1 className="game-question">
                        {activeQuestion?.question ?? lastResult?.comment ?? connectionStatus}
                      </h1>
                      <p className="mt-3 game-subtitle">
                        {activeQuestion
                          ? "Choose the correct answer below."
                          : lastResult?.taunt ?? "Press Ready when everyone has joined."}
                      </p>
                    </div>
                  </div>

                  <div className="row g-3 mt-auto">
                    {(activeQuestion?.answers ?? []).map((answer, index) => (
                      <div className="col-12 col-md-6" key={answer}>
                        <button
                          type="button"
                          onClick={() => sendAnswer(index)}
                          disabled={!activeQuestion || selectedAnswer !== null}
                          className={`btn w-100 game-answer-btn text-start ${
                            selectedAnswer === index ? "game-answer-selected" : ""
                          }`}
                        >
                          {answer}
                        </button>
                      </div>
                    ))}
                    {!activeQuestion && (
                      <div className="col-12">
                        <p className="text-white-50 text-center mb-0">
                          {roomCode ? `Share room ${roomCode} with another player.` : connectionStatus}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            <aside className="game-glass game-sidebar d-flex flex-column p-4">
              <div className="mb-4">
                <h2 className="game-sidebar-title">Players</h2>
                {roomCode && (
                  <p className="mt-2 mb-0 game-question-label">
                    Room {roomCode}
                  </p>
                )}
                <button
                  type="button"
                  className="btn dashboard-action-btn mt-3 w-100"
                  onClick={sendReady}
                  disabled={!roomCode}
                >
                  Ready
                </button>
              </div>

              <div className="d-flex flex-column gap-3 flex-grow-1">
                {players.map((player, index) => (
                  <div key={player.userId} className="game-player-row">
                    <div className="d-flex align-items-center gap-3">
                      <div className="game-player-badge">{index + 1}</div>
                      <span className="game-player-name">{player.displayName}</span>
                    </div>
                    <span className="game-player-status">
                      {player.isReady ? "Ready" : "Waiting"}
                    </span>
                  </div>
                ))}

                {players.length === 0 && (
                  <p className="text-white-50 mb-0">{connectionStatus}</p>
                )}
              </div>

              <div className="mt-4 pt-3 game-question-footer">
                <p className="game-question-label">Question</p>
                <div className="game-question-count">
                  {displayedQuestionCount ? `${currentQuestion}/${displayedQuestionCount}` : "-"}
                </div>
                {finalScores.length > 0 && (
                  <div className="mt-3 d-flex flex-column gap-2">
                    {finalScores.map((score, index) => (
                      <p key={score.userId} className="mb-0 text-white-50">
                        {index + 1}. {score.displayName}: {score.totalScore}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
