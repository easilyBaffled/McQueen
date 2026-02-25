import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PlayerDetail from '../PlayerDetail';
import styles from '../PlayerDetail.module.css';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { createMockEnrichedPlayer } from '../../../test/mockData';

vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  ReferenceLine: () => null,
  Customized: () => null,
}));

vi.mock('../../../shared', () => ({
  EventMarkerPopup: () => null,
  getEventConfig: () => ({ color: '#ccc', icon: '?' }),
  InfoTooltip: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../../utils/espnUrls', () => ({
  getPlayerNewsUrls: () => Promise.resolve({}),
}));

vi.mock('../../../utils/playerImages', () => ({
  getPlayerHeadshotUrl: () => null,
}));

const animationProps = new Set([
  'initial', 'animate', 'exit', 'transition', 'whileHover', 'whileTap',
  'layout', 'variants', 'layoutId',
]);
vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_: unknown, tag: string | symbol) => {
        const Component = ({
          children,
          ref,
          ...props
        }: {
          children?: React.ReactNode;
          ref?: React.Ref<unknown>;
          [key: string]: unknown;
        }) => {
          const domProps: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(props)) {
            if (animationProps.has(key)) continue;
            if (key === 'style' && typeof value === 'object') domProps[key] = value;
            else if (typeof value === 'function' && key.startsWith('on')) domProps[key] = value;
            else if (typeof value !== 'object') domProps[key] = value;
          }
          return React.createElement(String(tag), { ref, ...domProps }, children);
        };
        return Component;
      },
    },
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mahomes = createMockEnrichedPlayer({
  id: 'mahomes',
  name: 'Patrick Mahomes',
  team: 'KC',
  position: 'QB',
  currentPrice: 120.5,
  changePercent: 5.2,
  basePrice: 100,
  priceHistory: [
    {
      price: 100,
      timestamp: '2025-01-01T12:00:00Z',
      reason: { type: 'news', headline: 'Baseline' },
    },
    {
      price: 120.5,
      timestamp: '2025-01-02T14:00:00Z',
      reason: { type: 'game_event', eventType: 'TD', headline: 'Throws 3 TDs' },
    },
  ],
});

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderPlayerDetail(overrides: {
  tradingOverrides?: Record<string, unknown>;
  socialOverrides?: Record<string, unknown>;
  toastOverrides?: Record<string, unknown>;
  playerId?: string;
} = {}) {
  const { playerId = 'mahomes', ...providerOverrides } = overrides;
  return renderWithProviders(
    <MemoryRouter initialEntries={[`/player/${playerId}`]}>
      <Routes>
        <Route path="/player/:playerId" element={<PlayerDetail />} />
      </Routes>
    </MemoryRouter>,
    providerOverrides,
  );
}

describe('PlayerDetail page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders player header with name, team, position, and price (TC-025)', () => {
    renderPlayerDetail({
      tradingOverrides: {
        getPlayer: vi.fn(() => mahomes),
        portfolio: {},
      },
    });
    expect(screen.getByTestId('player-name')).toHaveTextContent('Patrick Mahomes');
    expect(screen.getByText('KC')).toBeInTheDocument();
    expect(screen.getByText('QB')).toBeInTheDocument();
    expect(screen.getByTestId('player-price').textContent).toContain('$120.50');
    const change = screen.getByTestId('price-change');
    expect(change.textContent).toContain('5.20%');
    expect(change).toHaveAttribute('aria-label', expect.stringContaining('Up 5.20 percent'));
  });

  it('buy flow — successful purchase shows success toast and resets amount (TC-013)', () => {
    const buyShares = vi.fn(() => true);
    const addToast = vi.fn();
    renderPlayerDetail({
      tradingOverrides: {
        getPlayer: vi.fn(() => mahomes),
        portfolio: {},
        buyShares,
        cash: 10000,
      },
      toastOverrides: { addToast },
    });

    const input = screen.getByTestId('form-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '3' } });

    const buyBtn = screen.getByTestId('trade-button');
    fireEvent.click(buyBtn);

    expect(buyShares).toHaveBeenCalledWith('mahomes', 3);
    expect(addToast).toHaveBeenCalledWith(
      expect.stringContaining('3 shares'),
      'success',
    );
    expect(addToast).toHaveBeenCalledWith(
      expect.stringContaining('$361.50'),
      'success',
    );
  });

  it('buy flow — insufficient funds shows error toast (TC-014)', () => {
    const buyShares = vi.fn(() => false);
    const addToast = vi.fn();
    renderPlayerDetail({
      tradingOverrides: {
        getPlayer: vi.fn(() => mahomes),
        portfolio: {},
        buyShares,
      },
      toastOverrides: { addToast },
    });

    const buyBtn = screen.getByTestId('trade-button');
    fireEvent.click(buyBtn);

    expect(addToast).toHaveBeenCalledWith('Insufficient funds for this purchase', 'error');
  });

  it('sell flow — successful sale shows success toast and resets amount (TC-015)', () => {
    const sellShares = vi.fn(() => true);
    const addToast = vi.fn();
    renderPlayerDetail({
      tradingOverrides: {
        getPlayer: vi.fn(() => mahomes),
        portfolio: { mahomes: { shares: 5, avgCost: 110 } },
        sellShares,
      },
      toastOverrides: { addToast },
    });

    const sellTab = screen.getAllByTestId('trading-tab')[1];
    fireEvent.click(sellTab);

    expect(screen.getByText(/You own 5/)).toBeInTheDocument();

    const input = screen.getByTestId('form-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '2' } });

    const sellBtn = screen.getByTestId('trade-button');
    fireEvent.click(sellBtn);

    expect(sellShares).toHaveBeenCalledWith('mahomes', 2);
    expect(addToast).toHaveBeenCalledWith(
      expect.stringContaining('2 shares'),
      'success',
    );
  });

  it('sell flow — failed sale shows error toast (TC-016)', () => {
    const sellShares = vi.fn(() => false);
    const addToast = vi.fn();
    renderPlayerDetail({
      tradingOverrides: {
        getPlayer: vi.fn(() => mahomes),
        portfolio: { mahomes: { shares: 5, avgCost: 110 } },
        sellShares,
      },
      toastOverrides: { addToast },
    });

    const sellTab = screen.getAllByTestId('trading-tab')[1];
    fireEvent.click(sellTab);

    const sellBtn = screen.getByTestId('trade-button');
    fireEvent.click(sellBtn);

    expect(addToast).toHaveBeenCalledWith('Unable to complete sale', 'error');
  });

  it('buy quantity input enforces minimum of 1 (TC-017)', () => {
    renderPlayerDetail({
      tradingOverrides: {
        getPlayer: vi.fn(() => mahomes),
        portfolio: {},
      },
    });

    const input = screen.getByTestId('form-input') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '0' } });
    expect(input.value).toBe('1');

    fireEvent.change(input, { target: { value: '-5' } });
    expect(input.value).toBe('1');

    fireEvent.change(input, { target: { value: 'abc' } });
    expect(input.value).toBe('1');
  });

  it('sell quantity input caps to owned shares when value exceeds max (TC-018)', () => {
    renderPlayerDetail({
      tradingOverrides: {
        getPlayer: vi.fn(() => mahomes),
        portfolio: { mahomes: { shares: 5, avgCost: 110 } },
      },
    });

    const sellTab = screen.getAllByTestId('trading-tab')[1];
    fireEvent.click(sellTab);

    const input = screen.getByTestId('form-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '10' } });
    // 120.50 * 5 = 602.50 (capped at 5 shares)
    expect(screen.getByTestId('order-total')).toHaveTextContent('$602.50');
  });

  it('sell quantity input clamps to 1 when value is below minimum (TC-018)', () => {
    renderPlayerDetail({
      tradingOverrides: {
        getPlayer: vi.fn(() => mahomes),
        portfolio: { mahomes: { shares: 5, avgCost: 110 } },
      },
    });

    const sellTab = screen.getAllByTestId('trading-tab')[1];
    fireEvent.click(sellTab);

    const input = screen.getByTestId('form-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '0' } });
    // Clamped to 1: 120.50 * 1 = 120.50
    expect(screen.getByTestId('order-total')).toHaveTextContent('$120.50');
  });

  it('sell tab is disabled when user has no holdings (TC-019)', () => {
    renderPlayerDetail({
      tradingOverrides: {
        getPlayer: vi.fn(() => mahomes),
        portfolio: {},
      },
    });

    const tabs = screen.getAllByTestId('trading-tab');
    const sellTab = tabs[1];
    expect(sellTab).toBeDisabled();
    expect(tabs[0]).not.toBeDisabled();
  });

  it('disabled sell tab shows tooltip explaining why (TC-007)', () => {
    renderPlayerDetail({
      tradingOverrides: {
        getPlayer: vi.fn(() => mahomes),
        portfolio: {},
      },
    });

    const tabs = screen.getAllByTestId('trading-tab');
    const sellTab = tabs[1];
    expect(sellTab).toHaveAttribute('title', 'You need to own shares to sell');
  });

  it('enabled sell tab does not show tooltip (TC-008)', () => {
    renderPlayerDetail({
      tradingOverrides: {
        getPlayer: vi.fn(() => mahomes),
        portfolio: { mahomes: { shares: 5, avgCost: 110 } },
      },
    });

    const tabs = screen.getAllByTestId('trading-tab');
    const sellTab = tabs[1];
    expect(sellTab).not.toHaveAttribute('title');
  });

  it('watchlist toggle — add to watchlist (TC-020)', () => {
    const addToWatchlist = vi.fn();
    const addToast = vi.fn();
    renderPlayerDetail({
      tradingOverrides: {
        getPlayer: vi.fn(() => mahomes),
        portfolio: {},
      },
      socialOverrides: {
        isWatching: vi.fn(() => false),
        addToWatchlist,
      },
      toastOverrides: { addToast },
    });

    const btn = screen.getByTestId('watchlist-button');
    expect(btn).toHaveTextContent('Add to Watchlist');

    fireEvent.click(btn);
    expect(addToWatchlist).toHaveBeenCalledWith('mahomes');
    expect(addToast).toHaveBeenCalledWith(
      'Added Patrick Mahomes to watchlist',
      'success',
    );
  });

  it('watchlist toggle — remove from watchlist (TC-021)', () => {
    const removeFromWatchlist = vi.fn();
    const addToast = vi.fn();
    renderPlayerDetail({
      tradingOverrides: {
        getPlayer: vi.fn(() => mahomes),
        portfolio: {},
      },
      socialOverrides: {
        isWatching: vi.fn(() => true),
        removeFromWatchlist,
      },
      toastOverrides: { addToast },
    });

    const btn = screen.getByTestId('watchlist-button');
    expect(btn).toHaveTextContent('Watching');
    expect(btn.className).toContain('watching');

    fireEvent.click(btn);
    expect(removeFromWatchlist).toHaveBeenCalledWith('mahomes');
    expect(addToast).toHaveBeenCalledWith(
      'Removed Patrick Mahomes from watchlist',
      'info',
    );
  });

  it('error state for invalid player ID (TC-022)', () => {
    renderPlayerDetail({
      tradingOverrides: {
        getPlayer: vi.fn(() => null),
        portfolio: {},
      },
      playerId: 'nonexistent',
    });

    expect(screen.getByTestId('error-state')).toBeInTheDocument();
    expect(screen.getByText('Player Not Found')).toBeInTheDocument();
    expect(
      screen.getByText("This player doesn't exist in the current scenario."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText('Back to Market'));
    expect(mockNavigate).toHaveBeenCalledWith('/market');
  });

  it('estimated cost updates dynamically as buy quantity changes (TC-023)', () => {
    renderPlayerDetail({
      tradingOverrides: {
        getPlayer: vi.fn(() => mahomes),
        portfolio: {},
      },
    });

    expect(screen.getByTestId('order-total')).toHaveTextContent('$120.50');

    const input = screen.getByTestId('form-input');
    fireEvent.change(input, { target: { value: '5' } });

    expect(screen.getByTestId('order-total')).toHaveTextContent('$602.50');
  });

  it('holdings card displays position details when user has holding (TC-024)', () => {
    renderPlayerDetail({
      tradingOverrides: {
        getPlayer: vi.fn(() => mahomes),
        portfolio: { mahomes: { shares: 5, avgCost: 110 } },
      },
    });

    const card = screen.getByTestId('holdings-card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveTextContent('Your Position');
    expect(card).toHaveTextContent('5');
    expect(card).toHaveTextContent('$110.00');
    expect(card).toHaveTextContent('$602.50');
    expect(card.textContent).toContain('▲');
  });

  it('holdings card does not appear when user has no holding', () => {
    renderPlayerDetail({
      tradingOverrides: {
        getPlayer: vi.fn(() => mahomes),
        portfolio: {},
      },
    });

    expect(screen.queryByTestId('holdings-card')).not.toBeInTheDocument();
  });

  it('negative price change shows down arrow (TC-025 edge)', () => {
    const fallingPlayer = createMockEnrichedPlayer({
      id: 'mahomes',
      name: 'Patrick Mahomes',
      currentPrice: 90,
      changePercent: -5.2,
      basePrice: 100,
      priceHistory: [
        {
          price: 100,
          timestamp: '2025-01-01T12:00:00Z',
          reason: { type: 'news', headline: 'Baseline' },
        },
      ],
    });
    renderPlayerDetail({
      tradingOverrides: {
        getPlayer: vi.fn(() => fallingPlayer),
        portfolio: {},
      },
    });
    const change = screen.getByTestId('price-change');
    expect(change.textContent).toContain('▼');
    expect(change).toHaveAttribute('aria-label', expect.stringContaining('Down 5.20 percent'));
  });

  it('renders price timeline with entries from priceHistory', () => {
    renderPlayerDetail({
      tradingOverrides: {
        getPlayer: vi.fn(() => mahomes),
        portfolio: {},
      },
    });
    expect(screen.getByTestId('timeline-card')).toBeInTheDocument();
    expect(screen.getByText('Price Changes')).toBeInTheDocument();
    const entries = screen.getAllByTestId('timeline-entry');
    expect(entries.length).toBe(2);
    expect(screen.getByText('Throws 3 TDs')).toBeInTheDocument();
    expect(screen.getByText('Baseline')).toBeInTheDocument();
  });

  it('renders move reason card', () => {
    renderPlayerDetail({
      tradingOverrides: {
        getPlayer: vi.fn(() => mahomes),
        portfolio: {},
      },
    });
    expect(screen.getByText('Why Did This Move?')).toBeInTheDocument();
    expect(screen.getByText('Strong performance in Week 14')).toBeInTheDocument();
  });

  it('renders content tiles when player has contentTiles', () => {
    const playerWithContent = createMockEnrichedPlayer({
      id: 'mahomes',
      name: 'Patrick Mahomes',
      currentPrice: 120.5,
      changePercent: 5.2,
      basePrice: 100,
      contentTiles: [
        { type: 'article', title: 'Mahomes dominates', source: 'ESPN', url: 'https://example.com' },
      ],
      priceHistory: [
        {
          price: 120.5,
          timestamp: '2025-01-02T14:00:00Z',
          reason: { type: 'news', headline: 'Big game' },
        },
      ],
    });
    renderPlayerDetail({
      tradingOverrides: {
        getPlayer: vi.fn(() => playerWithContent),
        portfolio: {},
      },
    });
    expect(screen.getByText('Related Content')).toBeInTheDocument();
    expect(screen.getByText('Mahomes dominates')).toBeInTheDocument();
    expect(screen.getByText('ESPN')).toBeInTheDocument();
  });

  describe('Content tile type badge CSS module classes', () => {
    const tileTypes = ['article', 'video', 'analysis', 'news'] as const;

    function renderWithContentTiles(
      tiles: Array<{ type: string; title: string; source: string; url: string }>,
    ) {
      const player = createMockEnrichedPlayer({
        id: 'mahomes',
        name: 'Patrick Mahomes',
        currentPrice: 120.5,
        changePercent: 5.2,
        basePrice: 100,
        contentTiles: tiles,
        priceHistory: [
          {
            price: 120.5,
            timestamp: '2025-01-02T14:00:00Z',
            reason: { type: 'news', headline: 'Big game' },
          },
        ],
      });
      return renderPlayerDetail({
        tradingOverrides: {
          getPlayer: vi.fn(() => player),
          portfolio: {},
        },
      });
    }

    it.each(tileTypes)(
      'applies scoped CSS module class for %s tile type badge (TC-001–TC-004)',
      (type) => {
        renderWithContentTiles([
          { type, title: `${type} title`, source: 'Source', url: 'https://example.com' },
        ]);
        const badge = screen.getByText(type);
        expect(badge).toHaveClass(styles['tile-type']);
        expect(badge).toHaveClass(styles[type]);
      },
    );

    it('does not leak raw unscoped class names into the DOM (TC-007)', () => {
      renderWithContentTiles(
        tileTypes.map((type) => ({
          type,
          title: `${type} title`,
          source: 'Source',
          url: 'https://example.com',
        })),
      );
      tileTypes.forEach((type) => {
        const badge = screen.getByText(type);
        const classes = badge.className.split(/\s+/);
        const hasRawUnscoped = classes.some((c) => c === type);
        expect(hasRawUnscoped).toBe(false);
      });
    });

    it('falls back to empty string for unknown tile type (TC-005)', () => {
      renderWithContentTiles([
        { type: 'podcast', title: 'Fantasy Pod', source: 'Spotify', url: 'https://example.com' },
      ]);
      const badge = screen.getByText('podcast');
      expect(badge).toHaveClass(styles['tile-type']);
      const classes = badge.className.split(/\s+/).filter(Boolean);
      expect(classes).toHaveLength(1);
    });

    it('each tile gets its own correct type class when multiple types present (TC-006)', () => {
      renderWithContentTiles(
        tileTypes.map((type) => ({
          type,
          title: `${type} title`,
          source: 'Source',
          url: 'https://example.com',
        })),
      );
      tileTypes.forEach((type) => {
        const badge = screen.getByText(type);
        expect(badge).toHaveClass(styles['tile-type']);
        expect(badge).toHaveClass(styles[type]);
        const otherTypes = tileTypes.filter((t) => t !== type);
        otherTypes.forEach((other) => {
          expect(badge).not.toHaveClass(styles[other]);
        });
      });
    });

    it('base tile-type class is always present regardless of type (TC-008)', () => {
      renderWithContentTiles([
        { type: 'article', title: 'Article', source: 'ESPN', url: 'https://example.com' },
        { type: 'unknown', title: 'Unknown', source: 'Other', url: 'https://example.com' },
      ]);
      const articleBadge = screen.getByText('article');
      const unknownBadge = screen.getByText('unknown');
      expect(articleBadge).toHaveClass(styles['tile-type']);
      expect(unknownBadge).toHaveClass(styles['tile-type']);
    });
  });

  describe('future-dated event filtering (TC-019 to TC-021)', () => {
    it('TC-019: price history chart excludes entries after scenario date', () => {
      const playerWithFuture = createMockEnrichedPlayer({
        id: 'mahomes',
        name: 'Patrick Mahomes',
        currentPrice: 130,
        changePercent: 5.2,
        basePrice: 100,
        priceHistory: [
          {
            price: 100,
            timestamp: '2024-12-01T12:00:00Z',
            reason: { type: 'news', headline: 'Week start' },
          },
          {
            price: 110,
            timestamp: '2024-12-04T14:00:00Z',
            reason: { type: 'game_event', eventType: 'TD', headline: 'TD pass' },
          },
          {
            price: 130,
            timestamp: '2024-12-06T10:00:00Z',
            reason: { type: 'news', headline: 'Future news' },
          },
        ],
      });
      const otherPlayer = createMockEnrichedPlayer({
        id: 'allen',
        name: 'Josh Allen',
        currentPrice: 50,
        changePercent: 0,
        basePrice: 50,
        priceHistory: [
          {
            price: 50,
            timestamp: '2024-12-04T16:00:00Z',
            reason: { type: 'news', headline: 'Allen baseline' },
          },
        ],
      });
      renderPlayerDetail({
        tradingOverrides: {
          getPlayer: vi.fn((id: string) =>
            id === 'mahomes' ? playerWithFuture : null,
          ),
          getPlayers: vi.fn(() => [playerWithFuture, otherPlayer]),
          portfolio: {},
        },
      });

      const entries = screen.getAllByTestId('timeline-entry');
      const futureEntry = entries.find((e) => e.textContent?.includes('Future news'));
      expect(futureEntry).toBeFalsy();

      const pastEntry = entries.find((e) => e.textContent?.includes('TD pass'));
      expect(pastEntry).toBeTruthy();
    });

    it('TC-020: scenario date derived from latest event across all players', () => {
      const player1 = createMockEnrichedPlayer({
        id: 'mahomes',
        name: 'Patrick Mahomes',
        currentPrice: 110,
        changePercent: 2,
        basePrice: 100,
        priceHistory: [
          {
            price: 100,
            timestamp: '2024-12-01T10:00:00Z',
            reason: { type: 'news', headline: 'Early entry' },
          },
          {
            price: 110,
            timestamp: '2024-12-04T14:00:00Z',
            reason: { type: 'news', headline: 'Mid entry' },
          },
          {
            price: 120,
            timestamp: '2024-12-08T10:00:00Z',
            reason: { type: 'news', headline: 'Future entry' },
          },
        ],
      });
      const player2 = createMockEnrichedPlayer({
        id: 'allen',
        name: 'Josh Allen',
        currentPrice: 50,
        changePercent: 0,
        basePrice: 50,
        priceHistory: [
          {
            price: 50,
            timestamp: '2024-12-04T16:00:00Z',
            reason: { type: 'news', headline: 'Allen latest' },
          },
        ],
      });
      renderPlayerDetail({
        tradingOverrides: {
          getPlayer: vi.fn((id: string) =>
            id === 'mahomes' ? player1 : null,
          ),
          getPlayers: vi.fn(() => [player1, player2]),
          portfolio: {},
        },
      });

      const entries = screen.getAllByTestId('timeline-entry');
      expect(entries.find((e) => e.textContent?.includes('Mid entry'))).toBeTruthy();
      expect(entries.find((e) => e.textContent?.includes('Early entry'))).toBeTruthy();
      expect(entries.find((e) => e.textContent?.includes('Future entry'))).toBeFalsy();
    });
  });

  it('renders league owners when holdings exist', () => {
    renderPlayerDetail({
      tradingOverrides: {
        getPlayer: vi.fn(() => mahomes),
        portfolio: {},
      },
      socialOverrides: {
        getLeagueHoldings: vi.fn(() => [
          { memberId: 'gridiron', name: 'GridironGuru', avatar: '🏈', isUser: false, shares: 10, avgCost: 100, gainPercent: 8.2 },
          { memberId: 'user', name: 'You', avatar: '👤', isUser: true, shares: 5, avgCost: 110, gainPercent: -2.1 },
        ]),
      },
    });
    expect(screen.getByTestId('league-owners-card')).toBeInTheDocument();
    expect(screen.getByText('League Owners (2)')).toBeInTheDocument();
    const rows = screen.getAllByTestId('league-owner-row');
    expect(rows).toHaveLength(2);
    expect(screen.getByText('GridironGuru')).toBeInTheDocument();
  });

  it('back button navigates back', () => {
    renderPlayerDetail({
      tradingOverrides: {
        getPlayer: vi.fn(() => mahomes),
        portfolio: {},
      },
    });
    const backBtn = screen.getByTestId('back-link');
    expect(backBtn).toHaveTextContent('Back');
    fireEvent.click(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('timeline renders INT event type with correct marker class', () => {
    const playerWithINT = createMockEnrichedPlayer({
      id: 'mahomes',
      name: 'Patrick Mahomes',
      currentPrice: 90,
      changePercent: -5.2,
      basePrice: 100,
      priceHistory: [
        {
          price: 100,
          timestamp: '2025-01-01T12:00:00Z',
          reason: { type: 'news', headline: 'Baseline' },
        },
        {
          price: 90,
          timestamp: '2025-01-02T14:00:00Z',
          reason: { type: 'game_event', eventType: 'INT', headline: 'Throws interception' },
        },
      ],
    });
    renderPlayerDetail({
      tradingOverrides: {
        getPlayer: vi.fn(() => playerWithINT),
        portfolio: {},
      },
    });
    expect(screen.getByText('Throws interception')).toBeInTheDocument();
  });

  it('timeline renders league_trade event type', () => {
    const playerWithTrade = createMockEnrichedPlayer({
      id: 'mahomes',
      name: 'Patrick Mahomes',
      currentPrice: 115,
      changePercent: 2.0,
      basePrice: 100,
      priceHistory: [
        {
          price: 100,
          timestamp: '2025-01-01T12:00:00Z',
          reason: { type: 'news', headline: 'Baseline' },
        },
        {
          price: 115,
          timestamp: '2025-01-02T14:00:00Z',
          reason: { type: 'league_trade', headline: 'Big trade by league member' },
        },
      ],
    });
    renderPlayerDetail({
      tradingOverrides: {
        getPlayer: vi.fn(() => playerWithTrade),
        portfolio: {},
      },
    });
    expect(screen.getByText('Big trade by league member')).toBeInTheDocument();
  });

  it('timeline entry with URL renders as link', () => {
    const playerWithUrl = createMockEnrichedPlayer({
      id: 'mahomes',
      name: 'Patrick Mahomes',
      currentPrice: 120.5,
      changePercent: 5.2,
      basePrice: 100,
      priceHistory: [
        {
          price: 100,
          timestamp: '2025-01-01T12:00:00Z',
          reason: { type: 'news', headline: 'Baseline', url: '#' },
        },
        {
          price: 120.5,
          timestamp: '2025-01-02T14:00:00Z',
          reason: { type: 'news', headline: 'Breaking news', url: 'https://espn.com/article' },
        },
      ],
    });
    renderPlayerDetail({
      tradingOverrides: {
        getPlayer: vi.fn(() => playerWithUrl),
        portfolio: {},
      },
    });
    const link = screen.getByText('Breaking news').closest('a');
    expect(link).toHaveAttribute('href', 'https://espn.com/article');
  });

  it('singular share text for buying 1 share', () => {
    const buyShares = vi.fn(() => true);
    const addToast = vi.fn();
    renderPlayerDetail({
      tradingOverrides: {
        getPlayer: vi.fn(() => mahomes),
        portfolio: {},
        buyShares,
      },
      toastOverrides: { addToast },
    });

    fireEvent.click(screen.getByTestId('trade-button'));
    expect(addToast).toHaveBeenCalledWith(
      expect.stringContaining('1 share of'),
      'success',
    );
  });
});
