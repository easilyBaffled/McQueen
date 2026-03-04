export const INITIAL_CASH: number = 10000;
export const USER_IMPACT_FACTOR: number = 0.001;
export const AI_BASE_CASH: number = 2000;

export const TICK_INTERVAL_MS: number = 3000;
export const ESPN_REFRESH_MS: number = 60 * 1000;
export const ESPN_NEWS_LIMIT: number = 30;
export const MAX_HISTORY_SIZE: number = 500;

export const MISSION_PICKS_PER_CATEGORY: number = 3;

export const STORAGE_KEYS = {
  scenario: 'mcqueen-scenario',
  portfolio: 'mcqueen-portfolio',
  watchlist: 'mcqueen-watchlist',
  cash: 'mcqueen-cash',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export const STORAGE_VERSION: number = 1;
