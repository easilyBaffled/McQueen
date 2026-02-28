import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SentimentInput } from '../priceCalculator';
import {
  applyPriceImpact,
  createPriceHistoryEntry,
  calculatePriceImpact,
  calculateNewPrice,
  calculateCumulativeImpact,
} from '../priceCalculator';

// TC-029
describe('applyPriceImpact', () => {
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

  it('returns 0 for price of 0', () => {
    expect(applyPriceImpact(0, { impactMultiplier: 1.05 })).toBe(0);
  });

  it('handles very small price', () => {
    expect(applyPriceImpact(0.01, { impactMultiplier: 1.05 })).toBe(0.01);
  });
});

// TC-034
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

// TC-026
describe('calculatePriceImpact — positive/high sentiment', () => {
  let randomSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    randomSpy = vi.spyOn(Math, 'random');
  });

  afterEach(() => {
    randomSpy.mockRestore();
  });

  it('produces impact in 3%–5% range for positive/high with confidence 1.0', () => {
    randomSpy.mockReturnValue(0.5);
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
    randomSpy.mockReturnValue(0.5);
    const result = calculatePriceImpact({
      sentiment: 'positive',
      magnitude: 0.66,
      confidence: 1.0,
    });
    expect(result.details.level).toBe('high');
  });
});

// TC-027
describe('calculatePriceImpact — all 9 sentiment/magnitude combos', () => {
  let randomSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    randomSpy = vi.spyOn(Math, 'random');
  });

  afterEach(() => {
    randomSpy.mockRestore();
  });

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
    it(`${sentiment}/${level}: Math.random=0 → impact at min of range`, () => {
      randomSpy.mockReturnValue(0);
      const result = calculatePriceImpact({
        sentiment,
        magnitude,
        confidence: 1.0,
      });
      const expected = +(minPct).toFixed(2);
      expect(result.impactPercent).toBeCloseTo(expected, 1);
    });

    it(`${sentiment}/${level}: Math.random≈1 → impact at max of range`, () => {
      randomSpy.mockReturnValue(0.9999);
      const result = calculatePriceImpact({
        sentiment,
        magnitude,
        confidence: 1.0,
      });
      const expected = +(maxPct).toFixed(2);
      expect(result.impactPercent).toBeCloseTo(expected, 0);
    });
  });
});

// TC-028
describe('calculatePriceImpact — confidence weighting', () => {
  let randomSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    randomSpy = vi.spyOn(Math, 'random');
  });

  afterEach(() => {
    randomSpy.mockRestore();
  });

  it('confidence 0.0 → multiplier 0.7', () => {
    randomSpy.mockReturnValue(0.5);
    const result = calculatePriceImpact({
      sentiment: 'positive',
      magnitude: 0.8,
      confidence: 0.0,
    });
    expect(result.details.confidenceMultiplier).toBeCloseTo(0.7, 5);
  });

  it('confidence 1.0 → multiplier 1.0', () => {
    randomSpy.mockReturnValue(0.5);
    const result = calculatePriceImpact({
      sentiment: 'positive',
      magnitude: 0.8,
      confidence: 1.0,
    });
    expect(result.details.confidenceMultiplier).toBeCloseTo(1.0, 5);
  });

  it('confidence 0.5 → multiplier 0.85', () => {
    randomSpy.mockReturnValue(0.5);
    const result = calculatePriceImpact({
      sentiment: 'positive',
      magnitude: 0.8,
      confidence: 0.5,
    });
    expect(result.details.confidenceMultiplier).toBeCloseTo(0.85, 5);
  });

  it('confidence defaults to 0.5 when omitted', () => {
    randomSpy.mockReturnValue(0.5);
    const result = calculatePriceImpact({
      sentiment: 'positive',
      magnitude: 0.8,
    });
    expect(result.details.confidence).toBe(0.5);
    expect(result.details.confidenceMultiplier).toBeCloseTo(0.85, 5);
  });

  it('confidence weighting scales the base impact correctly', () => {
    randomSpy.mockReturnValue(0.5);

    const full = calculatePriceImpact({
      sentiment: 'positive',
      magnitude: 0.8,
      confidence: 1.0,
    });
    const half = calculatePriceImpact({
      sentiment: 'positive',
      magnitude: 0.8,
      confidence: 0.0,
    });

    expect(full.details.baseImpact).toBeCloseTo(half.details.baseImpact, 5);
    expect(Math.abs(half.impactPercent)).toBeLessThan(Math.abs(full.impactPercent));
    expect(Math.abs(half.impactPercent)).toBeCloseTo(
      Math.abs(full.impactPercent) * 0.7,
      1,
    );
  });
});

// TC-030
describe('calculateNewPrice — end-to-end', () => {
  let randomSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    randomSpy = vi.spyOn(Math, 'random');
  });

  afterEach(() => {
    randomSpy.mockRestore();
  });

  it('composes impact and returns a complete PriceResult', () => {
    randomSpy.mockReturnValue(0.5);
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
    randomSpy.mockReturnValue(0.5);
    const result = calculateNewPrice(100, {
      sentiment: 'positive',
      magnitude: 0.8,
      confidence: 0.9,
    });
    expect(result.newPrice).toBeGreaterThan(100);
    expect(result.change).toBeGreaterThan(0);
  });

  it('negative sentiment decreases price', () => {
    randomSpy.mockReturnValue(0.5);
    const result = calculateNewPrice(100, {
      sentiment: 'negative',
      magnitude: 0.8,
      confidence: 0.9,
    });
    expect(result.newPrice).toBeLessThan(100);
    expect(result.change).toBeLessThan(0);
  });

  it('neutral sentiment keeps price close to original', () => {
    randomSpy.mockReturnValue(0.5);
    const result = calculateNewPrice(100, {
      sentiment: 'neutral',
      magnitude: 0.1,
      confidence: 0.5,
    });
    expect(Math.abs(result.change)).toBeLessThan(1);
  });
});

// TC-031
describe('calculateCumulativeImpact — multiple sentiments', () => {
  let randomSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    randomSpy = vi.spyOn(Math, 'random');
  });

  afterEach(() => {
    randomSpy.mockRestore();
  });

  it('sorts by confidence and applies correct decay', () => {
    randomSpy.mockReturnValue(0.5);
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

    // Verify sorted by confidence descending
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
    randomSpy.mockReturnValue(0.5);
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

// TC-032
describe('calculateCumulativeImpact — maxTotalImpact cap', () => {
  let randomSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    randomSpy = vi.spyOn(Math, 'random');
  });

  afterEach(() => {
    randomSpy.mockRestore();
  });

  it('respects custom maxTotalImpact of 5%', () => {
    randomSpy.mockReturnValue(0.5);
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
    randomSpy.mockReturnValue(0.99);
    const sentiments: SentimentInput[] = Array(20).fill({
      sentiment: 'positive',
      magnitude: 1.0,
      confidence: 1.0,
    });

    const result = calculateCumulativeImpact(100, sentiments);
    expect(Math.abs(result.totalImpactPercent)).toBeLessThanOrEqual(10.5);
  });

  it('skips impacts that would exceed the cap', () => {
    randomSpy.mockReturnValue(0.99);
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

// TC-033
describe('calculateCumulativeImpact — custom decayFactor', () => {
  let randomSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    randomSpy = vi.spyOn(Math, 'random');
  });

  afterEach(() => {
    randomSpy.mockRestore();
  });

  it('decayFactor 0.5 gives decays 1.0, 0.5, 0.25', () => {
    randomSpy.mockReturnValue(0.5);
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
    randomSpy.mockReturnValue(0.5);
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
    randomSpy.mockReturnValue(0.5);
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
