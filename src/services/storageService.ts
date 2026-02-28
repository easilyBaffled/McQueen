import { STORAGE_VERSION } from '../constants';

export const CURRENT_VERSION: number = STORAGE_VERSION;

interface VersionedEntry<T> {
  version: number;
  data: T;
}

function isVersionedEntry(value: unknown): value is VersionedEntry<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'version' in value &&
    'data' in value &&
    typeof (value as VersionedEntry<unknown>).version === 'number'
  );
}

function getStorage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function read<T>(key: string, defaultValue: T): T {
  const storage = getStorage();
  if (!storage) return defaultValue;

  try {
    const raw = storage.getItem(key);
    if (raw === null || raw === '') return defaultValue;

    const parsed: unknown = JSON.parse(raw);

    if (isVersionedEntry(parsed)) {
      if (parsed.version <= 0 || parsed.version > CURRENT_VERSION) {
        return defaultValue;
      }
      if (parsed.data === null || parsed.data === undefined) {
        return defaultValue;
      }
      return parsed.data as T;
    }

    // Legacy entry (no version wrapper) — return raw parsed value
    if (parsed === null || parsed === undefined) {
      return defaultValue;
    }
    return parsed as T;
  } catch {
    return defaultValue;
  }
}

export function write<T>(key: string, value: T): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    const entry: VersionedEntry<T> = {
      version: CURRENT_VERSION,
      data: value,
    };
    storage.setItem(key, JSON.stringify(entry));
  } catch {
    // Quota exceeded or other storage error — fail silently
  }
}

export function remove(key: string): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.removeItem(key);
  } catch {
    // Fail silently
  }
}
