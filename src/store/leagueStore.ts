import { create } from 'zustand';
import { LeagueMember } from '../types/league';

interface LeagueState {
  members: LeagueMember[];
  updateMemberPortfolios: () => void;
}

const mockMembers: LeagueMember[] = [
  {
    id: '1',
    username: 'Conservative Trader',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    algorithm: 'Conservative',
    portfolioValue: 10500,
    previousDayValue: 10200,
    cashBalance: 2500,
    holdings: [],
    transactions: []
  },
  {
    id: '2',
    username: 'Risk Taker',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    algorithm: 'Aggressive',
    portfolioValue: 11200,
    previousDayValue: 10000,
    cashBalance: 1800,
    holdings: [],
    transactions: []
  },
  {
    id: '3',
    username: 'Random Trader',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    algorithm: 'Random',
    portfolioValue: 9800,
    previousDayValue: 10000,
    cashBalance: 3200,
    holdings: [],
    transactions: []
  }
];

export const useLeagueStore = create<LeagueState>((set, get) => ({
  members: mockMembers,
  
  updateMemberPortfolios: () => {
    // Implementation of portfolio updates based on algorithms
    // This will be implemented in the next iteration
  }
}));