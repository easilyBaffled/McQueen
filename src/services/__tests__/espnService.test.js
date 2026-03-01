import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  NFL_TEAM_IDS,
  clearCache,
  getCacheStats,
  fetchNFLNews,
  fetchTeamNews,
  fetchScoreboard,
  fetchPlayerNews,
  MAX_CACHE_SIZE,
} from '../espnService';

describe('NFL_TEAM_IDS', () => {
  it('maps all 32 NFL teams', () => {
    expect(Object.keys(NFL_TEAM_IDS).length).toBe(32);
  });

  it('maps KC to numeric ID 12', () => {
    expect(NFL_TEAM_IDS.KC).toBe(12);
  });

  it('maps SF to numeric ID 25', () => {
    expect(NFL_TEAM_IDS.SF).toBe(25);
  });

  it('maps DAL to numeric ID 6', () => {
    expect(NFL_TEAM_IDS.DAL).toBe(6);
  });
});

// TC-015
describe('espnService — cache hit returns cached data without fetch', () => {
  beforeEach(() => {
    clearCache();
    vi.restoreAllMocks();
  });

  it('does not call fetch a second time when cache is fresh', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          articles: [{ id: '1', headline: 'Test' }],
        }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await fetchNFLNews();
    expect(mockFetch).toHaveBeenCalledTimes(1);

    await fetchNFLNews();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('returns same data from cache', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            articles: [{ id: '1', headline: 'Cached Article' }],
          }),
      }),
    );

    const first = await fetchNFLNews();
    const second = await fetchNFLNews();
    expect(first).toEqual(second);
  });
});

// TC-016
describe('espnService — cache miss after TTL expiration', () => {
  beforeEach(() => {
    clearCache();
    vi.restoreAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('re-fetches after 5 minutes have passed', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            articles: [{ id: '1', headline: 'Old Data' }],
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            articles: [{ id: '2', headline: 'New Data' }],
          }),
      });
    vi.stubGlobal('fetch', mockFetch);

    const first = await fetchNFLNews();
    expect(first[0].headline).toBe('Old Data');
    expect(mockFetch).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(300_001);

    const second = await fetchNFLNews();
    expect(second[0].headline).toBe('New Data');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('cache entry is still valid at exactly TTL boundary', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          articles: [{ id: '1', headline: 'Same' }],
        }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await fetchNFLNews();
    vi.advanceTimersByTime(299_999);
    await fetchNFLNews();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

// TC-017
describe('espnService — proxy fallback to direct ESPN API', () => {
  beforeEach(() => {
    clearCache();
    vi.restoreAllMocks();
  });

  it('falls back to direct API when proxy returns non-OK', async () => {
    const mockFetch = vi.fn().mockImplementation((url) => {
      if (url.startsWith('/espn-api')) {
        return Promise.resolve({ ok: false, status: 503 });
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            articles: [{ id: '1', headline: 'Direct API' }],
          }),
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await fetchNFLNews();
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result[0].headline).toBe('Direct API');
  });
});

// TC-018
describe('espnService — both proxy and direct fail', () => {
  beforeEach(() => {
    clearCache();
    vi.restoreAllMocks();
  });

  it('fetchNFLNews returns [] when both fail with non-OK', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );
    const result = await fetchNFLNews();
    expect(result).toEqual([]);
  });

  it('fetchScoreboard returns fallback when both fail', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );
    const result = await fetchScoreboard();
    expect(result).toEqual({ events: [], week: null, season: null });
  });

  it('fetchNFLNews returns [] on network error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
    );
    const result = await fetchNFLNews();
    expect(result).toEqual([]);
  });

  it('fetchScoreboard returns fallback on network error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network error')),
    );
    const result = await fetchScoreboard();
    expect(result).toEqual({ events: [], week: null, season: null });
  });
});

// TC-019
describe('espnService — fetchNFLNews normalizes articles', () => {
  beforeEach(() => {
    clearCache();
    vi.restoreAllMocks();
  });

  it('normalizes a full raw article', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            articles: [
              {
                id: '123',
                headline: 'Test Headline',
                description: 'A description',
                published: '2025-01-01T00:00:00Z',
                links: { web: { href: 'http://espn.com/article' } },
                images: [{ url: 'img.jpg' }],
                type: 'story',
                premium: true,
                categories: [{ id: 1, description: 'NFL' }],
              },
            ],
          }),
      }),
    );

    const result = await fetchNFLNews();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: '123',
      headline: 'Test Headline',
      description: 'A description',
      published: '2025-01-01T00:00:00Z',
      url: 'http://espn.com/article',
      thumbnail: 'img.jpg',
      source: 'ESPN NFL',
      type: 'story',
      premium: true,
    });
    expect(result[0].images).toEqual([{ url: 'img.jpg' }]);
    expect(result[0].categories).toEqual([{ id: 1, description: 'NFL' }]);
  });

  it('applies defaults for minimal raw article', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ articles: [{}] }),
      }),
    );

    const result = await fetchNFLNews();
    expect(result).toHaveLength(1);
    expect(result[0].headline).toBe('');
    expect(result[0].description).toBe('');
    expect(result[0].url).toBe('#');
    expect(result[0].thumbnail).toBeNull();
    expect(result[0].premium).toBe(false);
    expect(result[0].source).toBe('ESPN NFL');
    expect(result[0].type).toBe('news');
    expect(result[0].categories).toEqual([]);
  });

  it('returns [] when data.articles is undefined', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      }),
    );
    const result = await fetchNFLNews();
    expect(result).toEqual([]);
  });

  it('returns [] when data.articles is empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ articles: [] }),
      }),
    );
    const result = await fetchNFLNews();
    expect(result).toEqual([]);
  });
});

// TC-020
describe('espnService — fetchTeamNews with valid team abbreviation', () => {
  beforeEach(() => {
    clearCache();
    vi.restoreAllMocks();
  });

  it('fetches with correct team ID in URL for KC', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          articles: [{ id: '1', headline: 'KC News' }],
        }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await fetchTeamNews('KC', 5);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/teams/12/news?limit=5'),
    );
  });

  it('uppercases lowercase team abbreviation', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          articles: [{ id: '1', headline: 'SF News' }],
        }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await fetchTeamNews('sf');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/teams/25/'),
    );
  });
});

// TC-021
describe('espnService — fetchTeamNews with unknown team abbreviation', () => {
  beforeEach(() => {
    clearCache();
    vi.restoreAllMocks();
  });

  it('returns [] for unknown abbreviation "XYZ"', async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    const result = await fetchTeamNews('XYZ');
    expect(result).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns [] for empty string', async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    const result = await fetchTeamNews('');
    expect(result).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

// TC-022
describe('espnService — fetchScoreboard normalizes game events', () => {
  beforeEach(() => {
    clearCache();
    vi.restoreAllMocks();
  });

  it('normalizes a full event with home/away teams', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            events: [
              {
                id: 'evt1',
                name: 'KC vs SF',
                shortName: 'KC @ SF',
                date: '2025-02-01T18:00:00Z',
                competitions: [
                  {
                    competitors: [
                      {
                        homeAway: 'home',
                        team: {
                          id: '25',
                          abbreviation: 'SF',
                          displayName: '49ers',
                          logo: 'sf-logo.png',
                        },
                        score: '21',
                      },
                      {
                        homeAway: 'away',
                        team: {
                          id: '12',
                          abbreviation: 'KC',
                          displayName: 'Chiefs',
                          logo: 'kc-logo.png',
                        },
                        score: '17',
                      },
                    ],
                    status: {
                      type: { name: 'in-progress', description: '3rd Quarter' },
                      period: 3,
                      displayClock: '8:45',
                    },
                    venue: { fullName: "Levi's Stadium" },
                    broadcasts: [{ names: ['FOX', 'NFL Network'] }],
                  },
                ],
              },
            ],
            week: { number: 5 },
            season: { year: 2025 },
          }),
      }),
    );

    const result = await fetchScoreboard();
    expect(result.events).toHaveLength(1);
    const event = result.events[0];
    expect(event.id).toBe('evt1');
    expect(event.homeTeam).toEqual({
      id: '25',
      abbr: 'SF',
      name: '49ers',
      score: '21',
      logo: 'sf-logo.png',
    });
    expect(event.awayTeam).toEqual({
      id: '12',
      abbr: 'KC',
      name: 'Chiefs',
      score: '17',
      logo: 'kc-logo.png',
    });
    expect(event.status).toEqual({
      type: 'in-progress',
      description: '3rd Quarter',
      period: 3,
      clock: '8:45',
    });
    expect(event.venue).toBe("Levi's Stadium");
    expect(event.broadcast).toBe('FOX, NFL Network');
    expect(result.week).toEqual({ number: 5 });
    expect(result.season).toEqual({ year: 2025 });
  });

  it('handles event with no competitions', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            events: [
              {
                id: 'evt2',
                name: 'TBD',
                shortName: 'TBD',
                date: '2025-03-01',
                competitions: [],
              },
            ],
          }),
      }),
    );

    const result = await fetchScoreboard();
    const event = result.events[0];
    expect(event.homeTeam).toBeNull();
    expect(event.awayTeam).toBeNull();
    expect(event.venue).toBe('');
    expect(event.broadcast).toBe('');
  });

  it('handles missing competitors array', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            events: [
              {
                id: 'evt3',
                name: 'TBD',
                shortName: 'TBD',
                date: '2025-03-01',
                competitions: [{}],
              },
            ],
          }),
      }),
    );

    const result = await fetchScoreboard();
    const event = result.events[0];
    expect(event.homeTeam).toBeNull();
    expect(event.awayTeam).toBeNull();
  });
});

// TC-023
describe('espnService — fetchPlayerNews deduplicates and filters', () => {
  beforeEach(() => {
    clearCache();
    vi.restoreAllMocks();
  });

  it('deduplicates articles and filters by player name', async () => {
    const mockFetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/teams/12/')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              articles: [
                { id: '1', headline: 'Mahomes throws 3 TDs', description: '' },
                { id: '2', headline: 'KC defense update', description: '' },
              ],
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            articles: [
              { id: '1', headline: 'Mahomes throws 3 TDs', description: '' },
              { id: '3', headline: 'League news roundup', description: '' },
            ],
          }),
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await fetchPlayerNews('Patrick Mahomes', ['mahomes'], 'KC');
    const ids = result.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(result.every((a) => a.headline.toLowerCase().includes('mahomes'))).toBe(true);
  });

  it('returns [] when no articles match the player name', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            articles: [
              { id: '1', headline: 'Weather update', description: 'Sunny day' },
            ],
          }),
      }),
    );

    const result = await fetchPlayerNews('Patrick Mahomes', [], '');
    expect(result).toEqual([]);
  });

  it('skips team news when teamAbbr is empty', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          articles: [
            { id: '1', headline: 'Mahomes big game', description: '' },
          ],
        }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await fetchPlayerNews('Mahomes', [], '');
    expect(result).toHaveLength(1);
    // Should only call general news fetch, not team-specific
    const calls = mockFetch.mock.calls.map((c) => c[0]);
    expect(calls.every((url) => !url.includes('/teams/'))).toBe(true);
  });
});

// TC-024
describe('espnService — clearCache empties all entries', () => {
  beforeEach(() => {
    clearCache();
    vi.restoreAllMocks();
  });

  it('clears cache after populating', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ articles: [{ id: '1' }] }),
      }),
    );

    await fetchNFLNews();
    expect(getCacheStats().size).toBeGreaterThan(0);

    clearCache();
    expect(getCacheStats().size).toBe(0);
    expect(getCacheStats().keys).toEqual([]);
  });

  it('does not throw when clearing empty cache', () => {
    expect(() => clearCache()).not.toThrow();
    expect(getCacheStats().size).toBe(0);
  });
});

// TC-025
describe('espnService — getCacheStats reports correct metadata', () => {
  beforeEach(() => {
    clearCache();
    vi.restoreAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports correct size and keys after multiple fetches', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            articles: [{ id: '1' }],
          }),
      }),
    );

    await fetchNFLNews();
    await fetchTeamNews('KC');

    const stats = getCacheStats();
    expect(stats.size).toBe(2);
    expect(stats.keys).toHaveLength(2);
  });

  it('marks entries as expired after TTL', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ articles: [{ id: '1' }] }),
      }),
    );

    await fetchNFLNews();
    vi.advanceTimersByTime(300_001);

    const stats = getCacheStats();
    expect(stats.entries[0].expired).toBe(true);
  });

  it('marks entries as not expired within TTL', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ articles: [{ id: '1' }] }),
      }),
    );

    await fetchNFLNews();
    vi.advanceTimersByTime(60_000);

    const stats = getCacheStats();
    expect(stats.entries[0].expired).toBe(false);
    expect(stats.entries[0].age).toBeGreaterThanOrEqual(60_000);
  });
});

// TC-008: espnService cache does not exceed MAX_CACHE_SIZE
describe('espnService — cache size limit (MAX_CACHE_SIZE)', () => {
  beforeEach(() => {
    clearCache();
    vi.restoreAllMocks();
  });

  it('exports MAX_CACHE_SIZE as 100', () => {
    expect(MAX_CACHE_SIZE).toBe(100);
  });

  it('cache does not exceed MAX_CACHE_SIZE after many unique requests', async () => {
    let callCount = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ articles: [{ id: String(callCount) }] }),
        });
      }),
    );

    for (let i = 1; i <= MAX_CACHE_SIZE + 1; i++) {
      await fetchNFLNews(i);
    }

    expect(getCacheStats().size).toBeLessThanOrEqual(MAX_CACHE_SIZE);
  });

  it('evicts the oldest entry when exceeding MAX_CACHE_SIZE (TC-009)', async () => {
    let callCount = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ articles: [{ id: String(callCount) }] }),
        });
      }),
    );

    for (let i = 1; i <= MAX_CACHE_SIZE; i++) {
      await fetchNFLNews(i);
    }

    expect(getCacheStats().size).toBe(MAX_CACHE_SIZE);
    const firstKey = getCacheStats().keys[0];

    await fetchNFLNews(MAX_CACHE_SIZE + 1);

    expect(getCacheStats().size).toBe(MAX_CACHE_SIZE);
    expect(getCacheStats().keys).not.toContain(firstKey);
  });

  it('re-request of evicted endpoint triggers new fetch (TC-008)', async () => {
    const mockFetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ articles: [{ id: '1' }] }),
      }),
    );
    vi.stubGlobal('fetch', mockFetch);

    for (let i = 1; i <= MAX_CACHE_SIZE + 1; i++) {
      await fetchNFLNews(i);
    }

    const callsBefore = mockFetch.mock.calls.length;
    await fetchNFLNews(1);
    expect(mockFetch.mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it('cached non-evicted endpoint still serves from cache', async () => {
    const mockFetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ articles: [{ id: '1' }] }),
      }),
    );
    vi.stubGlobal('fetch', mockFetch);

    for (let i = 1; i <= 50; i++) {
      await fetchNFLNews(i);
    }
    const callsBefore = mockFetch.mock.calls.length;

    await fetchNFLNews(50);
    expect(mockFetch.mock.calls.length).toBe(callsBefore);
  });
});

// TC-010: espnService does not cache error responses
describe('espnService — error responses not cached', () => {
  beforeEach(() => {
    clearCache();
    vi.restoreAllMocks();
  });

  it('does not cache when both proxy and direct fail (500)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );
    await fetchNFLNews();
    expect(getCacheStats().size).toBe(0);
  });

  it('does not cache on network error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
    );
    await fetchNFLNews();
    expect(getCacheStats().size).toBe(0);
  });

  it('caches successful response after earlier failure (TC-010)', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ articles: [{ id: '1', headline: 'Success' }] }),
      });
    vi.stubGlobal('fetch', mockFetch);

    await fetchNFLNews(20);
    expect(getCacheStats().size).toBe(0);

    await fetchNFLNews(20);
    expect(getCacheStats().size).toBe(1);
  });

  it('proxy fails but direct succeeds — only successful response cached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url) => {
        if (url.startsWith('/espn-api')) {
          return Promise.resolve({ ok: false, status: 500 });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ articles: [{ id: '1' }] }),
        });
      }),
    );

    await fetchNFLNews();
    expect(getCacheStats().size).toBe(1);
  });
});

// TC-003: AbortSignal is forwarded through espnService fetch calls
describe('espnService — AbortSignal support', () => {
  beforeEach(() => {
    clearCache();
    vi.restoreAllMocks();
  });

  it('forwards AbortSignal to fetch (TC-003)', async () => {
    const controller = new AbortController();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ articles: [] }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await fetchNFLNews(20, { signal: controller.signal });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it('AbortSignal is forwarded to fallback fetch (TC-022)', async () => {
    const controller = new AbortController();
    const mockFetch = vi.fn().mockImplementation((url) => {
      if (url.startsWith('/espn-api')) {
        return Promise.resolve({ ok: false, status: 500 });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ articles: [] }),
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    await fetchNFLNews(20, { signal: controller.signal });
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[0][1]).toEqual({ signal: controller.signal });
    expect(mockFetch.mock.calls[1][1]).toEqual({ signal: controller.signal });
  });

  it('abort before resolve rejects with AbortError (TC-003)', async () => {
    const controller = new AbortController();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        return new Promise((_, reject) => {
          controller.signal.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted', 'AbortError'));
          });
        });
      }),
    );

    const promise = fetchNFLNews(20, { signal: controller.signal });
    controller.abort();
    await expect(promise).rejects.toThrow('The operation was aborted');
  });

  it('works without signal (backward compatibility)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ articles: [{ id: '1' }] }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await fetchNFLNews(20);
    expect(result).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledWith(expect.any(String));
    expect(mockFetch.mock.calls[0].length).toBe(1);
  });

  it('already-aborted signal rejects immediately', async () => {
    const controller = new AbortController();
    controller.abort();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url, opts) => {
        if (opts?.signal?.aborted) {
          return Promise.reject(new DOMException('The operation was aborted', 'AbortError'));
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ articles: [] }) });
      }),
    );

    await expect(fetchNFLNews(20, { signal: controller.signal })).rejects.toThrow('The operation was aborted');
  });
});

// TC-020: clearCache removes all entries including error-cached entries
describe('espnService — clearCache with mixed entries', () => {
  beforeEach(() => {
    clearCache();
    vi.restoreAllMocks();
  });

  it('clears all entries including those after error/success mix', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ articles: [{ id: '1' }] }),
      }),
    );

    for (let i = 0; i < 5; i++) {
      await fetchNFLNews(i + 1);
    }
    expect(getCacheStats().size).toBe(5);

    clearCache();
    expect(getCacheStats().size).toBe(0);
    expect(getCacheStats().keys).toEqual([]);
  });
});

// TC-012: successful cache entries respect standard TTL
describe('espnService — successful cache TTL unchanged', () => {
  beforeEach(() => {
    clearCache();
    vi.restoreAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('cache entry still valid at 4m59s', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ articles: [{ id: '1' }] }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await fetchNFLNews();
    vi.advanceTimersByTime(299_000);
    await fetchNFLNews();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('cache entry expired after 5m1s', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ articles: [{ id: '1' }] }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await fetchNFLNews();
    vi.advanceTimersByTime(301_000);
    await fetchNFLNews();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
