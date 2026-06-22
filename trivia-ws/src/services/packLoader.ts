import fs from "fs";
import path from "path";
import chokidar from "chokidar";
import type { FSWatcher } from "chokidar";
import type { Pack, PackSummary } from "../types/pack.js";

let watcher: FSWatcher | null = null;
let absoluteDir: string | null = null;

const packsById = new Map<string, Pack>();

function summarise(pack: Pack): PackSummary {
  return {
    id: pack.id,
    name: pack.name,
    questionCount: {
      easy: pack.easy.length,
      medium: pack.medium.length,
      hard: pack.hard.length,
      total: pack.easy.length + pack.medium.length + pack.hard.length,
    },
  };
}

function loadFile(filePath: string): void {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const pack = JSON.parse(raw) as Pack;

    if (!pack.id || !pack.name) {
      console.warn(`[packs] Skipping ${filePath} — missing required fields (id, name)`);
      return;
    }

    packsById.set(pack.id, pack);
    console.log(`[packs] Loaded "${pack.name}" (${pack.id}) from ${path.basename(filePath)}`);
  } catch (err) {
    console.error(`[packs] Failed to load ${filePath}:`, err);
  }
}

function unloadFile(filePath: string): void {
  // We don't know the pack id from the path alone, so scan for it
  for (const [id, pack] of packsById) {
    // Store the originating file path on load so we can match it here
    const meta = packMeta.get(id);
    if (meta?.filePath === filePath) {
      packsById.delete(id);
      packMeta.delete(id);
      console.log(`[packs] Unloaded pack "${pack.name}" (${id})`);
      return;
    }
  }
}

// Separate map to track which file each pack came from
const packMeta = new Map<string, { filePath: string }>();

function loadFileTracked(filePath: string): void {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const pack = JSON.parse(raw) as Pack;

    if (!pack.id || !pack.name) {
      console.warn(`[packs] Skipping ${filePath} — missing required fields (id, name)`);
      return;
    }

    packsById.set(pack.id, pack);
    packMeta.set(pack.id, { filePath });
    console.log(`[packs] Loaded "${pack.name}" (${pack.id}) from ${path.basename(filePath)}`);
  } catch (err) {
    console.error(`[packs] Failed to load ${filePath}:`, err);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** All loaded packs, full data. Used internally by game logic. */
export function getAllPacks(): Pack[] {
  return Array.from(packsById.values());
}

/** Full pack by id. Returns undefined if not found. */
export function getPackById(id: string): Pack | undefined {
  return packsById.get(id);
}

/** Lightweight summaries for the /packs HTTP endpoint. */
export function getPackSummaries(): PackSummary[] {
  return getAllPacks().map(summarise);
}

/**
 * Loads all JSON files from packsDir and starts a file watcher.
 * Call once at server startup.
 */
export function initPackLoader(packsDir: string): void {
  const absoluteDir = path.resolve(packsDir);

  // Initial synchronous load
  const files = fs.readdirSync(absoluteDir).filter(f => f.endsWith(".json"));
  console.log(`[packs] Found ${files.length} pack(s) on startup`);
  for (const file of files) {
    loadFileTracked(path.join(absoluteDir, file));
  }

  // Watch the directory, filter to .json only
  const watcher = chokidar.watch(absoluteDir, {
    persistent: true,
    ignoreInitial: true,
    ignored: (filePath: string, stats?: fs.Stats) =>
		stats?.isFile() === true && !filePath.endsWith(".json"),
  });

  watcher
    .on("add", loadFileTracked)
    .on("change", loadFileTracked)
    .on("unlink", unloadFile)
    .on("error", (err) => console.error("[packs] Watcher error:", err));

  console.log(`[packs] Watching ${absoluteDir} for changes`);
}

export async function closePackLoader(): Promise<void> {
	if (watcher && absoluteDir) {
		await watcher.unwatch(absoluteDir);
		await watcher.close();
		watcher = null;
	}
}
