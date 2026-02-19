import { describe, it, expect } from 'vitest';
import type { SentimentInput } from '../priceCalculator';
import {
  applyPriceImpact,
  createPriceHistoryEntry,
  calculatePriceImpact,
  calculateNewPrice,
  calculateCumulativeImpact,
} from '../priceCalculator';

describe('applyPriceImpact', () => {
  it('increases price with a positive multiplier', () => {
    const result = applyPriceImpact(100, { impactMultiplier: 1.05 });
    expect(result).toBe(105);
  });

  it('decreases price with a negative multiplier', () => {
    const result = applyPriceImpact(100, { impactMultiplier: 0.95 });
    expect(result).toBe(95);
  });

  it('returns the same price when multiplier is 1', () => {
    const result = applyPriceImpact(42.5, { impactMultiplier: 1 });
    expect(result).toBe(42.5);
  });

  it('rounds to two decimal places', () => {
    const result = applyPriceImpact(33.33, { impactMultiplier: 1.111 });
    expect(result).toBe(37.03);
  });
});

describe('createPriceHistoryEntry', () => {
  it('builds an entry with article metadata', () => {
    const article = {
      headline: 'Mahomes throws 4 TDs',
      published: '2025-12-01T12:00:00Z',
      source: 'ESPN',
      url: 'https://espn.com/article/123',
    };
    const sentiment: SentimentInput = { sentiment: 'positive', magnitude: 0.8 };

    const entry = createPriceHistoryEntry(article, sentiment, 55.25);

    expect(entry).toEqual({
      timestamp: '2025-12-01T12:00:00Z',
      price: 55.25,
      reason: {
        type: 'news',
        headline: 'Mahomes throws 4 TDs',
        source: 'ESPN',
        url: 'https://espn.com/article/123',
        sentiment: 'positive',
        magnitude: 0.8,
      },
      content: [
        {
          type: 'article',
          title: 'Mahomes throws 4 TDs',
          source: 'ESPN',
          url: 'https://espn.com/article/123',
        },
      ],
    });
  });

  it('produces empty content array when url is "#"', () => {
    const article = { headline: 'Test', url: '#' };
    const sentiment: SentimentInput = { sentiment: 'neutral', magnitude: 0 };

    const entry = createPriceHistoryEntry(article, sentiment, 10);
    expect(entry.content).toEqual([]);
  });
});

describe('calculatePriceImpact', () => {
  it('returns positive impact for positive sentiment', () => {
    const result = calculatePriceImpact({
      sentiment: 'positive',
      magnitude: 0.8,
      confidence: 0.9,
    });
    expect(result.impactPercent).toBeGreaterThan(0);
    expect(result.impactMultiplier).toBeGreaterThan(1);
    expect(result.description).toBeTruthy();
  });

  it('returns negative impact for negative sentiment', () => {
    const result = calculatePriceImpact({
      sentiment: 'negative',
      magnitude: 0.8,
      confidence: 0.9,
    });
    expect(result.impactPercent).toBeLessThan(0);
    expect(result.impactMultiplier).toBeLessThan(1);
  });

  it('returns near-zero impact for neutral sentiment', () => {
    const result = calculatePriceImpact({
      sentiment: 'neutral',
      magnitude: 0.1,
      confidence: 0.5,
    });
    expect(Math.abs(result.impactPercent)).toBeLessThan(1);
  });

  it('includes detail breakdown', () => {
    const result = calculatePriceImpact({
      sentiment: 'positive',
      magnitude: 0.5,
      confidence: 0.7,
    });
    expect(result.details).toHaveProperty('sentiment', 'positive');
    expect(result.details).toHaveProperty('level');
    expect(result.details).toHaveProperty('confidence', 0.7);
  });
});

describe('calculateNewPrice', () => {
  it('returns new price and change data', () => {
    const result = calculateNewPrice(100, {
      sentiment: 'positive',
      magnitude: 0.8,
      confidence: 0.9,
    });
    expect(result).toHaveProperty('newPrice');
    expect(result).toHaveProperty('previousPrice', 100);
    expect(result).toHaveProperty('change');
    expect(result).toHaveProperty('changePercent');
    expect(result).toHaveProperty('impact');
    expect(typeof result.newPrice).toBe('number');
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
});

describe('calculateCumulativeImpact', () => {
  it('processes multiple sentiment results', () => {
    const results: SentimentInput[] = [
      { sentiment: 'positive', magnitude: 0.5, confidence: 0.8 },
      { sentiment: 'positive', magnitude: 0.3, confidence: 0.6 },
    ];
    const result = calculateCumulativeImpact(100, results);
    expect(result).toHaveProperty('newPrice');
    expect(result).toHaveProperty('previousPrice', 100);
    expect(result).toHaveProperty('totalImpactPercent');
    expect(result).toHaveProperty('impacts');
    expect(result.newPrice).toBeGreaterThan(100);
  });

  it('applies decay factor to subsequent articles', () => {
    const results: SentimentInput[] = [
      { sentiment: 'positive', magnitude: 0.5, confidence: 0.8 },
      { sentiment: 'positive', magnitude: 0.5, confidence: 0.8 },
    ];
    const result = calculateCumulativeImpact(100, results);
    if (result.impacts.length >= 2) {
      expect(result.impacts[1].decay).toBeLessThan(1);
    }
  });

  it('respects maxTotalImpact cap', () => {
    const results: SentimentInput[] = Array(20).fill({
      sentiment: 'positive',
      magnitude: 1.0,
      confidence: 1.0,
    });
    const result = calculateCumulativeImpact(100, results, {
      maxTotalImpact: 0.1,
    });
    expect(Math.abs(result.totalImpactPercent)).toBeLessThanOrEqual(10.5);
  });

  it('returns unchanged price for empty results', () => {
    const result = calculateCumulativeImpact(100, []);
    expect(result.newPrice).toBe(100);
    expect(result.totalImpactPercent).toBe(0);
    expect(result.impacts).toEqual([]);
  });
});
