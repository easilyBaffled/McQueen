export type TradingAction = 'buy' | 'sell' | 'hold';
export type StrategyType = 'value' | 'momentum' | 'conservative';

export interface TradingDecision {
  action: TradingAction;
  quantity?: number;
  reason: string;
}

export interface TradeExecution {
  timestamp: number;
  stockId: string;
  action: TradingAction;
  quantity: number;
  price: number;
  total: number;
  strategyType: StrategyType;
}

export interface TradingConstraints {
  maxPositionSize: number;
  minStockPrice: number;
  minDiversification: number;
  marketHours: {
    open: string; // "09:30"
    close: string; // "16:00"
  };
}