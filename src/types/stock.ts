export interface Stock {
  id: string;
  name: string;
  symbol: string;
  price: number;
  previousPrice: number;
  availableShares: number;
  priceHistory: number[];
  news: NewsItem[];
}

export interface NewsItem {
  id: string;
  timestamp: number;
  title: string;
  content: string;
  impact: number;
}

export interface Portfolio {
  stocks: {
    [key: string]: {
      quantity: number;
      averagePrice: number;
    };
  };
}

export interface Transaction {
  id: string;
  stockId: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: number;
}