import { describe, it, expect } from 'vitest';
import {
  getEffectivePrice,
  getCurrentPriceFromHistory,
  getChangePercentFromHistory,
  getMoveReasonFromHistory,
  getLatestContentFromHistory,
  getAllContentFromHistory,
} from '../priceResolver';
import { MIN_PRICE } from '../priceCalculator';
import type { Player } from '../../types';

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

// TC-035
describe('getCurrentPriceFromHistory — with price history', () => {
  it('returns last entry price from multiple entries', () => {
    const player = makePlayer({
      priceHistory: [
        { timestamp: 't1', price: 50, reason: { type: 'news', headline: 'A' } },
        { timestamp: 't2', price: 55, reason: { type: 'news', headline: 'B' } },
        { timestamp: 't3', price: 60, reason: { type: 'news', headline: 'C' } },
      ],
    });
    expect(getCurrentPriceFromHistory(player)).toBe(60);
  });

  it('returns single entry price', () => {
    const player = makePlayer({
      priceHistory: [
        { timestamp: 't', price: 42, reason: { type: 'news', headline: '' } },
      ],
    });
    expect(getCurrentPriceFromHistory(player)).toBe(42);
  });
});

// TC-036
describe('getCurrentPriceFromHistory — falls back to basePrice', () => {
  it('returns basePrice when priceHistory is empty', () => {
    expect(
      getCurrentPriceFromHistory(makePlayer({ basePrice: 25, priceHistory: [] })),
    ).toBe(25);
  });

  it('returns basePrice when priceHistory is undefined', () => {
    expect(getCurrentPriceFromHistory(makePlayer({ basePrice: 30 }))).toBe(30);
  });

  it('returns 0 when basePrice is 0 and no history', () => {
    expect(getCurrentPriceFromHistory(makePlayer({ basePrice: 0 }))).toBe(0);
  });
});

// TC-037
describe('getCurrentPriceFromHistory — null/undefined player', () => {
  it('returns 0 for null', () => {
    expect(getCurrentPriceFromHistory(null)).toBe(0);
  });

  it('returns 0 for undefined', () => {
    expect(getCurrentPriceFromHistory(undefined)).toBe(0);
  });
});

// TC-038
describe('getEffectivePrice — override priority', () => {
  const players: Player[] = [
    makePlayer({
      id: 'p1',
      basePrice: 40,
      priceHistory: [
        { timestamp: 't', price: 60, reason: { type: 'news', headline: 'Update' } },
      ],
    }),
  ];

  it('uses override when one exists, ignoring history price', () => {
    expect(getEffectivePrice('p1', { p1: 80 }, {}, players)).toBe(80);
  });

  it('override value of 0 is used (not treated as falsy)', () => {
    expect(getEffectivePrice('p1', { p1: 0 }, {}, players)).toBe(0);
  });

  it('falls back to history when no override', () => {
    expect(getEffectivePrice('p1', {}, {}, players)).toBe(60);
  });

  it('falls back to basePrice when no override and no history', () => {
    const noHistory = [makePlayer({ id: 'p1', basePrice: 40 })];
    expect(getEffectivePrice('p1', {}, {}, noHistory)).toBe(40);
  });

  it('falls back to basePrice when history is empty', () => {
    const emptyHistory = [
      makePlayer({ id: 'p1', basePrice: 40, priceHistory: [] }),
    ];
    expect(getEffectivePrice('p1', {}, {}, emptyHistory)).toBe(40);
  });
});

// TC-039
describe('getEffectivePrice — user impact multiplier', () => {
  const players: Player[] = [
    makePlayer({
      id: 'p1',
      basePrice: 50,
      priceHistory: [
        { timestamp: 't', price: 100, reason: { type: 'news', headline: '' } },
      ],
    }),
  ];

  it('applies positive user impact to history price', () => {
    expect(getEffectivePrice('p1', {}, { p1: 0.1 }, players)).toBe(110);
  });

  it('applies negative user impact', () => {
    expect(getEffectivePrice('p1', {}, { p1: -0.05 }, players)).toBe(95);
  });

  it('applies impact on top of override (override is the base)', () => {
    expect(getEffectivePrice('p1', { p1: 80 }, { p1: 0.1 }, players)).toBe(88);
  });

  it('no user impact for the player leaves price unchanged', () => {
    expect(getEffectivePrice('p1', {}, {}, players)).toBe(100);
  });

  it('user impact of 0 leaves price unchanged', () => {
    expect(getEffectivePrice('p1', {}, { p1: 0 }, players)).toBe(100);
  });

  it('rounds result to two decimal places', () => {
    const p = [makePlayer({ id: 'p1', basePrice: 25 })];
    expect(
      getEffectivePrice('p1', { p1: 33.33 }, { p1: 0.001 }, p),
    ).toBe(33.36);
  });
});

// TC-040
describe('getEffectivePrice — null/undefined playerId', () => {
  const players: Player[] = [makePlayer()];

  it('returns 0 for null playerId', () => {
    expect(getEffectivePrice(null, {}, {}, players)).toBe(0);
  });

  it('returns 0 for undefined playerId', () => {
    expect(getEffectivePrice(undefined, {}, {}, players)).toBe(0);
  });

  it('returns 0 for empty string playerId', () => {
    expect(getEffectivePrice('', {}, {}, players)).toBe(0);
  });

  it('returns 0 for unmatched playerId with no override', () => {
    expect(getEffectivePrice('nonexistent', {}, {}, players)).toBe(0);
  });
});

// TC-041
describe('getChangePercentFromHistory', () => {
  it('computes correct percentage change', () => {
    const player = makePlayer({
      basePrice: 50,
      priceHistory: [
        { timestamp: 't', price: 60, reason: { type: 'news', headline: '' } },
      ],
    });
    expect(getChangePercentFromHistory(player)).toBe(20);
  });

  it('computes negative percentage for price decrease', () => {
    const player = makePlayer({
      basePrice: 50,
      priceHistory: [
        { timestamp: 't', price: 40, reason: { type: 'news', headline: '' } },
      ],
    });
    expect(getChangePercentFromHistory(player)).toBe(-20);
  });

  it('returns 0 when current equals base', () => {
    const player = makePlayer({
      basePrice: 40,
      priceHistory: [
        { timestamp: 't', price: 40, reason: { type: 'news', headline: '' } },
      ],
    });
    expect(getChangePercentFromHistory(player)).toBe(0);
  });

  it('returns 0 for null', () => {
    expect(getChangePercentFromHistory(null)).toBe(0);
  });

  it('returns 0 for undefined', () => {
    expect(getChangePercentFromHistory(undefined)).toBe(0);
  });

  it('returns 0 when basePrice is 0 (division by zero guard)', () => {
    expect(getChangePercentFromHistory(makePlayer({ basePrice: 0 }))).toBe(0);
  });

  it('returns 0 for basePrice 0 even with history', () => {
    const player = makePlayer({
      basePrice: 0,
      priceHistory: [
        { timestamp: 't', price: 10, reason: { type: 'news', headline: '' } },
      ],
    });
    expect(getChangePercentFromHistory(player)).toBe(0);
  });
});

describe('getMoveReasonFromHistory', () => {
  it('returns last headline', () => {
    const player = makePlayer({
      priceHistory: [
        { timestamp: 't1', price: 42, reason: { type: 'news', headline: 'Rush' } },
        {
          timestamp: 't2',
          price: 48,
          reason: { type: 'news', headline: 'Big trade' },
        },
      ],
    });
    expect(getMoveReasonFromHistory(player)).toBe('Big trade');
  });

  it('returns "" for null', () => {
    expect(getMoveReasonFromHistory(null)).toBe('');
  });

  it('returns "" for undefined', () => {
    expect(getMoveReasonFromHistory(undefined)).toBe('');
  });

  it('returns "" when priceHistory is empty', () => {
    expect(getMoveReasonFromHistory(makePlayer({ priceHistory: [] }))).toBe('');
  });

  it('returns "" when no priceHistory', () => {
    expect(getMoveReasonFromHistory(makePlayer())).toBe('');
  });

  it('returns "" when reason has no headline', () => {
    const player = makePlayer({
      priceHistory: [
        {
          timestamp: 't',
          price: 42,
          reason: undefined as unknown as import('../../types/scenario').PriceReason,
        },
      ],
    });
    expect(getMoveReasonFromHistory(player)).toBe('');
  });

  it('returns "" when headline is empty string', () => {
    const player = makePlayer({
      priceHistory: [
        { timestamp: 't', price: 42, reason: { type: 'news', headline: '' } },
      ],
    });
    expect(getMoveReasonFromHistory(player)).toBe('');
  });
});

describe('getLatestContentFromHistory', () => {
  it('returns content from last entry', () => {
    const player = makePlayer({
      priceHistory: [
        {
          timestamp: 't1',
          price: 42,
          reason: { type: 'news', headline: 'A' },
          content: [{ type: 'article' }],
        },
        {
          timestamp: 't2',
          price: 48,
          reason: { type: 'news', headline: 'B' },
          content: [{ type: 'video' }],
        },
      ],
    });
    expect(getLatestContentFromHistory(player)).toEqual([{ type: 'video' }]);
  });

  it('returns [] for null', () => {
    expect(getLatestContentFromHistory(null)).toEqual([]);
  });

  it('returns [] for undefined', () => {
    expect(getLatestContentFromHistory(undefined)).toEqual([]);
  });

  it('returns [] for empty priceHistory', () => {
    expect(
      getLatestContentFromHistory(makePlayer({ priceHistory: [] })),
    ).toEqual([]);
  });

  it('returns [] when last entry has no content', () => {
    const player = makePlayer({
      priceHistory: [
        { timestamp: 't', price: 42, reason: { type: 'news', headline: 'A' } },
      ],
    });
    expect(getLatestContentFromHistory(player)).toEqual([]);
  });
});

describe('getAllContentFromHistory', () => {
  it('aggregates content from all entries', () => {
    const player = makePlayer({
      priceHistory: [
        {
          timestamp: 't1',
          price: 42,
          reason: { type: 'news', headline: '' },
          content: [{ type: 'article' }],
        },
        {
          timestamp: 't2',
          price: 48,
          reason: { type: 'news', headline: '' },
          content: [{ type: 'video' }],
        },
      ],
    });
    expect(getAllContentFromHistory(player)).toEqual([
      { type: 'article' },
      { type: 'video' },
    ]);
  });

  it('returns [] for null', () => {
    expect(getAllContentFromHistory(null)).toEqual([]);
  });

  it('returns [] for undefined', () => {
    expect(getAllContentFromHistory(undefined)).toEqual([]);
  });

  it('returns [] for no priceHistory', () => {
    expect(getAllContentFromHistory(makePlayer())).toEqual([]);
  });

  it('skips entries without content', () => {
    const player = makePlayer({
      priceHistory: [
        {
          timestamp: 't1',
          price: 42,
          reason: { type: 'news', headline: '' },
          content: [{ type: 'article' }],
        },
        { timestamp: 't2', price: 45, reason: { type: 'news', headline: '' } },
        {
          timestamp: 't3',
          price: 48,
          reason: { type: 'news', headline: '' },
          content: [{ type: 'video' }, { type: 'tweet' }],
        },
      ],
    });
    expect(getAllContentFromHistory(player)).toEqual([
      { type: 'article' },
      { type: 'video' },
      { type: 'tweet' },
    ]);
  });
});

// TC-029: Price floor in getEffectivePrice
describe('getEffectivePrice — price floor', () => {
  it('clamps to MIN_PRICE when user impact drives price toward zero', () => {
    const players: Player[] = [makePlayer({ id: 'p1', basePrice: 0.02 })];
    const result = getEffectivePrice('p1', { p1: 0.02 }, { p1: -0.99 }, players);
    expect(result).toBeGreaterThanOrEqual(MIN_PRICE);
  });

  it('clamps penny stock with negative impact to MIN_PRICE', () => {
    const players: Player[] = [makePlayer({ id: 'p1', basePrice: 0.01 })];
    const result = getEffectivePrice('p1', { p1: 0.01 }, { p1: -0.5 }, players);
    expect(result).toBe(MIN_PRICE);
  });

  it('zero user impact returns base price unchanged', () => {
    const players: Player[] = [makePlayer({ id: 'p1', basePrice: 50 })];
    expect(getEffectivePrice('p1', {}, { p1: 0 }, players)).toBe(50);
  });

  it('positive impact is not clamped', () => {
    const players: Player[] = [makePlayer({ id: 'p1', basePrice: 50 })];
    expect(getEffectivePrice('p1', {}, { p1: 0.5 }, players)).toBe(75);
  });
});

describe('module exports', () => {
  it('exports all six functions', () => {
    expect(typeof getEffectivePrice).toBe('function');
    expect(typeof getCurrentPriceFromHistory).toBe('function');
    expect(typeof getChangePercentFromHistory).toBe('function');
    expect(typeof getMoveReasonFromHistory).toBe('function');
    expect(typeof getLatestContentFromHistory).toBe('function');
    expect(typeof getAllContentFromHistory).toBe('function');
  });
});
