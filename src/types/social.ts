export interface MissionPicks {
  risers: string[];
  fallers: string[];
}

export interface MissionScore {
  correct: number;
  total: number;
  percentile: number;
}

export interface LeagueMember {
  id: string;
  name: string;
  avatar?: string;
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
  avatar?: string;
  isUser: boolean;
  cash: number;
  holdingsValue: number;
  totalValue: number;
  rank: number;
  gapToNext: number;
  gain?: number;
  gainPercent?: number;
  traderAhead?: LeaderboardEntry | null;
}

export interface LeagueData {
  members: LeagueMember[];
  holdings: Record<string, LeagueHolding[]>;
}
