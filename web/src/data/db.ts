import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { AppState, DraftRecord } from '../types';

interface TinyWebDB extends DBSchema {
  state: {
    key: string;
    value: AppState;
  };
  drafts: {
    key: string;
    value: DraftRecord;
  };
}

const DB_NAME = 'tiny-web';
const DB_VERSION = 1;
const STATE_KEY = 'current';
const LOCAL_BACKUP = 'tiny-web-state-v1';

let dbPromise: Promise<IDBPDatabase<TinyWebDB>> | null = null;

function db() {
  if (!dbPromise) {
    dbPromise = openDB<TinyWebDB>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains('state')) database.createObjectStore('state');
        if (!database.objectStoreNames.contains('drafts')) database.createObjectStore('drafts', { keyPath: 'key' });
      },
    });
  }
  return dbPromise;
}

export async function loadState(): Promise<AppState | null> {
  try {
    const fromDb = await (await db()).get('state', STATE_KEY);
    if (fromDb) return fromDb;
  } catch {
    // IndexedDB may be unavailable in private mode; fall through to localStorage.
  }
  try {
    const raw = localStorage.getItem(LOCAL_BACKUP);
    return raw ? (JSON.parse(raw) as AppState) : null;
  } catch {
    return null;
  }
}

export async function saveState(state: AppState): Promise<void> {
  // The synchronous backup protects the last edit before a refresh or crash.
  try {
    localStorage.setItem(LOCAL_BACKUP, JSON.stringify(state));
  } catch {
    // Ignore quota/private-mode errors; IndexedDB remains the primary store.
  }
  try {
    await (await db()).put('state', state, STATE_KEY);
  } catch {
    // The localStorage backup is still available.
  }
}

export async function saveDraft(key: string, value: unknown): Promise<void> {
  const record: DraftRecord = { key, value, updatedAt: new Date().toISOString() };
  try {
    await (await db()).put('drafts', record);
  } catch {
    try {
      localStorage.setItem(`tiny-draft:${key}`, JSON.stringify(record));
    } catch {
      // Drafts are best-effort; the main state also persists.
    }
  }
}

export async function loadDraft<T>(key: string): Promise<T | null> {
  try {
    const record = await (await db()).get('drafts', key);
    if (record) return record.value as T;
  } catch {
    // Fall through.
  }
  try {
    const raw = localStorage.getItem(`tiny-draft:${key}`);
    return raw ? (JSON.parse(raw) as DraftRecord).value as T : null;
  } catch {
    return null;
  }
}

export async function deleteDraft(key: string): Promise<void> {
  try {
    await (await db()).delete('drafts', key);
  } catch {
    // Ignore.
  }
  localStorage.removeItem(`tiny-draft:${key}`);
}

export async function clearLocalData(): Promise<void> {
  localStorage.removeItem(LOCAL_BACKUP);
  try {
    await (await db()).clear('state');
    await (await db()).clear('drafts');
  } catch {
    // Ignore.
  }
}
