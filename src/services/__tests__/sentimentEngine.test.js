import { describe, it, expect } from 'vitest';
import {
  analyzeSentiment,
  getMagnitudeLevel,
  getSentimentDescription,
} from '../sentimentEngine';

describe('analyzeSentiment', () => {
  it('returns neutral for empty text', () => {
    const result = analyzeSentiment('');
    expect(result).toEqual({
      sentiment: 'neutral',
      magnitude: 0,
      confidence: 0,
      keywords: [],
    });
  });

  it('returns neutral for null/undefined text', () => {
    expect(analyzeSentiment(null).sentiment).toBe('neutral');
    expect(analyzeSentiment(undefined).sentiment).toBe('neutral');
  });

  it('detects high-impact positive keywords', () => {
    const result = analyzeSentiment('Mahomes throws game-winning touchdown');
    expect(result.sentiment).toBe('positive');
    expect(result.scores.positive).toBeGreaterThan(0);
    expect(result.keywords.length).toBeGreaterThan(0);
  });

  it('detects high-impact negative keywords', () => {
    const result = analyzeSentiment('Star QB suffers torn ACL, out for season');
    expect(result.sentiment).toBe('negative');
    expect(result.scores.negative).toBeGreaterThan(0);
  });

  it('detects medium-impact positive keywords', () => {
    const result = analyzeSentiment('Player leads team with explosive performance');
    expect(result.sentiment).toBe('positive');
    expect(result.keywords.some((k) => k.level === 'medium')).toBe(true);
  });

  it('detects low-impact positive keywords', () => {
    const result = analyzeSentiment('Player cleared for full participation, healthy');
    expect(result.sentiment).toBe('positive');
    expect(result.keywords.some((k) => k.level === 'low')).toBe(true);
  });

  it('handles negation near keywords', () => {
    const result = analyzeSentiment("Player did not score a touchdown");
    expect(result.scores.negative).toBeGreaterThan(0);
  });

  it('scores position-specific QB keywords', () => {
    const result = analyzeSentiment(
      'Elite passer rating and clean pocket performance',
      'Patrick Mahomes',
      'QB',
    );
    expect(result.keywords.some((k) => k.word === 'passer rating')).toBe(true);
    expect(result.scores.positive).toBeGreaterThan(0);
  });

  it('scores position-specific WR keywords', () => {
    const result = analyzeSentiment(
      'Record targets and receptions in contested catch situations',
      'Justin Jefferson',
      'WR',
    );
    expect(result.keywords.some((k) => k.word === 'targets')).toBe(true);
  });

  it('scores fantasy-relevant positive keywords', () => {
    const result = analyzeSentiment('Increased target share and snap count increase');
    expect(result.keywords.some((k) => k.word === 'target share')).toBe(true);
    expect(result.scores.positive).toBeGreaterThan(0);
  });

  it('scores fantasy-relevant negative keywords', () => {
    const result = analyzeSentiment('Running back in committee timeshare, reduced role');
    expect(result.sentiment).toBe('negative');
    expect(result.keywords.some((k) => k.word === 'committee')).toBe(true);
  });

  it('returns mixed/neutral when positive and negative scores are equal', () => {
    const result = analyzeSentiment('Player scored a touchdown but suffered injury');
    expect(result.keywords.length).toBeGreaterThan(0);
    expect(result.scores.positive).toBeGreaterThan(0);
    expect(result.scores.negative).toBeGreaterThan(0);
  });

  it('caps confidence at 1.0', () => {
    const text =
      'touchdown td winning career-high record-breaking mvp game-winning clutch dominant historic pro bowl all-pro';
    const result = analyzeSentiment(text);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('caps magnitude at 1.0', () => {
    const text =
      'touchdown td winning career-high record-breaking mvp game-winning clutch dominant historic';
    const result = analyzeSentiment(text);
    expect(result.magnitude).toBeLessThanOrEqual(1);
  });
});

describe('getMagnitudeLevel', () => {
  it('returns "high" for magnitude >= 0.66', () => {
    expect(getMagnitudeLevel(0.66)).toBe('high');
    expect(getMagnitudeLevel(1.0)).toBe('high');
  });

  it('returns "medium" for magnitude >= 0.33 and < 0.66', () => {
    expect(getMagnitudeLevel(0.33)).toBe('medium');
    expect(getMagnitudeLevel(0.5)).toBe('medium');
    expect(getMagnitudeLevel(0.65)).toBe('medium');
  });

  it('returns "low" for magnitude < 0.33', () => {
    expect(getMagnitudeLevel(0)).toBe('low');
    expect(getMagnitudeLevel(0.1)).toBe('low');
    expect(getMagnitudeLevel(0.32)).toBe('low');
  });
});

describe('getSentimentDescription', () => {
  it('returns Very Bullish for high positive', () => {
    expect(getSentimentDescription({ sentiment: 'positive', magnitude: 0.8 })).toBe(
      'Very Bullish 🚀',
    );
  });

  it('returns Bullish for medium positive', () => {
    expect(getSentimentDescription({ sentiment: 'positive', magnitude: 0.5 })).toBe(
      'Bullish 📈',
    );
  });

  it('returns Slightly Bullish for low positive', () => {
    expect(getSentimentDescription({ sentiment: 'positive', magnitude: 0.1 })).toBe(
      'Slightly Bullish 📊',
    );
  });

  it('returns Very Bearish for high negative', () => {
    expect(getSentimentDescription({ sentiment: 'negative', magnitude: 0.8 })).toBe(
      'Very Bearish 📉',
    );
  });

  it('returns Bearish for medium negative', () => {
    expect(getSentimentDescription({ sentiment: 'negative', magnitude: 0.5 })).toBe(
      'Bearish 🔻',
    );
  });

  it('returns Slightly Bearish for low negative', () => {
    expect(getSentimentDescription({ sentiment: 'negative', magnitude: 0.1 })).toBe(
      'Slightly Bearish 📊',
    );
  });

  it('returns Neutral for neutral sentiment', () => {
    expect(getSentimentDescription({ sentiment: 'neutral', magnitude: 0 })).toBe(
      'Neutral ➡️',
    );
  });

  it('returns fallback for unknown sentiment', () => {
    expect(getSentimentDescription({ sentiment: 'unknown', magnitude: 0 })).toBe(
      'Neutral ➡️',
    );
  });
});
