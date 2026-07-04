import fs from "fs";
import path from "path";

const LOG_PATH = process.env.BACKEND_LOG_PATH || "/var/log/backend/app.log";

type LogPayload = Record<string, unknown>;

function writeLog(data: LogPayload) {
  try {
    fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
    fs.appendFileSync(LOG_PATH, JSON.stringify(data) + "\n");
  } catch (err) {
    console.error("Failed to write backend log", err);
  }
}

export const logger = {
  info: (data: LogPayload) => {
    writeLog({ level: "info", ...data, timestamp: new Date().toISOString() });
  },

  error: (data: LogPayload) => {
    writeLog({ level: "error", ...data, timestamp: new Date().toISOString() });
  },
};
