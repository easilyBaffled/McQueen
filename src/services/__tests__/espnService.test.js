import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  NFL_TEAM_IDS,
  clearCache,
  getCacheStats,
  fetchNFLNews,
  fetchTeamNews,
  fetchScoreboard,
} from '../espnService';

describe('NFL_TEAM_IDS', () => {
  it('maps all 32 NFL teams', () => {
    expect(Object.keys(NFL_TEAM_IDS).length).toBe(32);
  });

  it('maps KC to numeric ID 12', () => {
    expect(NFL_TEAM_IDS.KC).toBe(12);
  });

  it('maps BUF to numeric ID 2', () => {
    expect(NFL_TEAM_IDS.BUF).toBe(2);
  });
});

describe('cache utilities', () => {
  beforeEach(() => {
    clearCache();
  });

  it('clearCache empties the cache', () => {
    clearCache();
    const stats = getCacheStats();
    expect(stats.size).toBe(0);
    expect(stats.keys).toEqual([]);
  });

  it('getCacheStats returns expected shape', () => {
    const stats = getCacheStats();
    expect(stats).toHaveProperty('size');
    expect(stats).toHaveProperty('keys');
    expect(stats).toHaveProperty('entries');
    expect(Array.isArray(stats.keys)).toBe(true);
    expect(Array.isArray(stats.entries)).toBe(true);
  });
});

describe('fetchNFLNews', () => {
  beforeEach(() => {
    clearCache();
    vi.restoreAllMocks();
  });

  it('returns empty array on network failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network error')),
    );

    const result = await fetchNFLNews();
    expect(result).toEqual([]);
  });

  it('normalizes articles from API response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            articles: [
              {
                id: '1',
                headline: 'Test headline',
                description: 'A test article',
                published: '2025-01-01T12:00:00Z',
                type: 'news',
              },
            ],
          }),
      }),
    );

    const result = await fetchNFLNews(5);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('id', '1');
    expect(result[0]).toHaveProperty('headline', 'Test headline');
    expect(result[0]).toHaveProperty('source', 'ESPN NFL');
  });
});

describe('fetchTeamNews', () => {
  beforeEach(() => {
    clearCache();
    vi.restoreAllMocks();
  });

  it('returns empty array for unknown team abbreviation', async () => {
    const result = await fetchTeamNews('FAKE');
    expect(result).toEqual([]);
  });

  it('fetches and normalizes team news', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            articles: [
              { id: '42', headline: 'KC wins again', description: 'Big game' },
            ],
          }),
      }),
    );

    const result = await fetchTeamNews('KC', 5);
    expect(result).toHaveLength(1);
    expect(result[0].headline).toBe('KC wins again');
  });
});

describe('fetchScoreboard', () => {
  beforeEach(() => {
    clearCache();
    vi.restoreAllMocks();
  });

  it('returns empty events on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network error')),
    );

    const result = await fetchScoreboard();
    expect(result).toEqual({ events: [], week: null, season: null });
  });
});
