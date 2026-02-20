import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
