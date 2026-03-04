import { STORAGE_VERSION } from '../constants';

export const CURRENT_VERSION: number = STORAGE_VERSION;

interface VersionedEntry<T> {
  version: number;
  data: T;
}

type Migrator = (data: unknown) => unknown;

const migrations: Map<number, Migrator> = new Map();

export function registerMigration(
  fromVersion: number,
  migrator: Migrator,
): void {
  if (fromVersion <= 0 || !Number.isInteger(fromVersion)) return;
  migrations.set(fromVersion, migrator);
}

export function clearMigrations(): void {
  migrations.clear();
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

export function read<T>(
  key: string,
  defaultValue: T,
  validator?: (v: unknown) => v is T,
): T {
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

      let data: unknown = parsed.data;
      if (data === null || data === undefined) {
        return defaultValue;
      }

      if (parsed.version < CURRENT_VERSION) {
        try {
          for (let v = parsed.version; v < CURRENT_VERSION; v++) {
            const migrator = migrations.get(v);
            if (!migrator) {
              console.warn(
                `Missing storage migration for version ${v} → ${v + 1}. Returning default value.`,
              );
              return defaultValue;
            }
            data = migrator(data);
            if (data === null || data === undefined) {
              return defaultValue;
            }
          }
        } catch {
          return defaultValue;
        }
      }

      if (validator && !validator(data)) {
        return defaultValue;
      }

      return data as T;
    }

    // Legacy entry (no version wrapper) — return raw parsed value
    if (parsed === null || parsed === undefined) {
      return defaultValue;
    }
    if (validator && !validator(parsed)) {
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
