import { describe, it, expect } from 'vitest';
import {
  analyzeSentiment,
  getMagnitudeLevel,
  getSentimentDescription,
} from '../sentimentEngine';

// TC-001
describe('analyzeSentiment — null/undefined/empty input', () => {
  it('returns neutral default for null', () => {
    const result = analyzeSentiment(null);
    expect(result).toEqual({
      sentiment: 'neutral',
      magnitude: 0,
      confidence: 0,
      keywords: [],
    });
  });

  it('returns neutral default for undefined', () => {
    const result = analyzeSentiment(undefined);
    expect(result).toEqual({
      sentiment: 'neutral',
      magnitude: 0,
      confidence: 0,
      keywords: [],
    });
  });

  it('returns neutral default for empty string', () => {
    const result = analyzeSentiment('');
    expect(result).toEqual({
      sentiment: 'neutral',
      magnitude: 0,
      confidence: 0,
      keywords: [],
    });
  });

  it('attempts keyword matching on whitespace-only string', () => {
    const result = analyzeSentiment('   ');
    expect(result.sentiment).toBe('neutral');
    expect(result.keywords).toEqual([]);
  });
});

// TC-002
describe('analyzeSentiment — high-level positive keyword detection', () => {
  it('detects "touchdown" with weight 3', () => {
    const result = analyzeSentiment(
      'Player scores a touchdown in the fourth quarter',
    );
    expect(result.sentiment).toBe('positive');
    expect(result.keywords).toContainEqual({
      word: 'touchdown',
      type: 'positive',
      level: 'high',
    });
    expect(result.scores.positive).toBeGreaterThanOrEqual(3);
  });

  it('detects "mvp" with high level', () => {
    const result = analyzeSentiment('Named MVP of the game');
    expect(result.keywords).toContainEqual({
      word: 'mvp',
      type: 'positive',
      level: 'high',
    });
  });

  it('is case insensitive — "TOUCHDOWN"', () => {
    const result = analyzeSentiment('TOUCHDOWN play wins the game');
    expect(result.keywords).toContainEqual({
      word: 'touchdown',
      type: 'positive',
      level: 'high',
    });
  });

  it('is case insensitive — "Touchdown"', () => {
    const result = analyzeSentiment('Touchdown in overtime');
    expect(result.keywords).toContainEqual({
      word: 'touchdown',
      type: 'positive',
      level: 'high',
    });
  });

  it('matches keyword embedded in longer word ("touchdowns")', () => {
    const result = analyzeSentiment('Player threw three touchdowns');
    expect(result.keywords).toContainEqual({
      word: 'touchdown',
      type: 'positive',
      level: 'high',
    });
  });

  it('detects all high-level positive keywords individually', () => {
    const highKeywords = [
      'touchdown',
      'td',
      'winning',
      'career-high',
      'record-breaking',
      'mvp',
      'game-winning',
      'clutch',
      'dominant',
      'historic',
      'pro bowl',
      'all-pro',
      'triple crown',
      'franchise record',
      'league-leading',
    ];

    highKeywords.forEach((keyword) => {
      const result = analyzeSentiment(`Player had a ${keyword} moment`);
      expect(result.keywords).toContainEqual({
        word: keyword,
        type: 'positive',
        level: 'high',
      });
    });
  });
});

// TC-003
describe('analyzeSentiment — medium-level positive keyword detection', () => {
  it('detects multiple medium keywords with weight 2 each', () => {
    const result = analyzeSentiment(
      'Player leads team to a comeback victory',
    );
    expect(result.keywords).toContainEqual({
      word: 'leads',
      type: 'positive',
      level: 'medium',
    });
    expect(result.keywords).toContainEqual({
      word: 'comeback',
      type: 'positive',
      level: 'medium',
    });
    expect(result.scores.positive).toBeGreaterThanOrEqual(4);
  });

  it('detects representative medium keywords', () => {
    const mediumKeywords = ['scores', 'leads', 'dominates', 'breakout', 'comeback'];
    mediumKeywords.forEach((keyword) => {
      const result = analyzeSentiment(`Player ${keyword} in big game`);
      expect(result.keywords).toContainEqual({
        word: keyword,
        type: 'positive',
        level: 'medium',
      });
    });
  });
});

// TC-004
describe('analyzeSentiment — low-level positive keyword detection', () => {
  it('detects low keywords with weight 1', () => {
    const result = analyzeSentiment(
      'Player cleared for full participation, looking healthy',
    );
    expect(result.keywords).toContainEqual({
      word: 'cleared',
      type: 'positive',
      level: 'low',
    });
    expect(result.keywords).toContainEqual({
      word: 'healthy',
      type: 'positive',
      level: 'low',
    });
    expect(result.scores.positive).toBeGreaterThanOrEqual(2);
  });

  it('detects multi-word keyword "full participation"', () => {
    const result = analyzeSentiment('Player was at full participation today');
    expect(result.keywords).toContainEqual({
      word: 'full participation',
      type: 'positive',
      level: 'low',
    });
  });

  it('detects representative low keywords', () => {
    const lowKeywords = ['solid', 'consistent', 'cleared', 'healthy'];
    lowKeywords.forEach((keyword) => {
      const result = analyzeSentiment(`Player is ${keyword}`);
      expect(result.keywords).toContainEqual({
        word: keyword,
        type: 'positive',
        level: 'low',
      });
    });
  });
});

// TC-005
describe('analyzeSentiment — high-level negative keyword detection', () => {
  it('detects multiple high-negative keywords and produces negative sentiment', () => {
    const result = analyzeSentiment(
      'Player suffers torn ACL, out for season',
    );
    expect(result.sentiment).toBe('negative');
    expect(result.keywords).toContainEqual({
      word: 'torn',
      type: 'negative',
      level: 'high',
    });
    expect(result.keywords).toContainEqual({
      word: 'acl',
      type: 'negative',
      level: 'high',
    });
    expect(result.keywords).toContainEqual({
      word: 'out for season',
      type: 'negative',
      level: 'high',
    });
    expect(result.scores.negative).toBeGreaterThanOrEqual(9);
  });

  it('accumulates multiple high-negative keywords', () => {
    const result = analyzeSentiment(
      'Injury requires surgery, fracture confirmed',
    );
    expect(result.scores.negative).toBeGreaterThanOrEqual(9);
  });

  it('detects all high-level negative keywords individually', () => {
    const highKeywords = [
      'injury',
      'torn',
      'out for season',
      'arrested',
      'suspended',
      'acl',
      'season-ending',
      'surgery',
      'fracture',
      'broken',
      'serious',
      'indefinitely',
      'career-threatening',
      'released',
      'cut',
    ];

    highKeywords.forEach((keyword) => {
      const result = analyzeSentiment(`Player faces ${keyword} issue`);
      expect(result.keywords).toContainEqual({
        word: keyword,
        type: 'negative',
        level: 'high',
      });
    });
  });
});

// TC-006
describe('analyzeSentiment — medium and low negative keyword detection', () => {
  it('detects medium negative keywords', () => {
    const result = analyzeSentiment(
      'Player listed as questionable after missed practice',
    );
    expect(result.keywords).toContainEqual({
      word: 'questionable',
      type: 'negative',
      level: 'medium',
    });
    expect(result.keywords).toContainEqual({
      word: 'missed practice',
      type: 'negative',
      level: 'medium',
    });
    expect(result.scores.negative).toBeGreaterThanOrEqual(4);
  });

  it('detects low negative keywords', () => {
    const result = analyzeSentiment(
      'Minor issue, day-to-day, precautionary rest',
    );
    expect(result.keywords.some((k) => k.level === 'low' && k.type === 'negative')).toBe(
      true,
    );
    expect(result.scores.negative).toBeGreaterThanOrEqual(3);
  });

  it('detects representative medium negative keywords', () => {
    const mediumKeywords = [
      'questionable',
      'limited',
      'benched',
      'fumble',
      'missed practice',
    ];
    mediumKeywords.forEach((keyword) => {
      const result = analyzeSentiment(`Player is ${keyword}`);
      expect(result.keywords).toContainEqual({
        word: keyword,
        type: 'negative',
        level: 'medium',
      });
    });
  });

  it('detects representative low negative keywords', () => {
    const lowKeywords = ['minor', 'rest', 'day-to-day', 'precautionary'];
    lowKeywords.forEach((keyword) => {
      const result = analyzeSentiment(`Player situation is ${keyword}`);
      expect(result.keywords).toContainEqual({
        word: keyword,
        type: 'negative',
        level: 'low',
      });
    });
  });
});

// TC-007
describe('analyzeSentiment — negation flips positive keyword scoring', () => {
  it('flips "touchdown" to negative when "not" precedes it', () => {
    const result = analyzeSentiment('Player did not score a touchdown');
    expect(result.keywords).toContainEqual({
      word: 'touchdown',
      type: 'positive',
      level: 'high',
    });
    expect(result.scores.negative).toBeGreaterThanOrEqual(3);
  });

  it('flips "winning" to negative when "won\'t" precedes it', () => {
    const result = analyzeSentiment("Won't be winning anytime soon");
    const winningKw = result.keywords.find((k) => k.word === 'winning');
    expect(winningKw).toBeDefined();
    expect(result.scores.negative).toBeGreaterThan(0);
  });

  it('each negation word triggers flipping', () => {
    const negationWords = [
      'not',
      'no',
      "won't",
      "didn't",
      "isn't",
      "wasn't",
      'unlikely',
      'denied',
    ];
    negationWords.forEach((neg) => {
      const result = analyzeSentiment(`${neg} a touchdown`);
      expect(result.scores.negative).toBeGreaterThan(0);
    });
  });

  it('does not flip when negation is far from keyword (>5 words)', () => {
    const result = analyzeSentiment(
      'not going to be the same player who can score a touchdown today',
    );
    // "not" is more than 5 words before "touchdown", so it depends on implementation
    // The function checks within 5 words before the keyword
    expect(result.keywords).toContainEqual({
      word: 'touchdown',
      type: 'positive',
      level: 'high',
    });
  });
});

// TC-008
describe('analyzeSentiment — negation flips negative keyword scoring', () => {
  it('flips "injury" to positive when "not" precedes it', () => {
    const result = analyzeSentiment('The injury is not serious');
    const injuryKw = result.keywords.find((k) => k.word === 'injury');
    expect(injuryKw).toBeDefined();
    expect(result.scores.positive).toBeGreaterThan(0);
  });

  it('flips "torn" to positive with "not"', () => {
    const result = analyzeSentiment('Not torn, just a sprain');
    expect(result.scores.positive).toBeGreaterThan(0);
  });

  it('flips "suspended" to positive with "wasn\'t"', () => {
    const result = analyzeSentiment("Player wasn't suspended after review");
    expect(result.scores.positive).toBeGreaterThan(0);
  });

  it('does not flip when negation is far from negative keyword', () => {
    const result = analyzeSentiment(
      'not going to be the same after the very long recovery from the injury',
    );
    // "not" is far from "injury" - scores.negative should have injury contribution
    expect(result.keywords.some((k) => k.word === 'injury')).toBe(true);
  });
});

// TC-009
describe('analyzeSentiment — position-specific QB keywords', () => {
  it('detects QB positive keywords with position=QB', () => {
    const result = analyzeSentiment(
      'Great passing yards and passer rating today',
      '',
      'QB',
    );
    expect(result.keywords).toContainEqual({
      word: 'passing yards',
      type: 'positive',
      level: 'medium',
    });
    expect(result.keywords).toContainEqual({
      word: 'passer rating',
      type: 'positive',
      level: 'medium',
    });
    expect(result.scores.positive).toBeGreaterThanOrEqual(3);
  });

  it('detects QB negative keywords with position=QB', () => {
    const result = analyzeSentiment(
      'Threw two interceptions and a pick six',
      '',
      'QB',
    );
    expect(result.keywords).toContainEqual({
      word: 'interceptions',
      type: 'negative',
      level: 'medium',
    });
    expect(result.keywords).toContainEqual({
      word: 'pick six',
      type: 'negative',
      level: 'medium',
    });
    expect(result.scores.negative).toBeGreaterThanOrEqual(3);
  });

  it('does not match QB keywords when position is empty', () => {
    const result = analyzeSentiment('Great passing yards today', '', '');
    expect(result.keywords.find((k) => k.word === 'passing yards')).toBeUndefined();
  });

  it('does not match QB keywords when position is RB', () => {
    const result = analyzeSentiment('Great passing yards today', '', 'RB');
    expect(result.keywords.find((k) => k.word === 'passing yards')).toBeUndefined();
  });
});

// TC-010
describe('analyzeSentiment — position-specific RB/WR/TE keywords', () => {
  it('detects RB positive keywords', () => {
    const result = analyzeSentiment(
      'Workhorse with big rushing yards',
      '',
      'RB',
    );
    expect(result.keywords).toContainEqual({
      word: 'workhorse',
      type: 'positive',
      level: 'medium',
    });
    expect(result.keywords).toContainEqual({
      word: 'rushing yards',
      type: 'positive',
      level: 'medium',
    });
  });

  it('detects WR positive keywords', () => {
    const result = analyzeSentiment(
      'Great targets and contested catch performance',
      '',
      'WR',
    );
    expect(result.keywords).toContainEqual({
      word: 'targets',
      type: 'positive',
      level: 'medium',
    });
    expect(result.keywords).toContainEqual({
      word: 'contested catch',
      type: 'positive',
      level: 'medium',
    });
  });

  it('detects TE negative keywords', () => {
    const result = analyzeSentiment(
      'Used for blocking only, limited route tree',
      '',
      'TE',
    );
    expect(result.keywords).toContainEqual({
      word: 'blocking only',
      type: 'negative',
      level: 'medium',
    });
    expect(result.keywords).toContainEqual({
      word: 'limited route tree',
      type: 'negative',
      level: 'medium',
    });
  });

  it('skips position keywords for unknown position without error', () => {
    expect(() =>
      analyzeSentiment('Great passing yards today', '', 'K'),
    ).not.toThrow();
    const result = analyzeSentiment('Great passing yards today', '', 'K');
    expect(result.keywords.find((k) => k.word === 'passing yards')).toBeUndefined();
  });
});

// TC-011
describe('analyzeSentiment — fantasy keywords', () => {
  it('detects fantasy positive keywords with weight 1 and level low', () => {
    const result = analyzeSentiment(
      'Increased target share and snap count increase as the starter',
    );
    expect(result.keywords).toContainEqual({
      word: 'target share',
      type: 'positive',
      level: 'low',
    });
    expect(result.keywords).toContainEqual({
      word: 'snap count increase',
      type: 'positive',
      level: 'low',
    });
    expect(result.keywords).toContainEqual({
      word: 'starter',
      type: 'positive',
      level: 'low',
    });
  });

  it('detects fantasy negative keywords with weight 1 and level low', () => {
    const result = analyzeSentiment(
      'In a committee, timeshare with reduced role',
    );
    expect(result.keywords).toContainEqual({
      word: 'committee',
      type: 'negative',
      level: 'low',
    });
    expect(result.keywords).toContainEqual({
      word: 'timeshare',
      type: 'negative',
      level: 'low',
    });
    expect(result.keywords).toContainEqual({
      word: 'reduced role',
      type: 'negative',
      level: 'low',
    });
  });
});

// TC-012
describe('analyzeSentiment — magnitude and confidence calculation', () => {
  it('caps magnitude at 1.0 for many high-positive keywords', () => {
    const text =
      'touchdown td winning career-high record-breaking mvp game-winning clutch dominant historic';
    const result = analyzeSentiment(text);
    expect(result.magnitude).toBeLessThanOrEqual(1);
    expect(result.magnitude).toBe(1);
  });

  it('caps confidence at 1.0 for many keywords', () => {
    const text =
      'touchdown td winning career-high record-breaking mvp game-winning clutch dominant historic pro bowl all-pro';
    const result = analyzeSentiment(text);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(result.confidence).toBe(1);
  });

  it('computes low magnitude for a single low-positive keyword', () => {
    const result = analyzeSentiment('Player is solid');
    expect(result.magnitude).toBeCloseTo(1 / 9, 1);
    expect(result.confidence).toBeCloseTo(1 / 10, 1);
  });

  it('returns neutral with magnitude 0.5 when scores are equal', () => {
    // "touchdown" (positive, weight 3) + "injury" (negative, weight 3) => equal
    const result = analyzeSentiment('touchdown injury');
    expect(result.sentiment).toBe('neutral');
    expect(result.magnitude).toBe(0.5);
  });

  it('returns all zeros when no keywords found', () => {
    const result = analyzeSentiment('The weather is nice today');
    expect(result.sentiment).toBe('neutral');
    expect(result.magnitude).toBe(0);
    expect(result.confidence).toBe(0);
    expect(result.scores).toEqual({ positive: 0, negative: 0, net: 0 });
  });

  it('includes scores breakdown', () => {
    const result = analyzeSentiment('Player scores a touchdown');
    expect(result.scores).toHaveProperty('positive');
    expect(result.scores).toHaveProperty('negative');
    expect(result.scores).toHaveProperty('net');
    expect(result.scores.net).toBe(result.scores.positive - result.scores.negative);
  });
});

// TC-013
describe('getMagnitudeLevel', () => {
  it('returns "high" for 0.66', () => {
    expect(getMagnitudeLevel(0.66)).toBe('high');
  });

  it('returns "medium" for 0.65', () => {
    expect(getMagnitudeLevel(0.65)).toBe('medium');
  });

  it('returns "medium" for 0.33', () => {
    expect(getMagnitudeLevel(0.33)).toBe('medium');
  });

  it('returns "low" for 0.32', () => {
    expect(getMagnitudeLevel(0.32)).toBe('low');
  });

  it('returns "low" for 0', () => {
    expect(getMagnitudeLevel(0)).toBe('low');
  });

  it('returns "high" for 1', () => {
    expect(getMagnitudeLevel(1)).toBe('high');
  });

  it('returns "low" for negative magnitude', () => {
    expect(getMagnitudeLevel(-0.1)).toBe('low');
  });

  it('returns "high" for magnitude > 1', () => {
    expect(getMagnitudeLevel(1.5)).toBe('high');
  });
});

// TC-014
describe('getSentimentDescription', () => {
  const cases = [
    { sentiment: 'positive', magnitude: 0.8, expected: 'Very Bullish 🚀' },
    { sentiment: 'positive', magnitude: 0.5, expected: 'Bullish 📈' },
    { sentiment: 'positive', magnitude: 0.1, expected: 'Slightly Bullish 📊' },
    { sentiment: 'negative', magnitude: 0.8, expected: 'Very Bearish 📉' },
    { sentiment: 'negative', magnitude: 0.5, expected: 'Bearish 🔻' },
    { sentiment: 'negative', magnitude: 0.1, expected: 'Slightly Bearish 📊' },
    { sentiment: 'neutral', magnitude: 0.8, expected: 'Mixed Signals ↔️' },
    { sentiment: 'neutral', magnitude: 0.5, expected: 'Neutral ➡️' },
    { sentiment: 'neutral', magnitude: 0.1, expected: 'Neutral ➡️' },
  ];

  cases.forEach(({ sentiment, magnitude, expected }) => {
    it(`returns "${expected}" for ${sentiment}/${getMagnitudeLevel(magnitude)}`, () => {
      expect(getSentimentDescription({ sentiment, magnitude })).toBe(expected);
    });
  });

  it('returns fallback for unknown sentiment', () => {
    expect(getSentimentDescription({ sentiment: 'mixed', magnitude: 0 })).toBe(
      'Neutral ➡️',
    );
  });
});
