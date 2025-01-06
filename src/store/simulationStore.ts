import { create } from 'zustand';
import { StockData, SimulationState, TradeData } from '../types/simulation';

interface SimulatorStore extends SimulationState {
  stockData: StockData | null;
  loadStockData: (data: StockData) => void;
  setPlaying: (isPlaying: boolean) => void;
  setSpeed: (speed: 1 | 2 | 4) => void;
  processNextTrade: () => void;
  reset: () => void;
}

export const useSimulatorStore = create<SimulatorStore>((set, get) => ({
  stockData: null,
  isPlaying: false,
  speed: 1,
  currentIndex: 0,
  currentTrade: null,

  loadStockData: (data) => {
    set({ 
      stockData: data,
      currentIndex: 0,
      currentTrade: data.trades[0] || null
    });
  },

  setPlaying: (isPlaying) => set({ isPlaying }),
  
  setSpeed: (speed) => set({ speed }),

  processNextTrade: () => {
    const { stockData, currentIndex } = get();
    if (!stockData || currentIndex >= stockData.trades.length - 1) {
      set({ isPlaying: false });
      return;
    }

    const nextIndex = currentIndex + 1;
    set({
      currentIndex: nextIndex,
      currentTrade: stockData.trades[nextIndex]
    });
  },

  reset: () => {
    const { stockData } = get();
    set({
      currentIndex: 0,
      currentTrade: stockData?.trades[0] || null,
      isPlaying: false
    });
  }
}));