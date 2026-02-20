import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MiniLeaderboard from '../MiniLeaderboard';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { createMockLeaderboardRankings } from '../../../test/mockData';

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
  it('renders standings header', () => {
    renderMiniLeaderboard();
    expect(screen.getByText('STANDINGS')).toBeInTheDocument();
  });

  it('renders View All link', () => {
    renderMiniLeaderboard();
    expect(screen.getByText('View All')).toBeInTheDocument();
  });

  it('shows top 3 traders with medals', () => {
    renderMiniLeaderboard();
    expect(screen.getByText('GridironGuru')).toBeInTheDocument();
    expect(screen.getByText('TDKing2024')).toBeInTheDocument();
    expect(screen.getByText('FantasyMVP')).toBeInTheDocument();
  });

  it('shows user position when not in top 3', () => {
    renderMiniLeaderboard();
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('#5')).toBeInTheDocument();
  });

  it('shows gap indicator when user is behind', () => {
    const rankingsWithGap = createMockLeaderboardRankings();
    rankingsWithGap[4] = {
      ...rankingsWithGap[4],
      gapToNext: 1500,
      traderAhead: { name: 'StockJock', memberId: 'stockjock' },
    };
    renderMiniLeaderboard({
      socialOverrides: {
        getLeaderboardRankings: vi.fn(() => rankingsWithGap),
      },
    });
    expect(screen.getByText('$1,500')).toBeInTheDocument();
    expect(screen.getByText(/behind #4 StockJock/)).toBeInTheDocument();
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
  });

  it('formats values with dollar sign', () => {
    renderMiniLeaderboard();
    expect(screen.getByText('$14,500')).toBeInTheDocument();
  });
});
