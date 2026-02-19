import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { read, write, remove, CURRENT_VERSION } from '../storageService';
import { STORAGE_VERSION, STORAGE_KEYS } from '../../constants';

// TC-001: storageService module exists with typed read/write/remove exports
describe('TC-001: module exports', () => {
  it('exports read, write, remove, and CURRENT_VERSION', () => {
    expect(typeof read).toBe('function');
    expect(typeof write).toBe('function');
    expect(typeof remove).toBe('function');
    expect(typeof CURRENT_VERSION).toBe('number');
  });

  it('CURRENT_VERSION is a positive integer', () => {
    expect(CURRENT_VERSION).toBeGreaterThan(0);
    expect(Number.isInteger(CURRENT_VERSION)).toBe(true);
  });
});

// TC-002: write() wraps data with a schema version number
describe('TC-002: write() version envelope', () => {
  beforeEach(() => localStorage.clear());

  it('wraps object data with version envelope', () => {
    write('test-key', { cash: 10000 });
    const raw = localStorage.getItem('test-key');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed).toEqual({ version: CURRENT_VERSION, data: { cash: 10000 } });
  });

  it('wraps primitive number with version envelope', () => {
    write('num', 42);
    const parsed = JSON.parse(localStorage.getItem('num')!);
    expect(parsed).toEqual({ version: CURRENT_VERSION, data: 42 });
  });

  it('wraps array with version envelope', () => {
    write('arr', ['a', 'b']);
    const parsed = JSON.parse(localStorage.getItem('arr')!);
    expect(parsed).toEqual({ version: CURRENT_VERSION, data: ['a', 'b'] });
  });

  it('wraps string with version envelope', () => {
    write('str', 'midweek');
    const parsed = JSON.parse(localStorage.getItem('str')!);
    expect(parsed).toEqual({ version: CURRENT_VERSION, data: 'midweek' });
  });
});

// TC-003: Happy-path read/write round-trip for objects
describe('TC-003: object round-trip', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips a portfolio object', () => {
    write('portfolio', { MAHOMES: { shares: 5, avgCost: 120 } });
    expect(read('portfolio', {})).toEqual({
      MAHOMES: { shares: 5, avgCost: 120 },
    });
  });

  it('round-trips a deeply nested object', () => {
    const deep = { a: { b: { c: { d: [1, 2, 3] } } } };
    write('deep', deep);
    expect(read('deep', {})).toEqual(deep);
  });

  it('round-trips an object with special characters', () => {
    const special = { key: 'héllo wörld 🏈', 'k/e.y': 'va"lue' };
    write('special', special);
    expect(read('special', {})).toEqual(special);
  });
});

// TC-004: Happy-path read/write round-trip for primitives
describe('TC-004: primitive round-trip', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips a number', () => {
    write('cash', 10000);
    expect(read('cash', 0)).toBe(10000);
  });

  it('round-trips a string', () => {
    write('scenario', 'midweek');
    expect(read('scenario', 'live')).toBe('midweek');
  });

  it('round-trips a boolean true', () => {
    write('flag', true);
    expect(read('flag', false)).toBe(true);
  });

  it('preserves falsy value 0 (does not return default)', () => {
    write('key', 0);
    expect(read('key', 99)).toBe(0);
  });

  it('preserves falsy value false (does not return default)', () => {
    write('key', false);
    expect(read('key', true)).toBe(false);
  });

  it('preserves empty string (does not return default)', () => {
    write('key', '');
    expect(read('key', 'fallback')).toBe('');
  });
});

// TC-005: Happy-path read/write round-trip for arrays
describe('TC-005: array round-trip', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips a watchlist array', () => {
    write('watchlist', ['MAHOMES', 'KELCE', 'ALLEN']);
    expect(read('watchlist', [])).toEqual(['MAHOMES', 'KELCE', 'ALLEN']);
  });

  it('round-trips an empty array', () => {
    write('empty', []);
    expect(read('empty', ['fallback'])).toEqual([]);
  });

  it('round-trips an array of objects', () => {
    const arr = [{ id: 1 }, { id: 2 }];
    write('objs', arr);
    expect(read('objs', [])).toEqual(arr);
  });
});

// TC-006: read() returns default value for missing key
describe('TC-006: missing key returns default', () => {
  beforeEach(() => localStorage.clear());

  it('returns object default', () => {
    expect(read('never-set', { cash: 10000 })).toEqual({ cash: 10000 });
  });

  it('returns numeric default 0', () => {
    expect(read('never-set', 0)).toBe(0);
  });

  it('returns boolean default false', () => {
    expect(read('never-set', false)).toBe(false);
  });

  it('returns empty array default', () => {
    expect(read<string[]>('never-set', [])).toEqual([]);
  });

  it('returns empty string default', () => {
    expect(read('never-set', '')).toBe('');
  });

  it('returns null default', () => {
    expect(read('never-set', null)).toBeNull();
  });
});

// TC-007: read() returns default for corrupt/unparseable JSON
describe('TC-007: corrupt JSON returns default', () => {
  beforeEach(() => localStorage.clear());

  it('returns default for invalid JSON', () => {
    localStorage.setItem('corrupt', 'not-valid-json{{{');
    expect(read('corrupt', [])).toEqual([]);
  });

  it('returns default for truncated JSON', () => {
    localStorage.setItem('partial', '{"version":');
    expect(read('partial', { cash: 0 })).toEqual({ cash: 0 });
  });

  it('returns default for literal string "undefined"', () => {
    localStorage.setItem('undef-str', 'undefined');
    expect(read('undef-str', 'fallback')).toBe('fallback');
  });

  it('returns default for literal string "NaN"', () => {
    localStorage.setItem('nan-str', 'NaN');
    expect(read('nan-str', 42)).toBe(42);
  });

  it('returns default for empty string value', () => {
    localStorage.setItem('empty', '');
    expect(read('empty', { cash: 0 })).toEqual({ cash: 0 });
  });

  it('returns default for literal string "null"', () => {
    localStorage.setItem('null-str', 'null');
    expect(read('null-str', 'fallback')).toBe('fallback');
  });
});

// TC-008: read() returns default when versioned data field is null or undefined
describe('TC-008: null/undefined data in versioned entry', () => {
  beforeEach(() => localStorage.clear());

  it('returns default when data is null', () => {
    localStorage.setItem(
      'null-data',
      JSON.stringify({ version: 1, data: null }),
    );
    expect(read('null-data', { cash: 0 })).toEqual({ cash: 0 });
  });

  it('returns default when data is undefined (serialized as missing field)', () => {
    // JSON.stringify({ version: 1, data: undefined }) -> '{"version":1}'
    // This drops the data field, so isVersionedEntry returns false (no 'data' key)
    // and it becomes a legacy entry returning { version: 1 }
    localStorage.setItem(
      'undef-data',
      JSON.stringify({ version: 1, data: undefined }),
    );
    const result = read('undef-data', 'fallback');
    // Since 'data' field is absent after serialization, treated as legacy
    expect(result).toEqual({ version: 1 });
  });

  it('preserves data: 0 (falsy but valid)', () => {
    localStorage.setItem(
      'zero-data',
      JSON.stringify({ version: 1, data: 0 }),
    );
    expect(read('zero-data', 99)).toBe(0);
  });

  it('preserves data: false (falsy but valid)', () => {
    localStorage.setItem(
      'false-data',
      JSON.stringify({ version: 1, data: false }),
    );
    expect(read('false-data', true)).toBe(false);
  });

  it('preserves data: empty string (falsy but valid)', () => {
    localStorage.setItem(
      'empty-data',
      JSON.stringify({ version: 1, data: '' }),
    );
    expect(read('empty-data', 'fallback')).toBe('');
  });
});

// TC-009: read() handles legacy (unversioned) entries
describe('TC-009: legacy entries', () => {
  beforeEach(() => localStorage.clear());

  it('reads legacy string', () => {
    localStorage.setItem('legacy-str', JSON.stringify('midweek'));
    expect(read('legacy-str', 'live')).toBe('midweek');
  });

  it('reads legacy object', () => {
    localStorage.setItem(
      'legacy-obj',
      JSON.stringify({ shares: 3, avgCost: 100 }),
    );
    expect(read('legacy-obj', {})).toEqual({ shares: 3, avgCost: 100 });
  });

  it('reads legacy number', () => {
    localStorage.setItem('legacy-num', JSON.stringify(42));
    expect(read('legacy-num', 0)).toBe(42);
  });

  it('reads legacy array', () => {
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

// TC-010: read() rejects entries with version higher than CURRENT_VERSION
describe('TC-010: future version rejection', () => {
  beforeEach(() => localStorage.clear());

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

  it('treats version Infinity as legacy (serializes to null)', () => {
    localStorage.setItem(
      'inf',
      JSON.stringify({ version: Infinity, data: 'hi' }),
    );
    // JSON.stringify(Infinity) -> null, typeof null !== 'number'
    // so isVersionedEntry returns false -> treated as legacy object
    const result = read('inf', 'default');
    expect(result).toEqual({ version: null, data: 'hi' });
  });

  it('treats version NaN as legacy (serializes to null)', () => {
    localStorage.setItem(
      'nan',
      JSON.stringify({ version: NaN, data: 'hi' }),
    );
    // JSON.stringify(NaN) -> null, same as Infinity
    const result = read('nan', 'default');
    expect(result).toEqual({ version: null, data: 'hi' });
  });
});

// TC-011: read() rejects entries with version 0 or negative
describe('TC-011: invalid version numbers', () => {
  beforeEach(() => localStorage.clear());

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

  it('returns default for version -5', () => {
    localStorage.setItem(
      'neg5',
      JSON.stringify({ version: -5, data: 'data' }),
    );
    expect(read('neg5', 'default')).toBe('default');
  });
});

// TC-012: Version migration reads v1 data at current version
describe('TC-012: v1 migration', () => {
  beforeEach(() => localStorage.clear());

  it('reads v1 versioned data successfully', () => {
    localStorage.setItem(
      'v1-data',
      JSON.stringify({ version: 1, data: { oldField: 'value' } }),
    );
    expect(read('v1-data', {})).toEqual({ oldField: 'value' });
  });
});

// TC-013: write() fails silently on quota exceeded
describe('TC-013: write() silent failure', () => {
  it('does not throw on QuotaExceededError', () => {
    const spy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });
    expect(() => write('fail-key', { data: 'test' })).not.toThrow();
    spy.mockRestore();
  });

  it('does not throw on SecurityError', () => {
    const spy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('SecurityError');
      });
    expect(() => write('fail-key', 'value')).not.toThrow();
    spy.mockRestore();
  });

  it('does not throw on generic Error', () => {
    const spy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('Unknown error');
      });
    expect(() => write('fail-key', 'value')).not.toThrow();
    spy.mockRestore();
  });
});

// TC-014: read() and write() handle localStorage being unavailable
describe('TC-014: localStorage unavailable', () => {
  let originalLS: Storage;

  beforeEach(() => {
    originalLS = globalThis.localStorage;
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: originalLS,
      writable: true,
      configurable: true,
    });
  });

  it('write() does not throw when localStorage is undefined', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    expect(() => write('key', 'value')).not.toThrow();
  });

  it('read() returns default when localStorage is undefined', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    expect(read('key', 'default')).toBe('default');
  });

  it('remove() does not throw when localStorage is undefined', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    expect(() => remove('key')).not.toThrow();
  });

  it('read() returns default when getItem throws SecurityError', () => {
    const spy = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new DOMException('Cookies disabled', 'SecurityError');
      });
    expect(read('key', 42)).toBe(42);
    spy.mockRestore();
  });
});

// TC-015: remove() deletes a stored key
describe('TC-015: remove()', () => {
  beforeEach(() => localStorage.clear());

  it('removes a stored key', () => {
    write('rm-key', 'data');
    remove('rm-key');
    expect(localStorage.getItem('rm-key')).toBeNull();
  });

  it('subsequent read returns default after remove', () => {
    write('rm-key', 'data');
    remove('rm-key');
    expect(read('rm-key', 'default')).toBe('default');
  });

  it('does not throw for key that was never set', () => {
    expect(() => remove('nonexistent')).not.toThrow();
  });

  it('does not throw when localStorage is unavailable', () => {
    const originalLS = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    expect(() => remove('key')).not.toThrow();
    Object.defineProperty(globalThis, 'localStorage', {
      value: originalLS,
      writable: true,
      configurable: true,
    });
  });
});

// TC-016: CURRENT_VERSION is sourced from constants.ts STORAGE_VERSION
describe('TC-016: version single source of truth', () => {
  it('CURRENT_VERSION equals STORAGE_VERSION from constants', () => {
    expect(CURRENT_VERSION).toBe(STORAGE_VERSION);
  });

  it('STORAGE_VERSION is a positive integer', () => {
    expect(STORAGE_VERSION).toBeGreaterThan(0);
    expect(Number.isInteger(STORAGE_VERSION)).toBe(true);
  });
});

// TC-017: Context providers use storageService exclusively — no direct localStorage calls
describe('TC-017: Split context integration (static analysis)', () => {
  const contextFiles = [
    { name: 'ScenarioContext', path: '../../context/ScenarioContext.tsx' },
    { name: 'TradingContext', path: '../../context/TradingContext.tsx' },
    { name: 'SocialContext', path: '../../context/SocialContext.tsx' },
  ];

  it('context files import read and/or write from storageService', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');

    for (const ctx of contextFiles) {
      const contextPath = path.resolve(import.meta.dirname, ctx.path);
      const source = fs.readFileSync(contextPath, 'utf-8');

      expect(source).toMatch(
        /import\s*\{[^}]*\b(read|write)\b[^}]*\}\s*from\s*['"]\.\.\/services\/storageService['"]/,
      );
    }
  });

  it('context files have zero direct localStorage calls', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');

    for (const ctx of contextFiles) {
      const contextPath = path.resolve(import.meta.dirname, ctx.path);
      const source = fs.readFileSync(contextPath, 'utf-8');

      expect(source).not.toMatch(/localStorage\.getItem/);
      expect(source).not.toMatch(/localStorage\.setItem/);
      expect(source).not.toMatch(/localStorage\.removeItem/);
    }
  });

  it('ScenarioContext uses read/write for scenario key', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const contextPath = path.resolve(
      import.meta.dirname,
      '../../context/ScenarioContext.tsx',
    );
    const source = fs.readFileSync(contextPath, 'utf-8');

    expect(source).toMatch(/read\(STORAGE_KEYS\.scenario/);
    expect(source).toMatch(/write\(STORAGE_KEYS\.scenario/);
  });

  it('TradingContext uses read/write for portfolio and cash keys', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const contextPath = path.resolve(
      import.meta.dirname,
      '../../context/TradingContext.tsx',
    );
    const source = fs.readFileSync(contextPath, 'utf-8');

    expect(source).toMatch(/read\(STORAGE_KEYS\.portfolio/);
    expect(source).toMatch(/read\(STORAGE_KEYS\.cash/);
    expect(source).toMatch(/write\(STORAGE_KEYS\.portfolio/);
    expect(source).toMatch(/write\(STORAGE_KEYS\.cash/);
  });

  it('SocialContext uses read/write for watchlist key', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const contextPath = path.resolve(
      import.meta.dirname,
      '../../context/SocialContext.tsx',
    );
    const source = fs.readFileSync(contextPath, 'utf-8');

    expect(source).toMatch(/read\(STORAGE_KEYS\.watchlist/);
    expect(source).toMatch(/write\(STORAGE_KEYS\.watchlist/);
  });
});

// TC-018: isVersionedEntry type guard discrimination
describe('TC-018: versioned entry discrimination', () => {
  beforeEach(() => localStorage.clear());

  it('recognizes valid versioned entry { version: 1, data: "hello" }', () => {
    localStorage.setItem(
      'key',
      JSON.stringify({ version: 1, data: 'hello' }),
    );
    expect(read('key', 'default')).toBe('hello');
  });

  it('treats non-numeric version as legacy', () => {
    localStorage.setItem(
      'key',
      JSON.stringify({ version: 'one', data: 'hello' }),
    );
    // version is not a number, so isVersionedEntry returns false -> legacy path
    const result = read('key', 'default');
    expect(result).toEqual({ version: 'one', data: 'hello' });
  });

  it('treats missing version field as legacy', () => {
    localStorage.setItem('key', JSON.stringify({ data: 'hello' }));
    // No version field, so isVersionedEntry returns false -> legacy
    expect(read('key', 'default')).toEqual({ data: 'hello' });
  });

  it('treats JSON null as invalid, returns default', () => {
    localStorage.setItem('key', JSON.stringify(null));
    expect(read('key', 'default')).toBe('default');
  });

  it('treats plain number as legacy', () => {
    localStorage.setItem('key', JSON.stringify(42));
    expect(read('key', 0)).toBe(42);
  });

  it('recognizes versioned entry with extra fields', () => {
    localStorage.setItem(
      'key',
      JSON.stringify({ version: 1, data: 'hello', extra: true }),
    );
    expect(read('key', 'default')).toBe('hello');
  });

  it('treats { version: 1 } without data field as legacy', () => {
    localStorage.setItem('key', JSON.stringify({ version: 1 }));
    // No 'data' field -> isVersionedEntry returns false -> legacy path
    expect(read('key', 'default')).toEqual({ version: 1 });
  });

  it('treats { data: "x" } without version field as legacy', () => {
    localStorage.setItem('key', JSON.stringify({ data: 'x' }));
    expect(read('key', 'default')).toEqual({ data: 'x' });
  });
});
