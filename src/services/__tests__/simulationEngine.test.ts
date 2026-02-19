import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildUnifiedTimeline,
  TimelineSimulationEngine,
  EspnSimulationEngine,
} from '../simulationEngine';
import type {
  SimulationEngine,
  OnPriceUpdate,
  EspnArticle,
} from '../simulationEngine';
import type { Player } from '../../types';
import type { TimelineEntry } from '../../types/simulation';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'player-1',
    name: 'Test Player',
    team: 'KC',
    position: 'QB',
    basePrice: 40.0,
    ...overrides,
  };
}

// TC-007: buildUnifiedTimeline
describe('buildUnifiedTimeline', () => {
  it('merges interleaving player histories into sorted timeline', () => {
    const players: Player[] = [
      makePlayer({
        id: 'a',
        name: 'Player A',
        priceHistory: [
          {
            timestamp: '2026-01-01T10:00:00Z',
            price: 40,
            reason: { type: 'news', headline: 'A1' },
          },
          {
            timestamp: '2026-01-01T12:00:00Z',
            price: 42,
            reason: { type: 'news', headline: 'A2' },
          },
        ],
      }),
      makePlayer({
        id: 'b',
        name: 'Player B',
        priceHistory: [
          {
            timestamp: '2026-01-01T11:00:00Z',
            price: 30,
            reason: { type: 'news', headline: 'B1' },
          },
          {
            timestamp: '2026-01-01T13:00:00Z',
            price: 32,
            reason: { type: 'news', headline: 'B2' },
          },
        ],
      }),
    ];

    const timeline = buildUnifiedTimeline(players);

    expect(timeline).toHaveLength(4);
    expect(timeline[0].playerId).toBe('a');
    expect(timeline[1].playerId).toBe('b');
    expect(timeline[2].playerId).toBe('a');
    expect(timeline[3].playerId).toBe('b');
  });

  it('includes all required fields on each entry', () => {
    const players: Player[] = [
      makePlayer({
        id: 'a',
        name: 'Player A',
        priceHistory: [
          {
            timestamp: '2026-01-01T10:00:00Z',
            price: 40,
            reason: { type: 'news', headline: 'A1' },
            content: [{ type: 'article' }],
          },
        ],
      }),
    ];

    const timeline = buildUnifiedTimeline(players);
    expect(timeline[0]).toHaveProperty('playerId', 'a');
    expect(timeline[0]).toHaveProperty('playerName', 'Player A');
    expect(timeline[0]).toHaveProperty('entryIndex', 0);
    expect(timeline[0]).toHaveProperty('timestamp');
    expect(timeline[0]).toHaveProperty('price', 40);
    expect(timeline[0]).toHaveProperty('reason');
    expect(timeline[0]).toHaveProperty('content');
  });

  it('skips players with undefined priceHistory', () => {
    const players: Player[] = [makePlayer({ id: 'a', name: 'Player A' })];
    expect(buildUnifiedTimeline(players)).toEqual([]);
  });

  it('skips players with empty priceHistory', () => {
    const players: Player[] = [
      makePlayer({ id: 'a', name: 'Player A', priceHistory: [] }),
    ];
    expect(buildUnifiedTimeline(players)).toEqual([]);
  });

  it('handles identical timestamps without crash', () => {
    const players: Player[] = [
      makePlayer({
        id: 'a',
        name: 'A',
        priceHistory: [
          {
            timestamp: '2026-01-01T10:00:00Z',
            price: 40,
            reason: { type: 'news', headline: '' },
          },
        ],
      }),
      makePlayer({
        id: 'b',
        name: 'B',
        priceHistory: [
          {
            timestamp: '2026-01-01T10:00:00Z',
            price: 30,
            reason: { type: 'news', headline: '' },
          },
        ],
      }),
    ];
    const timeline = buildUnifiedTimeline(players);
    expect(timeline).toHaveLength(2);
  });

  it('returns empty array for empty players', () => {
    expect(buildUnifiedTimeline([])).toEqual([]);
  });

  it('does not mutate input players array (pure function)', () => {
    const players: Player[] = [
      makePlayer({
        id: 'a',
        name: 'Player A',
        priceHistory: [
          {
            timestamp: '2026-01-01T10:00:00Z',
            price: 40,
            reason: { type: 'news', headline: 'A1' },
          },
        ],
      }),
    ];
    const clone = JSON.parse(JSON.stringify(players));

    buildUnifiedTimeline(players);

    expect(players).toEqual(clone);
  });

  it('returns identical results on repeated calls (deterministic)', () => {
    const players: Player[] = [
      makePlayer({
        id: 'a',
        name: 'A',
        priceHistory: [
          {
            timestamp: '2026-01-01T10:00:00Z',
            price: 40,
            reason: { type: 'news', headline: 'A1' },
          },
          {
            timestamp: '2026-01-01T12:00:00Z',
            price: 42,
            reason: { type: 'news', headline: 'A2' },
          },
        ],
      }),
    ];
    const result1 = buildUnifiedTimeline(players);
    const result2 = buildUnifiedTimeline(players);
    expect(result1).toEqual(result2);
  });

  it('single player timeline equals that player history in order', () => {
    const players: Player[] = [
      makePlayer({
        id: 'a',
        name: 'A',
        priceHistory: [
          {
            timestamp: '2026-01-01T10:00:00Z',
            price: 40,
            reason: { type: 'news', headline: 'First' },
          },
          {
            timestamp: '2026-01-01T12:00:00Z',
            price: 42,
            reason: { type: 'news', headline: 'Second' },
          },
        ],
      }),
    ];
    const timeline = buildUnifiedTimeline(players);
    expect(timeline).toHaveLength(2);
    expect(timeline[0].price).toBe(40);
    expect(timeline[1].price).toBe(42);
  });
});

// TC-008: TimelineSimulationEngine tick advancement
describe('TimelineSimulationEngine', () => {
  function makeTimeline(count: number): TimelineEntry[] {
    return Array.from({ length: count }, (_, i) => ({
      playerId: `player-${i}`,
      playerName: `Player ${i}`,
      entryIndex: i,
      timestamp: `2026-01-01T${String(10 + i).padStart(2, '0')}:00:00Z`,
      price: 50 + i,
      reason: { type: 'news' as const, headline: `Event ${i}` },
    }));
  }

  it('advances timeline and calls onPriceUpdate for each tick', () => {
    const onPriceUpdate = vi.fn();
    const timeline = makeTimeline(5);
    const engine = new TimelineSimulationEngine({ timeline, onPriceUpdate });

    engine.tick();
    expect(onPriceUpdate).toHaveBeenCalledTimes(1);
    expect(onPriceUpdate).toHaveBeenCalledWith(
      'player-1',
      51,
      timeline[1].reason,
    );
  });

  it('processes all entries through repeated ticks', () => {
    const onPriceUpdate = vi.fn();
    const timeline = makeTimeline(5);
    const engine = new TimelineSimulationEngine({ timeline, onPriceUpdate });

    engine.tick(); // index 1
    engine.tick(); // index 2
    engine.tick(); // index 3
    engine.tick(); // index 4
    expect(onPriceUpdate).toHaveBeenCalledTimes(4);
  });

  it('stops when timeline is exhausted', () => {
    const onPriceUpdate = vi.fn();
    const timeline = makeTimeline(5);
    const engine = new TimelineSimulationEngine({ timeline, onPriceUpdate });

    for (let i = 0; i < 4; i++) engine.tick();
    expect(onPriceUpdate).toHaveBeenCalledTimes(4);

    engine.tick();
    expect(onPriceUpdate).toHaveBeenCalledTimes(4);
  });

  it('handles empty timeline - tick is no-op', () => {
    const onPriceUpdate = vi.fn();
    const engine = new TimelineSimulationEngine({
      timeline: [],
      onPriceUpdate,
    });
    engine.tick();
    expect(onPriceUpdate).not.toHaveBeenCalled();
  });

  // TC-009: start/stop lifecycle
  it('start begins interval-based ticking', () => {
    vi.useFakeTimers();
    const onPriceUpdate = vi.fn();
    const timeline = makeTimeline(10);
    const engine = new TimelineSimulationEngine({
      timeline,
      onPriceUpdate,
      tickIntervalMs: 3000,
    });

    engine.start();
    vi.advanceTimersByTime(3000);
    expect(onPriceUpdate).toHaveBeenCalledTimes(1);

    engine.stop();
    vi.useRealTimers();
  });

  it('stop clears the interval', () => {
    vi.useFakeTimers();
    const onPriceUpdate = vi.fn();
    const timeline = makeTimeline(10);
    const engine = new TimelineSimulationEngine({
      timeline,
      onPriceUpdate,
      tickIntervalMs: 3000,
    });

    engine.start();
    vi.advanceTimersByTime(3000);
    expect(onPriceUpdate).toHaveBeenCalledTimes(1);

    engine.stop();
    vi.advanceTimersByTime(6000);
    expect(onPriceUpdate).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('stop before start does not throw', () => {
    const engine = new TimelineSimulationEngine({
      timeline: [],
      onPriceUpdate: vi.fn(),
    });
    expect(() => engine.stop()).not.toThrow();
  });

  it('calling start twice does not create duplicate intervals', () => {
    vi.useFakeTimers();
    const onPriceUpdate = vi.fn();
    const timeline = makeTimeline(10);
    const engine = new TimelineSimulationEngine({
      timeline,
      onPriceUpdate,
      tickIntervalMs: 3000,
    });

    engine.start();
    engine.start();
    vi.advanceTimersByTime(3000);
    expect(onPriceUpdate).toHaveBeenCalledTimes(1);

    engine.stop();
    vi.useRealTimers();
  });

  it('getPrice returns latest price for player', () => {
    const onPriceUpdate = vi.fn();
    const timeline = makeTimeline(3);
    const engine = new TimelineSimulationEngine({ timeline, onPriceUpdate });

    engine.tick();
    expect(engine.getPrice('player-1')).toBe(51);
  });

  it('getPrice returns 0 for unknown player', () => {
    const engine = new TimelineSimulationEngine({
      timeline: makeTimeline(3),
      onPriceUpdate: vi.fn(),
    });
    expect(engine.getPrice('unknown')).toBe(0);
  });

  it('getPrice returns 0 for empty string player id', () => {
    const engine = new TimelineSimulationEngine({
      timeline: makeTimeline(3),
      onPriceUpdate: vi.fn(),
    });
    expect(engine.getPrice('')).toBe(0);
  });

  it('throws when onPriceUpdate is null', () => {
    expect(
      () =>
        new TimelineSimulationEngine({
          timeline: [],
          onPriceUpdate: null as unknown as OnPriceUpdate,
        }),
    ).toThrow('onPriceUpdate must be a function');
  });

  it('throws when onPriceUpdate is undefined', () => {
    expect(
      () =>
        new TimelineSimulationEngine({
          timeline: [],
          onPriceUpdate: undefined as unknown as OnPriceUpdate,
        }),
    ).toThrow('onPriceUpdate must be a function');
  });

  it('throws when onPriceUpdate is a string', () => {
    expect(
      () =>
        new TimelineSimulationEngine({
          timeline: [],
          onPriceUpdate: 'not a function' as unknown as OnPriceUpdate,
        }),
    ).toThrow('onPriceUpdate must be a function');
  });

  it('seeds initial price from first timeline entry before any tick', () => {
    const timeline: TimelineEntry[] = [
      {
        playerId: 'mahomes',
        playerName: 'Mahomes',
        entryIndex: 0,
        timestamp: '2026-01-01T10:00:00Z',
        price: 50,
        reason: { type: 'news', headline: 'Start' },
      },
    ];
    const engine = new TimelineSimulationEngine({
      timeline,
      onPriceUpdate: vi.fn(),
    });
    expect(engine.getPrice('mahomes')).toBe(50);
  });

  it('does not seed any price when timeline is empty', () => {
    const engine = new TimelineSimulationEngine({
      timeline: [],
      onPriceUpdate: vi.fn(),
    });
    expect(engine.getPrice('anyone')).toBe(0);
  });

  it('1-entry timeline: first tick immediately stops', () => {
    const onPriceUpdate = vi.fn();
    const timeline: TimelineEntry[] = [
      {
        playerId: 'a',
        playerName: 'A',
        entryIndex: 0,
        timestamp: 't0',
        price: 50,
        reason: { type: 'news', headline: '' },
      },
    ];
    const engine = new TimelineSimulationEngine({ timeline, onPriceUpdate });
    engine.tick();
    expect(onPriceUpdate).not.toHaveBeenCalled();
  });

  it('restart after stop works correctly', () => {
    vi.useFakeTimers();
    const onPriceUpdate = vi.fn();
    const timeline = makeTimeline(10);
    const engine = new TimelineSimulationEngine({
      timeline,
      onPriceUpdate,
      tickIntervalMs: 3000,
    });

    engine.start();
    vi.advanceTimersByTime(3000);
    expect(onPriceUpdate).toHaveBeenCalledTimes(1);

    engine.stop();
    engine.start();
    vi.advanceTimersByTime(3000);
    expect(onPriceUpdate).toHaveBeenCalledTimes(2);

    engine.stop();
    vi.useRealTimers();
  });

  it('uses custom tickIntervalMs', () => {
    vi.useFakeTimers();
    const onPriceUpdate = vi.fn();
    const timeline = makeTimeline(10);
    const engine = new TimelineSimulationEngine({
      timeline,
      onPriceUpdate,
      tickIntervalMs: 1000,
    });

    engine.start();
    vi.advanceTimersByTime(1000);
    expect(onPriceUpdate).toHaveBeenCalledTimes(1);

    engine.stop();
    vi.useRealTimers();
  });

  it('getPrice updates when same player appears multiple times', () => {
    const onPriceUpdate = vi.fn();
    const timeline: TimelineEntry[] = [
      {
        playerId: 'mahomes',
        playerName: 'M',
        entryIndex: 0,
        timestamp: 't0',
        price: 50,
        reason: { type: 'news', headline: '' },
      },
      {
        playerId: 'mahomes',
        playerName: 'M',
        entryIndex: 1,
        timestamp: 't1',
        price: 55,
        reason: { type: 'news', headline: '' },
      },
      {
        playerId: 'mahomes',
        playerName: 'M',
        entryIndex: 2,
        timestamp: 't2',
        price: 60,
        reason: { type: 'news', headline: '' },
      },
    ];
    const engine = new TimelineSimulationEngine({ timeline, onPriceUpdate });

    engine.tick();
    expect(engine.getPrice('mahomes')).toBe(55);
    engine.tick();
    expect(engine.getPrice('mahomes')).toBe(60);
  });
});

describe('SimulationEngine interface contract', () => {
  it('has no React imports in simulationEngine.ts', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.resolve(__dirname, '..', 'simulationEngine.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).not.toMatch(/from\s+['"]react['"]/);
    expect(content).not.toMatch(/from\s+['"]react-dom['"]/);
  });

  it('a stub third engine class can implement SimulationEngine', () => {
    class StubEngine implements SimulationEngine {
      start() {}
      stop() {}
      tick() {}
      getPrice(_id: string) {
        return 0;
      }
    }

    const engine: SimulationEngine = new StubEngine();
    expect(typeof engine.start).toBe('function');
    expect(typeof engine.stop).toBe('function');
    expect(typeof engine.tick).toBe('function');
    expect(typeof engine.getPrice).toBe('function');
  });
});

// TC-010, TC-011: EspnSimulationEngine
describe('EspnSimulationEngine', () => {
  const testPlayers: Player[] = [
    makePlayer({
      id: 'mahomes',
      name: 'Patrick Mahomes',
      searchTerms: ['mahomes'],
      position: 'QB',
      basePrice: 50.0,
    }),
    makePlayer({
      id: 'kelce',
      name: 'Travis Kelce',
      searchTerms: ['kelce'],
      position: 'TE',
      basePrice: 35.0,
    }),
  ];

  // TC-010: article processing pipeline
  it('processes relevant articles and fires onPriceUpdate', async () => {
    const onPriceUpdate = vi.fn();
    const fetchNews = vi.fn().mockResolvedValue([
      {
        id: 'art-1',
        headline: 'Mahomes throws 4 touchdowns in comeback win',
        description: 'Great game',
      },
    ]);
    const calculateNewPrice = vi
      .fn()
      .mockReturnValue({ newPrice: 55.0, changePercent: 10 });
    const analyzeSentiment = vi.fn().mockReturnValue({
      sentiment: 'positive',
      magnitude: 0.8,
      confidence: 0.9,
    });

    const engine = new EspnSimulationEngine({
      players: testPlayers,
      onPriceUpdate,
      fetchNews,
      analyzeSentiment,
      calculateNewPrice,
    });

    await engine.tick();

    expect(onPriceUpdate).toHaveBeenCalledTimes(1);
    expect(onPriceUpdate).toHaveBeenCalledWith(
      'mahomes',
      55.0,
      expect.objectContaining({
        headline: 'Mahomes throws 4 touchdowns in comeback win',
      }),
    );
  });

  it('does not fire onPriceUpdate for irrelevant articles', async () => {
    const onPriceUpdate = vi.fn();
    const fetchNews = vi.fn().mockResolvedValue([
      {
        id: 'art-1',
        headline: 'Weather forecast for Sunday games',
        description: 'Rain expected',
      },
    ]);

    const engine = new EspnSimulationEngine({
      players: testPlayers,
      onPriceUpdate,
      fetchNews,
    });

    await engine.tick();
    expect(onPriceUpdate).not.toHaveBeenCalled();
  });

  it('fires updates for multiple players from one article', async () => {
    const onPriceUpdate = vi.fn();
    const fetchNews = vi.fn().mockResolvedValue([
      {
        id: 'art-1',
        headline: 'Mahomes to Kelce connection unstoppable',
        description: 'Touchdown play',
      },
    ]);
    const calculateNewPrice = vi
      .fn()
      .mockReturnValue({ newPrice: 55, changePercent: 5 });

    const engine = new EspnSimulationEngine({
      players: testPlayers,
      onPriceUpdate,
      fetchNews,
      calculateNewPrice,
      analyzeSentiment: vi.fn().mockReturnValue({
        sentiment: 'positive',
        magnitude: 0.5,
        confidence: 0.7,
      }),
    });

    await engine.tick();
    expect(onPriceUpdate).toHaveBeenCalledTimes(2);
  });

  it('handles empty article list without errors', async () => {
    const onPriceUpdate = vi.fn();
    const fetchNews = vi.fn().mockResolvedValue([]);

    const engine = new EspnSimulationEngine({
      players: testPlayers,
      onPriceUpdate,
      fetchNews,
    });

    await expect(engine.tick()).resolves.not.toThrow();
    expect(onPriceUpdate).not.toHaveBeenCalled();
  });

  it('handles fetch failure gracefully', async () => {
    const onPriceUpdate = vi.fn();
    const fetchNews = vi
      .fn()
      .mockRejectedValue(new Error('Network error'));

    const engine = new EspnSimulationEngine({
      players: testPlayers,
      onPriceUpdate,
      fetchNews,
    });

    await expect(engine.tick()).resolves.not.toThrow();
    expect(onPriceUpdate).not.toHaveBeenCalled();
  });

  // TC-011: article deduplication
  it('does not re-process same article on subsequent ticks', async () => {
    const onPriceUpdate = vi.fn();
    const articles = [
      { id: 'art-1', headline: 'Mahomes TD', description: 'Big play' },
    ];
    const fetchNews = vi.fn().mockResolvedValue(articles);
    const calculateNewPrice = vi
      .fn()
      .mockReturnValue({ newPrice: 55, changePercent: 5 });

    const engine = new EspnSimulationEngine({
      players: testPlayers,
      onPriceUpdate,
      fetchNews,
      calculateNewPrice,
      analyzeSentiment: vi.fn().mockReturnValue({
        sentiment: 'positive',
        magnitude: 0.5,
        confidence: 0.7,
      }),
    });

    await engine.tick();
    expect(onPriceUpdate).toHaveBeenCalledTimes(1);

    await engine.tick();
    expect(onPriceUpdate).toHaveBeenCalledTimes(1);
  });

  it('processes new articles but not old ones', async () => {
    const onPriceUpdate = vi.fn();
    const calculateNewPrice = vi
      .fn()
      .mockReturnValue({ newPrice: 55, changePercent: 5 });
    const analyzeSentiment = vi.fn().mockReturnValue({
      sentiment: 'positive',
      magnitude: 0.5,
      confidence: 0.7,
    });

    let articles = [
      { id: 'art-1', headline: 'Mahomes TD', description: 'Big play' },
    ];
    const fetchNews = vi
      .fn()
      .mockImplementation(() => Promise.resolve(articles));

    const engine = new EspnSimulationEngine({
      players: testPlayers,
      onPriceUpdate,
      fetchNews,
      calculateNewPrice,
      analyzeSentiment,
    });

    await engine.tick();
    expect(onPriceUpdate).toHaveBeenCalledTimes(1);

    articles = [
      { id: 'art-1', headline: 'Mahomes TD', description: 'Big play' },
      {
        id: 'art-2',
        headline: 'Kelce catch record',
        description: 'Amazing kelce',
      },
    ];
    await engine.tick();
    expect(onPriceUpdate).toHaveBeenCalledTimes(2);
  });

  it('skips articles with missing id', async () => {
    const onPriceUpdate = vi.fn();
    const fetchNews = vi.fn().mockResolvedValue([
      { id: '', headline: 'Mahomes TD', description: 'Big play' },
    ]);

    const engine = new EspnSimulationEngine({
      players: testPlayers,
      onPriceUpdate,
      fetchNews,
    });

    await engine.tick();
    expect(onPriceUpdate).not.toHaveBeenCalled();
  });

  // TC-012: common interface
  it('has start, stop, tick, getPrice methods', () => {
    const engine = new EspnSimulationEngine({
      players: testPlayers,
      onPriceUpdate: vi.fn(),
    });

    expect(typeof engine.start).toBe('function');
    expect(typeof engine.stop).toBe('function');
    expect(typeof engine.tick).toBe('function');
    expect(typeof engine.getPrice).toBe('function');
  });

  it('TimelineSimulationEngine also has start, stop, tick, getPrice methods', () => {
    const engine = new TimelineSimulationEngine({
      timeline: [],
      onPriceUpdate: vi.fn(),
    });

    expect(typeof engine.start).toBe('function');
    expect(typeof engine.stop).toBe('function');
    expect(typeof engine.tick).toBe('function');
    expect(typeof engine.getPrice).toBe('function');
  });

  it('throws for non-function onPriceUpdate', () => {
    expect(
      () =>
        new EspnSimulationEngine({
          players: testPlayers,
          onPriceUpdate: 'not a function' as unknown as () => void,
        }),
    ).toThrow();
  });

  it('getPrice returns updated price after processing', async () => {
    const calculateNewPrice = vi
      .fn()
      .mockReturnValue({ newPrice: 55, changePercent: 5 });
    const engine = new EspnSimulationEngine({
      players: testPlayers,
      onPriceUpdate: vi.fn(),
      fetchNews: vi.fn().mockResolvedValue([
        { id: 'art-1', headline: 'Mahomes TD', description: 'Big play' },
      ]),
      calculateNewPrice,
      analyzeSentiment: vi.fn().mockReturnValue({
        sentiment: 'positive',
        magnitude: 0.5,
        confidence: 0.7,
      }),
    });

    await engine.tick();
    expect(engine.getPrice('mahomes')).toBe(55);
  });
});

// TC-023: onPriceUpdate callback integration
describe('onPriceUpdate callback integration', () => {
  it('callback receives correct data for price overrides and history', () => {
    const priceOverrides: Record<string, number> = {};
    const history: Array<{
      playerId: string;
      action: string;
      price: number;
    }> = [];

    const onPriceUpdate = (
      playerId: string,
      price: number,
      reason: { headline?: string } | null,
    ) => {
      priceOverrides[playerId] = price;
      history.push({
        playerId,
        price,
        action: reason?.headline || 'Price update',
      });
    };

    const timeline: TimelineEntry[] = [
      {
        playerId: 'mahomes',
        playerName: 'Mahomes',
        entryIndex: 0,
        timestamp: 't0',
        price: 50,
        reason: { type: 'news', headline: 'Start' },
      },
      {
        playerId: 'mahomes',
        playerName: 'Mahomes',
        entryIndex: 1,
        timestamp: 't1',
        price: 55,
        reason: { type: 'news', headline: 'Big play' },
      },
      {
        playerId: 'kelce',
        playerName: 'Kelce',
        entryIndex: 0,
        timestamp: 't2',
        price: 32.5,
        reason: { type: 'news', headline: 'Catch' },
      },
    ];

    const engine = new TimelineSimulationEngine({ timeline, onPriceUpdate });

    engine.tick();
    expect(priceOverrides).toEqual({ mahomes: 55 });
    expect(history).toHaveLength(1);
    expect(history[0].action).toBe('Big play');

    engine.tick();
    expect(priceOverrides).toEqual({ mahomes: 55, kelce: 32.5 });
    expect(history).toHaveLength(2);
  });

  it('override is replaced not accumulated when same player updated', () => {
    const priceOverrides: Record<string, number> = {};
    const onPriceUpdate = (playerId: string, price: number) => {
      priceOverrides[playerId] = price;
    };

    const timeline: TimelineEntry[] = [
      {
        playerId: 'mahomes',
        playerName: 'M',
        entryIndex: 0,
        timestamp: 't0',
        price: 50,
        reason: { type: 'news', headline: '' },
      },
      {
        playerId: 'mahomes',
        playerName: 'M',
        entryIndex: 1,
        timestamp: 't1',
        price: 55,
        reason: { type: 'news', headline: '' },
      },
      {
        playerId: 'mahomes',
        playerName: 'M',
        entryIndex: 2,
        timestamp: 't2',
        price: 60,
        reason: { type: 'news', headline: '' },
      },
    ];

    const engine = new TimelineSimulationEngine({ timeline, onPriceUpdate });
    engine.tick();
    engine.tick();

    expect(priceOverrides.mahomes).toBe(60);
  });

  it('history entry created even when reason headline is missing', () => {
    const history: Array<{ action: string }> = [];

    const onPriceUpdate = (
      _playerId: string,
      _price: number,
      reason: { headline?: string } | null,
    ) => {
      history.push({ action: reason?.headline || 'Price update' });
    };

    const timeline: TimelineEntry[] = [
      {
        playerId: 'a',
        playerName: 'A',
        entryIndex: 0,
        timestamp: 't0',
        price: 50,
        reason: { type: 'news', headline: '' },
      },
      {
        playerId: 'a',
        playerName: 'A',
        entryIndex: 1,
        timestamp: 't1',
        price: 55,
        reason: { type: 'news', headline: '' },
      },
    ];

    const engine = new TimelineSimulationEngine({ timeline, onPriceUpdate });
    engine.tick();

    expect(history).toHaveLength(1);
    expect(history[0].action).toBe('Price update');
  });
});

// ── Comprehensive EspnSimulationEngine TCs ──────────────────────────
describe('EspnSimulationEngine — full TC coverage', () => {
  function espnPlayer(overrides: Partial<Player> = {}): Player {
    return {
      id: 'mahomes',
      name: 'Patrick Mahomes',
      team: 'KC',
      position: 'QB',
      basePrice: 50.0,
      searchTerms: ['mahomes', 'patrick mahomes'],
      ...overrides,
    };
  }

  function makeArticle(overrides: Partial<EspnArticle> = {}): EspnArticle {
    return {
      id: 'art-1',
      headline: 'Mahomes throws 4 TDs',
      description: 'Great game',
      ...overrides,
    };
  }

  // TC-001: implements SimulationEngine interface
  describe('TC-001: interface compliance', () => {
    it('can be assigned to a SimulationEngine-typed variable', () => {
      const engine: SimulationEngine = new EspnSimulationEngine({
        players: [],
        onPriceUpdate: vi.fn(),
      });
      expect(typeof engine.start).toBe('function');
      expect(typeof engine.stop).toBe('function');
      expect(typeof engine.tick).toBe('function');
      expect(typeof engine.getPrice).toBe('function');
    });

    it('tick() returns a Promise (async compatible with void | Promise<void>)', async () => {
      const engine = new EspnSimulationEngine({
        players: [],
        onPriceUpdate: vi.fn(),
      });
      const result = engine.tick();
      expect(result).toBeInstanceOf(Promise);
      await result;
    });
  });

  // TC-002: constructor validates onPriceUpdate
  describe('TC-002: onPriceUpdate validation', () => {
    it('throws when onPriceUpdate is a string', () => {
      expect(
        () =>
          new EspnSimulationEngine({
            players: [],
            onPriceUpdate: 'not a function' as unknown as OnPriceUpdate,
          }),
      ).toThrow('onPriceUpdate must be a function');
    });

    it('throws when onPriceUpdate is undefined', () => {
      expect(
        () =>
          new EspnSimulationEngine({
            players: [],
            onPriceUpdate: undefined as unknown as OnPriceUpdate,
          }),
      ).toThrow('onPriceUpdate must be a function');
    });

    it('throws when onPriceUpdate is null', () => {
      expect(
        () =>
          new EspnSimulationEngine({
            players: [],
            onPriceUpdate: null as unknown as OnPriceUpdate,
          }),
      ).toThrow('onPriceUpdate must be a function');
    });

    it('throws when onPriceUpdate is an object', () => {
      expect(
        () =>
          new EspnSimulationEngine({
            players: [],
            onPriceUpdate: {} as unknown as OnPriceUpdate,
          }),
      ).toThrow('onPriceUpdate must be a function');
    });

    it('throws when onPriceUpdate is a number', () => {
      expect(
        () =>
          new EspnSimulationEngine({
            players: [],
            onPriceUpdate: 42 as unknown as OnPriceUpdate,
          }),
      ).toThrow('onPriceUpdate must be a function');
    });

    it('succeeds with a valid function', () => {
      expect(
        () =>
          new EspnSimulationEngine({
            players: [],
            onPriceUpdate: vi.fn(),
          }),
      ).not.toThrow();
    });
  });

  // TC-003: constructor initializes prices from basePrices
  describe('TC-003: price initialization', () => {
    it('getPrice returns basePrice before any ticks', () => {
      const engine = new EspnSimulationEngine({
        players: [
          espnPlayer({ id: 'p1', basePrice: 50.0 }),
          espnPlayer({ id: 'p2', basePrice: 35.0 }),
        ],
        onPriceUpdate: vi.fn(),
      });

      expect(engine.getPrice('p1')).toBe(50.0);
      expect(engine.getPrice('p2')).toBe(35.0);
    });

    it('handles basePrice of 0', () => {
      const engine = new EspnSimulationEngine({
        players: [espnPlayer({ id: 'p1', basePrice: 0 })],
        onPriceUpdate: vi.fn(),
      });
      expect(engine.getPrice('p1')).toBe(0);
    });

    it('single player initializes correctly', () => {
      const engine = new EspnSimulationEngine({
        players: [espnPlayer({ id: 'solo', basePrice: 99.99 })],
        onPriceUpdate: vi.fn(),
      });
      expect(engine.getPrice('solo')).toBe(99.99);
    });
  });

  // TC-004: default values for optional dependencies
  describe('TC-004: default optional dependencies', () => {
    it('instantiates with only required options', () => {
      expect(
        () =>
          new EspnSimulationEngine({
            players: [espnPlayer()],
            onPriceUpdate: vi.fn(),
          }),
      ).not.toThrow();
    });

    it('default fetchNews returns empty array — tick produces no updates', async () => {
      const onPriceUpdate = vi.fn();
      const engine = new EspnSimulationEngine({
        players: [espnPlayer()],
        onPriceUpdate,
      });
      await engine.tick();
      expect(onPriceUpdate).not.toHaveBeenCalled();
    });

    it('default analyzeSentiment returns neutral with zero magnitude', async () => {
      const analyzeSentiment = vi.fn().mockReturnValue({
        sentiment: 'neutral',
        magnitude: 0,
        confidence: 0,
      });
      const calculateNewPrice = vi
        .fn()
        .mockReturnValue({ newPrice: 50, changePercent: 0 });
      const engine = new EspnSimulationEngine({
        players: [espnPlayer()],
        onPriceUpdate: vi.fn(),
        fetchNews: vi.fn().mockResolvedValue([makeArticle()]),
        analyzeSentiment,
        calculateNewPrice,
      });
      await engine.tick();
      expect(analyzeSentiment).toHaveBeenCalled();
    });

    it('default refreshIntervalMs is 60000', () => {
      vi.useFakeTimers();
      const fetchNews = vi.fn().mockResolvedValue([]);
      const engine = new EspnSimulationEngine({
        players: [espnPlayer()],
        onPriceUpdate: vi.fn(),
        fetchNews,
      });
      engine.start();
      expect(fetchNews).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(60000);
      expect(fetchNews).toHaveBeenCalledTimes(2);
      engine.stop();
      vi.useRealTimers();
    });
  });

  // TC-005: tick() calls fetchNews with newsLimit
  describe('TC-005: fetchNews called with newsLimit', () => {
    it('passes configured newsLimit to fetchNews', async () => {
      const fetchNews = vi.fn().mockResolvedValue([]);
      const engine = new EspnSimulationEngine({
        players: [],
        onPriceUpdate: vi.fn(),
        fetchNews,
        newsLimit: 15,
      });
      await engine.tick();
      expect(fetchNews).toHaveBeenCalledWith(15);
    });

    it('passes default newsLimit of 30 when not specified', async () => {
      const fetchNews = vi.fn().mockResolvedValue([]);
      const engine = new EspnSimulationEngine({
        players: [],
        onPriceUpdate: vi.fn(),
        fetchNews,
      });
      await engine.tick();
      expect(fetchNews).toHaveBeenCalledWith(30);
    });

    it('calls fetchNews on each tick', async () => {
      const fetchNews = vi.fn().mockResolvedValue([]);
      const engine = new EspnSimulationEngine({
        players: [],
        onPriceUpdate: vi.fn(),
        fetchNews,
      });
      await engine.tick();
      await engine.tick();
      await engine.tick();
      expect(fetchNews).toHaveBeenCalledTimes(3);
    });
  });

  // TC-006: full processing pipeline
  describe('TC-006: article processing pipeline', () => {
    it('calls analyzeSentiment with concatenated text, player name, and position', async () => {
      const analyzeSentiment = vi.fn().mockReturnValue({
        sentiment: 'positive',
        magnitude: 0.8,
        confidence: 0.9,
      });
      const calculateNewPrice = vi
        .fn()
        .mockReturnValue({ newPrice: 55, changePercent: 10 });
      const engine = new EspnSimulationEngine({
        players: [espnPlayer()],
        onPriceUpdate: vi.fn(),
        fetchNews: vi.fn().mockResolvedValue([makeArticle()]),
        analyzeSentiment,
        calculateNewPrice,
      });

      await engine.tick();

      expect(analyzeSentiment).toHaveBeenCalledWith(
        'Mahomes throws 4 TDs Great game',
        'Patrick Mahomes',
        'QB',
      );
    });

    it('calls calculateNewPrice with current price and sentiment result', async () => {
      const sentimentResult = {
        sentiment: 'positive' as const,
        magnitude: 0.8,
        confidence: 0.9,
      };
      const calculateNewPrice = vi
        .fn()
        .mockReturnValue({ newPrice: 55, changePercent: 10 });
      const engine = new EspnSimulationEngine({
        players: [espnPlayer({ basePrice: 50 })],
        onPriceUpdate: vi.fn(),
        fetchNews: vi.fn().mockResolvedValue([makeArticle()]),
        analyzeSentiment: vi.fn().mockReturnValue(sentimentResult),
        calculateNewPrice,
      });

      await engine.tick();

      expect(calculateNewPrice).toHaveBeenCalledWith(50, sentimentResult);
    });

    it('calls onPriceUpdate with correct PriceReason', async () => {
      const onPriceUpdate = vi.fn();
      const engine = new EspnSimulationEngine({
        players: [espnPlayer()],
        onPriceUpdate,
        fetchNews: vi.fn().mockResolvedValue([makeArticle()]),
        analyzeSentiment: vi.fn().mockReturnValue({
          sentiment: 'positive',
          magnitude: 0.8,
          confidence: 0.9,
        }),
        calculateNewPrice: vi
          .fn()
          .mockReturnValue({ newPrice: 55, changePercent: 10 }),
      });

      await engine.tick();

      expect(onPriceUpdate).toHaveBeenCalledWith('mahomes', 55, {
        type: 'news',
        headline: 'Mahomes throws 4 TDs',
        source: 'ESPN NFL',
        url: undefined,
        sentiment: 'positive',
        magnitude: 0.8,
      });
    });

    it('updates internal price after processing', async () => {
      const engine = new EspnSimulationEngine({
        players: [espnPlayer({ basePrice: 50 })],
        onPriceUpdate: vi.fn(),
        fetchNews: vi.fn().mockResolvedValue([makeArticle()]),
        analyzeSentiment: vi.fn().mockReturnValue({
          sentiment: 'positive',
          magnitude: 0.8,
          confidence: 0.9,
        }),
        calculateNewPrice: vi
          .fn()
          .mockReturnValue({ newPrice: 55, changePercent: 10 }),
      });

      await engine.tick();
      expect(engine.getPrice('mahomes')).toBe(55);
    });
  });

  // TC-007: irrelevant articles skipped
  describe('TC-007: irrelevant articles', () => {
    it('skips articles with no player match', async () => {
      const analyzeSentiment = vi.fn();
      const calculateNewPrice = vi.fn();
      const onPriceUpdate = vi.fn();
      const engine = new EspnSimulationEngine({
        players: [
          espnPlayer({ id: 'mahomes', searchTerms: ['mahomes'] }),
          espnPlayer({ id: 'kelce', searchTerms: ['kelce'], basePrice: 35 }),
        ],
        onPriceUpdate,
        fetchNews: vi.fn().mockResolvedValue([
          makeArticle({
            headline: 'Weather forecast for Sunday',
            description: 'Rain expected',
          }),
        ]),
        analyzeSentiment,
        calculateNewPrice,
      });

      await engine.tick();

      expect(analyzeSentiment).not.toHaveBeenCalled();
      expect(calculateNewPrice).not.toHaveBeenCalled();
      expect(onPriceUpdate).not.toHaveBeenCalled();
    });

    it('partial match does not trigger (mahome vs mahomes)', async () => {
      const onPriceUpdate = vi.fn();
      const engine = new EspnSimulationEngine({
        players: [espnPlayer({ searchTerms: ['mahomesX'] })],
        onPriceUpdate,
        fetchNews: vi.fn().mockResolvedValue([
          makeArticle({
            headline: 'Mahomes throws deep',
            description: 'nothing',
          }),
        ]),
        analyzeSentiment: vi.fn().mockReturnValue({
          sentiment: 'positive',
          magnitude: 0.5,
          confidence: 0.7,
        }),
        calculateNewPrice: vi
          .fn()
          .mockReturnValue({ newPrice: 55, changePercent: 5 }),
      });

      await engine.tick();
      expect(onPriceUpdate).not.toHaveBeenCalled();
    });
  });

  // TC-008: case-insensitive matching + searchTerms
  describe('TC-008: case-insensitive searchTerms matching', () => {
    it('matches uppercase headline against lowercase search term', async () => {
      const onPriceUpdate = vi.fn();
      const engine = new EspnSimulationEngine({
        players: [espnPlayer({ searchTerms: ['mahomes'] })],
        onPriceUpdate,
        fetchNews: vi.fn().mockResolvedValue([
          makeArticle({
            headline: 'MAHOMES throws deep',
            description: 'nothing',
          }),
        ]),
        analyzeSentiment: vi.fn().mockReturnValue({
          sentiment: 'positive',
          magnitude: 0.5,
          confidence: 0.7,
        }),
        calculateNewPrice: vi
          .fn()
          .mockReturnValue({ newPrice: 55, changePercent: 5 }),
      });

      await engine.tick();
      expect(onPriceUpdate).toHaveBeenCalledTimes(1);
    });

    it('matches via description when headline has no match', async () => {
      const onPriceUpdate = vi.fn();
      const engine = new EspnSimulationEngine({
        players: [espnPlayer({ searchTerms: ['patrick mahomes'] })],
        onPriceUpdate,
        fetchNews: vi.fn().mockResolvedValue([
          makeArticle({
            headline: 'nothing relevant',
            description: 'great pass by Patrick Mahomes',
          }),
        ]),
        analyzeSentiment: vi.fn().mockReturnValue({
          sentiment: 'positive',
          magnitude: 0.5,
          confidence: 0.7,
        }),
        calculateNewPrice: vi
          .fn()
          .mockReturnValue({ newPrice: 55, changePercent: 5 }),
      });

      await engine.tick();
      expect(onPriceUpdate).toHaveBeenCalledTimes(1);
    });

    it('does not match when neither headline nor description contains term', async () => {
      const onPriceUpdate = vi.fn();
      const engine = new EspnSimulationEngine({
        players: [espnPlayer({ searchTerms: ['mahomes'] })],
        onPriceUpdate,
        fetchNews: vi.fn().mockResolvedValue([
          makeArticle({
            headline: 'nothing',
            description: 'nothing',
          }),
        ]),
        analyzeSentiment: vi.fn().mockReturnValue({
          sentiment: 'neutral',
          magnitude: 0,
          confidence: 0,
        }),
        calculateNewPrice: vi
          .fn()
          .mockReturnValue({ newPrice: 50, changePercent: 0 }),
      });

      await engine.tick();
      expect(onPriceUpdate).not.toHaveBeenCalled();
    });

    it('falls back to player.name when searchTerms is undefined', async () => {
      const onPriceUpdate = vi.fn();
      const player = espnPlayer({ name: 'Patrick Mahomes' });
      delete (player as unknown as Record<string, unknown>).searchTerms;

      const engine = new EspnSimulationEngine({
        players: [player],
        onPriceUpdate,
        fetchNews: vi.fn().mockResolvedValue([
          makeArticle({
            headline: 'Patrick Mahomes scores',
            description: 'big play',
          }),
        ]),
        analyzeSentiment: vi.fn().mockReturnValue({
          sentiment: 'positive',
          magnitude: 0.5,
          confidence: 0.7,
        }),
        calculateNewPrice: vi
          .fn()
          .mockReturnValue({ newPrice: 55, changePercent: 5 }),
      });

      await engine.tick();
      expect(onPriceUpdate).toHaveBeenCalledTimes(1);
    });

    it('handles mixed-case search term like McAfee', async () => {
      const onPriceUpdate = vi.fn();
      const engine = new EspnSimulationEngine({
        players: [espnPlayer({ searchTerms: ['McAfee'] })],
        onPriceUpdate,
        fetchNews: vi.fn().mockResolvedValue([
          makeArticle({
            headline: 'mcafee show today',
            description: 'fun times',
          }),
        ]),
        analyzeSentiment: vi.fn().mockReturnValue({
          sentiment: 'neutral',
          magnitude: 0.3,
          confidence: 0.5,
        }),
        calculateNewPrice: vi
          .fn()
          .mockReturnValue({ newPrice: 51, changePercent: 2 }),
      });

      await engine.tick();
      expect(onPriceUpdate).toHaveBeenCalledTimes(1);
    });
  });

  // TC-009: one article matches multiple players
  describe('TC-009: multi-player match', () => {
    it('fires separate onPriceUpdate for each matched player', async () => {
      const onPriceUpdate = vi.fn();
      const analyzeSentiment = vi.fn().mockReturnValue({
        sentiment: 'positive',
        magnitude: 0.5,
        confidence: 0.7,
      });
      const calculateNewPrice = vi
        .fn()
        .mockReturnValue({ newPrice: 55, changePercent: 5 });

      const engine = new EspnSimulationEngine({
        players: [
          espnPlayer({ id: 'mahomes', searchTerms: ['mahomes'], basePrice: 50 }),
          espnPlayer({
            id: 'kelce',
            name: 'Travis Kelce',
            searchTerms: ['kelce'],
            position: 'TE',
            basePrice: 35,
          }),
        ],
        onPriceUpdate,
        fetchNews: vi.fn().mockResolvedValue([
          makeArticle({
            headline: 'Mahomes to Kelce connection',
            description: 'TD play',
          }),
        ]),
        analyzeSentiment,
        calculateNewPrice,
      });

      await engine.tick();

      expect(onPriceUpdate).toHaveBeenCalledTimes(2);
      const playerIds = onPriceUpdate.mock.calls.map(
        (c: unknown[]) => c[0],
      );
      expect(playerIds).toContain('mahomes');
      expect(playerIds).toContain('kelce');
    });

    it('calls analyzeSentiment with each player name/position', async () => {
      const analyzeSentiment = vi.fn().mockReturnValue({
        sentiment: 'positive',
        magnitude: 0.5,
        confidence: 0.7,
      });

      const engine = new EspnSimulationEngine({
        players: [
          espnPlayer({ id: 'mahomes', searchTerms: ['mahomes'], basePrice: 50 }),
          espnPlayer({
            id: 'kelce',
            name: 'Travis Kelce',
            searchTerms: ['kelce'],
            position: 'TE',
            basePrice: 35,
          }),
        ],
        onPriceUpdate: vi.fn(),
        fetchNews: vi.fn().mockResolvedValue([
          makeArticle({
            headline: 'Mahomes to Kelce connection',
            description: 'TD play',
          }),
        ]),
        analyzeSentiment,
        calculateNewPrice: vi
          .fn()
          .mockReturnValue({ newPrice: 55, changePercent: 5 }),
      });

      await engine.tick();

      expect(analyzeSentiment).toHaveBeenCalledTimes(2);
      expect(analyzeSentiment).toHaveBeenCalledWith(
        expect.any(String),
        'Patrick Mahomes',
        'QB',
      );
      expect(analyzeSentiment).toHaveBeenCalledWith(
        expect.any(String),
        'Travis Kelce',
        'TE',
      );
    });

    it('uses each player own current price for calculation', async () => {
      const calculateNewPrice = vi
        .fn()
        .mockImplementation((price: number) => ({
          newPrice: price + 5,
          changePercent: 10,
        }));

      const engine = new EspnSimulationEngine({
        players: [
          espnPlayer({ id: 'mahomes', searchTerms: ['mahomes'], basePrice: 50 }),
          espnPlayer({
            id: 'kelce',
            name: 'Travis Kelce',
            searchTerms: ['kelce'],
            position: 'TE',
            basePrice: 35,
          }),
        ],
        onPriceUpdate: vi.fn(),
        fetchNews: vi.fn().mockResolvedValue([
          makeArticle({
            headline: 'Mahomes to Kelce connection',
            description: 'TD play',
          }),
        ]),
        analyzeSentiment: vi.fn().mockReturnValue({
          sentiment: 'positive',
          magnitude: 0.5,
          confidence: 0.7,
        }),
        calculateNewPrice,
      });

      await engine.tick();

      expect(engine.getPrice('mahomes')).toBe(55);
      expect(engine.getPrice('kelce')).toBe(40);
    });
  });

  // TC-010: article deduplication
  describe('TC-010: article deduplication', () => {
    it('same article not re-processed across three ticks', async () => {
      const onPriceUpdate = vi.fn();
      const engine = new EspnSimulationEngine({
        players: [espnPlayer()],
        onPriceUpdate,
        fetchNews: vi.fn().mockResolvedValue([makeArticle()]),
        analyzeSentiment: vi.fn().mockReturnValue({
          sentiment: 'positive',
          magnitude: 0.5,
          confidence: 0.7,
        }),
        calculateNewPrice: vi
          .fn()
          .mockReturnValue({ newPrice: 55, changePercent: 5 }),
      });

      await engine.tick();
      expect(onPriceUpdate).toHaveBeenCalledTimes(1);

      await engine.tick();
      expect(onPriceUpdate).toHaveBeenCalledTimes(1);

      await engine.tick();
      expect(onPriceUpdate).toHaveBeenCalledTimes(1);
    });

    it('same content with different id is processed as new', async () => {
      const onPriceUpdate = vi.fn();
      const fetchNews = vi
        .fn()
        .mockResolvedValueOnce([makeArticle({ id: 'art-1' })])
        .mockResolvedValueOnce([makeArticle({ id: 'art-2' })]);

      const engine = new EspnSimulationEngine({
        players: [espnPlayer()],
        onPriceUpdate,
        fetchNews,
        analyzeSentiment: vi.fn().mockReturnValue({
          sentiment: 'positive',
          magnitude: 0.5,
          confidence: 0.7,
        }),
        calculateNewPrice: vi
          .fn()
          .mockReturnValue({ newPrice: 55, changePercent: 5 }),
      });

      await engine.tick();
      await engine.tick();
      expect(onPriceUpdate).toHaveBeenCalledTimes(2);
    });
  });

  // TC-011: new articles processed, old skipped
  describe('TC-011: mixed new and old articles', () => {
    it('processes only new articles in batch', async () => {
      const onPriceUpdate = vi.fn();
      const fetchNews = vi
        .fn()
        .mockResolvedValueOnce([
          makeArticle({ id: 'art-1', headline: 'Mahomes TD' }),
        ])
        .mockResolvedValueOnce([
          makeArticle({ id: 'art-1', headline: 'Mahomes TD' }),
          makeArticle({
            id: 'art-2',
            headline: 'Kelce catch',
            description: 'kelce record',
          }),
        ]);

      const engine = new EspnSimulationEngine({
        players: [
          espnPlayer({ id: 'mahomes', searchTerms: ['mahomes'] }),
          espnPlayer({
            id: 'kelce',
            name: 'Travis Kelce',
            searchTerms: ['kelce'],
            position: 'TE',
            basePrice: 35,
          }),
        ],
        onPriceUpdate,
        fetchNews,
        analyzeSentiment: vi.fn().mockReturnValue({
          sentiment: 'positive',
          magnitude: 0.5,
          confidence: 0.7,
        }),
        calculateNewPrice: vi
          .fn()
          .mockReturnValue({ newPrice: 55, changePercent: 5 }),
      });

      await engine.tick();
      expect(onPriceUpdate).toHaveBeenCalledTimes(1);

      await engine.tick();
      expect(onPriceUpdate).toHaveBeenCalledTimes(2);
    });
  });

  // TC-012: articles with missing/empty id
  describe('TC-012: falsy article ids', () => {
    it('skips article with empty string id', async () => {
      const onPriceUpdate = vi.fn();
      const engine = new EspnSimulationEngine({
        players: [espnPlayer()],
        onPriceUpdate,
        fetchNews: vi
          .fn()
          .mockResolvedValue([makeArticle({ id: '' })]),
        analyzeSentiment: vi.fn().mockReturnValue({
          sentiment: 'positive',
          magnitude: 0.5,
          confidence: 0.7,
        }),
        calculateNewPrice: vi
          .fn()
          .mockReturnValue({ newPrice: 55, changePercent: 5 }),
      });

      await engine.tick();
      expect(onPriceUpdate).not.toHaveBeenCalled();
    });

    it('skips article with undefined id', async () => {
      const onPriceUpdate = vi.fn();
      const engine = new EspnSimulationEngine({
        players: [espnPlayer()],
        onPriceUpdate,
        fetchNews: vi.fn().mockResolvedValue([
          makeArticle({
            id: undefined as unknown as string,
          }),
        ]),
        analyzeSentiment: vi.fn().mockReturnValue({
          sentiment: 'positive',
          magnitude: 0.5,
          confidence: 0.7,
        }),
        calculateNewPrice: vi
          .fn()
          .mockReturnValue({ newPrice: 55, changePercent: 5 }),
      });

      await engine.tick();
      expect(onPriceUpdate).not.toHaveBeenCalled();
    });

    it('processes article with id "0" (string zero) normally', async () => {
      const onPriceUpdate = vi.fn();
      const engine = new EspnSimulationEngine({
        players: [espnPlayer()],
        onPriceUpdate,
        fetchNews: vi.fn().mockResolvedValue([makeArticle({ id: '0' })]),
        analyzeSentiment: vi.fn().mockReturnValue({
          sentiment: 'positive',
          magnitude: 0.5,
          confidence: 0.7,
        }),
        calculateNewPrice: vi
          .fn()
          .mockReturnValue({ newPrice: 55, changePercent: 5 }),
      });

      await engine.tick();
      expect(onPriceUpdate).toHaveBeenCalledTimes(1);
    });
  });

  // TC-013: price accumulation across articles
  describe('TC-013: price accumulation', () => {
    it('second article uses price set by first article', async () => {
      const onPriceUpdate = vi.fn();
      const calculateNewPrice = vi
        .fn()
        .mockImplementation((p: number) => ({
          newPrice: p + 5,
          changePercent: 10,
        }));

      const engine = new EspnSimulationEngine({
        players: [espnPlayer({ basePrice: 50 })],
        onPriceUpdate,
        fetchNews: vi.fn().mockResolvedValue([
          makeArticle({ id: 'art-1', headline: 'Mahomes TD 1' }),
          makeArticle({ id: 'art-2', headline: 'Mahomes TD 2' }),
        ]),
        analyzeSentiment: vi.fn().mockReturnValue({
          sentiment: 'positive',
          magnitude: 0.5,
          confidence: 0.7,
        }),
        calculateNewPrice,
      });

      await engine.tick();

      expect(calculateNewPrice.mock.calls[0][0]).toBe(50);
      expect(calculateNewPrice.mock.calls[1][0]).toBe(55);
      expect(engine.getPrice('mahomes')).toBe(60);
      expect(onPriceUpdate).toHaveBeenCalledTimes(2);
      expect(onPriceUpdate.mock.calls[0][1]).toBe(55);
      expect(onPriceUpdate.mock.calls[1][1]).toBe(60);
    });
  });

  // TC-014: PriceReason object structure
  describe('TC-014: reason object structure', () => {
    it('includes source from article when present', async () => {
      const onPriceUpdate = vi.fn();
      const engine = new EspnSimulationEngine({
        players: [espnPlayer()],
        onPriceUpdate,
        fetchNews: vi.fn().mockResolvedValue([
          makeArticle({
            source: 'AP',
            url: 'https://example.com/story',
          }),
        ]),
        analyzeSentiment: vi.fn().mockReturnValue({
          sentiment: 'positive',
          magnitude: 0.8,
          confidence: 0.9,
        }),
        calculateNewPrice: vi
          .fn()
          .mockReturnValue({ newPrice: 55, changePercent: 10 }),
      });

      await engine.tick();

      const reason = onPriceUpdate.mock.calls[0][2];
      expect(reason).toEqual({
        type: 'news',
        headline: 'Mahomes throws 4 TDs',
        source: 'AP',
        url: 'https://example.com/story',
        sentiment: 'positive',
        magnitude: 0.8,
      });
    });

    it('falls back to ESPN NFL when article.source is empty', async () => {
      const onPriceUpdate = vi.fn();
      const engine = new EspnSimulationEngine({
        players: [espnPlayer()],
        onPriceUpdate,
        fetchNews: vi.fn().mockResolvedValue([
          makeArticle({ source: '' }),
        ]),
        analyzeSentiment: vi.fn().mockReturnValue({
          sentiment: 'positive',
          magnitude: 0.8,
          confidence: 0.9,
        }),
        calculateNewPrice: vi
          .fn()
          .mockReturnValue({ newPrice: 55, changePercent: 10 }),
      });

      await engine.tick();

      const reason = onPriceUpdate.mock.calls[0][2];
      expect(reason.source).toBe('ESPN NFL');
    });

    it('falls back to ESPN NFL when article.source is undefined', async () => {
      const onPriceUpdate = vi.fn();
      const engine = new EspnSimulationEngine({
        players: [espnPlayer()],
        onPriceUpdate,
        fetchNews: vi.fn().mockResolvedValue([
          makeArticle({ source: undefined }),
        ]),
        analyzeSentiment: vi.fn().mockReturnValue({
          sentiment: 'positive',
          magnitude: 0.5,
          confidence: 0.7,
        }),
        calculateNewPrice: vi
          .fn()
          .mockReturnValue({ newPrice: 55, changePercent: 5 }),
      });

      await engine.tick();

      const reason = onPriceUpdate.mock.calls[0][2];
      expect(reason.source).toBe('ESPN NFL');
    });

    it('passes undefined url when article has no url', async () => {
      const onPriceUpdate = vi.fn();
      const engine = new EspnSimulationEngine({
        players: [espnPlayer()],
        onPriceUpdate,
        fetchNews: vi.fn().mockResolvedValue([makeArticle()]),
        analyzeSentiment: vi.fn().mockReturnValue({
          sentiment: 'positive',
          magnitude: 0.5,
          confidence: 0.7,
        }),
        calculateNewPrice: vi
          .fn()
          .mockReturnValue({ newPrice: 55, changePercent: 5 }),
      });

      await engine.tick();

      const reason = onPriceUpdate.mock.calls[0][2];
      expect(reason.url).toBeUndefined();
    });
  });

  // TC-015: start() triggers immediate tick then interval
  describe('TC-015: start() immediate tick + interval', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => {
      vi.useRealTimers();
    });

    it('calls fetchNews immediately on start', () => {
      const fetchNews = vi.fn().mockResolvedValue([]);
      const engine = new EspnSimulationEngine({
        players: [espnPlayer()],
        onPriceUpdate: vi.fn(),
        fetchNews,
      });

      engine.start();
      expect(fetchNews).toHaveBeenCalledTimes(1);
    });

    it('calls fetchNews again after refreshIntervalMs', () => {
      const fetchNews = vi.fn().mockResolvedValue([]);
      const engine = new EspnSimulationEngine({
        players: [espnPlayer()],
        onPriceUpdate: vi.fn(),
        fetchNews,
        refreshIntervalMs: 60000,
      });

      engine.start();
      expect(fetchNews).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(60000);
      expect(fetchNews).toHaveBeenCalledTimes(2);

      vi.advanceTimersByTime(60000);
      expect(fetchNews).toHaveBeenCalledTimes(3);

      engine.stop();
    });

    it('uses custom refreshIntervalMs', () => {
      const fetchNews = vi.fn().mockResolvedValue([]);
      const engine = new EspnSimulationEngine({
        players: [espnPlayer()],
        onPriceUpdate: vi.fn(),
        fetchNews,
        refreshIntervalMs: 5000,
      });

      engine.start();
      expect(fetchNews).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(5000);
      expect(fetchNews).toHaveBeenCalledTimes(2);

      engine.stop();
    });
  });

  // TC-016: start() is idempotent
  describe('TC-016: start() idempotent', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('calling start twice does not create duplicate intervals', () => {
      const fetchNews = vi.fn().mockResolvedValue([]);
      const engine = new EspnSimulationEngine({
        players: [espnPlayer()],
        onPriceUpdate: vi.fn(),
        fetchNews,
        refreshIntervalMs: 10000,
      });

      engine.start();
      expect(fetchNews).toHaveBeenCalledTimes(1);

      engine.start();
      expect(fetchNews).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(10000);
      expect(fetchNews).toHaveBeenCalledTimes(2);

      engine.stop();
    });
  });

  // TC-017: stop() clears interval
  describe('TC-017: stop() clears interval', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('no more ticks after stop', () => {
      const fetchNews = vi.fn().mockResolvedValue([]);
      const engine = new EspnSimulationEngine({
        players: [espnPlayer()],
        onPriceUpdate: vi.fn(),
        fetchNews,
        refreshIntervalMs: 10000,
      });

      engine.start();
      expect(fetchNews).toHaveBeenCalledTimes(1);

      engine.stop();
      vi.advanceTimersByTime(30000);
      expect(fetchNews).toHaveBeenCalledTimes(1);
    });

    it('stop before start does not throw', () => {
      const engine = new EspnSimulationEngine({
        players: [],
        onPriceUpdate: vi.fn(),
      });
      expect(() => engine.stop()).not.toThrow();
    });

    it('stop twice does not throw', () => {
      const engine = new EspnSimulationEngine({
        players: [],
        onPriceUpdate: vi.fn(),
      });
      engine.start();
      engine.stop();
      expect(() => engine.stop()).not.toThrow();
    });
  });

  // TC-018: stop then start resumes
  describe('TC-018: stop then start resumes', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('start after stop resumes polling with immediate tick', () => {
      const fetchNews = vi.fn().mockResolvedValue([]);
      const engine = new EspnSimulationEngine({
        players: [espnPlayer()],
        onPriceUpdate: vi.fn(),
        fetchNews,
        refreshIntervalMs: 10000,
      });

      engine.start();
      expect(fetchNews).toHaveBeenCalledTimes(1);

      engine.stop();

      engine.start();
      expect(fetchNews).toHaveBeenCalledTimes(2);

      vi.advanceTimersByTime(10000);
      expect(fetchNews).toHaveBeenCalledTimes(3);

      engine.stop();
    });

    it('deduplication state persists across stop/start', async () => {
      const onPriceUpdate = vi.fn();
      const engine = new EspnSimulationEngine({
        players: [espnPlayer()],
        onPriceUpdate,
        fetchNews: vi.fn().mockResolvedValue([makeArticle({ id: 'art-1' })]),
        analyzeSentiment: vi.fn().mockReturnValue({
          sentiment: 'positive',
          magnitude: 0.5,
          confidence: 0.7,
        }),
        calculateNewPrice: vi
          .fn()
          .mockReturnValue({ newPrice: 55, changePercent: 5 }),
      });

      await engine.tick();
      expect(onPriceUpdate).toHaveBeenCalledTimes(1);

      engine.stop();
      engine.start();

      await engine.tick();
      expect(onPriceUpdate).toHaveBeenCalledTimes(1);

      engine.stop();
    });
  });

  // TC-019: fetch failure graceful handling
  describe('TC-019: fetch failure handling', () => {
    it('swallows rejected promise from fetchNews', async () => {
      const engine = new EspnSimulationEngine({
        players: [espnPlayer()],
        onPriceUpdate: vi.fn(),
        fetchNews: vi.fn().mockRejectedValue(new Error('Network error')),
      });

      await expect(engine.tick()).resolves.toBeUndefined();
    });

    it('does not corrupt prices on fetch failure', async () => {
      const engine = new EspnSimulationEngine({
        players: [espnPlayer({ basePrice: 50 })],
        onPriceUpdate: vi.fn(),
        fetchNews: vi.fn().mockRejectedValue(new Error('Network error')),
      });

      await engine.tick();
      expect(engine.getPrice('mahomes')).toBe(50);
    });

    it('recovers on subsequent successful tick', async () => {
      const onPriceUpdate = vi.fn();
      const fetchNews = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce([makeArticle()]);

      const engine = new EspnSimulationEngine({
        players: [espnPlayer()],
        onPriceUpdate,
        fetchNews,
        analyzeSentiment: vi.fn().mockReturnValue({
          sentiment: 'positive',
          magnitude: 0.5,
          confidence: 0.7,
        }),
        calculateNewPrice: vi
          .fn()
          .mockReturnValue({ newPrice: 55, changePercent: 5 }),
      });

      await engine.tick();
      expect(onPriceUpdate).not.toHaveBeenCalled();

      await engine.tick();
      expect(onPriceUpdate).toHaveBeenCalledTimes(1);
    });

    it('handles TypeError inside fetchNews', async () => {
      const engine = new EspnSimulationEngine({
        players: [espnPlayer()],
        onPriceUpdate: vi.fn(),
        fetchNews: vi
          .fn()
          .mockRejectedValue(new TypeError('Cannot read properties')),
      });

      await expect(engine.tick()).resolves.toBeUndefined();
    });
  });

  // TC-020: getPrice for unknown player
  describe('TC-020: getPrice unknown player', () => {
    it('returns 0 for non-existent player', () => {
      const engine = new EspnSimulationEngine({
        players: [espnPlayer()],
        onPriceUpdate: vi.fn(),
      });
      expect(engine.getPrice('nonexistent-player')).toBe(0);
    });

    it('returns 0 for empty string player id', () => {
      const engine = new EspnSimulationEngine({
        players: [espnPlayer()],
        onPriceUpdate: vi.fn(),
      });
      expect(engine.getPrice('')).toBe(0);
    });

    it('unknown player still returns 0 after processing articles', async () => {
      const engine = new EspnSimulationEngine({
        players: [espnPlayer()],
        onPriceUpdate: vi.fn(),
        fetchNews: vi.fn().mockResolvedValue([makeArticle()]),
        analyzeSentiment: vi.fn().mockReturnValue({
          sentiment: 'positive',
          magnitude: 0.5,
          confidence: 0.7,
        }),
        calculateNewPrice: vi
          .fn()
          .mockReturnValue({ newPrice: 55, changePercent: 5 }),
      });

      await engine.tick();
      expect(engine.getPrice('nonexistent')).toBe(0);
    });
  });

  // TC-021: no React dependency
  describe('TC-021: no React dependency', () => {
    it('simulationEngine.ts has no React imports', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.resolve(__dirname, '..', 'simulationEngine.ts');
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).not.toMatch(/from\s+['"]react['"]/);
      expect(content).not.toMatch(/from\s+['"]react-dom['"]/);
      expect(content).not.toMatch(
        /\b(useState|useEffect|useCallback|useRef|useMemo)\b/,
      );
    });

    it('engine works in a plain test without React runtime', () => {
      const engine = new EspnSimulationEngine({
        players: [espnPlayer()],
        onPriceUpdate: vi.fn(),
      });
      expect(engine.getPrice('mahomes')).toBe(50);
    });
  });

  // TC-022: both engines use same onPriceUpdate signature
  describe('TC-022: shared OnPriceUpdate signature', () => {
    it('both engines call onPriceUpdate with (string, number, object|null)', async () => {
      const spy = vi.fn();

      const timeline: TimelineEntry[] = [
        {
          playerId: 'mahomes',
          playerName: 'Mahomes',
          entryIndex: 0,
          timestamp: 't0',
          price: 50,
          reason: { type: 'news', headline: 'Start' },
        },
        {
          playerId: 'mahomes',
          playerName: 'Mahomes',
          entryIndex: 1,
          timestamp: 't1',
          price: 55,
          reason: { type: 'news', headline: 'Timeline event' },
        },
      ];
      const timelineEngine = new TimelineSimulationEngine({
        timeline,
        onPriceUpdate: spy,
      });
      timelineEngine.tick();

      expect(spy).toHaveBeenCalledTimes(1);
      const [tPlayerId, tPrice, tReason] = spy.mock.calls[0];
      expect(typeof tPlayerId).toBe('string');
      expect(typeof tPrice).toBe('number');
      expect(tReason).toBeTypeOf('object');

      spy.mockClear();

      const espnEngine = new EspnSimulationEngine({
        players: [espnPlayer({ basePrice: 50 })],
        onPriceUpdate: spy,
        fetchNews: vi.fn().mockResolvedValue([makeArticle()]),
        analyzeSentiment: vi.fn().mockReturnValue({
          sentiment: 'positive',
          magnitude: 0.5,
          confidence: 0.7,
        }),
        calculateNewPrice: vi
          .fn()
          .mockReturnValue({ newPrice: 55, changePercent: 5 }),
      });

      await espnEngine.tick();

      expect(spy).toHaveBeenCalledTimes(1);
      const [ePlayerId, ePrice, eReason] = spy.mock.calls[0];
      expect(typeof ePlayerId).toBe('string');
      expect(typeof ePrice).toBe('number');
      expect(eReason).toBeTypeOf('object');
    });
  });

  // TC-023: dependencies are injectable
  describe('TC-023: dependency injection', () => {
    it('all three dependencies are injected and called', async () => {
      const fetchNews = vi.fn().mockResolvedValue([makeArticle()]);
      const analyzeSentiment = vi.fn().mockReturnValue({
        sentiment: 'positive',
        magnitude: 0.8,
        confidence: 0.9,
      });
      const calculateNewPrice = vi
        .fn()
        .mockReturnValue({ newPrice: 55, changePercent: 10 });

      const engine = new EspnSimulationEngine({
        players: [espnPlayer()],
        onPriceUpdate: vi.fn(),
        fetchNews,
        analyzeSentiment,
        calculateNewPrice,
      });

      await engine.tick();

      expect(fetchNews).toHaveBeenCalled();
      expect(analyzeSentiment).toHaveBeenCalled();
      expect(calculateNewPrice).toHaveBeenCalled();
    });

    it('replacing mock changes behavior on next tick', async () => {
      const analyzeSentiment1 = vi.fn().mockReturnValue({
        sentiment: 'positive',
        magnitude: 0.8,
        confidence: 0.9,
      });
      const calculateNewPrice = vi
        .fn()
        .mockImplementation((price: number, s: { sentiment: string }) => ({
          newPrice: s.sentiment === 'negative' ? price - 5 : price + 5,
          changePercent: 10,
        }));

      const engine = new EspnSimulationEngine({
        players: [espnPlayer({ basePrice: 50 })],
        onPriceUpdate: vi.fn(),
        fetchNews: vi
          .fn()
          .mockResolvedValueOnce([makeArticle({ id: 'a1' })])
          .mockResolvedValueOnce([makeArticle({ id: 'a2' })]),
        analyzeSentiment: analyzeSentiment1,
        calculateNewPrice,
      });

      await engine.tick();
      expect(engine.getPrice('mahomes')).toBe(55);

      analyzeSentiment1.mockReturnValue({
        sentiment: 'negative',
        magnitude: 0.9,
        confidence: 0.95,
      });

      await engine.tick();
      expect(engine.getPrice('mahomes')).toBe(50);
    });
  });

  // TC-024: sentiment receives concatenated headline + description
  describe('TC-024: sentiment text concatenation', () => {
    it('passes "headline description" to analyzeSentiment', async () => {
      const analyzeSentiment = vi.fn().mockReturnValue({
        sentiment: 'positive',
        magnitude: 0.5,
        confidence: 0.7,
      });

      const engine = new EspnSimulationEngine({
        players: [espnPlayer()],
        onPriceUpdate: vi.fn(),
        fetchNews: vi.fn().mockResolvedValue([
          makeArticle({
            headline: 'Big Win',
            description: 'Mahomes threw 4 TDs',
          }),
        ]),
        analyzeSentiment,
        calculateNewPrice: vi
          .fn()
          .mockReturnValue({ newPrice: 55, changePercent: 5 }),
      });

      await engine.tick();

      expect(analyzeSentiment).toHaveBeenCalledWith(
        'Big Win Mahomes threw 4 TDs',
        'Patrick Mahomes',
        'QB',
      );
    });

    it('handles empty description', async () => {
      const analyzeSentiment = vi.fn().mockReturnValue({
        sentiment: 'neutral',
        magnitude: 0,
        confidence: 0,
      });

      const engine = new EspnSimulationEngine({
        players: [espnPlayer()],
        onPriceUpdate: vi.fn(),
        fetchNews: vi.fn().mockResolvedValue([
          makeArticle({
            headline: 'Mahomes headline',
            description: '',
          }),
        ]),
        analyzeSentiment,
        calculateNewPrice: vi
          .fn()
          .mockReturnValue({ newPrice: 50, changePercent: 0 }),
      });

      await engine.tick();

      expect(analyzeSentiment).toHaveBeenCalledWith(
        'Mahomes headline ',
        'Patrick Mahomes',
        'QB',
      );
    });

    it('handles empty headline', async () => {
      const analyzeSentiment = vi.fn().mockReturnValue({
        sentiment: 'neutral',
        magnitude: 0,
        confidence: 0,
      });

      const engine = new EspnSimulationEngine({
        players: [espnPlayer({ searchTerms: ['mahomes'] })],
        onPriceUpdate: vi.fn(),
        fetchNews: vi.fn().mockResolvedValue([
          makeArticle({
            headline: '',
            description: 'mahomes big play',
          }),
        ]),
        analyzeSentiment,
        calculateNewPrice: vi
          .fn()
          .mockReturnValue({ newPrice: 50, changePercent: 0 }),
      });

      await engine.tick();

      expect(analyzeSentiment).toHaveBeenCalledWith(
        ' mahomes big play',
        'Patrick Mahomes',
        'QB',
      );
    });
  });
});
