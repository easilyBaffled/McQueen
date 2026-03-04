import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Watchlist from '../Watchlist';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { createMockEnrichedPlayer } from '../../../test/mockData';
import type { EnrichedPlayer, SocialContextValue, TradingContextValue } from '../../../types';

// ── Mock child components ──────────────────────────────────────────

vi.mock('../../../components/PlayerCard/PlayerCard', () => ({
  default: (props: { player: EnrichedPlayer }) => (
    <div
      data-testid={`player-card-${props.player.id}`}
      data-player-name={props.player.name}
    >
      PlayerCard:{props.player.name}
    </div>
  ),
}));

const componentCache: Record<string, React.ComponentType<Record<string, unknown>>> = {};
vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_: unknown, tag: string | symbol) => {
        const tagStr = String(tag);
        if (!componentCache[tagStr]) {
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
              if (
                typeof value !== 'object' &&
                !key.startsWith('initial') &&
                !key.startsWith('animate') &&
                !key.startsWith('exit') &&
                !key.startsWith('transition') &&
                !key.startsWith('whileHover') &&
                !key.startsWith('whileTap') &&
                !key.startsWith('layout')
              ) {
                domProps[key] = value;
              }
            }
            return React.createElement(tagStr, { ref, ...domProps }, children);
          };
          Component.displayName = `motion.${tagStr}`;
          componentCache[tagStr] = Component;
        }
        return componentCache[tagStr];
      },
    },
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ── Test data ──────────────────────────────────────────────────────

const mahomes = createMockEnrichedPlayer({
  id: 'p1',
  name: 'Patrick Mahomes',
  team: 'KC',
  position: 'QB',
  currentPrice: 150,
  changePercent: 5.0,
  priceChange: 7.5,
});

const allen = createMockEnrichedPlayer({
  id: 'p2',
  name: 'Josh Allen',
  team: 'BUF',
  position: 'QB',
  currentPrice: 140,
  changePercent: -8.0,
  priceChange: -11.0,
});

const hurts = createMockEnrichedPlayer({
  id: 'p3',
  name: 'Jalen Hurts',
  team: 'PHI',
  position: 'QB',
  currentPrice: 130,
  changePercent: 3.0,
  priceChange: 4.0,
});

const lamb = createMockEnrichedPlayer({
  id: 'p4',
  name: 'CeeDee Lamb',
  team: 'DAL',
  position: 'WR',
  currentPrice: 110,
  changePercent: -1.5,
  priceChange: -1.7,
});

const brown = createMockEnrichedPlayer({
  id: 'p5',
  name: 'AJ Brown',
  team: 'PHI',
  position: 'WR',
  currentPrice: 100,
  changePercent: 6.5,
  priceChange: 6.5,
});

const hill = createMockEnrichedPlayer({
  id: 'p6',
  name: 'Tyreek Hill',
  team: 'MIA',
  position: 'WR',
  currentPrice: 90,
  changePercent: -0.2,
  priceChange: -0.2,
});

const allPlayers = [mahomes, allen, hurts, lamb, brown, hill];

// ── Helpers ────────────────────────────────────────────────────────

function renderWatchlist(opts: {
  watchlist?: string[];
  players?: EnrichedPlayer[];
  socialOverrides?: Partial<SocialContextValue>;
  tradingOverrides?: Partial<TradingContextValue>;
} = {}) {
  const { watchlist = [], players = allPlayers, socialOverrides, tradingOverrides } = opts;

  const playerMap = new Map(players.map((p) => [p.id, p]));

  return renderWithProviders(
    <MemoryRouter>
      <Watchlist />
    </MemoryRouter>,
    {
      socialOverrides: {
        watchlist,
        ...socialOverrides,
      },
      tradingOverrides: {
        getPlayers: vi.fn(() => players),
        getPlayer: vi.fn((id: string) => playerMap.get(id) ?? null),
        ...tradingOverrides,
      },
    },
  );
}

// ── Suite ──────────────────────────────────────────────────────────

describe('Watchlist page', () => {
  // TC-001: Empty state renders when watchlist is empty
  it('renders the empty-state container when watchlist is empty', () => {
    const { container } = renderWatchlist();

    const emptyState = container.querySelector('[class*="empty-state"][class*="enhanced"]');
    expect(emptyState).toBeInTheDocument();

    const grid = container.querySelector('[class*="watchlist-grid"]');
    expect(grid).not.toBeInTheDocument();
  });

  // TC-002: Empty state illustration — heart SVG and headings
  it('shows the heart SVG illustration and empty-state headings', () => {
    renderWatchlist();

    const svg = document.querySelector('svg[viewBox="0 0 80 80"]');
    expect(svg).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 3, name: 'Track Your Favorites' })).toBeInTheDocument();
    expect(screen.getByText(/Watch players you're interested in without committing to buy/)).toBeInTheDocument();
  });

  // TC-003: Page title and subtitle always render
  it('renders page title and subtitle with an empty watchlist', () => {
    renderWatchlist();

    expect(screen.getByRole('heading', { level: 1, name: 'Your Watchlist' })).toBeInTheDocument();
    expect(screen.getByText("Players you're keeping an eye on")).toBeInTheDocument();
  });

  it('renders page title and subtitle with a non-empty watchlist', () => {
    renderWatchlist({ watchlist: ['p1'] });

    expect(screen.getByRole('heading', { level: 1, name: 'Your Watchlist' })).toBeInTheDocument();
    expect(screen.getByText("Players you're keeping an eye on")).toBeInTheDocument();
  });

  // TC-004: Quick-add popular players section renders in empty state
  it('shows up to 4 popular players sorted by abs(changePercent)', () => {
    renderWatchlist();

    expect(screen.getByText('📊 Popular Players')).toBeInTheDocument();

    const buttons = screen.getAllByRole('button');
    const _quickAddButtons = buttons.filter((btn) =>
      btn.className.includes('quick-add-player') || btn.querySelector('[class*="quick-add-name"]'),
    );

    // Fallback: find by player names in expected order
    // Expected order by |changePercent|: Allen(8.0), Brown(6.5), Mahomes(5.0), Hurts(3.0)
    const playerNames = screen.getAllByText(/^(Josh Allen|AJ Brown|Patrick Mahomes|Jalen Hurts|CeeDee Lamb|Tyreek Hill)$/);
    const displayedNames = playerNames
      .filter((el) => el.className.includes('quick-add-name') || el.closest('button'))
      .map((el) => el.textContent);

    expect(displayedNames).toEqual(['Josh Allen', 'AJ Brown', 'Patrick Mahomes', 'Jalen Hurts']);
  });

  // TC-005: Quick-add section hidden when no players available
  it('hides popular players section when getPlayers returns empty', () => {
    renderWatchlist({ players: [] });

    expect(screen.queryByText('📊 Popular Players')).not.toBeInTheDocument();
    expect(screen.getByText('Track Your Favorites')).toBeInTheDocument();
    expect(screen.getByText('Browse All Players')).toBeInTheDocument();
  });

  // TC-006: Quick-add filters out already-watched players
  it('does not show quick-add section when watchlist is non-empty (grid shown instead)', () => {
    renderWatchlist({ watchlist: ['p1', 'p2'] });

    expect(screen.queryByText('📊 Popular Players')).not.toBeInTheDocument();
  });

  // TC-007: Quick-add button shows player team, name, and change percent
  it('displays team badge, name, and formatted change percent in quick-add buttons', () => {
    renderWatchlist({ players: [mahomes, allen] });

    // Positive change: Mahomes +5.0%
    // Note: Allen has higher |changePercent| so appears first
    expect(screen.getByText('BUF')).toBeInTheDocument();
    expect(screen.getByText('KC')).toBeInTheDocument();

    const upChange = screen.getByLabelText('Up 5.0 percent');
    expect(upChange).toBeInTheDocument();
    expect(upChange.textContent).toContain('▲');
    expect(upChange.textContent).toContain('5.0%');

    const downChange = screen.getByLabelText('Down 8.0 percent');
    expect(downChange).toBeInTheDocument();
    expect(downChange.textContent).toContain('▼');
    expect(downChange.textContent).toContain('8.0%');
  });

  // TC-007 edge case: zero changePercent treated as non-negative
  it('shows up arrow for player with 0% change', () => {
    const zeroPlayer = createMockEnrichedPlayer({
      id: 'pz',
      name: 'Zero Change',
      team: 'NYJ',
      changePercent: 0,
    });
    renderWatchlist({ players: [zeroPlayer] });

    const change = screen.getByLabelText('Up 0.0 percent');
    expect(change.textContent).toContain('▲');
    expect(change.textContent).toContain('0.0%');
  });

  // TC-008: Clicking quick-add calls addToWatchlist and shows success toast
  it('calls addToWatchlist and shows success toast on quick-add click', async () => {
    const addToWatchlist = vi.fn();

    renderWatchlist({
      players: [mahomes],
      socialOverrides: { watchlist: [], addToWatchlist },
      tradingOverrides: {
        getPlayers: vi.fn(() => [mahomes]),
        getPlayer: vi.fn(() => null),
      },
    });

    const user = userEvent.setup();
    const button = screen.getByText('Patrick Mahomes').closest('button')!;
    await user.click(button);

    expect(addToWatchlist).toHaveBeenCalledOnce();
    expect(addToWatchlist).toHaveBeenCalledWith('p1');
  });

  it('shows success toast with player name on quick-add', async () => {
    const addToWatchlist = vi.fn();
    const addToast = vi.fn((_msg: string, _type?: string, _dur?: number) => 1);

    renderWithProviders(
      <MemoryRouter>
        <Watchlist />
      </MemoryRouter>,
      {
        socialOverrides: { watchlist: [], addToWatchlist },
        tradingOverrides: {
          getPlayers: vi.fn(() => [mahomes]),
          getPlayer: vi.fn(() => null),
        },
        toastOverrides: { addToast },
      },
    );

    const user = userEvent.setup();
    const button = screen.getByText('Patrick Mahomes').closest('button')!;
    await user.click(button);

    expect(addToast).toHaveBeenCalledOnce();
    expect(addToast).toHaveBeenCalledWith('Added Patrick Mahomes to watchlist', 'success');
  });

  // TC-009: Watchlist grid renders PlayerCard for each watched player
  it('renders a PlayerCard for each watched player in the grid', () => {
    const { container } = renderWatchlist({ watchlist: ['p1', 'p2', 'p3'] });

    const grid = container.querySelector('[class*="watchlist-grid"]');
    expect(grid).toBeInTheDocument();

    expect(screen.getByTestId('player-card-p1')).toBeInTheDocument();
    expect(screen.getByTestId('player-card-p2')).toBeInTheDocument();
    expect(screen.getByTestId('player-card-p3')).toBeInTheDocument();
    expect(screen.getAllByTestId(/^player-card-/).length).toBe(3);
  });

  // TC-010: Watchlist grid with a single watched player
  it('renders grid with one PlayerCard and hides empty state', () => {
    const { container } = renderWatchlist({ watchlist: ['p1'] });

    const grid = container.querySelector('[class*="watchlist-grid"]');
    expect(grid).toBeInTheDocument();
    expect(screen.getAllByTestId(/^player-card-/).length).toBe(1);
    expect(screen.queryByText('Track Your Favorites')).not.toBeInTheDocument();
  });

  // TC-011: Each watched player card links to player detail page
  it('wraps each PlayerCard in a link to /player/:id', () => {
    renderWatchlist({ watchlist: ['p1', 'p2'] });

    const card1 = screen.getByTestId('player-card-p1');
    const link1 = card1.closest('a');
    expect(link1).toHaveAttribute('href', '/player/p1');

    const card2 = screen.getByTestId('player-card-p2');
    const link2 = card2.closest('a');
    expect(link2).toHaveAttribute('href', '/player/p2');
  });

  // TC-012: Remove button calls removeFromWatchlist and shows info toast
  it('calls removeFromWatchlist and shows info toast on remove click', async () => {
    const removeFromWatchlist = vi.fn();
    const addToast = vi.fn((_msg: string, _type?: string, _dur?: number) => 1);

    renderWithProviders(
      <MemoryRouter>
        <Watchlist />
      </MemoryRouter>,
      {
        socialOverrides: { watchlist: ['p1'], removeFromWatchlist },
        tradingOverrides: {
          getPlayers: vi.fn(() => allPlayers),
          getPlayer: vi.fn((id: string) => (id === 'p1' ? mahomes : null)),
        },
        toastOverrides: { addToast },
      },
    );

    const user = userEvent.setup();
    const removeBtn = screen.getByTitle('Remove from watchlist');
    await user.click(removeBtn);

    expect(removeFromWatchlist).toHaveBeenCalledOnce();
    expect(removeFromWatchlist).toHaveBeenCalledWith('p1');
    expect(addToast).toHaveBeenCalledOnce();
    expect(addToast).toHaveBeenCalledWith('Removed Patrick Mahomes from watchlist', 'info');
  });

  // TC-013: Remove button calls preventDefault to avoid navigation
  it('calls preventDefault on remove button click to prevent navigation', () => {
    renderWatchlist({ watchlist: ['p1'] });

    const removeBtn = screen.getByTitle('Remove from watchlist');
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');

    fireEvent(removeBtn, clickEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  // TC-014: Remove button has correct aria-label for accessibility
  it('has accessible aria-labels on remove buttons naming the player', () => {
    renderWatchlist({ watchlist: ['p1', 'p2'] });

    expect(screen.getByLabelText('Remove Patrick Mahomes from watchlist')).toBeInTheDocument();
    expect(screen.getByLabelText('Remove Josh Allen from watchlist')).toBeInTheDocument();
  });

  // TC-015: Browse All Players link navigates to /market
  it('renders Browse All Players link pointing to /market in empty state', () => {
    renderWatchlist();

    const link = screen.getByText('Browse All Players').closest('a');
    expect(link).toHaveAttribute('href', '/market');
  });

  // TC-016: Null players filtered from watchedPlayers array
  it('filters out null players from the watchlist grid', () => {
    renderWatchlist({ watchlist: ['p1', 'p_invalid', 'p2'] });

    expect(screen.getAllByTestId(/^player-card-/).length).toBe(2);
    expect(screen.getByTestId('player-card-p1')).toBeInTheDocument();
    expect(screen.getByTestId('player-card-p2')).toBeInTheDocument();
  });

  // TC-016 edge case: all null → shows empty state
  it('shows empty state when all watchlist IDs resolve to null', () => {
    renderWithProviders(
      <MemoryRouter>
        <Watchlist />
      </MemoryRouter>,
      {
        socialOverrides: { watchlist: ['invalid1', 'invalid2'] },
        tradingOverrides: {
          getPlayers: vi.fn(() => allPlayers),
          getPlayer: vi.fn(() => null),
        },
      },
    );

    expect(screen.getByText('Track Your Favorites')).toBeInTheDocument();
    expect(screen.queryAllByTestId(/^player-card-/).length).toBe(0);
  });
});
