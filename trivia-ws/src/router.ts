import type { IncomingMessage, ServerResponse } from "http";
import { handlePacksRoute } from "./handlers/packs.js";

export function handleHttpRequest(req: IncomingMessage, res: ServerResponse): void {
  const url = req.url ?? "/";
  const method = req.method ?? "GET";

  if (method === "GET" && url === "/packs") {
    return handlePacksRoute(req, res);
  }

  if (method === "GET" && url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", ts: Date.now() }));
    return;
  }

  // 404
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
}
