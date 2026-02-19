import type { ReactNode } from 'react';
import type { ContentItem, Player, ScenarioData, Portfolio, PriceHistoryEntry } from './scenario';
import type { HistoryEntry, TimelineEntry } from './simulation';
import type { PortfolioStats } from './trading';
import type { Article } from './espn';
import type { MissionPicks, MissionScore, LeaderboardEntry, LeagueHolding, LeagueMember } from './social';

// Re-export all types from domain-specific files
export * from './scenario';
export * from './simulation';
export * from './trading';
export * from './social';
export * from './espn';

// Convenience aliases
export type ContentTile = ContentItem;
export type EspnArticle = Article;

export interface ChildrenProps {
  children: ReactNode;
}

// Enriched player with computed fields (from TradingContext)
export interface EnrichedPlayer extends Player {
  currentPrice: number;
  changePercent: number;
  priceChange: number;
  moveReason: string;
  contentTiles: ContentItem[];
  allContent?: ContentItem[];
}

export interface EventData {
  type: string;
  headline?: string;
  price?: number;
  timestamp?: string;
  source?: string;
  url?: string;
  memberId?: string;
  action?: string;
  shares?: number;
}

// Context value types
export interface ScenarioContextValue {
  scenario: string;
  setScenario: (scenario: string) => void;
  currentData: ScenarioData | null;
  players: Player[];
  scenarioLoading: boolean;
  scenarioVersion: number;
}

export interface SimulationContextValue {
  tick: number;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  priceOverrides: Record<string, number>;
  history: HistoryEntry[];
  unifiedTimeline: TimelineEntry[];
  playoffDilutionApplied: boolean;
  isEspnLiveMode: boolean;
  espnNews: Article[];
  espnLoading: boolean;
  espnError: string | null;
  espnPriceHistory: Record<string, PriceHistoryEntry[]>;
  goToHistoryPoint: (index: number) => void;
  applyPlayoffDilution: (dilutionPercent: number) => void;
  refreshEspnNews: () => void;
  getUnifiedTimeline: () => TimelineEntry[];
}

export interface TradingContextValue {
  portfolio: Portfolio;
  cash: number;
  buyShares: (playerId: string, shares: number) => boolean;
  sellShares: (playerId: string, shares: number) => boolean;
  getEffectivePrice: (playerId: string) => number;
  getPlayer: (playerId: string) => EnrichedPlayer | null;
  getPlayers: () => EnrichedPlayer[];
  getPortfolioValue: () => PortfolioStats;
}

export interface SocialContextValue {
  watchlist: string[];
  missionPicks: MissionPicks;
  missionRevealed: boolean;
  addToWatchlist: (playerId: string) => void;
  removeFromWatchlist: (playerId: string) => void;
  isWatching: (playerId: string) => boolean;
  setMissionPick: (playerId: string, type: string) => void;
  clearMissionPick: (playerId: string) => void;
  revealMission: () => void;
  resetMission: () => void;
  getMissionScore: () => MissionScore | null;
  getLeaderboardRankings: () => LeaderboardEntry[];
  getLeagueHoldings: (playerId: string) => Array<LeagueHolding & {
    name: string;
    avatar: string;
    isUser: boolean;
    currentValue: number;
    gainPercent: number;
  }>;
  getLeagueMembers: () => LeagueMember[];
}
