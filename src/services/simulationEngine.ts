import type { Player, PriceReason } from '../types';
import type { TimelineEntry } from '../types/simulation';
import { TICK_INTERVAL_MS } from '../constants';

export type OnPriceUpdate = (
  playerId: string,
  price: number,
  reason: PriceReason | null,
) => void;

export interface SimulationEngine {
  start(): void;
  stop(): void;
  tick(): void | Promise<void>;
  getPrice(playerId: string): number;
}

export function buildUnifiedTimeline(players: Player[]): TimelineEntry[] {
  const timeline: TimelineEntry[] = [];

  players.forEach((player) => {
    if (player.priceHistory) {
      player.priceHistory.forEach((entry, index) => {
        timeline.push({
          playerId: player.id,
          playerName: player.name,
          entryIndex: index,
          timestamp: entry.timestamp,
          price: entry.price,
          reason: entry.reason,
          content: entry.content,
        });
      });
    }
  });

  timeline.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  return timeline;
}

export interface TimelineEngineOptions {
  timeline: TimelineEntry[];
  onPriceUpdate: OnPriceUpdate;
  tickIntervalMs?: number;
}

export class TimelineSimulationEngine implements SimulationEngine {
  private timeline: TimelineEntry[];
  private currentIndex: number;
  private intervalId: ReturnType<typeof setInterval> | null;
  private onPriceUpdateCb: OnPriceUpdate;
  private tickIntervalMs: number;
  private prices: Record<string, number>;

  constructor(options: TimelineEngineOptions) {
    if (typeof options.onPriceUpdate !== 'function') {
      throw new Error('onPriceUpdate must be a function');
    }
    this.timeline = options.timeline;
    this.onPriceUpdateCb = options.onPriceUpdate;
    this.tickIntervalMs = options.tickIntervalMs ?? TICK_INTERVAL_MS;
    this.currentIndex = 0;
    this.intervalId = null;
    this.prices = {};

    if (this.timeline.length > 0) {
      this.prices[this.timeline[0].playerId] = this.timeline[0].price;
    }
  }

  start(): void {
    if (this.intervalId !== null) return;
    this.intervalId = setInterval(() => this.tick(), this.tickIntervalMs);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  tick(): void {
    this.currentIndex++;
    if (this.currentIndex >= this.timeline.length) {
      this.stop();
      return;
    }

    const entry = this.timeline[this.currentIndex];
    this.prices[entry.playerId] = entry.price;
    this.onPriceUpdateCb(entry.playerId, entry.price, entry.reason);
  }

  getPrice(playerId: string): number {
    return this.prices[playerId] ?? 0;
  }
}

export interface EspnArticle {
  id: string;
  headline: string;
  description: string;
  published?: string;
  source?: string;
  url?: string;
  [key: string]: unknown;
}

export interface SentimentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  magnitude: number;
  confidence: number;
}

export interface PriceCalculation {
  newPrice: number;
  changePercent: number;
}

export interface EspnEngineOptions {
  players: Player[];
  onPriceUpdate: OnPriceUpdate;
  fetchNews?: (limit?: number) => Promise<EspnArticle[]>;
  analyzeSentiment?: (
    text: string,
    playerName?: string,
    position?: string,
  ) => SentimentAnalysis;
  calculateNewPrice?: (
    currentPrice: number,
    sentimentResult: SentimentAnalysis,
  ) => PriceCalculation;
  newsLimit?: number;
  refreshIntervalMs?: number;
}

export class EspnSimulationEngine implements SimulationEngine {
  private players: Player[];
  private onPriceUpdateCb: OnPriceUpdate;
  private fetchNewsFn: (limit?: number) => Promise<EspnArticle[]>;
  private analyzeSentimentFn: (
    text: string,
    playerName?: string,
    position?: string,
  ) => SentimentAnalysis;
  private calculateNewPriceFn: (
    currentPrice: number,
    sentimentResult: SentimentAnalysis,
  ) => PriceCalculation;
  private newsLimit: number;
  private refreshIntervalMs: number;
  private processedArticleIds: Set<string>;
  private prices: Record<string, number>;
  private intervalId: ReturnType<typeof setInterval> | null;

  constructor(options: EspnEngineOptions) {
    if (typeof options.onPriceUpdate !== 'function') {
      throw new Error('onPriceUpdate must be a function');
    }
    this.players = options.players;
    this.onPriceUpdateCb = options.onPriceUpdate;
    this.fetchNewsFn = options.fetchNews ?? (() => Promise.resolve([]));
    this.analyzeSentimentFn =
      options.analyzeSentiment ??
      (() => ({
        sentiment: 'neutral' as const,
        magnitude: 0,
        confidence: 0,
      }));
    this.calculateNewPriceFn =
      options.calculateNewPrice ??
      ((p: number) => ({ newPrice: p, changePercent: 0 }));
    this.newsLimit = options.newsLimit ?? 30;
    this.refreshIntervalMs = options.refreshIntervalMs ?? 60000;
    this.processedArticleIds = new Set();
    this.prices = {};
    this.intervalId = null;

    this.players.forEach((p) => {
      this.prices[p.id] = p.basePrice;
    });
  }

  start(): void {
    if (this.intervalId !== null) return;
    this.tick();
    this.intervalId = setInterval(() => this.tick(), this.refreshIntervalMs);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async tick(): Promise<void> {
    let articles: EspnArticle[];
    try {
      articles = await this.fetchNewsFn(this.newsLimit);
    } catch {
      return;
    }

    for (const article of articles) {
      if (!article.id || this.processedArticleIds.has(article.id)) continue;

      for (const player of this.players) {
        const searchTerms = player.searchTerms || [player.name];
        const articleText =
          `${article.headline} ${article.description}`.toLowerCase();
        const isRelevant = searchTerms.some((term) =>
          articleText.includes(term.toLowerCase()),
        );

        if (isRelevant) {
          const sentimentResult = this.analyzeSentimentFn(
            `${article.headline} ${article.description}`,
            player.name,
            player.position,
          );

          const currentPrice = this.prices[player.id] ?? player.basePrice;
          const { newPrice } = this.calculateNewPriceFn(
            currentPrice,
            sentimentResult,
          );

          this.prices[player.id] = newPrice;
          this.onPriceUpdateCb(player.id, newPrice, {
            type: 'news',
            headline: article.headline,
            source: (article.source as string) || 'ESPN NFL',
            url: article.url,
            sentiment: sentimentResult.sentiment,
            magnitude: sentimentResult.magnitude,
          });
        }
      }

      this.processedArticleIds.add(article.id);
    }
  }

  getPrice(playerId: string): number {
    return this.prices[playerId] ?? 0;
  }
}
