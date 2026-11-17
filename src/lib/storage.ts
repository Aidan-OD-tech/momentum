import type { MomentumData } from "@/lib/types";

// Everything Momentum keeps lives under one key, as one versioned object (handoff "Behavior notes").
export const STORAGE_KEY = "momentum:v1";
// Where stored text we couldn't read is copied before starting fresh, so it is never silently lost.
export const UNREADABLE_KEY = "momentum:v1:unreadable";

// `ok: false` means storage can't be used this session (private mode, disabled, full, or a backup failed).
// The app then keeps working in memory and never writes.
export type LoadResult = { data: MomentumData | null; ok: boolean };

// Reading window.localStorage itself can throw (for example when site data is blocked).
function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function parse(raw: string): MomentumData | null {
  try {
    const value = JSON.parse(raw);
    if (value && value.version === 1 && Array.isArray(value.assignments)) return value as MomentumData;
    return null;
  } catch {
    return null;
  }
}

export function load(storage: Storage | null = browserStorage()): LoadResult {
  if (!storage) return { data: null, ok: false };
  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return { data: null, ok: false };
  }
  if (raw === null) return { data: null, ok: true };

  const data = parse(raw);
  if (data) return { data, ok: true };

  // Unreadable or unknown version: back it up before anything else. If the backup fails,
  // don't write at all this session, so the original stays where it is.
  try {
    storage.setItem(UNREADABLE_KEY, raw);
    return { data: null, ok: true };
  } catch {
    return { data: null, ok: false };
  }
}

// True only when the write succeeded.
export function save(data: MomentumData, storage: Storage | null = browserStorage()): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
