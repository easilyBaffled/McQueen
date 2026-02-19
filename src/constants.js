// Cash & trading
export const INITIAL_CASH = 10000;
export const USER_IMPACT_FACTOR = 0.001; // Each share bought/sold moves price by 0.1%
export const AI_BASE_CASH = 2000; // AI traders' simulated cash reserve

// Simulation timing
export const TICK_INTERVAL_MS = 3000; // Live scenario tick every 3 seconds
export const ESPN_REFRESH_MS = 60 * 1000; // ESPN Live mode polls every 60 seconds
export const ESPN_NEWS_LIMIT = 30; // Max articles per ESPN fetch

// Mission
export const MISSION_PICKS_PER_CATEGORY = 3; // Risers and fallers each

// localStorage keys
export const STORAGE_KEYS = {
  scenario: 'mcqueen-scenario',
  portfolio: 'mcqueen-portfolio',
  watchlist: 'mcqueen-watchlist',
  cash: 'mcqueen-cash',
};
