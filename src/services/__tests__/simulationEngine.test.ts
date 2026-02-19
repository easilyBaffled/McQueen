import { describe, it, expect, vi } from 'vitest';
import {
  buildUnifiedTimeline,
  TimelineSimulationEngine,
  EspnSimulationEngine,
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
