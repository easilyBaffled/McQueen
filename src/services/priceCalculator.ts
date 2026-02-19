import { getMagnitudeLevel } from './sentimentEngine';

interface SentimentInput {
  sentiment: string;
  magnitude: number;
  confidence?: number;
}

const PRICE_IMPACT_RANGES: Record<
  string,
  Record<string, { min: number; max: number }>
> = {
  positive: {
    high: { min: 0.03, max: 0.05 },
    medium: { min: 0.015, max: 0.03 },
    low: { min: 0.005, max: 0.015 },
  },
  negative: {
    high: { min: -0.05, max: -0.03 },
    medium: { min: -0.03, max: -0.015 },
    low: { min: -0.015, max: -0.005 },
  },
  neutral: {
    high: { min: -0.005, max: 0.005 },
    medium: { min: -0.005, max: 0.005 },
    low: { min: -0.003, max: 0.003 },
  },
};

const CONFIDENCE_WEIGHT = 0.7;

export function calculatePriceImpact(sentimentResult: SentimentInput) {
  const { sentiment, magnitude, confidence = 0.5 } = sentimentResult;
  const level = getMagnitudeLevel(magnitude);

  const range =
    PRICE_IMPACT_RANGES[sentiment]?.[level] || PRICE_IMPACT_RANGES.neutral.low;

  const baseImpact = randomInRange(range.min, range.max);

  const confidenceMultiplier =
    CONFIDENCE_WEIGHT + (1 - CONFIDENCE_WEIGHT) * confidence;
  const finalImpact = baseImpact * confidenceMultiplier;

  return {
    impactPercent: +(finalImpact * 100).toFixed(2),
    impactMultiplier: 1 + finalImpact,
    description: getImpactDescription(finalImpact),
    details: {
      sentiment,
      level,
      baseImpact,
      confidence,
      confidenceMultiplier,
    },
  };
}

export function applyPriceImpact(
  currentPrice: number,
  impact: { impactMultiplier: number },
): number {
  const newPrice = currentPrice * impact.impactMultiplier;
  return +newPrice.toFixed(2);
}

export function calculateNewPrice(
  currentPrice: number,
  sentimentResult: SentimentInput,
) {
  const impact = calculatePriceImpact(sentimentResult);
  const newPrice = applyPriceImpact(currentPrice, impact);

  return {
    newPrice,
    previousPrice: currentPrice,
    change: +(newPrice - currentPrice).toFixed(2),
    changePercent: impact.impactPercent,
    impact,
  };
}

export function calculateCumulativeImpact(
  currentPrice: number,
  sentimentResults: SentimentInput[],
  options: { maxTotalImpact?: number; decayFactor?: number } = {},
) {
  const { maxTotalImpact = 0.1, decayFactor = 0.7 } = options;

  let runningPrice = currentPrice;
  let totalImpactPercent = 0;
  const impacts: Array<Record<string, unknown>> = [];

  const sortedResults = [...sentimentResults].sort(
    (a, b) => (b.confidence || 0.5) - (a.confidence || 0.5),
  );

  sortedResults.forEach((result, index) => {
    const decay = Math.pow(decayFactor, index);
    const impact = calculatePriceImpact(result);

    const decayedImpact = {
      ...impact,
      impactPercent: impact.impactPercent * decay,
      impactMultiplier: 1 + (impact.impactMultiplier - 1) * decay,
    };

    if (
      Math.abs(totalImpactPercent + decayedImpact.impactPercent) >
      maxTotalImpact * 100
    ) {
      return;
    }

    runningPrice = applyPriceImpact(runningPrice, decayedImpact);
    totalImpactPercent += decayedImpact.impactPercent;

    impacts.push({
      ...decayedImpact,
      decay,
      runningPrice,
    });
  });

  return {
    newPrice: runningPrice,
    previousPrice: currentPrice,
    change: +(runningPrice - currentPrice).toFixed(2),
    totalImpactPercent: +totalImpactPercent.toFixed(2),
    impacts,
  };
}

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function getImpactDescription(impact: number): string {
  const percent = Math.abs(impact * 100);

  if (impact > 0) {
    if (percent >= 3) return 'Strong Rally';
    if (percent >= 1.5) return 'Moderate Gain';
    return 'Slight Uptick';
  } else if (impact < 0) {
    if (percent >= 3) return 'Sharp Decline';
    if (percent >= 1.5) return 'Moderate Drop';
    return 'Slight Dip';
  }

  return 'Holding Steady';
}

export function createPriceHistoryEntry(
  article: {
    headline?: string;
    published?: string;
    source?: string;
    url?: string;
  },
  sentimentResult: { sentiment: string; magnitude: number },
  newPrice: number,
) {
  return {
    timestamp: article.published || new Date().toISOString(),
    price: newPrice,
    reason: {
      type: 'news' as const,
      headline: article.headline,
      source: article.source || 'ESPN NFL',
      url: article.url,
      sentiment: sentimentResult.sentiment,
      magnitude: sentimentResult.magnitude,
    },
    content:
      article.url && article.url !== '#'
        ? [
            {
              type: 'article',
              title: article.headline,
              source: article.source || 'ESPN NFL',
              url: article.url,
            },
          ]
        : [],
  };
}

export default {
  calculatePriceImpact,
  applyPriceImpact,
  calculateNewPrice,
  calculateCumulativeImpact,
  createPriceHistoryEntry,
  PRICE_IMPACT_RANGES,
};
