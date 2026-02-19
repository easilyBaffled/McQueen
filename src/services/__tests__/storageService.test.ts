import { describe, it, expect, beforeEach, vi } from 'vitest';
import { read, write, remove, CURRENT_VERSION } from '../storageService';

describe('storageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('write()', () => {
    it('stores data wrapped with version number', () => {
      write('test-key', { cash: 10000 });

      const raw = localStorage.getItem('test-key');
      expect(raw).not.toBeNull();

      const parsed = JSON.parse(raw!);
      expect(parsed.version).toBe(CURRENT_VERSION);
      expect(parsed.data).toEqual({ cash: 10000 });
    });

    it('stores primitive values', () => {
      write('num-key', 42);
      const raw = JSON.parse(localStorage.getItem('num-key')!);
      expect(raw.version).toBe(CURRENT_VERSION);
      expect(raw.data).toBe(42);
    });

    it('stores arrays', () => {
      write('arr-key', ['a', 'b']);
      const raw = JSON.parse(localStorage.getItem('arr-key')!);
      expect(raw.data).toEqual(['a', 'b']);
    });

    it('handles localStorage setItem throwing (quota exceeded)', () => {
      const spy = vi
        .spyOn(Storage.prototype, 'setItem')
        .mockImplementation(() => {
          throw new DOMException('QuotaExceededError');
        });

      expect(() => write('fail-key', { data: 'test' })).not.toThrow();
      spy.mockRestore();
    });

    it('handles localStorage being undefined', () => {
      const originalLS = globalThis.localStorage;
      Object.defineProperty(globalThis, 'localStorage', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      expect(() => write('key', 'value')).not.toThrow();
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalLS,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('read()', () => {
    it('reads back data written by write()', () => {
      write('test-key', { foo: 'bar' });
      const result = read('test-key', {});
      expect(result).toEqual({ foo: 'bar' });
    });

    it('returns default value for missing key', () => {
      const result = read('never-set', { cash: 10000 });
      expect(result).toEqual({ cash: 10000 });
    });

    it('returns falsy default value of 0', () => {
      const result = read('never-set', 0);
      expect(result).toBe(0);
    });

    it('returns falsy default value of false', () => {
      const result = read('never-set', false);
      expect(result).toBe(false);
    });

    it('returns default for empty array', () => {
      const result = read<string[]>('never-set', []);
      expect(result).toEqual([]);
    });

    it('returns default for corrupt JSON', () => {
      localStorage.setItem('corrupt-key', 'not-valid-json{{{');
      const result = read('corrupt-key', []);
      expect(result).toEqual([]);
    });

    it('returns default for empty string in localStorage', () => {
      localStorage.setItem('empty', '');
      const result = read('empty', { cash: 0 });
      expect(result).toEqual({ cash: 0 });
    });

    it('returns default when stored data is null', () => {
      localStorage.setItem(
        'null-data',
        JSON.stringify({ version: CURRENT_VERSION, data: null }),
      );
      const result = read('null-data', { cash: 0 });
      expect(result).toEqual({ cash: 0 });
    });

    it('handles localStorage getItem throwing', () => {
      const spy = vi
        .spyOn(Storage.prototype, 'getItem')
        .mockImplementation(() => {
          throw new SecurityError('Cookies disabled');
        });

      const result = read('key', 42);
      expect(result).toBe(42);
      spy.mockRestore();
    });

    it('handles localStorage being undefined', () => {
      const originalLS = globalThis.localStorage;
      Object.defineProperty(globalThis, 'localStorage', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      const result = read('key', 'default');
      expect(result).toBe('default');
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalLS,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('version migration', () => {
    it('reads legacy entries without version wrapper', () => {
      localStorage.setItem('legacy-key', JSON.stringify('midweek'));
      const result = read('legacy-key', 'live');
      expect(result).toBe('midweek');
    });

    it('reads legacy objects without version wrapper', () => {
      localStorage.setItem(
        'legacy-obj',
        JSON.stringify({ shares: 3, avgCost: 100 }),
      );
      const result = read('legacy-obj', {});
      expect(result).toEqual({ shares: 3, avgCost: 100 });
    });

    it('migrates stored entry from v1 to current version', () => {
      localStorage.setItem(
        'migrate-key',
        JSON.stringify({ version: 1, data: { oldField: 'value' } }),
      );
      const result = read('migrate-key', {});
      expect(result).toEqual({ oldField: 'value' });
    });

    it('returns default for entry with version higher than current', () => {
      localStorage.setItem(
        'future-key',
        JSON.stringify({ version: 999, data: { future: true } }),
      );
      const result = read('future-key', { fallback: true });
      expect(result).toEqual({ fallback: true });
    });

    it('returns default for entry with version 0 or negative', () => {
      localStorage.setItem(
        'zero-ver',
        JSON.stringify({ version: 0, data: { bad: true } }),
      );
      const result = read('zero-ver', { fallback: true });
      expect(result).toEqual({ fallback: true });
    });
  });

  describe('remove()', () => {
    it('removes a stored key', () => {
      write('rm-key', 'data');
      remove('rm-key');
      expect(localStorage.getItem('rm-key')).toBeNull();
    });

    it('does not throw for missing key', () => {
      expect(() => remove('nonexistent')).not.toThrow();
    });
  });
});

class SecurityError extends DOMException {
  constructor(message: string) {
    super(message, 'SecurityError');
  }
}
