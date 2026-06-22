import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  port: Number(process.env.PORT ?? 3000),
  packsDir: process.env.PACKS_DIR ?? path.resolve(__dirname, "../../trivia_packs"),
  databaseUrl: process.env.DATABASE_URL,

  questions: {
    easy:   Number(process.env.QUESTIONS_EASY   ?? 5),
    medium: Number(process.env.QUESTIONS_MEDIUM ?? 5),
    hard:   Number(process.env.QUESTIONS_HARD   ?? 5),
  },

  // Milliseconds players have to answer each question
  questionTimerMs: Number(process.env.QUESTION_TIMER_MS ?? 30_000),
} as const;
