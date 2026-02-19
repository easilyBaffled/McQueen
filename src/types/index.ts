import type { ReactNode } from 'react';

export interface PriceReason {
  type: string;
  headline: string;
  source?: string;
  memberId?: string;
  action?: string;
  shares?: number;
  url?: string;
  sentiment?: string;
  magnitude?: number;
}

export interface ContentTile {
  type: string;
  title: string;
  source?: string;
  url?: string;
}

export interface PriceHistoryEntry {
  timestamp: string;
  price: number;
  reason?: PriceReason;
  content?: ContentTile[];
  sentiment?: string;
  sentimentDescription?: string;
}

export interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  basePrice: number;
  totalSharesAvailable?: number;
  isActive?: boolean;
  isBuyback?: boolean;
  searchTerms?: string[];
  priceHistory: PriceHistoryEntry[];
}

export interface EnrichedPlayer extends Player {
  currentPrice: number;
  changePercent: number;
  priceChange: number;
  moveReason: string;
  contentTiles: ContentTile[];
  allContent?: ContentTile[];
}

export interface PortfolioHolding {
  shares: number;
  avgCost: number;
}

export interface Portfolio {
  [playerId: string]: PortfolioHolding;
}

export interface PortfolioStats {
  value: number;
  cost: number;
  gain: number;
  gainPercent: number;
}

export interface ScenarioData {
  scenario: string;
  timestamp?: string;
  headline?: string;
  players: Player[];
  startingPortfolio?: Portfolio;
}

export interface LeagueMember {
  id: string;
  name: string;
  avatar: string;
  isUser?: boolean;
}

export interface LeagueHolding {
  memberId: string;
  shares: number;
  avgCost: number;
}

export interface LeaderboardEntry {
  memberId: string;
  name: string;
  avatar: string;
  isUser: boolean;
  cash: number;
  holdingsValue: number;
  totalValue: number;
  gain?: number;
  gainPercent?: number;
  rank: number;
  gapToNext: number;
  traderAhead: LeaderboardEntry | null;
}

export interface MissionPicks {
  risers: string[];
  fallers: string[];
}

export interface MissionScore {
  correct: number;
  total: number;
  percentile: number;
}

export interface EspnArticle {
  id: string;
  headline: string;
  description: string;
  published?: string;
  images?: { url: string }[];
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

export interface TimelineEntry {
  playerId: string;
  playerName: string;
  price: number;
  timestamp: string;
  reason?: PriceReason;
  content?: ContentTile[];
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

export interface ArticleImage {
  url: string;
  width?: number;
  height?: number;
  caption?: string;
}

export interface ArticleCategory {
  id?: number;
  description?: string;
  type?: string;
}

export interface Article {
  id: string;
  headline: string;
  description: string;
  published: string;
  url: string;
  images: ArticleImage[];
  thumbnail: string | null;
  source: string;
  type: string;
  premium: boolean;
  categories: ArticleCategory[];
  _raw: Record<string, unknown>;
}

export interface GameEventTeam {
  id: string;
  abbr: string;
  name: string;
  score: string;
  logo: string;
}

export interface GameEvent {
  id: string;
  name: string;
  shortName: string;
  date: string;
  status: {
    type: string;
    description: string;
    period: number;
    clock: string;
  };
  homeTeam: GameEventTeam | null;
  awayTeam: GameEventTeam | null;
  venue: string;
  broadcast: string;
}

export type ContentItem = ContentTile;

export interface EspnPlayer {
  id: string;
  name: string;
  espnId: string;
  team: string;
  position: string;
  basePrice: number;
  searchTerms?: string[];
}

export interface EspnPlayersData {
  players: EspnPlayer[];
}

export interface ChildrenProps {
  children: ReactNode;
}

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
  espnNews: EspnArticle[];
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
