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
  _raw?: Record<string, unknown>;
}

export interface ArticleImage {
  url?: string;
  width?: number;
  height?: number;
  caption?: string;
}

export interface ArticleCategory {
  id?: number;
  description?: string;
  type?: string;
}

export interface SentimentKeyword {
  word: string;
  type: 'positive' | 'negative';
  level: 'high' | 'medium' | 'low';
}

export interface SentimentScores {
  positive: number;
  negative: number;
  net: number;
}

export interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  magnitude: number;
  confidence: number;
  keywords: SentimentKeyword[];
  scores?: SentimentScores;
}

export interface GameEventTeam {
  id: string;
  abbr: string;
  name: string;
  score: string;
  logo: string;
}

export interface GameEventStatus {
  type: string;
  description: string;
  period: number;
  clock: string;
}

export interface GameEvent {
  id: string;
  name: string;
  shortName: string;
  date: string;
  status: GameEventStatus;
  homeTeam: GameEventTeam | null;
  awayTeam: GameEventTeam | null;
  venue: string;
  broadcast: string;
}

export interface PriceImpact {
  impactPercent: number;
  impactMultiplier: number;
  description: string;
  details: {
    sentiment: string;
    level: string;
    baseImpact: number;
    confidence: number;
    confidenceMultiplier: number;
  };
}

export interface EspnPlayersData {
  players: Array<{
    id: string;
    espnId: string;
    name: string;
    searchTerms: string[];
    team: string;
    position: string;
    basePrice: number;
  }>;
  metadata?: Record<string, unknown>;
}
