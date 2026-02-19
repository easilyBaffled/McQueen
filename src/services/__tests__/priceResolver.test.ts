import { describe, it, expect } from 'vitest';
import {
  getEffectivePrice,
  getCurrentPriceFromHistory,
  getChangePercentFromHistory,
  getMoveReasonFromHistory,
  getLatestContentFromHistory,
  getAllContentFromHistory,
} from '../priceResolver';
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

describe('priceResolver', () => {
  describe('getEffectivePrice', () => {
    const players: Player[] = [
      makePlayer({
        id: 'player-1',
        basePrice: 40.0,
        priceHistory: [
          {
            timestamp: '2026-01-01',
            price: 50.0,
            reason: { type: 'news', headline: 'Update' },
          },
        ],
      }),
      makePlayer({ id: 'player-2', basePrice: 30.0 }),
    ];

    // TC-001: returns override price when override exists
    it('returns override price when override exists', () => {
      expect(
        getEffectivePrice('player-1', { 'player-1': 55.0 }, {}, players),
      ).toBe(55.0);
    });

    it('applies user impact to override price', () => {
      expect(
        getEffectivePrice(
          'player-1',
          { 'player-1': 55.0 },
          { 'player-1': 0.05 },
          players,
        ),
      ).toBe(57.75);
    });

    it('uses override value of 0 (not treated as falsy)', () => {
      expect(
        getEffectivePrice('player-1', { 'player-1': 0 }, {}, players),
      ).toBe(0);
    });

    // TC-002: falls back to priceHistory when no override
    it('falls back to last priceHistory entry when no override', () => {
      const playersWithHistory: Player[] = [
        makePlayer({
          id: 'player-1',
          basePrice: 40.0,
          priceHistory: [
            {
              timestamp: '2026-01-01',
              price: 42.0,
              reason: { type: 'news', headline: 'A' },
            },
            {
              timestamp: '2026-01-02',
              price: 48.0,
              reason: { type: 'news', headline: 'B' },
            },
          ],
        }),
      ];
      expect(
        getEffectivePrice('player-1', {}, {}, playersWithHistory),
      ).toBe(48.0);
    });

    it('applies negative user impact to history price', () => {
      const playersWithHistory: Player[] = [
        makePlayer({
          id: 'player-1',
          basePrice: 40.0,
          priceHistory: [
            {
              timestamp: '2026-01-01',
              price: 42.0,
              reason: { type: 'news', headline: 'A' },
            },
            {
              timestamp: '2026-01-02',
              price: 48.0,
              reason: { type: 'news', headline: 'B' },
            },
          ],
        }),
      ];
      expect(
        getEffectivePrice(
          'player-1',
          {},
          { 'player-1': -0.02 },
          playersWithHistory,
        ),
      ).toBe(47.04);
    });

    // TC-003: falls back to basePrice when no override and no history
    it('falls back to basePrice when no history', () => {
      const noHistory: Player[] = [
        makePlayer({ id: 'player-1', basePrice: 40.0 }),
      ];
      expect(getEffectivePrice('player-1', {}, {}, noHistory)).toBe(40.0);
    });

    it('falls back to basePrice when priceHistory is empty', () => {
      const emptyHistory: Player[] = [
        makePlayer({ id: 'player-1', basePrice: 40.0, priceHistory: [] }),
      ];
      expect(getEffectivePrice('player-1', {}, {}, emptyHistory)).toBe(40.0);
    });

    it('returns 0 when basePrice is 0', () => {
      const zeroBase: Player[] = [
        makePlayer({ id: 'player-1', basePrice: 0 }),
      ];
      expect(getEffectivePrice('player-1', {}, {}, zeroBase)).toBe(0);
    });

    // TC-004: unknown player returns zero
    it('returns 0 for unknown player', () => {
      expect(getEffectivePrice('nonexistent', {}, {}, players)).toBe(0);
    });

    it('returns 0 for empty players array', () => {
      expect(getEffectivePrice('player-1', {}, {}, [])).toBe(0);
    });

    it('returns 0 for null playerId', () => {
      expect(getEffectivePrice(null, {}, {}, players)).toBe(0);
    });

    it('returns 0 for undefined playerId', () => {
      expect(getEffectivePrice(undefined, {}, {}, players)).toBe(0);
    });

    // TC-005: user impact math precision
    it('rounds to two decimal places', () => {
      const p: Player[] = [makePlayer({ id: 'player-1', basePrice: 25.0 })];
      expect(
        getEffectivePrice(
          'player-1',
          { 'player-1': 33.33 },
          { 'player-1': 0.001 },
          p,
        ),
      ).toBe(33.36);
    });

    it('handles large negative impact', () => {
      const p: Player[] = [makePlayer({ id: 'player-1', basePrice: 25.0 })];
      expect(
        getEffectivePrice(
          'player-1',
          { 'player-1': 100.0 },
          { 'player-1': -0.5 },
          p,
        ),
      ).toBe(50.0);
    });

    it('returns unchanged price with zero user impact', () => {
      const p: Player[] = [makePlayer({ id: 'player-1', basePrice: 42.5 })];
      expect(
        getEffectivePrice(
          'player-1',
          { 'player-1': 42.5 },
          { 'player-1': 0 },
          p,
        ),
      ).toBe(42.5);
    });

    it('handles 100% increase impact', () => {
      const p: Player[] = [makePlayer({ id: 'player-1', basePrice: 25.0 })];
      expect(
        getEffectivePrice(
          'player-1',
          { 'player-1': 50.0 },
          { 'player-1': 1.0 },
          p,
        ),
      ).toBe(100.0);
    });
  });

  // TC-006: pure function, no React dependency
  // Verified by this test file importing and calling getEffectivePrice
  // without any React runtime, hooks, or JSX.

  // TC-024: helper functions extracted from GameContext
  describe('getCurrentPriceFromHistory', () => {
    it('returns last history price', () => {
      const player = makePlayer({
        priceHistory: [
          {
            timestamp: 't1',
            price: 42,
            reason: { type: 'news', headline: 'Rush' },
            content: [{ type: 'article' }],
          },
          {
            timestamp: 't2',
            price: 48,
            reason: { type: 'news', headline: 'TD pass' },
            content: [{ type: 'video' }],
          },
        ],
      });
      expect(getCurrentPriceFromHistory(player)).toBe(48);
    });

    it('returns 0 for null', () => {
      expect(getCurrentPriceFromHistory(null)).toBe(0);
    });

    it('returns basePrice when no history', () => {
      expect(getCurrentPriceFromHistory(makePlayer({ basePrice: 40 }))).toBe(
        40,
      );
    });

    it('returns basePrice when history is empty', () => {
      expect(
        getCurrentPriceFromHistory(
          makePlayer({ basePrice: 40, priceHistory: [] }),
        ),
      ).toBe(40);
    });

    it('returns single entry price', () => {
      const player = makePlayer({
        priceHistory: [
          {
            timestamp: 't',
            price: 55,
            reason: { type: 'news', headline: '' },
          },
        ],
      });
      expect(getCurrentPriceFromHistory(player)).toBe(55);
    });

    // TC-009
    it('returns 0 for undefined', () => {
      expect(getCurrentPriceFromHistory(undefined)).toBe(0);
    });

    it('returns 0 when basePrice is 0 and no history', () => {
      expect(getCurrentPriceFromHistory(makePlayer({ basePrice: 0 }))).toBe(0);
    });
  });

  describe('getChangePercentFromHistory', () => {
    it('returns correct percent', () => {
      const player = makePlayer({
        basePrice: 40,
        priceHistory: [
          {
            timestamp: 't',
            price: 48,
            reason: { type: 'news', headline: '' },
          },
        ],
      });
      expect(getChangePercentFromHistory(player)).toBe(20);
    });

    it('returns 0 for null', () => {
      expect(getChangePercentFromHistory(null)).toBe(0);
    });

    it('returns 0 when basePrice is 0', () => {
      expect(getChangePercentFromHistory(makePlayer({ basePrice: 0 }))).toBe(
        0,
      );
    });

    // TC-010: negative percentage
    it('returns negative percent for price decrease', () => {
      const player = makePlayer({
        basePrice: 50,
        priceHistory: [
          {
            timestamp: 't',
            price: 40,
            reason: { type: 'news', headline: '' },
          },
        ],
      });
      expect(getChangePercentFromHistory(player)).toBe(-20);
    });

    it('returns 0 when current equals base', () => {
      const player = makePlayer({
        basePrice: 40,
        priceHistory: [
          {
            timestamp: 't',
            price: 40,
            reason: { type: 'news', headline: '' },
          },
        ],
      });
      expect(getChangePercentFromHistory(player)).toBe(0);
    });

    it('returns 0 for undefined player', () => {
      expect(getChangePercentFromHistory(undefined)).toBe(0);
    });

    it('returns 0 for basePrice 0 even with history', () => {
      const player = makePlayer({
        basePrice: 0,
        priceHistory: [
          {
            timestamp: 't',
            price: 10,
            reason: { type: 'news', headline: '' },
          },
        ],
      });
      expect(getChangePercentFromHistory(player)).toBe(0);
    });
  });

  describe('getMoveReasonFromHistory', () => {
    it('returns last headline', () => {
      const player = makePlayer({
        priceHistory: [
          {
            timestamp: 't1',
            price: 42,
            reason: { type: 'news', headline: 'Rush' },
          },
          {
            timestamp: 't2',
            price: 48,
            reason: { type: 'news', headline: 'TD pass' },
          },
        ],
      });
      expect(getMoveReasonFromHistory(player)).toBe('TD pass');
    });

    it('returns empty string for null player', () => {
      expect(getMoveReasonFromHistory(null)).toBe('');
    });

    it('returns empty string when last entry has no reason', () => {
      const player = makePlayer({
        priceHistory: [
          {
            timestamp: 't',
            price: 42,
            reason: undefined as unknown as Player['priceHistory'] extends
              | (infer E)[]
              | undefined
              ? NonNullable<E>['reason']
              : never,
          },
        ],
      });
      expect(getMoveReasonFromHistory(player)).toBe('');
    });

    // TC-013 edge cases
    it('returns empty string for undefined player', () => {
      expect(getMoveReasonFromHistory(undefined)).toBe('');
    });

    it('returns empty string when player has no priceHistory', () => {
      expect(getMoveReasonFromHistory(makePlayer())).toBe('');
    });

    it('returns empty string when headline is empty string', () => {
      const player = makePlayer({
        priceHistory: [
          {
            timestamp: 't',
            price: 42,
            reason: { type: 'news', headline: '' },
          },
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

    it('returns empty array for null player', () => {
      expect(getLatestContentFromHistory(null)).toEqual([]);
    });

    it('returns empty array when last entry has no content', () => {
      const player = makePlayer({
        priceHistory: [
          {
            timestamp: 't',
            price: 42,
            reason: { type: 'news', headline: 'A' },
          },
        ],
      });
      expect(getLatestContentFromHistory(player)).toEqual([]);
    });

    // TC-015 edge cases
    it('returns empty array for undefined player', () => {
      expect(getLatestContentFromHistory(undefined)).toEqual([]);
    });

    it('returns empty array for empty priceHistory', () => {
      expect(
        getLatestContentFromHistory(makePlayer({ priceHistory: [] })),
      ).toEqual([]);
    });

    it('returns empty array when content is empty array', () => {
      const player = makePlayer({
        priceHistory: [
          {
            timestamp: 't',
            price: 42,
            reason: { type: 'news', headline: 'A' },
            content: [],
          },
        ],
      });
      expect(getLatestContentFromHistory(player)).toEqual([]);
    });
  });

  describe('getAllContentFromHistory', () => {
    it('returns all content aggregated', () => {
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

    it('returns empty array for null player', () => {
      expect(getAllContentFromHistory(null)).toEqual([]);
    });

    it('returns empty array for player with no priceHistory', () => {
      expect(getAllContentFromHistory(makePlayer())).toEqual([]);
    });

    it('returns empty for player with empty priceHistory', () => {
      expect(
        getAllContentFromHistory(makePlayer({ priceHistory: [] })),
      ).toEqual([]);
    });

    // TC-016 edge case: some entries have content, others don't
    it('only aggregates from entries that have content', () => {
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
            price: 45,
            reason: { type: 'news', headline: '' },
          },
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

    it('returns empty array for undefined player', () => {
      expect(getAllContentFromHistory(undefined)).toEqual([]);
    });

    it('returns empty when all entries have empty content arrays', () => {
      const player = makePlayer({
        priceHistory: [
          {
            timestamp: 't1',
            price: 42,
            reason: { type: 'news', headline: '' },
            content: [],
          },
          {
            timestamp: 't2',
            price: 45,
            reason: { type: 'news', headline: '' },
            content: [],
          },
        ],
      });
      expect(getAllContentFromHistory(player)).toEqual([]);
    });
  });

  // TC-018: all six functions are named exports
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

  // TC-022: priority chain (override > history > basePrice)
  describe('getEffectivePrice priority chain', () => {
    const player = makePlayer({
      id: 'p',
      basePrice: 30,
      priceHistory: [
        {
          timestamp: 't',
          price: 40,
          reason: { type: 'news', headline: 'Update' },
        },
      ],
    });

    it('override wins over history and basePrice', () => {
      expect(getEffectivePrice('p', { p: 50 }, {}, [player])).toBe(50);
    });

    it('history wins over basePrice when no override', () => {
      expect(getEffectivePrice('p', {}, {}, [player])).toBe(40);
    });

    it('basePrice is final fallback', () => {
      const noHistory = makePlayer({ id: 'p', basePrice: 30 });
      expect(getEffectivePrice('p', {}, {}, [noHistory])).toBe(30);
    });

    it('override same value as history still uses override path', () => {
      expect(getEffectivePrice('p', { p: 40 }, {}, [player])).toBe(40);
    });

    // TC-019: pure function with no closure
    it('produces different results with different players arrays', () => {
      const playersA = [makePlayer({ id: 'x', basePrice: 10 })];
      const playersB = [makePlayer({ id: 'x', basePrice: 99 })];
      expect(getEffectivePrice('x', {}, {}, playersA)).toBe(10);
      expect(getEffectivePrice('x', {}, {}, playersB)).toBe(99);
    });

    it('returns empty string playerId as 0', () => {
      expect(getEffectivePrice('', {}, {}, [player])).toBe(0);
    });
  });
});
