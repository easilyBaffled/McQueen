import type { PriceReason, ContentItem } from './scenario';

export interface TimelineEntry {
  playerId: string;
  playerName: string;
  entryIndex: number;
  timestamp: string;
  price: number;
  reason: PriceReason;
  content?: ContentItem[];
}

export interface HistoryEntry {
  tick: number;
  prices: Record<string, number>;
  action: string;
  playerId?: string;
  playerName?: string;
  sentiment?: string;
  changePercent?: number;
}
