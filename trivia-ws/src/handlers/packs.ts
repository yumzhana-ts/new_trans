import type { IncomingMessage, ServerResponse } from "http";
import { getPackSummaries } from "../services/packLoader.js";

/**
 * GET /packs
 * Returns a list of available question pack summaries.
 * Consumed by the Next.js frontend to render pack selection UI.
 */
export function handlePacksRoute(_req: IncomingMessage, res: ServerResponse): void {
  const packs = getPackSummaries();

  res.writeHead(200, {
    "Content-Type": "application/json",
    // Allow your Next.js dev server to call this without CORS issues
    "Access-Control-Allow-Origin": process.env.CORS_ORIGIN ?? "*",
  });

  res.end(JSON.stringify({ packs }));
}
