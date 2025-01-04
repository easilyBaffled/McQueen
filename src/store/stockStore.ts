import { create } from 'zustand';
import { generateMockPriceData } from '../lib/utils';
import { Stock, Portfolio, Transaction } from '../types/stock';

interface StockState {
  stocks: Stock[];
  portfolio: Portfolio;
  walletBalance: number;
  transactions: Transaction[];
  updateInterval: number;
  setUpdateInterval: (interval: number) => void;
  updateStockPrices: () => void;
  executeTrade: (stockId: string, type: 'buy' | 'sell', quantity: number) => void;
}

const mockStocks: Stock[] = [
  {
    id: '1',
    name: 'TechCorp',
    symbol: 'TECH',
    price: 150.00,
    previousPrice: 148.50,
    availableShares: 1000,
    priceHistory: generateMockPriceData(150, 100),
    news: [
      {
        id: '1',
        timestamp: Date.now() - 3600000, // 1 hour ago
        title: 'TechCorp Announces New Product',
        content: 'TechCorp reveals revolutionary AI technology',
        impact: 2.5
      },
      {
        id: '2',
        timestamp: Date.now() - 7200000, // 2 hours ago
        title: 'Q4 Earnings Report',
        content: 'TechCorp exceeds market expectations',
        impact: 3.8
      }
    ]
  },
  {
    id: '2',
    name: 'Global Finance',
    symbol: 'GFI',
    price: 85.75,
    previousPrice: 86.25,
    availableShares: 2000,
    priceHistory: generateMockPriceData(85, 100),
    news: [
      {
        id: '3',
        timestamp: Date.now() - 1800000, // 30 minutes ago
        title: 'Market Expansion',
        content: 'GFI enters Asian markets',
        impact: 1.8
      }
    ]
  }
];

export const useStockStore = create<StockState>((set, get) => ({
  stocks: mockStocks,
  portfolio: { stocks: {} },
  walletBalance: 10000,
  transactions: [],
  updateInterval: 5000,

  setUpdateInterval: (interval) => set({ updateInterval: interval }),

  updateStockPrices: () => {
    const stocks = get().stocks.map(stock => {
      const maxChange = stock.price * 0.05;
      const change = (Math.random() * 2 - 1) * maxChange;
      const newPrice = Number((stock.price + change).toFixed(2));
      
      return {
        ...stock,
        previousPrice: stock.price,
        price: newPrice,
        priceHistory: [...stock.priceHistory, newPrice].slice(-100)
      };
    });
    set({ stocks });
  },

  executeTrade: (stockId, type, quantity) => {
    const state = get();
    const stock = state.stocks.find(s => s.id === stockId);
    if (!stock) return;

    const total = stock.price * quantity;
    
    if (type === 'buy') {
      if (total > state.walletBalance) return;
      if (quantity > stock.availableShares) return;
      
      set(state => ({
        walletBalance: state.walletBalance - total,
        portfolio: {
          stocks: {
            ...state.portfolio.stocks,
            [stockId]: {
              quantity: (state.portfolio.stocks[stockId]?.quantity || 0) + quantity,
              averagePrice: stock.price
            }
          }
        },
        stocks: state.stocks.map(s => 
          s.id === stockId 
            ? { ...s, availableShares: s.availableShares - quantity }
            : s
        )
      }));
    } else {
      const currentHolding = state.portfolio.stocks[stockId]?.quantity || 0;
      if (quantity > currentHolding) return;
      
      set(state => ({
        walletBalance: state.walletBalance + total,
        portfolio: {
          stocks: {
            ...state.portfolio.stocks,
            [stockId]: {
              quantity: currentHolding - quantity,
              averagePrice: stock.price
            }
          }
        },
        stocks: state.stocks.map(s => 
          s.id === stockId 
            ? { ...s, availableShares: s.availableShares + quantity }
            : s
        )
      }));
    }

    const transaction: Transaction = {
      id: Date.now().toString(),
      stockId,
      type,
      quantity,
      price: stock.price,
      timestamp: Date.now()
    };

    set(state => ({
      transactions: [...state.transactions, transaction]
    }));
  }
}));