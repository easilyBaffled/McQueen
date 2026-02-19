/**
 * Sentiment Analysis Engine for NFL News
 * Uses keyword-based rules to determine if news is bullish or bearish for a player's price
 */

// Positive keywords categorized by impact magnitude
const POSITIVE_KEYWORDS = {
  high: [
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
  ],
  medium: [
    'scores',
    'leads',
    'dominates',
    'surges',
    'breakout',
    'explosive',
    'outstanding',
    'impressive',
    'excellent',
    'strong',
    'big game',
    'key play',
    'crucial',
    'rallies',
    'comeback',
    'hot streak',
  ],
  low: [
    'solid',
    'consistent',
    'returns',
    'practice',
    'cleared',
    'healthy',
    'ready',
    'full participation',
    'no limitations',
    'good shape',
    'confident',
    'optimistic',
    'progress',
    'improving',
  ],
};

// Negative keywords categorized by impact magnitude
const NEGATIVE_KEYWORDS = {
  high: [
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
  ],
  medium: [
    'questionable',
    'limited',
    'struggling',
    'benched',
    'interception',
    'fumble',
    'turnover',
    'sacked',
    'ineffective',
    'concerning',
    'doubtful',
    'setback',
    'aggravated',
    'flare-up',
    'missed practice',
  ],
  low: [
    'minor',
    'rest',
    'maintenance',
    'dnp',
    'veteran day off',
    'precautionary',
    'day-to-day',
    'slight',
    'manageable',
    'load management',
    'not serious',
  ],
};

// Special context keywords that modify sentiment
const CONTEXT_MODIFIERS = {
  negation: [
    'not',
    'no',
    "won't",
    "didn't",
    "isn't",
    "wasn't",
    'unlikely',
    'denied',
  ],
  intensifiers: ['very', 'extremely', 'incredibly', 'absolutely', 'completely'],
  diminishers: ['slightly', 'somewhat', 'possibly', 'might', 'could'],
};

// Position-specific keywords (some news matters more for certain positions)
const POSITION_KEYWORDS = {
  QB: {
    positive: [
      'passing yards',
      'completions',
      'passer rating',
      'qbr',
      'clean pocket',
    ],
    negative: ['interceptions', 'sacks taken', 'fumbles', 'pick six'],
  },
  RB: {
    positive: ['rushing yards', 'carries', 'goal line', 'workhorse', 'bellcow'],
    negative: ['fumbles', 'pass blocking', 'limited touches'],
  },
  WR: {
    positive: [
      'targets',
      'receptions',
      'receiving yards',
      'separation',
      'contested catch',
    ],
    negative: ['drops', 'limited targets', 'decoy'],
  },
  TE: {
    positive: ['red zone targets', 'seam route', 'blocking and receiving'],
    negative: ['blocking only', 'limited route tree'],
  },
};

// Fantasy-relevant keywords
const FANTASY_KEYWORDS = {
  positive: [
    'target share',
    'snap count increase',
    'red zone',
    'usage',
    'workload',
    'featured',
    'starter',
    'wr1',
    'rb1',
    'every down back',
    'alpha',
  ],
  negative: [
    'committee',
    'timeshare',
    'reduced role',
    'backup',
    'spelled',
    'pitch count',
    'limited snaps',
    'third down only',
  ],
};

/**
 * Analyzes a headline/text for sentiment
 * @param {string} text - The news headline or article text
 * @param {string} playerName - The player's name to check context
 * @param {string} position - Player's position (QB, RB, WR, TE, etc.)
 * @returns {{ sentiment: 'positive'|'negative'|'neutral', magnitude: number, confidence: number, keywords: string[] }}
 */
export function analyzeSentiment(text, playerName = '', position = '') {
  if (!text) {
    return { sentiment: 'neutral', magnitude: 0, confidence: 0, keywords: [] };
  }

  const lowerText = text.toLowerCase();
  const foundKeywords = [];
  let positiveScore = 0;
  let negativeScore = 0;

  // Check for negation in the text
  const hasNegation = CONTEXT_MODIFIERS.negation.some((word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerText);
  });

  // Score positive keywords
  Object.entries(POSITIVE_KEYWORDS).forEach(([level, keywords]) => {
    const weight = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
    keywords.forEach((keyword) => {
      if (lowerText.includes(keyword.toLowerCase())) {
        foundKeywords.push({ word: keyword, type: 'positive', level });
        // If negation is present near the keyword, flip the score
        if (hasNegation && isNegationNearKeyword(lowerText, keyword)) {
          negativeScore += weight;
        } else {
          positiveScore += weight;
        }
      }
    });
  });

  // Score negative keywords
  Object.entries(NEGATIVE_KEYWORDS).forEach(([level, keywords]) => {
    const weight = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
    keywords.forEach((keyword) => {
      if (lowerText.includes(keyword.toLowerCase())) {
        foundKeywords.push({ word: keyword, type: 'negative', level });
        // If negation is present near the keyword, flip the score
        if (hasNegation && isNegationNearKeyword(lowerText, keyword)) {
          positiveScore += weight;
        } else {
          negativeScore += weight;
        }
      }
    });
  });

  // Check position-specific keywords
  if (position && POSITION_KEYWORDS[position]) {
    POSITION_KEYWORDS[position].positive.forEach((keyword) => {
      if (lowerText.includes(keyword.toLowerCase())) {
        foundKeywords.push({
          word: keyword,
          type: 'positive',
          level: 'medium',
        });
        positiveScore += 1.5;
      }
    });
    POSITION_KEYWORDS[position].negative.forEach((keyword) => {
      if (lowerText.includes(keyword.toLowerCase())) {
        foundKeywords.push({
          word: keyword,
          type: 'negative',
          level: 'medium',
        });
        negativeScore += 1.5;
      }
    });
  }

  // Check fantasy-relevant keywords
  FANTASY_KEYWORDS.positive.forEach((keyword) => {
    if (lowerText.includes(keyword.toLowerCase())) {
      foundKeywords.push({ word: keyword, type: 'positive', level: 'low' });
      positiveScore += 1;
    }
  });
  FANTASY_KEYWORDS.negative.forEach((keyword) => {
    if (lowerText.includes(keyword.toLowerCase())) {
      foundKeywords.push({ word: keyword, type: 'negative', level: 'low' });
      negativeScore += 1;
    }
  });

  // Calculate final sentiment
  const totalScore = positiveScore + negativeScore;
  const netScore = positiveScore - negativeScore;

  let sentiment = 'neutral';
  let magnitude = 0;
  let confidence = 0;

  if (totalScore > 0) {
    confidence = Math.min(totalScore / 10, 1); // Max confidence at 10 keyword matches

    if (netScore > 0) {
      sentiment = 'positive';
      magnitude = Math.min(positiveScore / 9, 1); // Normalize to 0-1, max at 9 points
    } else if (netScore < 0) {
      sentiment = 'negative';
      magnitude = Math.min(negativeScore / 9, 1);
    } else {
      sentiment = 'neutral';
      magnitude = 0.5; // Mixed signals
    }
  }

  return {
    sentiment,
    magnitude,
    confidence,
    keywords: foundKeywords,
    scores: { positive: positiveScore, negative: negativeScore, net: netScore },
  };
}

/**
 * Check if a negation word appears near a keyword (within 5 words)
 */
function isNegationNearKeyword(text, keyword) {
  const words = text.split(/\s+/);
  const keywordIndex = words.findIndex((w) =>
    w.includes(keyword.toLowerCase().split(' ')[0]),
  );

  if (keywordIndex === -1) return false;

  // Check 5 words before the keyword
  const startIndex = Math.max(0, keywordIndex - 5);
  const contextWords = words.slice(startIndex, keywordIndex);

  return CONTEXT_MODIFIERS.negation.some((neg) =>
    contextWords.some((w) => w.toLowerCase().includes(neg)),
  );
}

/**
 * Get the sentiment level label based on magnitude
 * @param {number} magnitude - 0 to 1
 * @returns {'high'|'medium'|'low'}
 */
export function getMagnitudeLevel(magnitude) {
  if (magnitude >= 0.66) return 'high';
  if (magnitude >= 0.33) return 'medium';
  return 'low';
}

/**
 * Get a human-readable description of the sentiment
 * @param {{ sentiment: string, magnitude: number }} result
 * @returns {string}
 */
export function getSentimentDescription(result) {
  const { sentiment, magnitude } = result;
  const level = getMagnitudeLevel(magnitude);

  const descriptions = {
    positive: {
      high: 'Very Bullish 🚀',
      medium: 'Bullish 📈',
      low: 'Slightly Bullish 📊',
    },
    negative: {
      high: 'Very Bearish 📉',
      medium: 'Bearish 🔻',
      low: 'Slightly Bearish 📊',
    },
    neutral: {
      high: 'Mixed Signals ↔️',
      medium: 'Neutral ➡️',
      low: 'Neutral ➡️',
    },
  };

  return descriptions[sentiment]?.[level] || 'Neutral ➡️';
}

export default {
  analyzeSentiment,
  getMagnitudeLevel,
  getSentimentDescription,
  POSITIVE_KEYWORDS,
  NEGATIVE_KEYWORDS,
};
