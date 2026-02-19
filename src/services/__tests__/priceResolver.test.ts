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
  });
});
