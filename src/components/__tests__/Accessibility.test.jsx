import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlayerCard from '../PlayerCard';
import Toast, { ToastProvider, useToast } from '../Toast';
import Layout from '../Layout';
import Glossary from '../Glossary';
import Onboarding from '../Onboarding';
import AddEventModal from '../AddEventModal';
import EventMarkerPopup from '../EventMarkerPopup';
import FirstTradeGuide from '../FirstTradeGuide';

vi.mock('../../context/GameContext', () => ({
  useGame: () => ({
    scenario: 'midweek',
    portfolio: {},
    cash: 10000,
    isWatching: () => false,
    getLeagueHoldings: () => [],
    getPortfolioValue: () => ({ value: 0, gain: 0, gainPercent: 0 }),
    setScenario: vi.fn(),
    espnLoading: false,
    espnError: null,
    refreshEspnNews: vi.fn(),
    currentData: { headline: 'Test' },
    getPlayers: () => [],
    getLeaderboardRankings: () => [],
  }),
}));

vi.mock('../../utils/playerImages', () => ({
  getPlayerHeadshotUrl: () => null,
}));

vi.mock('../../utils/devMode', () => ({
  isDevMode: () => false,
}));

vi.mock('recharts', () => ({
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
}));

vi.mock('react-router-dom', () => ({
  NavLink: ({ children, ...props }) => <a {...props}>{children}</a>,
  Outlet: () => <div data-testid="outlet" />,
  useLocation: () => ({ pathname: '/' }),
  Link: ({ children, ...props }) => <a {...props}>{children}</a>,
  useNavigate: () => vi.fn(),
}));

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag) => {
        const Component = ({ children, ...props }) => {
          const domProps = {};
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
          const El = tag;
          return <El {...domProps}>{children}</El>;
        };
        Component.displayName = `motion.${tag}`;
        return Component;
      },
    },
  ),
  AnimatePresence: ({ children }) => <>{children}</>,
}));

const basePlayer = {
  id: 'p1',
  name: 'Patrick Mahomes',
  team: 'KC',
  position: 'QB',
  currentPrice: 54.25,
  changePercent: 2.5,
  priceHistory: [50, 51, 52, 53],
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

    const container = document.querySelector('.toast-container');
    expect(container).toHaveAttribute('aria-live', 'polite');
    expect(container).toHaveAttribute('role', 'status');
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
});
