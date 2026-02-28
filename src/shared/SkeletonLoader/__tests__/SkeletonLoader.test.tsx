import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import {
  PlayerCardSkeleton,
  MarketSkeleton,
  LeaderboardSkeleton,
  MissionSkeleton,
  TextSkeleton,
} from '../SkeletonLoader';
import SkeletonDefault from '../SkeletonLoader';

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_: unknown, tag: string | symbol) => {
        const Component = ({
          children,
          ...props
        }: {
          children?: React.ReactNode;
          [key: string]: unknown;
        }) => {
          const domProps: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(props)) {
            if (key === 'style' && typeof value === 'object') {
              domProps[key] = value;
            } else if (typeof value !== 'object' && typeof value !== 'function') {
              domProps[key] = value;
            }
          }
          return React.createElement(String(tag), domProps, children);
        };
        return Component;
      },
    },
  ),
}));

describe('SkeletonLoader components', () => {
  it('PlayerCardSkeleton renders skeleton card structure', () => {
    const { container } = render(<PlayerCardSkeleton />);
    expect(container.firstChild).toBeTruthy();
  });

  it('MarketSkeleton renders correct number of cards', () => {
    const { container } = render(<MarketSkeleton count={4} />);
    const grid = container.querySelector('[class*="skeleton-market-grid"]')!;
    expect(grid.children).toHaveLength(4);
  });

  it('MarketSkeleton uses default count of 6', () => {
    const { container } = render(<MarketSkeleton />);
    const grid = container.querySelector('[class*="skeleton-market-grid"]')!;
    expect(grid.children).toHaveLength(6);
  });

  it('LeaderboardSkeleton renders header and rows', () => {
    const { container } = render(<LeaderboardSkeleton />);
    expect(container.firstChild).toBeTruthy();
    const rows = container.querySelectorAll('[class*="skeleton-leaderboard-row"]');
    expect(rows).toHaveLength(5);
  });

  it('MissionSkeleton renders header and player grid', () => {
    const { container } = render(<MissionSkeleton />);
    expect(container.firstChild).toBeTruthy();
    const players = container.querySelectorAll('[class*="skeleton-mission-player"]');
    expect(players).toHaveLength(12);
  });

  it('TextSkeleton renders with custom width and height', () => {
    const { container } = render(<TextSkeleton width="200px" height="24px" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('200px');
    expect(el.style.height).toBe('24px');
  });

  it('TextSkeleton uses default width and height', () => {
    const { container } = render(<TextSkeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('100%');
    expect(el.style.height).toBe('16px');
  });

  it('default export contains all skeleton components', () => {
    expect(SkeletonDefault.PlayerCardSkeleton).toBe(PlayerCardSkeleton);
    expect(SkeletonDefault.MarketSkeleton).toBe(MarketSkeleton);
    expect(SkeletonDefault.LeaderboardSkeleton).toBe(LeaderboardSkeleton);
    expect(SkeletonDefault.MissionSkeleton).toBe(MissionSkeleton);
    expect(SkeletonDefault.TextSkeleton).toBe(TextSkeleton);
  });

  it('PlayerCardSkeleton renders header, body, and footer sections (TC-035)', () => {
    const { container } = render(<PlayerCardSkeleton />);
    expect(container.querySelector('[class*="skeleton-card"]')).toBeTruthy();
    expect(container.querySelector('[class*="skeleton-team-badge"]')).toBeTruthy();
    expect(container.querySelector('[class*="skeleton-position"]')).toBeTruthy();
    expect(container.querySelector('[class*="skeleton-avatar"]')).toBeTruthy();
    expect(container.querySelector('[class*="skeleton-name"]')).toBeTruthy();
    expect(container.querySelector('[class*="skeleton-price"]')).toBeTruthy();
    expect(container.querySelector('[class*="skeleton-change"]')).toBeTruthy();
    expect(container.querySelector('[class*="skeleton-chart"]')).toBeTruthy();
    expect(container.querySelector('[class*="skeleton-headline"]')).toBeTruthy();
    expect(container.querySelector('[class*="skeleton-owners"]')).toBeTruthy();
  });

  it('MarketSkeleton renders grid with correct class (TC-036)', () => {
    const { container } = render(<MarketSkeleton />);
    expect(container.querySelector('[class*="skeleton-market-grid"]')).toBeTruthy();
  });

  it('MarketSkeleton with count=0 renders empty grid (TC-036 edge)', () => {
    const { container } = render(<MarketSkeleton count={0} />);
    const grid = container.querySelector('[class*="skeleton-market-grid"]')!;
    expect(grid.children).toHaveLength(0);
  });

  it('LeaderboardSkeleton renders header and 5 rows with rank, name, value (TC-037)', () => {
    const { container } = render(<LeaderboardSkeleton />);
    expect(container.querySelector('[class*="skeleton-leaderboard-header"]')).toBeTruthy();
    const rows = container.querySelectorAll('[class*="skeleton-leaderboard-row"]');
    expect(rows).toHaveLength(5);
    rows.forEach((row) => {
      expect(row.querySelector('[class*="skeleton-rank"]')).toBeTruthy();
      expect(row.querySelector('[class*="skeleton-name-small"]')).toBeTruthy();
      expect(row.querySelector('[class*="skeleton-value"]')).toBeTruthy();
    });
  });

  it('MissionSkeleton renders header, grid, and 12 player items with buttons (TC-038)', () => {
    const { container } = render(<MissionSkeleton />);
    expect(container.querySelector('[class*="skeleton-mission-header"]')).toBeTruthy();
    expect(container.querySelector('[class*="skeleton-mission-grid"]')).toBeTruthy();
    const players = container.querySelectorAll('[class*="skeleton-mission-player"]');
    expect(players).toHaveLength(12);
    players.forEach((player) => {
      expect(player.querySelector('[class*="skeleton-player-mini"]')).toBeTruthy();
      const buttons = player.querySelectorAll('[class*="skeleton-button"]');
      expect(buttons).toHaveLength(2);
    });
  });

  it('all skeleton components render motion.div elements (TC-039)', () => {
    const { container: c1 } = render(<PlayerCardSkeleton />);
    expect(c1.firstChild).toBeTruthy();
    const { container: c2 } = render(<LeaderboardSkeleton />);
    expect(c2.firstChild).toBeTruthy();
    const { container: c3 } = render(<MissionSkeleton />);
    expect(c3.firstChild).toBeTruthy();
    const { container: c4 } = render(<TextSkeleton />);
    expect(c4.firstChild).toBeTruthy();
  });
});
