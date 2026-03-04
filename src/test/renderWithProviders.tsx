import { type ReactElement, type ReactNode } from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { vi } from 'vitest';
import { ScenarioContext } from '../context/ScenarioContext';
import { SimulationProvider } from '../context/SimulationContext';
import { EspnProvider, EspnContext } from '../context/EspnContext';
import { TradingContext, TradingProvider } from '../context/TradingContext';
import { SocialContext, SocialProvider } from '../context/SocialContext';
import { ToastContext, type ToastContextValue, ToastProvider } from '../components/Toast/ToastProvider';
import type { ScenarioContextValue, TradingContextValue, SocialContextValue, EspnContextValue, ScenarioData } from '../types';

function createDefaultScenarioValue(): ScenarioContextValue {
  return {
    scenario: 'midweek',
    setScenario: vi.fn(),
    currentData: null,
    players: [],
    scenarioLoading: false,
    scenarioVersion: 0,
    scenarioError: null,
    retryScenarioLoad: vi.fn(),
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

function createDefaultEspnValue(): EspnContextValue {
  return {
    isEspnLiveMode: false,
    espnNews: [],
    espnLoading: false,
    espnError: null,
    espnPriceHistory: {},
    refreshEspnNews: vi.fn(),
  };
}

function createDefaultToastValue(): ToastContextValue {
  return {
    addToast: vi.fn((_message: string, _type?: string, _duration?: number): number => 1),
    removeToast: vi.fn(),
  };
}

/**
 * Test scenario data with three players at known prices.
 * Used by `useRealProviders: true` mode so integration tests exercise
 * real price resolution, trading, and portfolio logic.
 *
 * Player prices (last entry in priceHistory):
 *  - mahomes: $52.00 (base $50, +4%)
 *  - allen:   $43.00 (base $45, −4.44%)
 *  - jackson: $55.00 (base $48, +14.58%)
 */
export const TEST_SCENARIO_DATA: ScenarioData = {
  scenario: 'midweek',
  players: [
    {
      id: 'mahomes',
      name: 'Patrick Mahomes',
      team: 'KC',
      position: 'QB',
      basePrice: 50,
      totalSharesAvailable: 1000,
      priceHistory: [
        { timestamp: '2024-01-14T10:00:00Z', price: 50, reason: { type: 'news', headline: 'Base price', source: 'ESPN' } },
        { timestamp: '2024-01-15T10:00:00Z', price: 52, reason: { type: 'news', headline: '350 passing yards in Week 14', source: 'ESPN' } },
      ],
    },
    {
      id: 'allen',
      name: 'Josh Allen',
      team: 'BUF',
      position: 'QB',
      basePrice: 45,
      totalSharesAvailable: 1000,
      priceHistory: [
        { timestamp: '2024-01-14T10:00:00Z', price: 45, reason: { type: 'news', headline: 'Base price', source: 'ESPN' } },
        { timestamp: '2024-01-15T10:00:00Z', price: 43, reason: { type: 'news', headline: 'Tough loss in Week 14', source: 'ESPN' } },
      ],
    },
    {
      id: 'jackson',
      name: 'Lamar Jackson',
      team: 'BAL',
      position: 'QB',
      basePrice: 48,
      totalSharesAvailable: 1000,
      priceHistory: [
        { timestamp: '2024-01-14T10:00:00Z', price: 48, reason: { type: 'news', headline: 'Base price', source: 'ESPN' } },
        { timestamp: '2024-01-15T10:00:00Z', price: 55, reason: { type: 'news', headline: 'MVP performance Week 14', source: 'ESPN' } },
      ],
    },
  ],
};

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  scenarioOverrides?: Partial<ScenarioContextValue>;
  espnOverrides?: Partial<EspnContextValue>;
  tradingOverrides?: Partial<TradingContextValue>;
  socialOverrides?: Partial<SocialContextValue>;
  toastOverrides?: Partial<ToastContextValue>;

  /**
   * When `true`, wraps the component in the real provider tree
   * (ScenarioContext → SimulationProvider → TradingProvider → SocialProvider → ToastProvider)
   * with test scenario data. Use this for integration tests that verify actual
   * business logic: portfolio calculations, trading, price resolution.
   *
   * When `false` or omitted (default), uses mock stubs for all context values.
   * This is the right choice for isolated unit tests.
   */
  useRealProviders?: boolean;
}

/**
 * Renders a component wrapped in context providers for testing.
 *
 * **Mock mode (default):** Wraps the component in context providers with `vi.fn()` stubs
 * for all context values. Use this for isolated unit tests where you want to control
 * exactly what each context returns without exercising real business logic.
 *
 * **Real providers mode (`useRealProviders: true`):** Wraps the component in the actual
 * provider tree (ScenarioContext → SimulationProvider → TradingProvider → SocialProvider →
 * ToastProvider) with test scenario data (3 QBs with known prices). Use this for
 * integration tests that need to verify real business logic: portfolio calculations,
 * trading operations, price resolution, etc.
 *
 * @example
 * // Mock mode (unit test) — functions are vi.fn() stubs
 * renderWithProviders(<PlayerCard player={mockPlayer} />);
 * renderWithProviders(<Portfolio />, { tradingOverrides: { cash: 500 } });
 *
 * @example
 * // Real providers mode (integration test) — exercises actual logic
 * renderWithProviders(<TradingComponent />, { useRealProviders: true });
 */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
): RenderResult {
  const {
    scenarioOverrides,
    espnOverrides,
    tradingOverrides,
    socialOverrides,
    toastOverrides,
    useRealProviders = false,
    ...renderOptions
  } = options;

  if (useRealProviders) {
    return renderWithRealProviders(ui, renderOptions);
  }

  const scenarioValue: ScenarioContextValue = {
    ...createDefaultScenarioValue(),
    ...scenarioOverrides,
  };
  const espnValue: EspnContextValue = {
    ...createDefaultEspnValue(),
    ...espnOverrides,
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
        <EspnContext.Provider value={espnValue}>
          <TradingContext.Provider value={tradingValue}>
            <SocialContext.Provider value={socialValue}>
              <ToastContext.Provider value={toastValue}>
                {children}
              </ToastContext.Provider>
            </SocialContext.Provider>
          </TradingContext.Provider>
        </EspnContext.Provider>
      </ScenarioContext.Provider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Internal helper: wraps the component in real providers with test scenario data.
 * Clears mcqueen-* localStorage keys so each test starts fresh.
 */
function renderWithRealProviders(
  ui: ReactElement,
  renderOptions: Omit<RenderOptions, 'wrapper'>,
): RenderResult {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith('mcqueen'));
  keys.forEach((k) => localStorage.removeItem(k));

  const scenarioValue: ScenarioContextValue = {
    scenario: 'midweek',
    setScenario: () => {},
    currentData: TEST_SCENARIO_DATA,
    players: TEST_SCENARIO_DATA.players,
    scenarioLoading: false,
    scenarioVersion: 0,
    scenarioError: null,
    retryScenarioLoad: () => {},
  };

  function RealWrapper({ children }: { children: ReactNode }) {
    return (
      <ScenarioContext.Provider value={scenarioValue}>
        <SimulationProvider>
          <EspnProvider>
            <TradingProvider>
              <SocialProvider>
                <ToastProvider>
                  {children}
                </ToastProvider>
              </SocialProvider>
            </TradingProvider>
          </EspnProvider>
        </SimulationProvider>
      </ScenarioContext.Provider>
    );
  }

  return render(ui, { wrapper: RealWrapper, ...renderOptions });
}
