import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import Leaderboard from '../Leaderboard';

vi.mock('../../../context/TradingContext', () => ({
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

const mockRankings = [
  { memberId: 'gridiron', name: 'GridironGuru', avatar: '🏈', isUser: false, cash: 2000, holdingsValue: 12500, totalValue: 14500, rank: 1, gapToNext: 0, gainPercent: 8.2 },
  { memberId: 'tdking', name: 'TDKing2024', avatar: '👑', isUser: false, cash: 2000, holdingsValue: 11800, totalValue: 13800, rank: 2, gapToNext: 700, gainPercent: 5.1 },
  { memberId: 'fantasymvp', name: 'FantasyMVP', avatar: '🏆', isUser: false, cash: 2000, holdingsValue: 10200, totalValue: 12200, rank: 3, gapToNext: 1600, gainPercent: 3.4 },
  { memberId: 'stockjock', name: 'StockJock', avatar: '📈', isUser: false, cash: 2000, holdingsValue: 9500, totalValue: 11500, rank: 4, gapToNext: 700, gainPercent: -1.2 },
  { memberId: 'user', name: 'You', avatar: '👤', isUser: true, cash: 10000, holdingsValue: 0, totalValue: 10000, rank: 5, gapToNext: 1500, gain: 0, gainPercent: 0 },
  { memberId: 'rookie', name: 'RookieTrader', avatar: '🌟', isUser: false, cash: 2000, holdingsValue: 7200, totalValue: 9200, rank: 6, gapToNext: 800, gainPercent: 2.3 },
  { memberId: 'chartchaser', name: 'ChartChaser', avatar: '📊', isUser: false, cash: 2000, holdingsValue: 6800, totalValue: 8800, rank: 7, gapToNext: 400, gainPercent: 1.0 },
  { memberId: 'endzone', name: 'EndZoneElite', avatar: '🎯', isUser: false, cash: 2000, holdingsValue: 6000, totalValue: 8000, rank: 8, gapToNext: 800, gainPercent: -0.5 },
  { memberId: 'pigskin', name: 'PigSkinPro', avatar: '🐷', isUser: false, cash: 2000, holdingsValue: 5500, totalValue: 7500, rank: 9, gapToNext: 500, gainPercent: 0.8 },
  { memberId: 'nflnerd', name: 'NFLNerd', avatar: '🤓', isUser: false, cash: 2000, holdingsValue: 4800, totalValue: 6800, rank: 10, gapToNext: 700, gainPercent: -2.1 },
  { memberId: 'bullmarket', name: 'BullMarketBob', avatar: '🐂', isUser: false, cash: 2000, holdingsValue: 4000, totalValue: 6000, rank: 11, gapToNext: 800, gainPercent: 0.3 },
];

vi.mock('../../../context/SocialContext', () => ({
  useSocial: () => ({
    getLeaderboardRankings: () => mockRankings,
    isWatching: () => false,
    getLeagueHoldings: () => [],
    getLeagueMembers: () => [],
    watchlist: [],
    missionPicks: { risers: [], fallers: [] },
    missionRevealed: false,
  }),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [key: string]: unknown }) => (
    <a href={to} {...props as React.AnchorHTMLAttributes<HTMLAnchorElement>}>{children}</a>
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
}));

describe('Leaderboard – real data integration (mcq-35g.6)', () => {
  it('renders trader names from league data, not hardcoded placeholders', () => {
    render(<Leaderboard />);

    expect(screen.getByText('GridironGuru')).toBeInTheDocument();
    expect(screen.getByText('TDKing2024')).toBeInTheDocument();
    expect(screen.getByText('FantasyMVP')).toBeInTheDocument();
    expect(screen.getByText('StockJock')).toBeInTheDocument();
    expect(screen.getByText('RookieTrader')).toBeInTheDocument();
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    expect(screen.queryByText('TraderX')).not.toBeInTheDocument();
  });

  it('renders all 11 league members (10 AI + 1 user)', () => {
    render(<Leaderboard />);

    const rows = document.querySelectorAll('[class*="table-row"]');
    expect(rows.length).toBe(11);
  });

  it('displays portfolio values computed from holdings', () => {
    render(<Leaderboard />);

    expect(screen.getByText('$14,500.00')).toBeInTheDocument();
    expect(screen.getByText('$13,800.00')).toBeInTheDocument();
  });

  it('sorts rankings by total value descending', () => {
    render(<Leaderboard />);

    const rows = document.querySelectorAll('[class*="table-row"]');
    const values = Array.from(rows).map((row) => {
      const valueCell = row.querySelector('[class*="col-value"]');
      return parseFloat(valueCell?.textContent?.replace(/[$,]/g, '') ?? '0');
    });

    for (let i = 1; i < values.length; i++) {
      expect(values[i - 1]).toBeGreaterThanOrEqual(values[i]);
    }
  });

  it('highlights the user row and displays "You"', () => {
    render(<Leaderboard />);

    const userRow = document.querySelector('[class*="user-row"]');
    expect(userRow).toBeInTheDocument();
    expect(within(userRow as HTMLElement).getByText('You')).toBeInTheDocument();
  });

  it('shows medal icons for top 3 traders', () => {
    render(<Leaderboard />);

    const rows = document.querySelectorAll('[class*="table-row"]');
    expect(rows[0].textContent).toContain('🥇');
    expect(rows[1].textContent).toContain('🥈');
    expect(rows[2].textContent).toContain('🥉');
  });

  it('shows numeric rank for traders ranked 4th and below', () => {
    render(<Leaderboard />);

    const rows = document.querySelectorAll('[class*="table-row"]');
    const fourthRow = rows[3];
    expect(fourthRow.textContent).not.toContain('🥇');
    expect(fourthRow.textContent).not.toContain('🥈');
    expect(fourthRow.textContent).not.toContain('🥉');
    expect(fourthRow.querySelector('[class*="rank-number"]')?.textContent).toBe('4');
  });

  it('displays trader avatars from league data', () => {
    render(<Leaderboard />);

    expect(screen.getByText('🏈')).toBeInTheDocument();
    expect(screen.getByText('👑')).toBeInTheDocument();
    expect(screen.getByText('🏆')).toBeInTheDocument();
    expect(screen.getByText('📈')).toBeInTheDocument();
    expect(screen.getByText('🌟')).toBeInTheDocument();
  });

  it('shows weekly gain with correct formatting and aria-labels', () => {
    render(<Leaderboard />);

    const gainEls = document.querySelectorAll('[aria-label*="percent"]');
    expect(gainEls.length).toBeGreaterThan(0);

    const upGain = Array.from(gainEls).find((el) =>
      el.getAttribute('aria-label')?.includes('Up 8.2 percent'),
    );
    expect(upGain).toBeInTheDocument();
    expect(upGain?.textContent).toContain('▲ +8.2%');

    const downGain = Array.from(gainEls).find((el) =>
      el.getAttribute('aria-label')?.includes('Down 1.2 percent'),
    );
    expect(downGain).toBeInTheDocument();
    expect(downGain?.textContent).toContain('▼ 1.2%');
  });

  it('user rank card shows correct rank, value, and gain', () => {
    render(<Leaderboard />);

    const rankBadge = document.querySelector('[class*="rank-badge"]');
    expect(rankBadge?.textContent).toBe('#5');

    const rankValue = document.querySelector('[class*="rank-value"]');
    expect(rankValue?.textContent).toContain('$10,000.00');

    const rankChange = document.querySelector('[class*="rank-change"]');
    expect(rankChange?.textContent).toContain('0.0%');
  });

  it('shows "Start Trading" tip when user has no trades', () => {
    render(<Leaderboard />);

    expect(screen.getByText('Ready to climb the leaderboard?')).toBeInTheDocument();
    expect(screen.getByText('Start Trading →')).toBeInTheDocument();
    expect(screen.getByText('Start Trading →').closest('a')).toHaveAttribute('href', '/market');
  });

  it('applies text-up / text-down global classes for gain color-coding', () => {
    render(<Leaderboard />);

    const upElements = document.querySelectorAll('.text-up');
    const downElements = document.querySelectorAll('.text-down');
    expect(upElements.length).toBeGreaterThan(0);
    expect(downElements.length).toBeGreaterThan(0);
  });
});
