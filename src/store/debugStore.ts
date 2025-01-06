import { create } from 'zustand';

interface DebugState {
  isDebugMode: boolean;
  isPaused: boolean;
  toggleDebugMode: () => void;
  togglePause: () => void;
}

export const useDebugStore = create<DebugState>((set) => ({
  isDebugMode: false,
  isPaused: false,
  toggleDebugMode: () => set(state => ({ isDebugMode: !state.isDebugMode })),
  togglePause: () => set(state => ({ isPaused: !state.isPaused })),
}));