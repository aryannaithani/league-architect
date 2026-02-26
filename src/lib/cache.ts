const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export function getCache<T>(key: string): CacheEntry<T> | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry<T>;
  } catch {
    return null;
  }
}

export function setCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

export function isCacheStale(key: string): boolean {
  const entry = getCache(key);
  if (!entry) return true;
  return Date.now() - entry.timestamp > CACHE_TTL;
}

export function clearAllCache(): void {
  const keys = ["league_players", "league_matches", "league_state", "league_knockout"];
  keys.forEach((k) => localStorage.removeItem(k));
}

export const CACHE_KEYS = {
  players: "league_players",
  matches: "league_matches",
  state: "league_state",
  knockout: "league_knockout",
} as const;
