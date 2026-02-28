import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../renderWithProviders';
import {
  createMockPlayer,
  createMockEnrichedPlayer,
  createMockPortfolio,
  createMockLeaderboardRankings,
  mockPlayer,
  mockEnrichedPlayer,
  mockPortfolio,
  mockEmptyPortfolio,
} from '../mockData';
import { useScenario } from '../../context/ScenarioContext';
import { useTrading } from '../../context/TradingContext';
import { useSocial } from '../../context/SocialContext';
import { useToast } from '../../components/Toast/ToastProvider';
import type { Player, EnrichedPlayer, Portfolio, LeaderboardEntry } from '../../types';

/* ---------- Test consumer components ---------- */

function ScenarioConsumer() {
  const { scenario } = useScenario();
  return <div data-testid="scenario">{scenario}</div>;
}

function TradingConsumer() {
  const { cash } = useTrading();
  return <div data-testid="cash">{cash}</div>;
}

function SocialConsumer() {
  const { watchlist, isWatching, getLeagueHoldings } = useSocial();
  return (
    <div>
      <span data-testid="watchlist-length">{watchlist.length}</span>
      <span data-testid="is-watching">{String(isWatching('p1'))}</span>
      <span data-testid="league-holdings">{JSON.stringify(getLeagueHoldings('p1'))}</span>
    </div>
  );
}

function ToastConsumer() {
  const { addToast, removeToast } = useToast();
  return (
    <div>
      <span data-testid="add-toast-type">{typeof addToast}</span>
      <span data-testid="remove-toast-type">{typeof removeToast}</span>
    </div>
  );
}

function MultiContextConsumer() {
  const { scenario } = useScenario();
  const { cash } = useTrading();
  const { watchlist } = useSocial();
  const { addToast } = useToast();
  return (
    <div>
      <span data-testid="multi-scenario">{scenario}</span>
      <span data-testid="multi-cash">{cash}</span>
      <span data-testid="multi-watchlist">{watchlist.length}</span>
      <span data-testid="multi-toast">{typeof addToast}</span>
    </div>
  );
}

/* ---------- TC-001: ScenarioContext ---------- */

describe('TC-001: renderWithProviders wraps component in ScenarioContext', () => {
  it('renders without useScenario error', () => {
    renderWithProviders(<ScenarioConsumer />);
    expect(screen.getByTestId('scenario')).toBeInTheDocument();
  });

  it('provides default scenario value "midweek"', () => {
    renderWithProviders(<ScenarioConsumer />);
    expect(screen.getByTestId('scenario')).toHaveTextContent('midweek');
  });

  it('works with empty options object', () => {
    renderWithProviders(<ScenarioConsumer />, {});
    expect(screen.getByTestId('scenario')).toHaveTextContent('midweek');
  });
});

/* ---------- TC-002: TradingContext ---------- */

describe('TC-002: renderWithProviders wraps component in TradingContext', () => {
  it('renders without useTrading error', () => {
    renderWithProviders(<TradingConsumer />);
    expect(screen.getByTestId('cash')).toBeInTheDocument();
  });

  it('provides default cash value of 10000', () => {
    renderWithProviders(<TradingConsumer />);
    expect(screen.getByTestId('cash')).toHaveTextContent('10000');
  });
});

/* ---------- TC-003: SocialContext ---------- */

describe('TC-003: renderWithProviders wraps component in SocialContext', () => {
  it('renders without useSocial error', () => {
    renderWithProviders(<SocialConsumer />);
    expect(screen.getByTestId('watchlist-length')).toBeInTheDocument();
  });

  it('provides default watchlist length of 0', () => {
    renderWithProviders(<SocialConsumer />);
    expect(screen.getByTestId('watchlist-length')).toHaveTextContent('0');
  });

  it('isWatching returns false by default', () => {
    renderWithProviders(<SocialConsumer />);
    expect(screen.getByTestId('is-watching')).toHaveTextContent('false');
  });

  it('getLeagueHoldings returns empty array by default', () => {
    renderWithProviders(<SocialConsumer />);
    expect(screen.getByTestId('league-holdings')).toHaveTextContent('[]');
  });
});

/* ---------- TC-004: ToastContext ---------- */

describe('TC-004: renderWithProviders wraps component in ToastContext', () => {
  it('renders without useToast error', () => {
    renderWithProviders(<ToastConsumer />);
    expect(screen.getByTestId('add-toast-type')).toBeInTheDocument();
  });

  it('addToast is a callable function', () => {
    renderWithProviders(<ToastConsumer />);
    expect(screen.getByTestId('add-toast-type')).toHaveTextContent('function');
  });

  it('addToast mock returns a numeric id by default', () => {
    const addToastMock = vi.fn(
      (_msg: string, _type?: string, _dur?: number): number => 42,
    );
    renderWithProviders(<ToastConsumer />, {
      toastOverrides: { addToast: addToastMock },
    });
    expect(addToastMock('test')).toBe(42);
    expect(typeof addToastMock('test')).toBe('number');
  });
});

/* ---------- TC-005: Per-context overrides ---------- */

describe('TC-005: renderWithProviders allows per-context overrides', () => {
  it('overrides scenario value', () => {
    renderWithProviders(<ScenarioConsumer />, {
      scenarioOverrides: { scenario: 'playoffs' },
    });
    expect(screen.getByTestId('scenario')).toHaveTextContent('playoffs');
  });

  it('overrides cash value', () => {
    renderWithProviders(<TradingConsumer />, {
      tradingOverrides: { cash: 5000 },
    });
    expect(screen.getByTestId('cash')).toHaveTextContent('5000');
  });

  it('overrides watchlist', () => {
    renderWithProviders(<SocialConsumer />, {
      socialOverrides: { watchlist: ['p1'] },
    });
    expect(screen.getByTestId('watchlist-length')).toHaveTextContent('1');
  });

  it('overriding one context leaves others at defaults', () => {
    renderWithProviders(<MultiContextConsumer />, {
      tradingOverrides: { cash: 5000 },
    });
    expect(screen.getByTestId('multi-scenario')).toHaveTextContent('midweek');
    expect(screen.getByTestId('multi-cash')).toHaveTextContent('5000');
    expect(screen.getByTestId('multi-watchlist')).toHaveTextContent('0');
  });

  it('empty overrides behave same as no override', () => {
    renderWithProviders(<ScenarioConsumer />, {
      scenarioOverrides: {},
    });
    expect(screen.getByTestId('scenario')).toHaveTextContent('midweek');
  });
});

/* ---------- TC-006: Returns standard RTL render result ---------- */

describe('TC-006: renderWithProviders returns standard RTL render result', () => {
  it('returns container, getByText, queryByText, rerender, unmount', () => {
    const result = renderWithProviders(<ScenarioConsumer />);
    expect(result.container).toBeInstanceOf(HTMLElement);
    expect(typeof result.getByText).toBe('function');
    expect(typeof result.queryByText).toBe('function');
    expect(typeof result.rerender).toBe('function');
    expect(typeof result.unmount).toBe('function');
  });

  it('unmount cleans up without errors', () => {
    const result = renderWithProviders(<ScenarioConsumer />);
    expect(() => result.unmount()).not.toThrow();
  });
});

/* ---------- TC-007: mockPlayer ---------- */

describe('TC-007: mockData exports a valid mock Player object', () => {
  it('createMockPlayer returns object with all required fields', () => {
    const player = createMockPlayer();
    expect(player.id).toBeDefined();
    expect(player.name).toBeDefined();
    expect(player.team).toBeDefined();
    expect(player.position).toBeDefined();
    expect(player.basePrice).toBeGreaterThan(0);
  });

  it('has realistic NFL player values', () => {
    const player = createMockPlayer();
    expect(player.name).toBe('Patrick Mahomes');
    expect(player.team).toBe('KC');
    expect(player.position).toBe('QB');
  });

  it('includes optional fields useful for testing', () => {
    const player = createMockPlayer();
    expect(Array.isArray(player.priceHistory)).toBe(true);
    expect(typeof player.totalSharesAvailable).toBe('number');
  });

  it('priceHistory entries have valid structure', () => {
    const player = createMockPlayer();
    expect(player.priceHistory!.length).toBeGreaterThan(0);
    const entry = player.priceHistory![0];
    expect(entry.timestamp).toBeDefined();
    expect(entry.price).toBeGreaterThan(0);
    expect(entry.reason).toBeDefined();
    expect(entry.reason.headline).toBeDefined();
  });

  it('mockPlayer convenience export matches factory shape', () => {
    expect(mockPlayer.id).toBe('p1');
    expect(mockPlayer.name).toBe('Patrick Mahomes');
  });
});

/* ---------- TC-008: mockEnrichedPlayer ---------- */

describe('TC-008: mockData exports a valid mock EnrichedPlayer object', () => {
  it('has all Player fields plus computed fields', () => {
    const ep = createMockEnrichedPlayer();
    expect(ep.id).toBeDefined();
    expect(ep.name).toBeDefined();
    expect(ep.currentPrice).toBeGreaterThan(0);
    expect(typeof ep.changePercent).toBe('number');
    expect(typeof ep.priceChange).toBe('number');
    expect(ep.moveReason).toBeDefined();
    expect(Array.isArray(ep.contentTiles)).toBe(true);
  });

  it('supports spread for negative changePercent variant', () => {
    const neg = { ...createMockEnrichedPlayer(), changePercent: -3.1 };
    expect(neg.changePercent).toBe(-3.1);
    expect(neg.currentPrice).toBeGreaterThan(0);
  });

  it('mockEnrichedPlayer convenience export matches factory shape', () => {
    expect(mockEnrichedPlayer.currentPrice).toBeGreaterThan(0);
  });
});

/* ---------- TC-009: mockPortfolio ---------- */

describe('TC-009: mockData exports valid mock Portfolio data', () => {
  it('createMockPortfolio returns non-empty portfolio', () => {
    const portfolio = createMockPortfolio();
    expect(Object.keys(portfolio).length).toBeGreaterThan(0);
  });

  it('entries have shares > 0 and avgCost > 0', () => {
    const portfolio = createMockPortfolio();
    Object.values(portfolio).forEach((holding) => {
      expect(holding.shares).toBeGreaterThan(0);
      expect(holding.avgCost).toBeGreaterThan(0);
    });
  });

  it('portfolio keys reference known mock player IDs', () => {
    const portfolio = createMockPortfolio();
    const player = createMockPlayer();
    expect(portfolio[player.id]).toBeDefined();
  });

  it('empty portfolio is trivially constructible', () => {
    expect(mockEmptyPortfolio).toEqual({});
  });

  it('mockPortfolio convenience export matches factory shape', () => {
    expect(mockPortfolio['p1']).toBeDefined();
    expect(mockPortfolio['p1'].shares).toBeGreaterThan(0);
  });
});

/* ---------- TC-010: mockLeaderboardRankings ---------- */

describe('TC-010: mockData exports valid mock LeaderboardEntry data', () => {
  it('returns a non-empty array', () => {
    const rankings = createMockLeaderboardRankings();
    expect(rankings.length).toBeGreaterThan(0);
  });

  it('entries have all required fields', () => {
    const rankings = createMockLeaderboardRankings();
    rankings.forEach((entry) => {
      expect(entry.memberId).toBeDefined();
      expect(entry.name).toBeDefined();
      expect(typeof entry.isUser).toBe('boolean');
      expect(typeof entry.cash).toBe('number');
      expect(typeof entry.holdingsValue).toBe('number');
      expect(typeof entry.totalValue).toBe('number');
      expect(typeof entry.rank).toBe('number');
      expect(typeof entry.gapToNext).toBe('number');
    });
  });

  it('contains exactly one user entry with name "You"', () => {
    const rankings = createMockLeaderboardRankings();
    const users = rankings.filter((r) => r.isUser);
    expect(users).toHaveLength(1);
    expect(users[0].name).toBe('You');
  });

  it('sorted by totalValue descending', () => {
    const rankings = createMockLeaderboardRankings();
    for (let i = 1; i < rankings.length; i++) {
      expect(rankings[i - 1].totalValue).toBeGreaterThanOrEqual(rankings[i].totalValue);
    }
  });

  it('includes at least one negative gainPercent', () => {
    const rankings = createMockLeaderboardRankings();
    const hasNegative = rankings.some((r) => (r.gainPercent ?? 0) < 0);
    expect(hasNegative).toBe(true);
  });

  it('has at least 3 entries for medal display', () => {
    const rankings = createMockLeaderboardRankings();
    expect(rankings.length).toBeGreaterThanOrEqual(3);
  });
});

/* ---------- TC-011: Type safety ---------- */

describe('TC-011: mockData objects are type-safe', () => {
  it('assigns to typed variables without errors', () => {
    const p: Player = createMockPlayer();
    const ep: EnrichedPlayer = createMockEnrichedPlayer();
    const pf: Portfolio = createMockPortfolio();
    const lb: LeaderboardEntry[] = createMockLeaderboardRankings();
    expect(p).toBeDefined();
    expect(ep).toBeDefined();
    expect(pf).toBeDefined();
    expect(lb).toBeDefined();
  });
});

/* ---------- TC-013: Multiple contexts simultaneously ---------- */

describe('TC-013: component using multiple contexts simultaneously', () => {
  it('renders with all four contexts at once', () => {
    renderWithProviders(<MultiContextConsumer />);
    expect(screen.getByTestId('multi-scenario')).toHaveTextContent('midweek');
    expect(screen.getByTestId('multi-cash')).toHaveTextContent('10000');
    expect(screen.getByTestId('multi-watchlist')).toHaveTextContent('0');
    expect(screen.getByTestId('multi-toast')).toHaveTextContent('function');
  });

  it('supports overrides for all four contexts simultaneously', () => {
    const customAddToast = vi.fn(
      (_msg: string, _type?: string, _dur?: number): number => 42,
    );
    renderWithProviders(<MultiContextConsumer />, {
      scenarioOverrides: { scenario: 'live' },
      tradingOverrides: { cash: 7500 },
      socialOverrides: { watchlist: ['p1', 'p2'] },
      toastOverrides: { addToast: customAddToast },
    });
    expect(screen.getByTestId('multi-scenario')).toHaveTextContent('live');
    expect(screen.getByTestId('multi-cash')).toHaveTextContent('7500');
    expect(screen.getByTestId('multi-watchlist')).toHaveTextContent('2');
  });

  it('partial overrides across multiple contexts', () => {
    renderWithProviders(<MultiContextConsumer />, {
      scenarioOverrides: { scenario: 'playoffs' },
      tradingOverrides: { cash: 3000 },
    });
    expect(screen.getByTestId('multi-scenario')).toHaveTextContent('playoffs');
    expect(screen.getByTestId('multi-cash')).toHaveTextContent('3000');
    expect(screen.getByTestId('multi-watchlist')).toHaveTextContent('0');
    expect(screen.getByTestId('multi-toast')).toHaveTextContent('function');
  });
});

/* ---------- TC-014: Mutation isolation ---------- */

describe('TC-014: mockData objects are isolated between tests (factory functions)', () => {
  it('test A: mutating factory result takes effect locally', () => {
    const player = createMockPlayer();
    player.name = 'Modified';
    expect(player.name).toBe('Modified');
  });

  it('test B: new factory call returns original value', () => {
    const player = createMockPlayer();
    expect(player.name).toBe('Patrick Mahomes');
  });
});
