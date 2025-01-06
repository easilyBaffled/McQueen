export interface LeagueMember {
  id: string;
  username: string;
  photoUrl: string;
  algorithm: 'Conservative' | 'Aggressive' | 'Random';
  portfolioValue: number;
  previousDayValue: number;
  cashBalance: number;
  holdings: MemberHolding[];
  transactions: Transaction[];
}

export interface MemberHolding {
  stockId: string;
  quantity: number;
  averagePrice: number;
  currentValue: number;
}

export interface RiskMetrics {
  beta: number;
  sharpeRatio: number;
}

export interface Transaction {
  id: string;
  timestamp: number;
  stockId: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  total: number;
  fee: number;
}