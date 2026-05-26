import { createSeed, SEED_VERSION } from "./seed";
import type { DBShape, TableName } from "./types";

const DB_KEY = "de_local_db_v1";
const VERSION_KEY = "de_local_db_version";

let memoryDB: DBShape | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function loadFromStorage(): DBShape | null {
  if (!isBrowser()) return null;
  try {
    const version = localStorage.getItem(VERSION_KEY);
    if (version !== String(SEED_VERSION)) return null;
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DBShape;
  } catch {
    return null;
  }
}

function persist(db: DBShape) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    localStorage.setItem(VERSION_KEY, String(SEED_VERSION));
  } catch {
    // Quota exceeded — drop session/transient state and retry once
    try {
      const trimmed = { ...db, current_session: null };
      localStorage.setItem(DB_KEY, JSON.stringify(trimmed));
    } catch {
      /* still failing — give up silently */
    }
  }
}

export function getDB(): DBShape {
  if (memoryDB) return memoryDB;
  const fromStorage = loadFromStorage();
  memoryDB = fromStorage ?? createSeed();
  if (!fromStorage) persist(memoryDB);
  return memoryDB;
}

export function mutate(fn: (db: DBShape) => void) {
  const db = getDB();
  fn(db);
  persist(db);
}

export function getTable<K extends TableName>(name: K): DBShape[K] {
  return getDB()[name];
}

export function resetDB() {
  memoryDB = createSeed();
  persist(memoryDB);
}

export function clearSession() {
  mutate((db) => {
    db.current_session = null;
  });
}

export function setSession(userId: string) {
  mutate((db) => {
    db.current_session = {
      access_token: `local-token-${userId}-${Date.now()}`,
      refresh_token: `local-refresh-${userId}`,
      user_id: userId,
      expires_at: Date.now() + 60 * 60 * 1000,
    };
  });
}

export function currentSession() {
  return getDB().current_session;
}

export function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}
