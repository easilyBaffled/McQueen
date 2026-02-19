export interface PortfolioStats {
  value: number;
  cost: number;
  gain: number;
  gainPercent: number;
}

export interface TradeResult {
  success: boolean;
  playerId?: string;
  shares?: number;
  price?: number;
  total?: number;
}
