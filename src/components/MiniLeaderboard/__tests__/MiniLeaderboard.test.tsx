import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MiniLeaderboard from '../MiniLeaderboard';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { createMockLeaderboardRankings } from '../../../test/mockData';
import type { LeaderboardEntry } from '../../../types';

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
            if (typeof value !== 'object' && typeof value !== 'function') {
              domProps[key] = value;
            }
          }
          return React.createElement(String(tag), { ref, ...domProps }, children);
        };
        return Component;
      },
    },
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const rankings = createMockLeaderboardRankings();

function renderMiniLeaderboard(overrides = {}) {
  return renderWithProviders(
    <MemoryRouter>
      <MiniLeaderboard />
    </MemoryRouter>,
    {
      socialOverrides: {
        getLeaderboardRankings: vi.fn(() => rankings),
      },
      ...overrides,
    },
  );
}

describe('MiniLeaderboard', () => {
  it('renders standings header with trophy icon', () => {
    renderMiniLeaderboard();
    expect(screen.getByText('STANDINGS')).toBeInTheDocument();
    const trophies = screen.getAllByText('🏆');
    expect(trophies.length).toBeGreaterThanOrEqual(1);
  });

  it('renders View All link pointing to /leaderboard', () => {
    renderMiniLeaderboard();
    const link = screen.getByText('View All').closest('a');
    expect(link).toBeTruthy();
    expect(link!.getAttribute('href')).toBe('/leaderboard');
  });

  it('shows top 3 traders with correct medal emojis', () => {
    renderMiniLeaderboard();
    expect(screen.getByText('GridironGuru')).toBeInTheDocument();
    expect(screen.getByText('TDKing2024')).toBeInTheDocument();
    expect(screen.getByText('FantasyMVP')).toBeInTheDocument();
    expect(screen.getByText('🥇')).toBeInTheDocument();
    expect(screen.getByText('🥈')).toBeInTheDocument();
    expect(screen.getByText('🥉')).toBeInTheDocument();
  });

  it('shows user position below divider when not in top 3', () => {
    renderMiniLeaderboard();
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('#5')).toBeInTheDocument();
    expect(screen.getByText('•••')).toBeInTheDocument();
  });

  it('shows gap indicator with dollar amount and trader name', () => {
    const rankingsWithGap = createMockLeaderboardRankings();
    rankingsWithGap[4] = {
      ...rankingsWithGap[4],
      gapToNext: 1500,
      traderAhead: { name: 'StockJock', memberId: 'stockjock' } as LeaderboardEntry,
    };
    renderMiniLeaderboard({
      socialOverrides: {
        getLeaderboardRankings: vi.fn(() => rankingsWithGap),
      },
    });
    expect(screen.getByText('$1,500')).toBeInTheDocument();
    expect(screen.getByText(/behind #4 StockJock/)).toBeInTheDocument();
  });

  it('hides gap indicator when gapToNext is 0', () => {
    const rankingsNoGap = createMockLeaderboardRankings();
    rankingsNoGap[4] = { ...rankingsNoGap[4], gapToNext: 0, traderAhead: null };
    renderMiniLeaderboard({
      socialOverrides: {
        getLeaderboardRankings: vi.fn(() => rankingsNoGap),
      },
    });
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.queryByText(/behind/)).toBeNull();
  });

  it('shows motivational message when user is in top 3 at #1', () => {
    const userFirst = createMockLeaderboardRankings().map((r, i) => ({
      ...r,
      isUser: i === 0,
      rank: i + 1,
    }));
    userFirst[0] = { ...userFirst[0], name: 'You', avatar: '👤', isUser: true, rank: 1 };
    renderMiniLeaderboard({
      socialOverrides: {
        getLeaderboardRankings: vi.fn(() => userFirst),
      },
    });
    expect(screen.getByText(/You're in the lead/)).toBeInTheDocument();
  });

  it('shows close-to-leader message when user is in top 3 but not #1', () => {
    const userSecond = createMockLeaderboardRankings().map((r) => ({
      ...r,
      isUser: false,
    }));
    userSecond[1] = { ...userSecond[1], isUser: true, name: 'You', rank: 2, gapToNext: 700 };
    renderMiniLeaderboard({
      socialOverrides: {
        getLeaderboardRankings: vi.fn(() => userSecond),
      },
    });
    const statusEl = document.querySelector('[class*="status-close"]');
    expect(statusEl).toBeTruthy();
    expect(statusEl!.textContent).toContain('$700');
    expect(statusEl!.textContent).toContain('#1');
  });

  it('formats values with dollar sign and commas', () => {
    renderMiniLeaderboard();
    expect(screen.getByText('$14,500')).toBeInTheDocument();
  });

  it('handles empty rankings without errors', () => {
    renderMiniLeaderboard({
      socialOverrides: {
        getLeaderboardRankings: vi.fn(() => []),
      },
    });
    expect(screen.getByText('STANDINGS')).toBeInTheDocument();
    expect(screen.queryByText('You')).toBeNull();
    expect(screen.queryByText('•••')).toBeNull();
  });

  it('shows generic avatar for user and custom avatar for others', () => {
    renderMiniLeaderboard();
    const avatars = screen.getAllByText('👤');
    expect(avatars.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('🏈')).toBeInTheDocument();
    expect(screen.getByText('👑')).toBeInTheDocument();
  });

  it('applies is-leader class to first rank row only', () => {
    const { container } = renderMiniLeaderboard();
    const rows = container.querySelectorAll('[class*="mini-rank-row"]');
    expect(rows.length).toBeGreaterThanOrEqual(3);
    expect(rows[0].className).toContain('is-leader');
    expect(rows[1].className).not.toContain('is-leader');
  });

  it('renders with only 1 trader without errors', () => {
    const singleTrader: LeaderboardEntry[] = [
      { memberId: 'solo', name: 'Solo', avatar: '🎯', isUser: true, cash: 5000, holdingsValue: 5000, totalValue: 10000, rank: 1, gapToNext: 0 },
    ];
    renderMiniLeaderboard({
      socialOverrides: {
        getLeaderboardRankings: vi.fn(() => singleTrader),
      },
    });
    expect(screen.getByText('Solo')).toBeInTheDocument();
    expect(screen.getByText(/in the lead/)).toBeInTheDocument();
  });
});
