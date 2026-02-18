import { describe, it, expect } from 'vitest';
import { applyPriceImpact, createPriceHistoryEntry } from '../priceCalculator';

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
    const result = applyPriceImpact(42.50, { impactMultiplier: 1 });
    expect(result).toBe(42.50);
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
    const sentiment = { sentiment: 'positive', magnitude: 0.8 };

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
    const sentiment = { sentiment: 'neutral', magnitude: 0 };

    const entry = createPriceHistoryEntry(article, sentiment, 10);
    expect(entry.content).toEqual([]);
  });
});
