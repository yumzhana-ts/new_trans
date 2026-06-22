"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "bootstrap/dist/css/bootstrap.min.css";
import "@/styles/admin.css";

export default function Dashboard() {
  const router = useRouter();
  const [activeView, setActiveView] = useState("new_game");
  const [roomCode, setRoomCode] = useState("");

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function joinGame(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const code = roomCode.trim().toUpperCase();
    if (!code) return;

    router.push(`/game?mode=join&code=${encodeURIComponent(code)}`);
  }

  return (
    <div className="dashboard-shell min-vh-100 w-100 text-white overflow-hidden">
      <div className="position-relative min-vh-100">
        <div className="dashboard-bg-1 position-absolute top-0 start-0 end-0 bottom-0" />
        <div className="dashboard-bg-2 position-absolute top-0 start-0 end-0 bottom-0" />
        <div className="dashboard-bg-3 position-absolute top-0 start-0 end-0 bottom-0" />

        <main className="position-relative mx-auto d-flex min-vh-100 w-100 dashboard-max-width px-3 py-3">
          <div className="d-flex w-100 gap-4 flex-column flex-lg-row">
            <aside className="dashboard-glass dashboard-sidebar d-flex flex-column p-4">
              <div className="mt-4 d-flex flex-column gap-2">
                <button
                  onClick={() => setActiveView("profile")}
                  className={`btn dashboard-nav-btn text-start ${
                    activeView === "profile"
					? "dashboard-nav-active"
					: ""
                  }`}
                >
                  Profile
                </button>

                <button
                  onClick={() => setActiveView("new_game")}
                  className={`btn dashboard-nav-btn text-start ${
                    activeView === "new_game"
					? "dashboard-nav-active"
					: ""
                  }`}
                >
                  New Game
                </button>

                <button
                  onClick={() => setActiveView("join_game")}
                  className={`btn dashboard-nav-btn text-start ${
                    activeView === "join_game"
					? "dashboard-nav-active"
					: ""
                  }`}
                >
                  Join Game
                </button>
              </div>

              <div className="mt-auto pt-4">
                <div className="d-flex flex-column gap-2">
                  <button
                    type="button"
                    onClick={logout}
                    className="btn dashboard-link-btn text-danger"
                  >
                    Logout
                  </button>

                  <Link href="/legal" className="btn dashboard-link-btn text-white">
                    Privacy Policy/Terms of Use
                  </Link>
                </div>
              </div>
            </aside>

            <section className="dashboard-glass flex-grow-1 p-4 p-lg-5">
              {activeView === "profile" && (
                <div className="dashboard-content text-body-secondary">
                  <h1 className="dashboard-title">Profile</h1>
                  <p className="text-white/80">This is the profile content.</p>
                </div>
              )}

              {activeView === "new_game" && (
                <div className="dashboard-content text-body-secondary">
                  <h1 className="dashboard-title">New Game</h1>
                  <p className="text-white/80">This is the new game content.</p>

                  <Link href="/game?mode=create" className="btn dashboard-action-btn mt-2">
                    Create Game
                  </Link>
                </div>
              )}

              {activeView === "join_game" && (
                <div className="dashboard-content text-body-secondary">
                  <h1 className="dashboard-title">Join Game</h1>
                  <p className="text-white/80">Enter the room code from the host.</p>

                  <form onSubmit={joinGame} className="d-flex flex-column gap-3 mt-3">
                    <input
                      type="text"
                      value={roomCode}
                      onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                      className="form-control"
                      maxLength={4}
                      placeholder="Room code"
                    />
                    <button type="submit" className="btn dashboard-action-btn">
                      Join Game
                    </button>
                  </form>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
