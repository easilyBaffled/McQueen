import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from '../Layout';
import styles from '../Layout.module.css';
import { renderWithProviders } from '../../../test/renderWithProviders';

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

vi.mock('../../ScenarioToggle/ScenarioToggle', () => ({
  default: () => <div data-testid="scenario-toggle">ScenarioToggle</div>,
}));

vi.mock('../../LiveTicker/LiveTicker', () => ({
  default: () => <div data-testid="live-ticker">LiveTicker</div>,
}));

vi.mock('../../TimelineDebugger/TimelineDebugger', () => ({
  default: () => <div data-testid="timeline-debugger">TimelineDebugger</div>,
}));

vi.mock('../../../shared', () => ({
  Glossary: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="glossary" role="dialog">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

function renderLayout(overrides = {}) {
  return renderWithProviders(
    <MemoryRouter>
      <Layout />
    </MemoryRouter>,
    overrides,
  );
}

describe('Layout', () => {
  beforeEach(() => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  it('renders McQUEEN logo', () => {
    renderLayout();
    expect(screen.getByText('McQUEEN')).toBeInTheDocument();
    expect(screen.getByText('NFL Stock Market')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderLayout();
    expect(screen.getByText('Timeline')).toBeInTheDocument();
    expect(screen.getByText('Market')).toBeInTheDocument();
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    expect(screen.getByText('Watchlist')).toBeInTheDocument();
    expect(screen.getByText('Mission')).toBeInTheDocument();
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
  });

  it('renders scenario toggle', () => {
    renderLayout();
    expect(screen.getByTestId('scenario-toggle')).toBeInTheDocument();
  });

  it('shows total value in header', () => {
    renderLayout({
      tradingOverrides: {
        cash: 5000,
        getPortfolioValue: vi.fn(() => ({ value: 3000, cost: 2500, gain: 500, gainPercent: 20 })),
      },
    });
    expect(screen.getByTestId('balance-label')).toHaveTextContent('Total Value');
  });

  it('renders LiveTicker when scenario is live', () => {
    renderLayout({ scenarioOverrides: { scenario: 'live' } });
    expect(screen.getByTestId('live-ticker')).toBeInTheDocument();
  });

  it('does not render LiveTicker for midweek scenario', () => {
    renderLayout({ scenarioOverrides: { scenario: 'midweek' } });
    expect(screen.queryByTestId('live-ticker')).not.toBeInTheDocument();
  });

  it('opens glossary when help button clicked', () => {
    renderLayout();
    expect(screen.queryByTestId('glossary')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('help-button'));
    expect(screen.getByTestId('glossary')).toBeInTheDocument();
  });

  it('closes glossary when close clicked', () => {
    renderLayout();
    fireEvent.click(screen.getByTestId('help-button'));
    expect(screen.getByTestId('glossary')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('glossary')).not.toBeInTheDocument();
  });

  it('has skip to main content link', () => {
    renderLayout();
    expect(screen.getByText('Skip to main content')).toBeInTheDocument();
  });

  it('renders main navigation with aria-label', () => {
    renderLayout();
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
  });

  describe('NavLink CSS module classes', () => {
    function renderLayoutAtRoute(route: string, overrides = {}) {
      return renderWithProviders(
        <MemoryRouter initialEntries={[route]}>
          <Layout />
        </MemoryRouter>,
        overrides,
      );
    }

    it('applies scoped nav-link class to all NavLinks', () => {
      renderLayoutAtRoute('/');
      const navLinks = screen.getAllByTestId('nav-link');
      expect(navLinks).toHaveLength(6);
      navLinks.forEach((link) => {
        expect(link).toHaveClass(styles['nav-link']);
      });
    });

    it('applies scoped active class to the Timeline link on "/"', () => {
      renderLayoutAtRoute('/');
      const timelineLink = screen.getByText('Timeline').closest('a')!;
      expect(timelineLink).toHaveClass(styles['nav-link']);
      expect(timelineLink).toHaveClass(styles['active']);
    });

    it('does not apply active class to inactive NavLinks', () => {
      renderLayoutAtRoute('/');
      const inactiveLabels = ['Market', 'Portfolio', 'Watchlist', 'Mission', 'Leaderboard'];
      inactiveLabels.forEach((label) => {
        const link = screen.getByText(label).closest('a')!;
        expect(link).toHaveClass(styles['nav-link']);
        expect(link).not.toHaveClass(styles['active']);
      });
    });

    it('applies active class to Market link on "/market"', () => {
      renderLayoutAtRoute('/market');
      const marketLink = screen.getByText('Market').closest('a')!;
      expect(marketLink).toHaveClass(styles['active']);
      const timelineLink = screen.getByText('Timeline').closest('a')!;
      expect(timelineLink).not.toHaveClass(styles['active']);
    });

    it('applies active class only to the matching route NavLink', () => {
      const routeMap: Record<string, string> = {
        '/': 'Timeline',
        '/market': 'Market',
        '/portfolio': 'Portfolio',
        '/watchlist': 'Watchlist',
        '/mission': 'Mission',
        '/leaderboard': 'Leaderboard',
      };

      for (const [route, expectedActive] of Object.entries(routeMap)) {
        const { unmount } = renderLayoutAtRoute(route);
        const activeLink = screen.getByText(expectedActive).closest('a')!;
        expect(activeLink).toHaveClass(styles['active']);

        const allLabels = Object.values(routeMap);
        allLabels
          .filter((label) => label !== expectedActive)
          .forEach((label) => {
            const link = screen.getByText(label).closest('a')!;
            expect(link).not.toHaveClass(styles['active']);
          });

        unmount();
      }
    });

    it('Timeline NavLink uses end prop for exact-match active detection', () => {
      renderLayoutAtRoute('/market');
      const timelineLink = screen.getByText('Timeline').closest('a')!;
      expect(timelineLink).not.toHaveClass(styles['active']);
    });
  });
});
