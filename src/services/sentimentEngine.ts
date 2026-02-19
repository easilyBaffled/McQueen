type KeywordLevel = 'high' | 'medium' | 'low';
type SentimentType = 'positive' | 'negative' | 'neutral';

interface KeywordMap {
  high: string[];
  medium: string[];
  low: string[];
}

const POSITIVE_KEYWORDS: KeywordMap = {
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

const NEGATIVE_KEYWORDS: KeywordMap = {
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

const POSITION_KEYWORDS: Record<
  string,
  { positive: string[]; negative: string[] }
> = {
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
    positive: [
      'rushing yards',
      'carries',
      'goal line',
      'workhorse',
      'bellcow',
    ],
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

interface FoundKeyword {
  word: string;
  type: string;
  level: string;
}

interface AnalyzeSentimentResult {
  sentiment: SentimentType;
  magnitude: number;
  confidence: number;
  keywords: FoundKeyword[];
  scores?: { positive: number; negative: number; net: number };
}

export function analyzeSentiment(
  text: string | null | undefined,
  playerName: string = '',
  position: string = '',
): AnalyzeSentimentResult {
  void playerName;
  if (!text) {
    return { sentiment: 'neutral', magnitude: 0, confidence: 0, keywords: [] };
  }

  const lowerText = text.toLowerCase();
  const foundKeywords: FoundKeyword[] = [];
  let positiveScore = 0;
  let negativeScore = 0;

  const hasNegation = CONTEXT_MODIFIERS.negation.some((word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerText);
  });

  (Object.entries(POSITIVE_KEYWORDS) as [KeywordLevel, string[]][]).forEach(
    ([level, keywords]) => {
      const weight = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
      keywords.forEach((keyword) => {
        if (lowerText.includes(keyword.toLowerCase())) {
          foundKeywords.push({ word: keyword, type: 'positive', level });
          if (hasNegation && isNegationNearKeyword(lowerText, keyword)) {
            negativeScore += weight;
          } else {
            positiveScore += weight;
          }
        }
      });
    },
  );

  (Object.entries(NEGATIVE_KEYWORDS) as [KeywordLevel, string[]][]).forEach(
    ([level, keywords]) => {
      const weight = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
      keywords.forEach((keyword) => {
        if (lowerText.includes(keyword.toLowerCase())) {
          foundKeywords.push({ word: keyword, type: 'negative', level });
          if (hasNegation && isNegationNearKeyword(lowerText, keyword)) {
            positiveScore += weight;
          } else {
            negativeScore += weight;
          }
        }
      });
    },
  );

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

  const totalScore = positiveScore + negativeScore;
  const netScore = positiveScore - negativeScore;

  let sentiment: SentimentType = 'neutral';
  let magnitude = 0;
  let confidence = 0;

  if (totalScore > 0) {
    confidence = Math.min(totalScore / 10, 1);

    if (netScore > 0) {
      sentiment = 'positive';
      magnitude = Math.min(positiveScore / 9, 1);
    } else if (netScore < 0) {
      sentiment = 'negative';
      magnitude = Math.min(negativeScore / 9, 1);
    } else {
      sentiment = 'neutral';
      magnitude = 0.5;
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

function isNegationNearKeyword(text: string, keyword: string): boolean {
  const words = text.split(/\s+/);
  const keywordIndex = words.findIndex((w) =>
    w.includes(keyword.toLowerCase().split(' ')[0]),
  );

  if (keywordIndex === -1) return false;

  const startIndex = Math.max(0, keywordIndex - 5);
  const contextWords = words.slice(startIndex, keywordIndex);

  return CONTEXT_MODIFIERS.negation.some((neg) =>
    contextWords.some((w) => w.toLowerCase().includes(neg)),
  );
}

export function getMagnitudeLevel(
  magnitude: number,
): 'high' | 'medium' | 'low' {
  if (magnitude >= 0.66) return 'high';
  if (magnitude >= 0.33) return 'medium';
  return 'low';
}

export function getSentimentDescription(result: {
  sentiment: string;
  magnitude: number;
}): string {
  const { sentiment, magnitude } = result;
  const level = getMagnitudeLevel(magnitude);

  const descriptions: Record<string, Record<string, string>> = {
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
