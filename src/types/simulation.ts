export interface TradeData {
  timestamp: string;
  price: number;
  volumeTraded: number;
  trend: 'UP' | 'DOWN' | 'FLAT';
}

export interface StockData {
  stockSymbol: string;
  startingPrice: number;
  totalVolume: number;
  trades: TradeData[];
}

export interface SimulationState {
  isPlaying: boolean;
  speed: 1 | 2 | 4;
  currentIndex: number;
  currentTrade: TradeData | null;
}