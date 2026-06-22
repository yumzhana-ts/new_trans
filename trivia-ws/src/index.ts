import http from "http";
import { WebSocketServer } from "ws";
import { config } from "./config/index.js";
import { initPackLoader, closePackLoader } from "./services/packLoader.js";
import { startIdleCleanup } from "./services/roomManager.js";
import { authenticateWebSocket, closeAuthDb } from "./services/authDb.js";
import { upsertSession } from "./services/sessionManager.js";
import { handleHttpRequest } from "./router.js";
import { handleMessage, handleDisconnect } from "./handlers/message.js";


initPackLoader(config.packsDir);
startIdleCleanup();
const server = http.createServer(handleHttpRequest);
const wss = new WebSocketServer({ server });


wss.on("connection", async (ws, req) => {
  const pendingMessages: string[] = [];
  let authenticated = false;

  ws.on("message", (raw) => {
    const message = raw.toString();

    if (!authenticated) {
      pendingMessages.push(message);
      return;
    }

    handleMessage(ws, message).catch((err: unknown) => {
      console.error("[ws] Message handler failed:", err);
    });
  });
  ws.on("close", () => handleDisconnect(ws));
  ws.on("error", (err) => console.error("[ws] Socket error:", err));

  try {
    const user = await authenticateWebSocket(req);
    if (!user) {
      console.log("[ws] Rejected unauthorized connection");
      ws.close(1008, "Unauthorized");
      return;
    }

    const { reconnected } = upsertSession(user.id, user.username, ws);
    authenticated = true;
    console.log(`[ws] ${reconnected ? "Reconnected" : "Connected"}: ${user.username} (${user.id})`);
  } catch (error: unknown) {
    console.error("[ws] Authentication failed:", error);
    ws.close(1011, "Authentication failed");
    return;
  }

  for (const message of pendingMessages.splice(0)) {
    handleMessage(ws, message).catch((err: unknown) => {
      console.error("[ws] Message handler failed:", err);
    });
  }
});

server.listen(config.port, () => {
  console.log(`[server] Listening on port ${config.port}`);
  console.log(`[server] HTTP:      http://localhost:${config.port}`);
  console.log(`[server] WebSocket: ws://localhost:${config.port}`);
  console.log(`[server] Packs dir: ${config.packsDir}`);
  console.log(`[server] Questions:  easy=${config.questions.easy} medium=${config.questions.medium} hard=${config.questions.hard}`);
});


async function shutdown(signal: string) {
  console.log(`\n[server] ${signal} received — shutting down`);
  await closePackLoader();
  await closeAuthDb();
  wss.close(() => {
    server.close(() => {
      console.log("[server] Closed");
      process.exit(0);
    });
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
