import { describe, it, expect } from 'vitest';
import type { SentimentInput } from '../priceCalculator';
import {
  applyPriceImpact,
  createPriceHistoryEntry,
  calculatePriceImpact,
  calculateNewPrice,
  calculateCumulativeImpact,
  MIN_PRICE,
} from '../priceCalculator';

// --- Price floor tests (TC-005) ---
describe('applyPriceImpact — price floor', () => {
  it('increases price with a positive multiplier', () => {
    expect(applyPriceImpact(100, { impactMultiplier: 1.05 })).toBe(105);
  });

  it('decreases price with a negative multiplier', () => {
    expect(applyPriceImpact(100, { impactMultiplier: 0.97 })).toBe(97);
  });

  it('returns the same price when multiplier is 1', () => {
    expect(applyPriceImpact(42.5, { impactMultiplier: 1 })).toBe(42.5);
  });

  it('rounds to two decimal places', () => {
    expect(applyPriceImpact(33.33, { impactMultiplier: 0.97 })).toBe(32.33);
  });

  it('clamps to MIN_PRICE for price of 0', () => {
    expect(applyPriceImpact(0, { impactMultiplier: 1.05 })).toBe(MIN_PRICE);
  });

  it('handles very small price', () => {
    expect(applyPriceImpact(0.01, { impactMultiplier: 1.05 })).toBe(MIN_PRICE);
  });

  it('clamps to MIN_PRICE when multiplier is 0 (100% loss)', () => {
    expect(applyPriceImpact(1.0, { impactMultiplier: 0.0 })).toBe(MIN_PRICE);
  });

  it('clamps to MIN_PRICE with negative multiplier', () => {
    expect(applyPriceImpact(0.5, { impactMultiplier: -1.0 })).toBe(MIN_PRICE);
  });

  it('does not clamp when result is above floor', () => {
    expect(applyPriceImpact(100.0, { impactMultiplier: 0.99 })).toBe(99);
  });

  it('price at exactly MIN_PRICE with negative stays at MIN_PRICE', () => {
    expect(applyPriceImpact(MIN_PRICE, { impactMultiplier: 0.5 })).toBe(MIN_PRICE);
  });
});

// --- NaN guard tests (TC-006) ---
describe('applyPriceImpact — NaN guard', () => {
  it('NaN currentPrice returns MIN_PRICE', () => {
    const result = applyPriceImpact(NaN, { impactMultiplier: 1.05 });
    expect(result).toBe(MIN_PRICE);
    expect(Number.isFinite(result)).toBe(true);
  });

  it('NaN impactMultiplier returns safe default', () => {
    const result = applyPriceImpact(50, { impactMultiplier: NaN });
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBe(50);
  });

  it('both NaN returns MIN_PRICE', () => {
    const result = applyPriceImpact(NaN, { impactMultiplier: NaN });
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBe(MIN_PRICE);
  });
});

// --- Infinity guard tests (TC-007) ---
describe('applyPriceImpact — Infinity guard', () => {
  it('Infinity currentPrice returns MIN_PRICE', () => {
    const result = applyPriceImpact(Infinity, { impactMultiplier: 1.05 });
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBe(MIN_PRICE);
  });

  it('-Infinity currentPrice returns MIN_PRICE', () => {
    const result = applyPriceImpact(-Infinity, { impactMultiplier: 1.05 });
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBe(MIN_PRICE);
  });

  it('Infinity impactMultiplier returns safe default', () => {
    const result = applyPriceImpact(50, { impactMultiplier: Infinity });
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBe(50);
  });

  it('-Infinity impactMultiplier returns MIN_PRICE', () => {
    const result = applyPriceImpact(50, { impactMultiplier: -Infinity });
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBe(50);
  });
});

// --- calculateNewPrice NaN/Infinity guards (TC-006, TC-007) ---
describe('calculateNewPrice — NaN/Infinity guards', () => {
  it('NaN currentPrice returns finite newPrice >= MIN_PRICE', () => {
    const result = calculateNewPrice(NaN, {
      sentiment: 'positive',
      magnitude: 5,
      confidence: 0.8,
    });
    expect(Number.isFinite(result.newPrice)).toBe(true);
    expect(result.newPrice).toBeGreaterThanOrEqual(MIN_PRICE);
  });

  it('Infinity currentPrice returns finite newPrice', () => {
    const result = calculateNewPrice(Infinity, {
      sentiment: 'neutral',
      magnitude: 1,
      confidence: 0.5,
    });
    expect(Number.isFinite(result.newPrice)).toBe(true);
  });
});

// --- calculateCumulativeImpact NaN guard (TC-006) ---
describe('calculateCumulativeImpact — NaN guard', () => {
  it('NaN currentPrice returns safe defaults', () => {
    const result = calculateCumulativeImpact(NaN, [
      { sentiment: 'positive', magnitude: 3 },
    ]);
    expect(Number.isFinite(result.newPrice)).toBe(true);
    expect(result.newPrice).toBeGreaterThanOrEqual(MIN_PRICE);
    expect(Number.isFinite(result.totalImpactPercent)).toBe(true);
  });
});

// --- createPriceHistoryEntry (TC-034) ---
describe('createPriceHistoryEntry', () => {
  it('builds an entry with full article metadata', () => {
    const article = {
      headline: 'Big Win',
      published: '2025-01-01T00:00:00Z',
      source: 'ESPN NFL',
      url: 'http://example.com',
    };
    const sentiment: SentimentInput = { sentiment: 'positive', magnitude: 0.7 };
    const entry = createPriceHistoryEntry(article, sentiment, 105.5);

    expect(entry.timestamp).toBe('2025-01-01T00:00:00Z');
    expect(entry.price).toBe(105.5);
    expect(entry.reason).toEqual({
      type: 'news',
      headline: 'Big Win',
      source: 'ESPN NFL',
      url: 'http://example.com',
      sentiment: 'positive',
      magnitude: 0.7,
    });
    expect(entry.content).toEqual([
      {
        type: 'article',
        title: 'Big Win',
        source: 'ESPN NFL',
        url: 'http://example.com',
      },
    ]);
  });

  it('produces empty content array when url is "#"', () => {
    const entry = createPriceHistoryEntry(
      { headline: 'Test', url: '#' },
      { sentiment: 'neutral', magnitude: 0 },
      10,
    );
    expect(entry.content).toEqual([]);
  });

  it('produces empty content array when url is undefined', () => {
    const entry = createPriceHistoryEntry(
      { headline: 'Test' },
      { sentiment: 'neutral', magnitude: 0 },
      10,
    );
    expect(entry.content).toEqual([]);
  });

  it('defaults source to "ESPN NFL" when missing', () => {
    const entry = createPriceHistoryEntry(
      { headline: 'Test', url: 'http://x.com' },
      { sentiment: 'neutral', magnitude: 0 },
      10,
    );
    expect(entry.reason.source).toBe('ESPN NFL');
    expect(entry.content![0].source).toBe('ESPN NFL');
  });

  it('defaults published to current ISO timestamp when missing', () => {
    const entry = createPriceHistoryEntry(
      { headline: 'Test' },
      { sentiment: 'neutral', magnitude: 0 },
      10,
    );
    expect(entry.timestamp).toBeTruthy();
    expect(() => new Date(entry.timestamp)).not.toThrow();
  });
});

// --- Deterministic pricing (TC-008) ---
describe('calculatePriceImpact — deterministic', () => {
  it('same inputs produce identical results', () => {
    const input: SentimentInput = {
      sentiment: 'positive',
      magnitude: 5,
      confidence: 0.8,
    };
    const result1 = calculatePriceImpact(input);
    const result2 = calculatePriceImpact(input);
    expect(result1.impactPercent).toBe(result2.impactPercent);
    expect(result1.impactMultiplier).toBe(result2.impactMultiplier);
  });

  it('different sentiment produces different results', () => {
    const a = calculatePriceImpact({ sentiment: 'positive', magnitude: 5, confidence: 0.8 });
    const b = calculatePriceImpact({ sentiment: 'negative', magnitude: 5, confidence: 0.8 });
    expect(a.impactPercent).not.toBe(b.impactPercent);
  });

  it('different magnitude produces different results', () => {
    const a = calculatePriceImpact({ sentiment: 'positive', magnitude: 5, confidence: 0.8 });
    const c = calculatePriceImpact({ sentiment: 'positive', magnitude: 1, confidence: 0.8 });
    expect(a.impactPercent).not.toBe(c.impactPercent);
  });
});

describe('calculateNewPrice — deterministic', () => {
  it('same inputs produce identical newPrice', () => {
    const input: SentimentInput = { sentiment: 'negative', magnitude: 3, confidence: 0.6 };
    const r1 = calculateNewPrice(100, input);
    const r2 = calculateNewPrice(100, input);
    expect(r1.newPrice).toBe(r2.newPrice);
  });
});

describe('calculateCumulativeImpact — deterministic', () => {
  it('same inputs produce identical results', () => {
    const sentiments: SentimentInput[] = [
      { sentiment: 'positive', magnitude: 0.5, confidence: 0.9 },
      { sentiment: 'negative', magnitude: 0.3, confidence: 0.7 },
    ];
    const r1 = calculateCumulativeImpact(100, sentiments);
    const r2 = calculateCumulativeImpact(100, sentiments);
    expect(r1.newPrice).toBe(r2.newPrice);
    expect(r1.totalImpactPercent).toBe(r2.totalImpactPercent);
  });
});

// --- Impact ranges (TC-026, TC-027) ---
describe('calculatePriceImpact — positive/high sentiment', () => {
  it('produces impact in 3%–5% range for positive/high with confidence 1.0', () => {
    const result = calculatePriceImpact({
      sentiment: 'positive',
      magnitude: 0.8,
      confidence: 1.0,
    });
    expect(result.impactPercent).toBeGreaterThanOrEqual(3);
    expect(result.impactPercent).toBeLessThanOrEqual(5);
    expect(result.details.level).toBe('high');
    expect(result.details.sentiment).toBe('positive');
  });

  it('boundary: magnitude exactly 0.66 maps to "high"', () => {
    const result = calculatePriceImpact({
      sentiment: 'positive',
      magnitude: 0.66,
      confidence: 1.0,
    });
    expect(result.details.level).toBe('high');
  });
});

describe('calculatePriceImpact — all 9 sentiment/magnitude combos produce values in expected range', () => {
  const combos: Array<{
    sentiment: SentimentInput['sentiment'];
    magnitude: number;
    level: string;
    minPct: number;
    maxPct: number;
  }> = [
    { sentiment: 'positive', magnitude: 0.8, level: 'high', minPct: 3, maxPct: 5 },
    { sentiment: 'positive', magnitude: 0.5, level: 'medium', minPct: 1.5, maxPct: 3 },
    { sentiment: 'positive', magnitude: 0.1, level: 'low', minPct: 0.5, maxPct: 1.5 },
    { sentiment: 'negative', magnitude: 0.8, level: 'high', minPct: -5, maxPct: -3 },
    { sentiment: 'negative', magnitude: 0.5, level: 'medium', minPct: -3, maxPct: -1.5 },
    { sentiment: 'negative', magnitude: 0.1, level: 'low', minPct: -1.5, maxPct: -0.5 },
    { sentiment: 'neutral', magnitude: 0.8, level: 'high', minPct: -0.5, maxPct: 0.5 },
    { sentiment: 'neutral', magnitude: 0.5, level: 'medium', minPct: -0.5, maxPct: 0.5 },
    { sentiment: 'neutral', magnitude: 0.1, level: 'low', minPct: -0.3, maxPct: 0.3 },
  ];

  combos.forEach(({ sentiment, magnitude, level, minPct, maxPct }) => {
    it(`${sentiment}/${level}: impact within [${minPct}, ${maxPct}]%`, () => {
      const result = calculatePriceImpact({
        sentiment,
        magnitude,
        confidence: 1.0,
      });
      expect(result.impactPercent).toBeGreaterThanOrEqual(minPct);
      expect(result.impactPercent).toBeLessThanOrEqual(maxPct);
    });
  });
});

// --- Confidence weighting (TC-028) ---
describe('calculatePriceImpact — confidence weighting', () => {
  it('confidence 0.0 → multiplier 0.7', () => {
    const result = calculatePriceImpact({
      sentiment: 'positive',
      magnitude: 0.8,
      confidence: 0.0,
    });
    expect(result.details.confidenceMultiplier).toBeCloseTo(0.7, 5);
  });

  it('confidence 1.0 → multiplier 1.0', () => {
    const result = calculatePriceImpact({
      sentiment: 'positive',
      magnitude: 0.8,
      confidence: 1.0,
    });
    expect(result.details.confidenceMultiplier).toBeCloseTo(1.0, 5);
  });

  it('confidence 0.5 → multiplier 0.85', () => {
    const result = calculatePriceImpact({
      sentiment: 'positive',
      magnitude: 0.8,
      confidence: 0.5,
    });
    expect(result.details.confidenceMultiplier).toBeCloseTo(0.85, 5);
  });

  it('confidence defaults to 0.5 when omitted', () => {
    const result = calculatePriceImpact({
      sentiment: 'positive',
      magnitude: 0.8,
    });
    expect(result.details.confidence).toBe(0.5);
    expect(result.details.confidenceMultiplier).toBeCloseTo(0.85, 5);
  });
});

// --- calculateNewPrice end-to-end (TC-030) ---
describe('calculateNewPrice — end-to-end', () => {
  it('composes impact and returns a complete PriceResult', () => {
    const result = calculateNewPrice(100, {
      sentiment: 'positive',
      magnitude: 0.8,
      confidence: 1.0,
    });
    expect(result.previousPrice).toBe(100);
    expect(result.newPrice).toBeGreaterThan(100);
    expect(result.change).toBeCloseTo(result.newPrice - 100, 2);
    expect(result.changePercent).toBe(result.impact.impactPercent);
    expect(result.impact).toBeDefined();
  });

  it('positive sentiment increases price', () => {
    const result = calculateNewPrice(100, {
      sentiment: 'positive',
      magnitude: 0.8,
      confidence: 0.9,
    });
    expect(result.newPrice).toBeGreaterThan(100);
    expect(result.change).toBeGreaterThan(0);
  });

  it('negative sentiment decreases price', () => {
    const result = calculateNewPrice(100, {
      sentiment: 'negative',
      magnitude: 0.8,
      confidence: 0.9,
    });
    expect(result.newPrice).toBeLessThan(100);
    expect(result.change).toBeLessThan(0);
  });

  it('neutral sentiment keeps price close to original', () => {
    const result = calculateNewPrice(100, {
      sentiment: 'neutral',
      magnitude: 0.1,
      confidence: 0.5,
    });
    expect(Math.abs(result.change)).toBeLessThan(1);
  });
});

// --- calculateCumulativeImpact (TC-031) ---
describe('calculateCumulativeImpact — multiple sentiments', () => {
  it('sorts by confidence and applies correct decay', () => {
    const sentiments: SentimentInput[] = [
      { sentiment: 'positive', magnitude: 0.8, confidence: 0.5 },
      { sentiment: 'positive', magnitude: 0.5, confidence: 0.9 },
      { sentiment: 'negative', magnitude: 0.3, confidence: 0.7 },
    ];

    const result = calculateCumulativeImpact(100, sentiments);
    expect(result.impacts).toHaveLength(3);
    expect(result.impacts[0].decay).toBe(1.0);
    expect(result.impacts[1].decay).toBeCloseTo(0.7, 5);
    expect(result.impacts[2].decay).toBeCloseTo(0.49, 5);

    expect(result.impacts[0].details.confidence).toBe(0.9);
    expect(result.impacts[1].details.confidence).toBe(0.7);
    expect(result.impacts[2].details.confidence).toBe(0.5);
  });

  it('returns unchanged price for empty sentiments', () => {
    const result = calculateCumulativeImpact(100, []);
    expect(result.newPrice).toBe(100);
    expect(result.totalImpactPercent).toBe(0);
    expect(result.impacts).toEqual([]);
  });

  it('tracks running price correctly', () => {
    const sentiments: SentimentInput[] = [
      { sentiment: 'positive', magnitude: 0.5, confidence: 0.8 },
      { sentiment: 'positive', magnitude: 0.3, confidence: 0.6 },
    ];

    const result = calculateCumulativeImpact(100, sentiments);
    expect(result.impacts.length).toBeGreaterThanOrEqual(1);
    expect(result.newPrice).toBe(
      result.impacts[result.impacts.length - 1].runningPrice,
    );
  });
});

// --- Price floor in cumulative impact (TC-028) ---
describe('calculateCumulativeImpact — price floor', () => {
  it('enforces >= MIN_PRICE even with many negative impacts', () => {
    const sentiments: SentimentInput[] = Array(10).fill({
      sentiment: 'negative',
      magnitude: 10,
      confidence: 1.0,
    });
    const result = calculateCumulativeImpact(0.05, sentiments, { maxTotalImpact: 1 });
    expect(result.newPrice).toBeGreaterThanOrEqual(MIN_PRICE);
    result.impacts.forEach((impact) => {
      expect(impact.runningPrice).toBeGreaterThanOrEqual(MIN_PRICE);
    });
  });
});

// --- maxTotalImpact cap (TC-032) ---
describe('calculateCumulativeImpact — maxTotalImpact cap', () => {
  it('respects custom maxTotalImpact of 5%', () => {
    const sentiments: SentimentInput[] = Array(20).fill({
      sentiment: 'positive',
      magnitude: 1.0,
      confidence: 1.0,
    });

    const result = calculateCumulativeImpact(100, sentiments, {
      maxTotalImpact: 0.05,
    });
    expect(Math.abs(result.totalImpactPercent)).toBeLessThanOrEqual(5.5);
  });

  it('respects default maxTotalImpact of 10%', () => {
    const sentiments: SentimentInput[] = Array(20).fill({
      sentiment: 'positive',
      magnitude: 1.0,
      confidence: 1.0,
    });

    const result = calculateCumulativeImpact(100, sentiments);
    expect(Math.abs(result.totalImpactPercent)).toBeLessThanOrEqual(10.5);
  });

  it('skips impacts that would exceed the cap', () => {
    const sentiments: SentimentInput[] = Array(20).fill({
      sentiment: 'positive',
      magnitude: 1.0,
      confidence: 1.0,
    });

    const result = calculateCumulativeImpact(100, sentiments, {
      maxTotalImpact: 0.05,
    });
    expect(result.impacts.length).toBeLessThan(20);
  });
});

// --- Custom decayFactor (TC-033) ---
describe('calculateCumulativeImpact — custom decayFactor', () => {
  it('decayFactor 0.5 gives decays 1.0, 0.5, 0.25', () => {
    const sentiments: SentimentInput[] = [
      { sentiment: 'positive', magnitude: 0.5, confidence: 0.9 },
      { sentiment: 'positive', magnitude: 0.5, confidence: 0.8 },
      { sentiment: 'positive', magnitude: 0.5, confidence: 0.7 },
    ];

    const result = calculateCumulativeImpact(100, sentiments, {
      decayFactor: 0.5,
    });
    expect(result.impacts[0].decay).toBe(1.0);
    expect(result.impacts[1].decay).toBeCloseTo(0.5, 5);
    expect(result.impacts[2].decay).toBeCloseTo(0.25, 5);
  });

  it('decayFactor 1.0 gives no decay', () => {
    const sentiments: SentimentInput[] = [
      { sentiment: 'positive', magnitude: 0.5, confidence: 0.9 },
      { sentiment: 'positive', magnitude: 0.5, confidence: 0.8 },
    ];

    const result = calculateCumulativeImpact(100, sentiments, {
      decayFactor: 1.0,
    });
    expect(result.impacts[0].decay).toBe(1.0);
    expect(result.impacts[1].decay).toBe(1.0);
  });

  it('decayFactor 0 means only first impact applies', () => {
    const sentiments: SentimentInput[] = [
      { sentiment: 'positive', magnitude: 0.5, confidence: 0.9 },
      { sentiment: 'positive', magnitude: 0.5, confidence: 0.8 },
    ];

    const result = calculateCumulativeImpact(100, sentiments, {
      decayFactor: 0,
    });
    expect(result.impacts[0].decay).toBe(1.0);
    if (result.impacts.length > 1) {
      expect(result.impacts[1].decay).toBe(0);
    }
  });
});
