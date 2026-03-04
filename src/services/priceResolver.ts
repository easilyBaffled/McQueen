import type { Player, ContentItem } from '../types';
import { MIN_PRICE } from './priceCalculator';

export function getCurrentPriceFromHistory(
  player: Player | null | undefined,
): number {
  if (!player) return 0;
  const history = player.priceHistory;
  if (history && history.length > 0) {
    return history[history.length - 1].price;
  }
  return player.basePrice;
}

export function getChangePercentFromHistory(
  player: Player | null | undefined,
): number {
  if (!player) return 0;
  const currentPrice = getCurrentPriceFromHistory(player);
  const basePrice = player.basePrice;
  if (basePrice === 0) return 0;
  return ((currentPrice - basePrice) / basePrice) * 100;
}

export function getMoveReasonFromHistory(
  player: Player | null | undefined,
): string {
  if (!player) return '';
  const history = player.priceHistory;
  if (history && history.length > 0) {
    const lastEntry = history[history.length - 1];
    return lastEntry.reason?.headline || '';
  }
  return '';
}

export function getLatestContentFromHistory(
  player: Player | null | undefined,
): ContentItem[] {
  if (!player) return [];
  const history = player.priceHistory;
  if (history && history.length > 0) {
    const lastEntry = history[history.length - 1];
    return lastEntry.content || [];
  }
  return [];
}

export function getAllContentFromHistory(
  player: Player | null | undefined,
): ContentItem[] {
  if (!player || !player.priceHistory) return [];
  const allContent: ContentItem[] = [];
  player.priceHistory.forEach((entry) => {
    if (entry.content && entry.content.length > 0) {
      allContent.push(...entry.content);
    }
  });
  return allContent;
}

export function getEffectivePrice(
  playerId: string | null | undefined,
  priceOverrides: Record<string, number>,
  userImpact: Record<string, number>,
  players: Player[],
): number {
  if (!playerId) return 0;

  const player = players.find((p) => p.id === playerId);

  let basePrice: number;
  if (priceOverrides[playerId] !== undefined) {
    basePrice = priceOverrides[playerId];
  } else {
    basePrice = getCurrentPriceFromHistory(player);
  }

  const impact = userImpact[playerId] || 0;
  const result = +(basePrice * (1 + impact)).toFixed(2);
  if (result <= 0 && basePrice <= 0) return 0;
  return Math.max(MIN_PRICE, result);
}
