export interface ContentItem {
  type: string;
  title?: string;
  headline?: string;
  source?: string;
  url?: string;
}

export interface PriceReason {
  type: 'news' | 'game_event' | 'league_trade';
  headline: string;
  source?: string;
  eventType?: string;
  url?: string;
  memberId?: string;
  action?: string;
  shares?: number;
  sentiment?: string;
  magnitude?: number;
}

export interface PriceHistoryEntry {
  timestamp: string;
  price: number;
  reason: PriceReason;
  content?: ContentItem[];
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
  priceHistory?: PriceHistoryEntry[];
  espnId?: string;
  searchTerms?: string[];
}

export interface Holding {
  shares: number;
  avgCost: number;
}

export type Portfolio = Record<string, Holding>;

export interface ScenarioData {
  scenario: string;
  timestamp?: string;
  headline?: string;
  startingPortfolio?: Portfolio;
  players: Player[];
}

export type SimulationMode =
  | 'midweek'
  | 'live'
  | 'playoffs'
  | 'superbowl'
  | 'espn-live';
