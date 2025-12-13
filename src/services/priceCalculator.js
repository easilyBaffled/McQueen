/**
 * Price Calculator Service
 * Converts sentiment analysis results into price impacts for the McQueen market
 */

import { getMagnitudeLevel } from './sentimentEngine';

// Price impact ranges for moderate volatility (1-5%)
const PRICE_IMPACT_RANGES = {
  positive: {
    high: { min: 0.03, max: 0.05 },    // +3% to +5%
    medium: { min: 0.015, max: 0.03 }, // +1.5% to +3%
    low: { min: 0.005, max: 0.015 }    // +0.5% to +1.5%
  },
  negative: {
    high: { min: -0.05, max: -0.03 },   // -5% to -3%
    medium: { min: -0.03, max: -0.015 }, // -3% to -1.5%
    low: { min: -0.015, max: -0.005 }    // -1.5% to -0.5%
  },
  neutral: {
    high: { min: -0.005, max: 0.005 },  // -0.5% to +0.5%
    medium: { min: -0.005, max: 0.005 },
    low: { min: -0.003, max: 0.003 }
  }
};

// Confidence multiplier - lower confidence = smaller impact
const CONFIDENCE_WEIGHT = 0.7; // 70% of impact comes from base, 30% from confidence

/**
 * Calculate price impact from sentiment analysis result
 * @param {{ sentiment: string, magnitude: number, confidence: number }} sentimentResult
 * @returns {{ impactPercent: number, impactMultiplier: number, description: string }}
 */
export function calculatePriceImpact(sentimentResult) {
  const { sentiment, magnitude, confidence = 0.5 } = sentimentResult;
  const level = getMagnitudeLevel(magnitude);
  
  const range = PRICE_IMPACT_RANGES[sentiment]?.[level] || PRICE_IMPACT_RANGES.neutral.low;
  
  // Random value within the range
  const baseImpact = randomInRange(range.min, range.max);
  
  // Apply confidence weighting - higher confidence = closer to full impact
  const confidenceMultiplier = CONFIDENCE_WEIGHT + (1 - CONFIDENCE_WEIGHT) * confidence;
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
      confidenceMultiplier
    }
  };
}

/**
 * Apply price impact to a current price
 * @param {number} currentPrice - Current player price
 * @param {{ impactMultiplier: number }} impact - Impact result from calculatePriceImpact
 * @returns {number} New price
 */
export function applyPriceImpact(currentPrice, impact) {
  const newPrice = currentPrice * impact.impactMultiplier;
  return +newPrice.toFixed(2);
}

/**
 * Calculate new price from sentiment result in one step
 * @param {number} currentPrice - Current player price
 * @param {{ sentiment: string, magnitude: number, confidence: number }} sentimentResult
 * @returns {{ newPrice: number, impact: object }}
 */
export function calculateNewPrice(currentPrice, sentimentResult) {
  const impact = calculatePriceImpact(sentimentResult);
  const newPrice = applyPriceImpact(currentPrice, impact);
  
  return {
    newPrice,
    previousPrice: currentPrice,
    change: +(newPrice - currentPrice).toFixed(2),
    changePercent: impact.impactPercent,
    impact
  };
}

/**
 * Process multiple news items and calculate cumulative impact
 * @param {number} currentPrice - Current player price
 * @param {Array<{ sentiment: string, magnitude: number, confidence: number }>} sentimentResults
 * @param {Object} options - Options for cumulative calculation
 * @returns {{ newPrice: number, totalImpact: number, impacts: Array }}
 */
export function calculateCumulativeImpact(currentPrice, sentimentResults, options = {}) {
  const {
    maxTotalImpact = 0.10, // Cap at 10% total movement
    decayFactor = 0.7      // Each subsequent article has 70% the impact of the previous
  } = options;

  let runningPrice = currentPrice;
  let totalImpactPercent = 0;
  const impacts = [];

  // Sort by confidence (most confident first) if desired
  const sortedResults = [...sentimentResults].sort((a, b) => 
    (b.confidence || 0.5) - (a.confidence || 0.5)
  );

  sortedResults.forEach((result, index) => {
    const decay = Math.pow(decayFactor, index);
    const impact = calculatePriceImpact(result);
    
    // Apply decay to the impact
    const decayedImpact = {
      ...impact,
      impactPercent: impact.impactPercent * decay,
      impactMultiplier: 1 + (impact.impactMultiplier - 1) * decay
    };

    // Check if we've hit the cap
    if (Math.abs(totalImpactPercent + decayedImpact.impactPercent) > maxTotalImpact * 100) {
      return; // Skip this impact
    }

    runningPrice = applyPriceImpact(runningPrice, decayedImpact);
    totalImpactPercent += decayedImpact.impactPercent;
    
    impacts.push({
      ...decayedImpact,
      decay,
      runningPrice
    });
  });

  return {
    newPrice: runningPrice,
    previousPrice: currentPrice,
    change: +(runningPrice - currentPrice).toFixed(2),
    totalImpactPercent: +totalImpactPercent.toFixed(2),
    impacts
  };
}

/**
 * Generate a random number within a range
 */
function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Get human-readable description of price impact
 */
function getImpactDescription(impact) {
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

/**
 * Create a price history entry from news and sentiment
 * @param {Object} article - News article
 * @param {Object} sentimentResult - Sentiment analysis result
 * @param {number} newPrice - Calculated new price
 * @returns {Object} Price history entry compatible with McQueen data structure
 */
export function createPriceHistoryEntry(article, sentimentResult, newPrice) {
  return {
    timestamp: article.published || new Date().toISOString(),
    price: newPrice,
    reason: {
      type: 'news',
      headline: article.headline,
      source: article.source || 'ESPN NFL',
      url: article.url,
      sentiment: sentimentResult.sentiment,
      magnitude: sentimentResult.magnitude
    },
    content: article.url && article.url !== '#' ? [
      {
        type: 'article',
        title: article.headline,
        source: article.source || 'ESPN NFL',
        url: article.url
      }
    ] : []
  };
}

export default {
  calculatePriceImpact,
  applyPriceImpact,
  calculateNewPrice,
  calculateCumulativeImpact,
  createPriceHistoryEntry,
  PRICE_IMPACT_RANGES
};

