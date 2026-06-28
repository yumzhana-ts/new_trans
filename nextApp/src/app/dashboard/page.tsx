"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "bootstrap/dist/css/bootstrap.min.css";
import "@/styles/admin.css";

// profile
import { QRCodeSVG } from "qrcode.react";
import { useProfile } from "@/hooks/useProfile";
import AuthHomeNav from "@/components/AuthHomeNav";

type Pack = {
  id: string;
  name: string;
  questionCount: {
    easy: number;
    medium: number;
    hard: number;
    total: number;
  };
};

type RoomPlayer = {
  userId: string;
  displayName: string;
  score: number;
  isSpectator: boolean;
  isReady: boolean;
};

type Room = {
  code: string;
  isPublic: boolean;
  packId: string;
  maxPlayers: number;
  state: string;
  players: RoomPlayer[];
};

export default function Dashboard() {
  const router = useRouter();
  const [activeView, setActiveView] = useState("new_game");
  const [roomCode, setRoomCode] = useState("");
  const [packs, setPacks] = useState<Pack[]>([]);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);

  // profile
  const { user, loading, error, updateProfile, deleteProfile } = useProfile();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
  const [twoFactorUrl, setTwoFactorUrl] = useState<string | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorMessage, setTwoFactorMessage] = useState<string | null>(null);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/ws/packs")
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setPacks(data.packs ?? []))
      .catch(console.error);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function createGame() {
    if (!selectedPack) return;
    router.push(`/game?mode=create&packId=${encodeURIComponent(selectedPack)}`);
  }

  function joinGame(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const code = roomCode.trim().toUpperCase();
    if (!code) return;

    router.push(`/game?mode=join&code=${encodeURIComponent(code)}`);
  }

  function getDashboardWsUrl() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/ws/`;
  }

  useEffect(() => {
    let closedByCleanup = false;
    const ws = new WebSocket(getDashboardWsUrl());
    wsRef.current = ws;

    ws.onerror = (event) => {
      console.error("Dashboard WebSocket error", event);
    };

    ws.onclose = (event) => {
      console.log("Dashboard WebSocket closed", event.code, event.reason);
      if (!closedByCleanup) {
        console.warn(event.reason || `Connection closed (${event.code})`);
      }
    };

    return () => {
      closedByCleanup = true;
      wsRef.current = null;
      ws.close();
    };
  }, []);

  const refreshRooms = useCallback(() => {
    const ws = wsRef.current;
    if (!ws) return;

    const requestId = crypto.randomUUID();

    const handleMessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "room:list" && msg.requestId === requestId) {
          setRooms(msg.payload.rooms ?? []);
          ws.removeEventListener("message", handleMessage);
        }
      } catch (err) {
        console.error("WS parse error:", err);
      }
    };

    const sendRoomList = () => {
      ws.send(
        JSON.stringify({
          type: "room:list",
          requestId,
          ts: Date.now(),
          payload: {},
        })
      );
    };

    ws.addEventListener("message", handleMessage);

    if (ws.readyState === WebSocket.OPEN) {
      sendRoomList();
    } else {
      ws.addEventListener("open", sendRoomList, { once: true });
    }

    return () => {
      ws.removeEventListener("message", handleMessage);
    };
  }, []);

  useEffect(() => {
    if (activeView !== "join_game") return;
    const cleanup = refreshRooms();
    return cleanup;
  }, [activeView, refreshRooms]);

  //profile
  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
      setTwoFactorEnabled(user.two_factor_enabled);
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ username });
  };

  const handleDeleteProfile = async () => {
    if (!confirm("Are you sure you want to delete your profile?")) return;
    await deleteProfile();
    await logout();
    window.location.href = "/";
  };

  const handleTwoFactorSetup = async () => {
    setTwoFactorLoading(true);
    setTwoFactorError(null);
    setTwoFactorMessage(null);
    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setTwoFactorError(data.error || "Unable to start 2FA setup.");
        return;
      }
      setTwoFactorSecret(data.secret);
      setTwoFactorUrl(data.otpauth_url);
      setTwoFactorMessage(
        "2FA secret created. Add it to your authenticator app, then enter the current code to enable it."
      );
    } catch {
      setTwoFactorError("Unable to start 2FA setup.");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleTwoFactorEnable = async () => {
    setTwoFactorLoading(true);
    setTwoFactorError(null);
    setTwoFactorMessage(null);
    try {
      const res = await fetch("/api/auth/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: twoFactorCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTwoFactorError(data.error || "Unable to enable 2FA.");
        return;
      }
      setTwoFactorEnabled(true);
      setTwoFactorSecret(null);
      setTwoFactorUrl(null);
      setTwoFactorCode("");
      setTwoFactorMessage(data.message || "2FA enabled successfully.");
    } catch {
      setTwoFactorError("Unable to enable 2FA.");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleTwoFactorDisable = async () => {
    setTwoFactorLoading(true);
    setTwoFactorError(null);
    setTwoFactorMessage(null);
    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: twoFactorCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTwoFactorError(data.error || "Unable to disable 2FA.");
        return;
      }
      setTwoFactorEnabled(false);
      setTwoFactorCode("");
      setTwoFactorSecret(null);
      setTwoFactorUrl(null);
      setTwoFactorMessage(data.message || "2FA disabled successfully.");
    } catch {
      setTwoFactorError("Unable to disable 2FA.");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  useEffect(() => {
    const view = new URLSearchParams(window.location.search).get("view");

    if (view === "profile") {
      setActiveView("profile");
    }
  }, []);

  return (
    <div className="dashboard-shell min-vh-100 w-100 text-white overflow-hidden">
      <div className="position-relative min-vh-100">
        <div className="dashboard-bg-1 position-absolute top-0 start-0 end-0 bottom-0" />
        <div className="dashboard-bg-2 position-absolute top-0 start-0 end-0 bottom-0" />
        <div className="dashboard-bg-3 position-absolute top-0 start-0 end-0 bottom-0" />

        <main className="position-relative mx-auto d-flex min-vh-100 w-100 dashboard-max-width px-3 py-3">
          <div className="d-flex w-100 gap-4 flex-column flex-lg-row">
            <aside className="dashboard-glass dashboard-sidebar d-flex flex-column p-4">
              <AuthHomeNav variant="dark" />
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

                {user?.role === "admin" && (
                  <Link href="/admin/users" className="btn dashboard-nav-btn text-start">
                    Admin Panel
                  </Link>
                )}
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
              {/* {activeView === "profile" && (
                <div className="dashboard-content text-body-secondary">
                  <h1 className="dashboard-title">Profile</h1>
                  <p className="text-white/80">This is the profile content.</p>
                </div>
              )} */}

              {activeView === "profile" && (
                <div className="dashboard-content text-white">
                  {loading && <div className="text-center mt-5">Loading...</div>}
                  {error && <div className="alert alert-danger mt-5 text-center">{error}</div>}
                  {!loading && !error && user && (
                    <div className="d-flex justify-content-start align-items-start">
                      {/* <div className="card p-4 shadow" style={{ width: "100%", maxWidth: "520px" }}> */}
                    <div
                      className="dashboard-hide-scrollbar"
                      style={{
                        width: "100%",
                        maxWidth: "520px",
                        maxHeight: "80vh",
                        overflowY: "auto",
                        paddingRight: "0.5rem",
                      }}
                    >
                      <h3 className="dashboard-title mb-4">My Profile</h3>

                      <form onSubmit={handleUpdateProfile}>
                        <div className="mb-3">
                          <label className="form-label">Username</label>
                          <input
                            type="text"
                            className="form-control"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label">Email</label>
                          <input
                            type="email"
                            className="form-control"
                            value={email}
                            readOnly
                            disabled
                          />
                          <small className="text-white-50">
                            This email is used for login and account recovery, so it cannot be changed here.
                          </small>
                        </div>

                        <button
                          type="submit"
                          className="btn dashboard-action-btn w-100"
                          disabled={loading}
                        >
                          {loading ? <span className="spinner-border spinner-border-sm" /> : "Update Profile"}
                        </button>
                      </form>

                      <hr />

                      <div className="mb-3">
                        <h5 className="mb-2">Password</h5>
                        <p className="text-white-50 small mb-2">
                          To change or set your password, use the password reset flow with your account email.
                        </p>
                        <Link href="/reset-password" className="btn dashboard-link-btn w-100 text-center">
                          Change Password
                        </Link>
                      </div>

                      <hr />

                      <div className="mb-3">
                        <h5 className="mb-2">Two-Factor Authentication</h5>
                        {twoFactorError && <div className="alert alert-danger py-2">{twoFactorError}</div>}
                        {twoFactorMessage && <div className="alert alert-success py-2">{twoFactorMessage}</div>}

                        {!twoFactorEnabled && !twoFactorSecret && (
                          <button
                            className="btn dashboard-link-btn w-100 text-center mb-2"
                            onClick={handleTwoFactorSetup}
                            disabled={twoFactorLoading}
                            type="button"
                          >
                            {twoFactorLoading ? "Preparing…" : "Set up 2FA"}
                          </button>
                        )}

                        {twoFactorSecret && (
                          <div className="mb-3">
                            {twoFactorUrl && (
                              <div className="text-center mb-3">
                                <div className="small text-white-50 mb-2">Scan with your authenticator app</div>
                                <div className="d-inline-block bg-white p-3 rounded">
                                  <QRCodeSVG value={twoFactorUrl} size={180} />
                                </div>
                              </div>
                            )}
                            <div className="small text-white-50 mb-2">Manual setup key</div>
                            <div
                              className="form-control mb-2"
                              style={{ fontFamily: "monospace", wordBreak: "break-all" }}
                            >
                              {twoFactorSecret}
                            </div>
                          </div>
                        )}

                        {(twoFactorSecret || twoFactorEnabled) && (
                          <div className="mb-3">
                            <label className="form-label">
                              {twoFactorEnabled ? "Current 2FA code to disable" : "Current 2FA code to enable"}
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={twoFactorCode}
                              onChange={(e) => setTwoFactorCode(e.target.value)}
                              inputMode="numeric"
                              placeholder="123456"
                            />
                          </div>
                        )}

                        {twoFactorSecret && !twoFactorEnabled && (
                          <button
                            className="btn dashboard-action-btn w-100 mb-2"
                            onClick={handleTwoFactorEnable}
                            disabled={twoFactorLoading || !twoFactorCode.trim()}
                            type="button"
                          >
                            {twoFactorLoading ? "Enabling…" : "Enable 2FA"}
                          </button>
                        )}

                        {twoFactorEnabled && (
                          <button
                            className="btn dashboard-link-btn text-danger w-100 mb-2"
                            onClick={handleTwoFactorDisable}
                            disabled={twoFactorLoading || !twoFactorCode.trim()}
                            type="button"
                          >
                            {twoFactorLoading ? "Disabling…" : "Disable 2FA"}
                          </button>
                        )}
                      </div>

                      <hr />

                      <button
                        className="btn dashboard-action-btn text-danger w-100"
                        onClick={handleDeleteProfile}
                        disabled={loading}
                        type="button"
                      >
                        Delete Profile
                      </button>
                    </div>
                    </div>
                  )}
                </div>
              )}

              {activeView === "new_game" && (
                <div className="dashboard-content text-white">
                  <h1 className="dashboard-title">New Game</h1>
                  <p className="text-white/80">Pick a game to start.</p>
                  <div
                    className="dashboard-hide-scrollbar"
                    style={{ maxHeight: "40vh", overflowY: "auto" }}
                  >
                    <div className="row g-3">
                      {packs.map((pack) => (
                        <div key={pack.id} className="col-12 col-md-6 col-lg-4">
                          <button
                            type="button"
                            onClick={() => setSelectedPack(pack.id)}
                            className={`w-100 text-start dashboard-pack p-3 h-100 ${
                              selectedPack === pack.id ? "dashboard-pack-selected" : ""
                            }`}
                          >
                            <h5 className="text-white">{pack.name}</h5>
                            <p className="text-white/70 mb-2">
                              Questions: {pack.questionCount.total}
                            </p>
                            <small className="text-white/50">
                              Easy: {pack.questionCount.easy} | Medium: {pack.questionCount.medium} | Hard: {pack.questionCount.hard}
                            </small>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={createGame}
                    disabled={!selectedPack}
                    className={`btn dashboard-action-btn mt-3 ${!selectedPack ? "disabled" : ""}`}
                  >
                    Create Game
                  </button>
                </div>
              )}

              {activeView === "join_game" && (
                <div className="dashboard-content text-white">
                  <h1 className="dashboard-title">Join Game</h1>
                  <p className="text-white/80">Enter the room code from the host.</p>

                  <div style={{ maxWidth: "420px" }}>
                    <form onSubmit={joinGame} className="d-flex flex-column gap-3 mt-3">
                      <input
                        type="text"
                        value={roomCode}
                        onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                        className="form-control w-100"
                        maxLength={4}
                        placeholder="Room code"
                      />
                      <button type="submit" className="btn dashboard-action-btn w-100">
                        Join Game
                      </button>
                    </form>
                  </div>
                  <p className="text-white/80 mt-3">Or you can choose from public games.</p>
                  <div className="dashboard-hide-scrollbar" style={{ maxHeight: "300px" }}>
                    <div className="row g-3">
                      {rooms.map((room) => (
                        <div key={room.code} className="col-12 col-md-6 col-lg-4">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/game?mode=join&code=${encodeURIComponent(room.code)}`)
                            }
                            className="w-100 text-start dashboard-pack p-3 h-100"
                          >
                            <h5 className="text-white">Room {room.code}</h5>
                            <p className="text-white/70 mb-2">
                              Pack: {room.packId}
                              <br />
                              Players: {room.players.length}/{room.maxPlayers}
                              <br />
                              State: {room.state}
                            </p>
                            <small className="text-white/50">Public</small>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
