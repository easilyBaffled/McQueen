import type {
  Player,
  EnrichedPlayer,
  Portfolio,
  PriceHistoryEntry,
  LeaderboardEntry,
} from '../types';

export function createMockPlayer(overrides?: Partial<Player>): Player {
  return {
    id: 'p1',
    name: 'Patrick Mahomes',
    team: 'KC',
    position: 'QB',
    basePrice: 50,
    totalSharesAvailable: 1000,
    priceHistory: [
      {
        timestamp: '2024-01-15T10:00:00Z',
        price: 52,
        reason: {
          type: 'news',
          headline: '350 passing yards in Week 14',
          source: 'ESPN',
        },
      } satisfies PriceHistoryEntry,
    ],
    ...overrides,
  };
}

export function createMockEnrichedPlayer(
  overrides?: Partial<EnrichedPlayer>,
): EnrichedPlayer {
  return {
    ...createMockPlayer(),
    currentPrice: 54.25,
    changePercent: 2.5,
    priceChange: 2.5,
    moveReason: 'Strong performance in Week 14',
    contentTiles: [],
    ...overrides,
  };
}

export function createMockPortfolio(): Portfolio {
  return {
    p1: { shares: 10, avgCost: 48.5 },
    p2: { shares: 5, avgCost: 35.0 },
  };
}

export function createMockLeaderboardRankings(): LeaderboardEntry[] {
  return [
    { memberId: 'gridiron', name: 'GridironGuru', avatar: '🏈', isUser: false, cash: 2000, holdingsValue: 12500, totalValue: 14500, rank: 1, gapToNext: 0, gainPercent: 8.2 },
    { memberId: 'tdking', name: 'TDKing2024', avatar: '👑', isUser: false, cash: 2000, holdingsValue: 11800, totalValue: 13800, rank: 2, gapToNext: 700, gainPercent: 5.1 },
    { memberId: 'fantasymvp', name: 'FantasyMVP', avatar: '🏆', isUser: false, cash: 2000, holdingsValue: 10200, totalValue: 12200, rank: 3, gapToNext: 1600, gainPercent: 3.4 },
    { memberId: 'stockjock', name: 'StockJock', avatar: '📈', isUser: false, cash: 2000, holdingsValue: 9500, totalValue: 11500, rank: 4, gapToNext: 700, gainPercent: -1.2 },
    { memberId: 'user', name: 'You', avatar: '👤', isUser: true, cash: 10000, holdingsValue: 0, totalValue: 10000, rank: 5, gapToNext: 1500, gain: 0, gainPercent: 0 },
  ];
}

export const mockPlayer: Player = createMockPlayer();
export const mockEnrichedPlayer: EnrichedPlayer = createMockEnrichedPlayer();
export const mockPortfolio: Portfolio = createMockPortfolio();
export const mockEmptyPortfolio: Portfolio = {};
export const mockLeaderboardRankings: LeaderboardEntry[] = createMockLeaderboardRankings();
