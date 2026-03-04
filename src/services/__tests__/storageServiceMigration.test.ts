import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../constants', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, STORAGE_VERSION: 3 };
});

import {
  read,
  write,
  CURRENT_VERSION,
  registerMigration,
  clearMigrations,
} from '../storageService';

describe('TC-001: registerMigration exports and registers a migrator', () => {
  beforeEach(() => {
    localStorage.clear();
    clearMigrations();
  });

  it('CURRENT_VERSION is mocked to 3 for migration tests', () => {
    expect(CURRENT_VERSION).toBe(3);
  });

  it('exports registerMigration as a function', () => {
    expect(typeof registerMigration).toBe('function');
  });

  it('exports clearMigrations as a function', () => {
    expect(typeof clearMigrations).toBe('function');
  });

  it('registers a migrator without throwing', () => {
    expect(() =>
      registerMigration(1, (data) => ({ ...(data as object), newField: true })),
    ).not.toThrow();
  });

  it('overwrites migrator when registering same version twice', () => {
    registerMigration(2, () => ({ first: true }));
    registerMigration(2, () => ({ second: true }));
    localStorage.setItem(
      'key',
      JSON.stringify({ version: 2, data: {} }),
    );
    expect(read('key', {})).toEqual({ second: true });
  });

  it('ignores registration with fromVersion 0', () => {
    expect(() => registerMigration(0, () => ({}))).not.toThrow();
  });

  it('ignores registration with negative fromVersion', () => {
    expect(() => registerMigration(-1, () => ({}))).not.toThrow();
  });

  it('ignores registration with non-integer fromVersion', () => {
    expect(() => registerMigration(1.5, () => ({}))).not.toThrow();
  });
});

describe('TC-002: Single-step migration (v2 → v3)', () => {
  beforeEach(() => {
    localStorage.clear();
    clearMigrations();
  });

  it('applies single registered migration when one version behind', () => {
    registerMigration(2, (data) => ({ ...(data as object), migrated: true }));
    localStorage.setItem(
      'portfolio',
      JSON.stringify({ version: 2, data: { cash: 5000 } }),
    );
    expect(read('portfolio', {})).toEqual({ cash: 5000, migrated: true });
  });

  it('migrates primitive data correctly', () => {
    registerMigration(2, (data) => (data as number) * 2);
    localStorage.setItem(
      'key',
      JSON.stringify({ version: 2, data: 42 }),
    );
    expect(read('key', 0)).toBe(84);
  });
});

describe('TC-003: Multi-step migration chain (v1 → v3)', () => {
  beforeEach(() => {
    localStorage.clear();
    clearMigrations();
  });

  it('applies migrators sequentially v1→v2→v3', () => {
    registerMigration(1, (d) => ({ ...(d as object), v2Field: 'added' }));
    registerMigration(2, (d) => ({ ...(d as object), v3Field: 'added' }));
    localStorage.setItem(
      'test',
      JSON.stringify({ version: 1, data: { original: true } }),
    );
    expect(read('test', {})).toEqual({
      original: true,
      v2Field: 'added',
      v3Field: 'added',
    });
  });

  it('migrator(2) receives output of migrator(1), not raw data', () => {
    const migrator2 = vi.fn((d) => ({ ...(d as object), v3: true }));
    registerMigration(1, (d) => ({ ...(d as object), v2: true }));
    registerMigration(2, migrator2);
    localStorage.setItem(
      'key',
      JSON.stringify({ version: 1, data: { original: true } }),
    );
    read('key', {});
    expect(migrator2).toHaveBeenCalledWith({ original: true, v2: true });
  });
});

describe('TC-004: Missing migration in chain falls back to defaultValue', () => {
  beforeEach(() => {
    localStorage.clear();
    clearMigrations();
  });

  it('returns defaultValue when v2→v3 migrator is missing', () => {
    registerMigration(1, (d) => ({ ...(d as object), v2: true }));
    localStorage.setItem(
      'portfolio',
      JSON.stringify({ version: 1, data: { cash: 5000 } }),
    );
    expect(read('portfolio', { cash: 10000 })).toEqual({ cash: 10000 });
  });

  it('returns defaultValue when v1→v2 migrator is missing (gap at beginning)', () => {
    registerMigration(2, (d) => ({ ...(d as object), v3: true }));
    localStorage.setItem(
      'key',
      JSON.stringify({ version: 1, data: { cash: 5000 } }),
    );
    expect(read('key', { fallback: true })).toEqual({ fallback: true });
  });
});

describe('TC-005: Missing migration logs a warning', () => {
  beforeEach(() => {
    localStorage.clear();
    clearMigrations();
  });

  it('logs console.warn when migration is missing', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    registerMigration(1, (d) => d);
    localStorage.setItem(
      'key',
      JSON.stringify({ version: 1, data: { cash: 5000 } }),
    );
    read('key', {});
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toMatch(/migration/i);
    expect(warnSpy.mock.calls[0][0]).toContain('2');
    warnSpy.mockRestore();
  });

  it('does not log warning when all migrations are present', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    registerMigration(1, (d) => d);
    registerMigration(2, (d) => d);
    localStorage.setItem(
      'key',
      JSON.stringify({ version: 1, data: { cash: 5000 } }),
    );
    read('key', {});
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe('TC-006: Data at CURRENT_VERSION requires no migration', () => {
  beforeEach(() => {
    localStorage.clear();
    clearMigrations();
  });

  it('returns data without invoking any migrators', () => {
    const migrator1 = vi.fn((d) => d);
    const migrator2 = vi.fn((d) => d);
    registerMigration(1, migrator1);
    registerMigration(2, migrator2);
    write('key', { cash: 9000 });
    expect(read('key', {})).toEqual({ cash: 9000 });
    expect(migrator1).not.toHaveBeenCalled();
    expect(migrator2).not.toHaveBeenCalled();
  });
});

describe('TC-007: Validator passes — returns migrated data', () => {
  beforeEach(() => {
    localStorage.clear();
    clearMigrations();
  });

  const isValidCash = (v: unknown): v is { cash: number } =>
    typeof v === 'object' &&
    v !== null &&
    typeof (v as { cash: number }).cash === 'number';

  it('returns data when validator passes on current-version data', () => {
    write('key', { cash: 5000 });
    expect(read('key', { cash: 0 }, isValidCash)).toEqual({ cash: 5000 });
  });

  it('returns data when validator passes on multi-field object', () => {
    const isValid = (v: unknown): v is { a: number; b: string } =>
      typeof v === 'object' &&
      v !== null &&
      typeof (v as { a: number }).a === 'number' &&
      typeof (v as { b: string }).b === 'string';
    write('key', { a: 1, b: 'hello' });
    expect(read('key', { a: 0, b: '' }, isValid)).toEqual({
      a: 1,
      b: 'hello',
    });
  });
});

describe('TC-008: Validator fails — returns defaultValue', () => {
  beforeEach(() => {
    localStorage.clear();
    clearMigrations();
  });

  const isValidCash = (v: unknown): v is { cash: number } =>
    typeof v === 'object' &&
    v !== null &&
    typeof (v as { cash: number }).cash === 'number';

  it('returns defaultValue when validator rejects data', () => {
    localStorage.setItem(
      'key',
      JSON.stringify({ version: CURRENT_VERSION, data: { cash: 'not-a-number' } }),
    );
    expect(read('key', { cash: 0 }, isValidCash)).toEqual({ cash: 0 });
  });

  it('returns defaultValue when data is completely wrong type', () => {
    localStorage.setItem(
      'key',
      JSON.stringify({ version: CURRENT_VERSION, data: 'just a string' }),
    );
    expect(read('key', { cash: 0 }, isValidCash)).toEqual({ cash: 0 });
  });

  it('returns defaultValue when data is null after validation', () => {
    const alwaysFails = (_v: unknown): _v is never => false;
    write('key', { cash: 5000 });
    expect(read('key', { cash: 0 }, alwaysFails)).toEqual({ cash: 0 });
  });
});

describe('TC-009: No validator — backward compatible behavior', () => {
  beforeEach(() => {
    localStorage.clear();
    clearMigrations();
  });

  it('returns stored data without validation (two-argument form)', () => {
    write('key', { cash: 5000 });
    expect(read('key', {})).toEqual({ cash: 5000 });
  });

  it('round-trips primitive without validator', () => {
    write('num', 42);
    expect(read('num', 0)).toBe(42);
  });

  it('round-trips array without validator', () => {
    write('arr', ['a', 'b']);
    expect(read('arr', [])).toEqual(['a', 'b']);
  });

  it('passing undefined as third argument behaves identically to omitting it', () => {
    write('key', { cash: 5000 });
    expect(read('key', {}, undefined)).toEqual({ cash: 5000 });
  });
});

describe('TC-010: Validator applied after migration', () => {
  beforeEach(() => {
    localStorage.clear();
    clearMigrations();
  });

  it('validates post-migration data, not raw stored data', () => {
    registerMigration(2, (d) => ({ ...(d as object), newField: 42 }));
    const validator = (v: unknown): v is { newField: number } =>
      typeof v === 'object' &&
      v !== null &&
      typeof (v as { newField: number }).newField === 'number';
    localStorage.setItem(
      'key',
      JSON.stringify({ version: 2, data: { oldField: 'x' } }),
    );
    expect(read('key', { newField: 0 }, validator)).toEqual({ oldField: 'x', newField: 42 });
  });

  it('returns defaultValue if migration output fails validation', () => {
    registerMigration(2, (d) => ({ ...(d as object), newField: 'wrong-type' }));
    const validator = (v: unknown): v is { newField: number } =>
      typeof v === 'object' &&
      v !== null &&
      typeof (v as { newField: number }).newField === 'number';
    localStorage.setItem(
      'key',
      JSON.stringify({ version: 2, data: { oldField: 'x' } }),
    );
    expect(read('key', { newField: 0 }, validator)).toEqual({ newField: 0 });
  });
});

describe('TC-011: Validator fails on post-migration data — returns defaultValue', () => {
  beforeEach(() => {
    localStorage.clear();
    clearMigrations();
  });

  it('returns defaultValue when migrated data fails validation', () => {
    registerMigration(2, (d) => ({ ...(d as object), newField: 'not-a-number' }));
    const validator = (v: unknown): v is { newField: number } =>
      typeof v === 'object' &&
      v !== null &&
      typeof (v as { newField: number }).newField === 'number';
    localStorage.setItem(
      'key',
      JSON.stringify({ version: 2, data: { oldField: 'x' } }),
    );
    expect(read('key', { newField: 0 }, validator)).toEqual({ newField: 0 });
  });
});

describe('TC-012: Migration function throws — returns defaultValue', () => {
  beforeEach(() => {
    localStorage.clear();
    clearMigrations();
  });

  it('returns defaultValue when migrator throws Error', () => {
    registerMigration(2, () => {
      throw new Error('migration bug');
    });
    localStorage.setItem(
      'key',
      JSON.stringify({ version: 2, data: { cash: 5000 } }),
    );
    expect(read('key', { cash: 0 })).toEqual({ cash: 0 });
  });

  it('does not throw to caller', () => {
    registerMigration(2, () => {
      throw new Error('migration bug');
    });
    localStorage.setItem(
      'key',
      JSON.stringify({ version: 2, data: { cash: 5000 } }),
    );
    expect(() => read('key', { cash: 0 })).not.toThrow();
  });

  it('returns defaultValue when migrator throws a non-Error value', () => {
    registerMigration(2, () => {
      throw 'string error';
    });
    localStorage.setItem(
      'key',
      JSON.stringify({ version: 2, data: { cash: 5000 } }),
    );
    expect(read('key', { cash: 0 })).toEqual({ cash: 0 });
  });

  it('returns defaultValue when second migrator throws after first succeeds', () => {
    registerMigration(1, (d) => ({ ...(d as object), v2: true }));
    registerMigration(2, () => {
      throw new Error('v3 migration bug');
    });
    localStorage.setItem(
      'key',
      JSON.stringify({ version: 1, data: { original: true } }),
    );
    expect(read('key', { fallback: true })).toEqual({ fallback: true });
  });
});

describe('TC-013: Migration returns null or undefined', () => {
  beforeEach(() => {
    localStorage.clear();
    clearMigrations();
  });

  it('returns defaultValue when migrator returns null', () => {
    registerMigration(2, () => null);
    localStorage.setItem(
      'key',
      JSON.stringify({ version: 2, data: { cash: 5000 } }),
    );
    expect(read('key', { cash: 0 })).toEqual({ cash: 0 });
  });

  it('returns defaultValue when migrator returns undefined', () => {
    registerMigration(2, () => undefined);
    localStorage.setItem(
      'key',
      JSON.stringify({ version: 2, data: { cash: 5000 } }),
    );
    expect(read('key', { cash: 0 })).toEqual({ cash: 0 });
  });

  it('preserves 0 from migrator (falsy but valid)', () => {
    registerMigration(2, () => 0);
    localStorage.setItem(
      'key',
      JSON.stringify({ version: 2, data: { cash: 5000 } }),
    );
    expect(read('key', 99)).toBe(0);
  });

  it('preserves false from migrator (falsy but valid)', () => {
    registerMigration(2, () => false);
    localStorage.setItem(
      'key',
      JSON.stringify({ version: 2, data: { cash: 5000 } }),
    );
    expect(read('key', true)).toBe(false);
  });
});

describe('TC-014: Corrupt/unparseable data still returns defaultValue (regression)', () => {
  beforeEach(() => {
    localStorage.clear();
    clearMigrations();
  });

  it('returns default for invalid JSON', () => {
    localStorage.setItem('corrupt', 'not-valid-json{{{');
    expect(read('corrupt', [])).toEqual([]);
  });

  it('returns default for truncated JSON', () => {
    localStorage.setItem('partial', '{"version":');
    expect(read('partial', { cash: 0 })).toEqual({ cash: 0 });
  });

  it('returns default for empty string', () => {
    localStorage.setItem('empty', '');
    expect(read('empty', 'fallback')).toBe('fallback');
  });
});

describe('TC-015: Legacy (unversioned) entries still returned as-is (regression)', () => {
  beforeEach(() => {
    localStorage.clear();
    clearMigrations();
  });

  it('reads legacy object without migration', () => {
    localStorage.setItem(
      'legacy-obj',
      JSON.stringify({ shares: 3, avgCost: 100 }),
    );
    expect(read('legacy-obj', {})).toEqual({ shares: 3, avgCost: 100 });
  });

  it('reads legacy string without migration', () => {
    localStorage.setItem('legacy-str', JSON.stringify('hello'));
    expect(read('legacy-str', 'default')).toBe('hello');
  });

  it('reads legacy number without migration', () => {
    localStorage.setItem('legacy-num', JSON.stringify(42));
    expect(read('legacy-num', 0)).toBe(42);
  });

  it('reads legacy array without migration', () => {
    localStorage.setItem('legacy-arr', JSON.stringify(['a', 'b']));
    expect(read('legacy-arr', [])).toEqual(['a', 'b']);
  });

  it('treats object with version but no data as legacy', () => {
    localStorage.setItem(
      'version-only',
      JSON.stringify({ version: 1, name: 'test' }),
    );
    expect(read('version-only', {})).toEqual({ version: 1, name: 'test' });
  });
});

describe('TC-016: Future version entries still rejected (regression)', () => {
  beforeEach(() => {
    localStorage.clear();
    clearMigrations();
  });

  it('returns default for version 999', () => {
    localStorage.setItem(
      'future',
      JSON.stringify({ version: 999, data: { future: true } }),
    );
    expect(read('future', { fallback: true })).toEqual({ fallback: true });
  });

  it('returns default for CURRENT_VERSION + 1', () => {
    localStorage.setItem(
      'future2',
      JSON.stringify({ version: CURRENT_VERSION + 1, data: 'hi' }),
    );
    expect(read('future2', 'default')).toBe('default');
  });
});

describe('TC-017: Version 0 and negative versions still rejected (regression)', () => {
  beforeEach(() => {
    localStorage.clear();
    clearMigrations();
  });

  it('returns default for version 0', () => {
    localStorage.setItem(
      'zero-ver',
      JSON.stringify({ version: 0, data: { bad: true } }),
    );
    expect(read('zero-ver', { fallback: true })).toEqual({ fallback: true });
  });

  it('returns default for version -1', () => {
    localStorage.setItem(
      'neg1',
      JSON.stringify({ version: -1, data: { bad: true } }),
    );
    expect(read('neg1', { fallback: true })).toEqual({ fallback: true });
  });
});

describe('TC-020: read() signature backward compatibility', () => {
  beforeEach(() => {
    localStorage.clear();
    clearMigrations();
  });

  it('two-argument form works without validator', () => {
    write('key', 'hello');
    expect(read('key', 'default')).toBe('hello');
  });

  it('explicit undefined validator behaves same as omitted', () => {
    write('key', 42);
    expect(read('key', 0, undefined)).toBe(42);
  });
});
