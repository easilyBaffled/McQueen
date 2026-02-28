import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlayerCard from '../PlayerCard/PlayerCard';
import { ToastProvider, useToast } from '../Toast/ToastProvider';
import Layout from '../Layout/Layout';
import AddEventModal from '../AddEventModal/AddEventModal';
import { Glossary, EventMarkerPopup, FirstTradeGuide } from '../../shared';
import Portfolio from '../../pages/Portfolio/Portfolio';
import Leaderboard from '../../pages/Leaderboard/Leaderboard';

vi.mock('../../context/ScenarioContext', () => ({
  useScenario: () => ({
    scenario: 'midweek',
    setScenario: vi.fn(),
    currentData: { headline: 'Test' },
    players: [],
  }),
}));

vi.mock('../../context/SimulationContext', () => ({
  useSimulation: () => ({
    espnLoading: false,
    espnError: null,
    refreshEspnNews: vi.fn(),
    history: [],
    tick: 0,
    unifiedTimeline: [],
    isPlaying: false,
    setIsPlaying: vi.fn(),
    goToHistoryPoint: vi.fn(),
  }),
}));

vi.mock('../../context/TradingContext', () => ({
  useTrading: () => ({
    portfolio: {},
    cash: 10000,
    getPortfolioValue: () => ({ value: 0, gain: 0, gainPercent: 0 }),
    getPlayers: () => [],
    getPlayer: () => null,
    buyShares: vi.fn(),
    sellShares: vi.fn(),
    getEffectivePrice: () => 0,
  }),
}));

vi.mock('../../context/SocialContext', () => ({
  useSocial: () => ({
    isWatching: () => false,
    getLeagueHoldings: () => [],
    getLeaderboardRankings: () => [
      { memberId: 'user', name: 'You', avatar: '👤', isUser: true, cash: 10000, holdingsValue: 500, totalValue: 10500, rank: 1, gapToNext: 0, gain: 500, gainPercent: 5 },
      { memberId: 'ai1', name: 'Bot1', avatar: '🤖', isUser: false, cash: 9000, holdingsValue: 1000, totalValue: 10000, rank: 2, gapToNext: 500, gain: 0, gainPercent: 0 },
    ],
    getLeagueMembers: () => [],
    watchlist: [],
    missionPicks: { risers: [], fallers: [] },
    missionRevealed: false,
  }),
}));

vi.mock('../../utils/playerImages', () => ({
  getPlayerHeadshotUrl: () => null,
}));

vi.mock('../../utils/devMode', () => ({
  isDevMode: () => false,
}));

vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('react-router-dom', () => ({
  NavLink: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <a {...props as React.AnchorHTMLAttributes<HTMLAnchorElement>}>{children}</a>,
  Outlet: () => <div data-testid="outlet" />,
  useLocation: () => ({ pathname: '/' }),
  Link: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <a {...props as React.AnchorHTMLAttributes<HTMLAnchorElement>}>{children}</a>,
  useNavigate: () => vi.fn(),
}));

vi.mock('framer-motion', () => {
  const componentCache: Record<string, React.ComponentType<Record<string, unknown>>> = {};
  return {
    motion: new Proxy(
      {},
      {
        get: (_: unknown, tag: string | symbol) => {
          const tagStr = String(tag);
          if (!componentCache[tagStr]) {
            const Component = ({ children, ref, ...props }: { children?: React.ReactNode; ref?: React.Ref<unknown>; [key: string]: unknown }) => {
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
  };
});

const basePlayer = {
  id: 'p1',
  name: 'Patrick Mahomes',
  team: 'KC',
  position: 'QB',
  basePrice: 50,
  currentPrice: 54.25,
  changePercent: 2.5,
  priceChange: 1.25,
  moveReason: 'test reason',
  contentTiles: [],
  priceHistory: [] as import('../../types').PriceHistoryEntry[],
};

const downPlayer = {
  ...basePlayer,
  id: 'p2',
  name: 'Joe Burrow',
  changePercent: -3.1,
};

// --- mcq-o0b.2: ARIA attributes ---

describe('ARIA attributes (mcq-o0b.2)', () => {
  it('toast notifications have role="alert" or aria-live', () => {
    function TriggerToast() {
      const { addToast } = useToast();
      return (
        <button onClick={() => addToast('Test message', 'success')}>
          Toast
        </button>
      );
    }

    render(
      <ToastProvider>
        <TriggerToast />
      </ToastProvider>,
    );

    const container = document.querySelector('[aria-live="polite"]') || document.querySelector('[role="status"]');
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute('aria-live', 'polite');
  });

  it('Glossary modal has role="dialog" and aria-modal', () => {
    render(<Glossary isOpen={true} onClose={() => {}} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');
  });

  it('Glossary close button has aria-label', () => {
    render(<Glossary isOpen={true} onClose={() => {}} />);

    const closeBtn = screen.getByLabelText(/close/i);
    expect(closeBtn).toBeInTheDocument();
  });

  it('Glossary search input has aria-label', () => {
    render(<Glossary isOpen={true} onClose={() => {}} />);

    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toBeInTheDocument();
  });

  it('icon-only buttons in toast have aria-label', async () => {
    function TriggerToast() {
      const { addToast } = useToast();
      return (
        <button onClick={() => addToast('Test message', 'success')}>
          Toast
        </button>
      );
    }

    render(
      <ToastProvider>
        <TriggerToast />
      </ToastProvider>,
    );

    const user = userEvent.setup();
    await user.click(screen.getByText('Toast'));

    const closeBtn = screen.getByLabelText(/dismiss/i);
    expect(closeBtn).toBeInTheDocument();
  });

  it('AddEventModal has role="dialog", aria-modal, and aria-labelledby', () => {
    render(
      <AddEventModal
        isOpen={true}
        onClose={() => {}}
        onSubmit={() => {}}
        players={[]}
      />,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');
  });

  it('EventMarkerPopup close button has aria-label', () => {
    const event = {
      type: 'TD',
      headline: 'Touchdown!',
      source: 'ESPN',
      price: 55.0,
    };

    render(
      <EventMarkerPopup
        event={event}
        position={{ x: 100, y: 100 }}
        onClose={() => {}}
      />,
    );

    const closeBtn = screen.getByLabelText(/close/i);
    expect(closeBtn).toBeInTheDocument();
  });

  it('FirstTradeGuide close button has aria-label', async () => {
    localStorage.setItem('mcqueen-onboarding-just-completed', 'true');
    localStorage.removeItem('mcqueen-first-trade-seen');

    vi.useFakeTimers();
    render(<FirstTradeGuide hasCompletedFirstTrade={false} />);
    vi.advanceTimersByTime(600);
    vi.useRealTimers();

    const closeBtn = await screen.findByLabelText(/close/i);
    expect(closeBtn).toBeInTheDocument();

    localStorage.removeItem('mcqueen-onboarding-just-completed');
  });

  it('Layout nav has aria-label for main navigation', () => {
    render(<Layout />);

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label');
  });

  it('Layout main has proper landmark role', () => {
    render(<Layout />);

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });
});

// --- mcq-o0b.3: Keyboard navigation ---

describe('Keyboard navigation (mcq-o0b.3)', () => {
  it('Escape key closes Glossary modal', async () => {
    const onClose = vi.fn();
    render(<Glossary isOpen={true} onClose={onClose} />);

    const user = userEvent.setup();
    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
  });

  it('skip-to-main-content link is present in Layout', () => {
    render(<Layout />);

    const skipLink = screen.getByText(/skip to main content/i);
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('Escape key closes AddEventModal', async () => {
    const onClose = vi.fn();
    render(
      <AddEventModal
        isOpen={true}
        onClose={onClose}
        onSubmit={() => {}}
        players={[]}
      />,
    );

    const user = userEvent.setup();
    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
  });

  it('Glossary traps focus inside the dialog', async () => {
    render(<Glossary isOpen={true} onClose={() => {}} />);

    const dialog = screen.getByRole('dialog');
    const focusableElements = dialog.querySelectorAll(
      'button, input, [tabindex]:not([tabindex="-1"])',
    );
    expect(focusableElements.length).toBeGreaterThan(0);

    const lastFocusable = focusableElements[focusableElements.length - 1];

    (lastFocusable as HTMLElement).focus();
    expect(document.activeElement).toBe(lastFocusable);

    const user = userEvent.setup();
    await user.tab();

    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('AddEventModal moves initial focus to close button when opened', () => {
    render(
      <AddEventModal
        isOpen={true}
        onClose={() => {}}
        onSubmit={() => {}}
        players={[]}
      />,
    );

    const closeBtn = screen.getByLabelText('Close modal');
    expect(closeBtn).toHaveFocus();
  });

  it('ScenarioToggle desktop tabs support arrow key navigation', async () => {
    render(<Layout />);

    const tabs = screen.getAllByTitle(
      /simulated midweek|watch prices|playoff scenario|live super bowl|real espn/i,
    );
    expect(tabs.length).toBeGreaterThan(1);

    tabs[0].focus();
    const user = userEvent.setup();
    await user.keyboard('{ArrowRight}');

    expect(document.activeElement).toBe(tabs[1]);
  });
});

// --- mcq-o0b.4: Secondary indicators for color-coded values ---

describe('Secondary indicators for color-coded values (mcq-o0b.4)', () => {
  it('positive price change shows up arrow icon', () => {
    render(<PlayerCard player={basePlayer} />);

    const changeEl = screen.getByText(/2\.50%/);
    expect(changeEl.textContent).toContain('▲');
    expect(changeEl).toHaveAttribute('aria-label');
    expect(changeEl.getAttribute('aria-label')).toMatch(/up|gain|increase/i);
  });

  it('negative price change shows down arrow icon', () => {
    render(<PlayerCard player={downPlayer} />);

    const changeEl = screen.getByText(/3\.10%/);
    expect(changeEl.textContent).toContain('▼');
    expect(changeEl).toHaveAttribute('aria-label');
    expect(changeEl.getAttribute('aria-label')).toMatch(/down|loss|decrease/i);
  });

  it('Portfolio total gain/loss shows arrow and aria-label', () => {
    render(<Portfolio />);

    const gainEls = document.querySelectorAll('[aria-label*="ain"], [aria-label*="oss"]');
    const gainEl = Array.from(gainEls).find((el) => /[▲▼]/.test(el.textContent ?? ''));
    expect(gainEl).toBeInTheDocument();
    expect(gainEl!.textContent).toMatch(/[▲▼]/);
    expect(gainEl).toHaveAttribute('aria-label');
    expect(gainEl!.getAttribute('aria-label')).toMatch(/gain|loss/i);
  });

  it('Leaderboard user rank change shows arrow and aria-label', () => {
    render(<Leaderboard />);

    const ariaEls = document.querySelectorAll('[aria-label*="percent"]');
    const rankChange = Array.from(ariaEls).find((el) => /[▲▼]/.test(el.textContent ?? ''));
    expect(rankChange).toBeInTheDocument();
    expect(rankChange!.textContent).toMatch(/[▲▼]/);
    expect(rankChange).toHaveAttribute('aria-label');
  });

  it('Leaderboard trader weekly gains show arrows and aria-labels', () => {
    render(<Leaderboard />);

    const ariaEls = document.querySelectorAll('[aria-label*="percent"]');
    const gains = Array.from(ariaEls).filter((el) => /[▲▼]/.test(el.textContent ?? ''));
    expect(gains.length).toBeGreaterThan(0);
    gains.forEach((el) => {
      expect(el.textContent).toMatch(/[▲▼]/);
      expect(el).toHaveAttribute('aria-label');
    });
  });
});
