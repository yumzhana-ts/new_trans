type Entry = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 60_000; // 1 minute
const MAX_ATTEMPTS = 5;

const attempts = new Map<string, Entry>();

export function checkLoginRateLimit(
  ip: string,
  userIdentifier?: string | number
): boolean {
  // Ensure key is always a string
  const key = userIdentifier ? `${ip}:${userIdentifier}` : ip;
  const now = Date.now();

  const entry = attempts.get(key);

  if (!entry || now > entry.resetAt) {
    attempts.set(key, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    return true;
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return false;
  }

  entry.count++;
  return true;
}

export function clearLoginRateLimit(ip: string, userIdentifier?: string | number) {
  const key = userIdentifier ? `${ip}:${userIdentifier}` : ip;
  attempts.delete(key);
}