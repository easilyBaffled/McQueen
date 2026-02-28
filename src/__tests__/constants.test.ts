import { describe, it, expect } from 'vitest';
import {
  INITIAL_CASH,
  USER_IMPACT_FACTOR,
  AI_BASE_CASH,
  TICK_INTERVAL_MS,
  ESPN_REFRESH_MS,
  ESPN_NEWS_LIMIT,
  MISSION_PICKS_PER_CATEGORY,
  STORAGE_VERSION,
  STORAGE_KEYS,
} from '../constants';
import type { StorageKey } from '../constants';

describe('constants', () => {
  it('exports numeric constants with correct types', () => {
    expect(typeof INITIAL_CASH).toBe('number');
    expect(typeof USER_IMPACT_FACTOR).toBe('number');
    expect(typeof AI_BASE_CASH).toBe('number');
    expect(typeof TICK_INTERVAL_MS).toBe('number');
    expect(typeof ESPN_REFRESH_MS).toBe('number');
    expect(typeof ESPN_NEWS_LIMIT).toBe('number');
    expect(typeof MISSION_PICKS_PER_CATEGORY).toBe('number');
    expect(typeof STORAGE_VERSION).toBe('number');
  });

  it('has expected values for game constants', () => {
    expect(INITIAL_CASH).toBe(10000);
    expect(TICK_INTERVAL_MS).toBe(3000);
    expect(STORAGE_VERSION).toBe(1);
  });
});

describe('STORAGE_KEYS', () => {
  it('contains all four storage keys', () => {
    expect(STORAGE_KEYS.scenario).toBe('mcqueen-scenario');
    expect(STORAGE_KEYS.portfolio).toBe('mcqueen-portfolio');
    expect(STORAGE_KEYS.watchlist).toBe('mcqueen-watchlist');
    expect(STORAGE_KEYS.cash).toBe('mcqueen-cash');
  });

  it('is readonly (as const)', () => {
    expect(Object.keys(STORAGE_KEYS)).toHaveLength(4);
  });
});

describe('StorageKey type', () => {
  it('accepts valid storage key values', () => {
    const keys: StorageKey[] = [
      'mcqueen-scenario',
      'mcqueen-portfolio',
      'mcqueen-watchlist',
      'mcqueen-cash',
    ];
    expect(keys).toHaveLength(4);
    keys.forEach((key) => {
      expect(Object.values(STORAGE_KEYS)).toContain(key);
    });
  });
});
