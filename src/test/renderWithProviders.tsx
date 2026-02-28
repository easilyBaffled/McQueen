import { type ReactElement, type ReactNode } from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { vi } from 'vitest';
import { ScenarioContext } from '../context/ScenarioContext';
import { SimulationContext } from '../context/SimulationContext';
import { TradingContext } from '../context/TradingContext';
import { SocialContext } from '../context/SocialContext';
import { ToastContext, type ToastContextValue } from '../components/Toast/ToastProvider';
import type { ScenarioContextValue, SimulationContextValue, TradingContextValue, SocialContextValue } from '../types';

function createDefaultScenarioValue(): ScenarioContextValue {
  return {
    scenario: 'midweek',
    setScenario: vi.fn(),
    currentData: null,
    players: [],
    scenarioLoading: false,
    scenarioVersion: 0,
  };
}

function createDefaultSimulationValue(): SimulationContextValue {
  return {
    tick: 0,
    isPlaying: false,
    setIsPlaying: vi.fn(),
    priceOverrides: {},
    history: [],
    unifiedTimeline: [],
    playoffDilutionApplied: false,
    isEspnLiveMode: false,
    espnNews: [],
    espnLoading: false,
    espnError: null,
    espnPriceHistory: {},
    goToHistoryPoint: vi.fn(),
    applyPlayoffDilution: vi.fn(),
    refreshEspnNews: vi.fn(),
    getUnifiedTimeline: vi.fn(() => []),
  };
}

function createDefaultTradingValue(): TradingContextValue {
  return {
    portfolio: {},
    cash: 10000,
    buyShares: vi.fn((_playerId: string, _shares: number): boolean => false),
    sellShares: vi.fn((_playerId: string, _shares: number): boolean => false),
    getEffectivePrice: vi.fn((_playerId: string): number => 0),
    getPlayer: vi.fn((_playerId: string) => null),
    getPlayers: vi.fn(() => []),
    getPortfolioValue: vi.fn(() => ({ value: 0, cost: 0, gain: 0, gainPercent: 0 })),
  };
}

function createDefaultSocialValue(): SocialContextValue {
  return {
    watchlist: [],
    missionPicks: { risers: [], fallers: [] },
    missionRevealed: false,
    addToWatchlist: vi.fn(),
    removeFromWatchlist: vi.fn(),
    isWatching: vi.fn((_playerId: string): boolean => false),
    setMissionPick: vi.fn(),
    clearMissionPick: vi.fn(),
    revealMission: vi.fn(),
    resetMission: vi.fn(),
    getMissionScore: vi.fn(() => null),
    getLeaderboardRankings: vi.fn(() => []),
    getLeagueHoldings: vi.fn((_playerId: string) => []),
    getLeagueMembers: vi.fn(() => []),
  } as SocialContextValue;
}

function createDefaultToastValue(): ToastContextValue {
  return {
    addToast: vi.fn((_message: string, _type?: string, _duration?: number): number => 1),
    removeToast: vi.fn(),
  };
}

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  scenarioOverrides?: Partial<ScenarioContextValue>;
  simulationOverrides?: Partial<SimulationContextValue>;
  tradingOverrides?: Partial<TradingContextValue>;
  socialOverrides?: Partial<SocialContextValue>;
  toastOverrides?: Partial<ToastContextValue>;
}

export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
): RenderResult {
  const {
    scenarioOverrides,
    simulationOverrides,
    tradingOverrides,
    socialOverrides,
    toastOverrides,
    ...renderOptions
  } = options;

  const scenarioValue: ScenarioContextValue = {
    ...createDefaultScenarioValue(),
    ...scenarioOverrides,
  };
  const simulationValue: SimulationContextValue = {
    ...createDefaultSimulationValue(),
    ...simulationOverrides,
  };
  const tradingValue: TradingContextValue = {
    ...createDefaultTradingValue(),
    ...tradingOverrides,
  };
  const socialValue: SocialContextValue = {
    ...createDefaultSocialValue(),
    ...socialOverrides,
  };
  const toastValue: ToastContextValue = {
    ...createDefaultToastValue(),
    ...toastOverrides,
  };

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ScenarioContext.Provider value={scenarioValue}>
        <SimulationContext.Provider value={simulationValue}>
          <TradingContext.Provider value={tradingValue}>
            <SocialContext.Provider value={socialValue}>
              <ToastContext.Provider value={toastValue}>
                {children}
              </ToastContext.Provider>
            </SocialContext.Provider>
          </TradingContext.Provider>
        </SimulationContext.Provider>
      </ScenarioContext.Provider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
