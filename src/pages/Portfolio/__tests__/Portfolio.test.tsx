import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Portfolio from '../Portfolio';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { createMockEnrichedPlayer } from '../../../test/mockData';
import type { EnrichedPlayer } from '../../../types';

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
            if (key === 'style' && typeof value === 'object') {
              domProps[key] = value;
            } else if (typeof value !== 'object' && typeof value !== 'function') {
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

const mahomes = createMockEnrichedPlayer({
  id: 'p1',
  name: 'Patrick Mahomes',
  team: 'KC',
  position: 'QB',
  currentPrice: 120,
  changePercent: 5.0,
});

const allen = createMockEnrichedPlayer({
  id: 'p2',
  name: 'Josh Allen',
  team: 'BUF',
  position: 'QB',
  currentPrice: 90,
  changePercent: -3.0,
});

const trendingPlayers: EnrichedPlayer[] = [
  createMockEnrichedPlayer({ id: 't1', name: 'Trending1', changePercent: 10 }),
  createMockEnrichedPlayer({ id: 't2', name: 'Trending2', changePercent: 8 }),
  createMockEnrichedPlayer({ id: 't3', name: 'Trending3', changePercent: 5 }),
];

function renderPortfolio(overrides = {}) {
  return renderWithProviders(
    <MemoryRouter>
      <Portfolio />
    </MemoryRouter>,
    overrides,
  );
}

describe('Portfolio page', () => {
  it('renders page title', () => {
    renderPortfolio();
    expect(screen.getByText('Your Portfolio')).toBeInTheDocument();
  });

  it('shows portfolio summary with total value and cash', () => {
    renderPortfolio({
      tradingOverrides: {
        cash: 5000,
        getPortfolioValue: vi.fn(() => ({ value: 3000, cost: 2500, gain: 500, gainPercent: 20 })),
        portfolio: {},
        getPlayer: vi.fn(() => null),
        getPlayers: vi.fn(() => []),
      },
    });
    expect(screen.getByText('$8,000.00')).toBeInTheDocument();
    expect(screen.getByText('$5,000.00')).toBeInTheDocument();
    expect(screen.getByText('$3,000.00')).toBeInTheDocument();
  });

  it('shows empty state when no holdings', () => {
    renderPortfolio({
      tradingOverrides: {
        portfolio: {},
        getPlayer: vi.fn(() => null),
        getPlayers: vi.fn(() => trendingPlayers),
        getPortfolioValue: vi.fn(() => ({ value: 0, cost: 0, gain: 0, gainPercent: 0 })),
      },
    });
    expect(screen.getByText('Start Your Trading Journey')).toBeInTheDocument();
    expect(screen.getByText('Browse Market')).toBeInTheDocument();
  });

  it('shows trending players in empty state', () => {
    renderPortfolio({
      tradingOverrides: {
        portfolio: {},
        getPlayer: vi.fn(() => null),
        getPlayers: vi.fn(() => trendingPlayers),
        getPortfolioValue: vi.fn(() => ({ value: 0, cost: 0, gain: 0, gainPercent: 0 })),
      },
    });
    expect(screen.getByText('Trending1')).toBeInTheDocument();
    expect(screen.getByText('Trending2')).toBeInTheDocument();
  });

  it('renders holdings list when portfolio has entries', () => {
    renderPortfolio({
      tradingOverrides: {
        portfolio: {
          p1: { shares: 10, avgCost: 100 },
          p2: { shares: 5, avgCost: 95 },
        },
        getPlayer: vi.fn((id: string) => {
          if (id === 'p1') return mahomes;
          if (id === 'p2') return allen;
          return null;
        }),
        getPlayers: vi.fn(() => [mahomes, allen]),
        getPortfolioValue: vi.fn(() => ({ value: 1650, cost: 1475, gain: 175, gainPercent: 11.86 })),
        cash: 5000,
      },
    });
    expect(screen.getByText('Patrick Mahomes')).toBeInTheDocument();
    expect(screen.getByText('Josh Allen')).toBeInTheDocument();
    const holdingRows = screen.getAllByTestId('holding-row');
    expect(holdingRows).toHaveLength(2);
  });

  it('skips holdings where player data is not found', () => {
    renderPortfolio({
      tradingOverrides: {
        portfolio: {
          p1: { shares: 10, avgCost: 100 },
          unknown: { shares: 3, avgCost: 50 },
        },
        getPlayer: vi.fn((id: string) => {
          if (id === 'p1') return mahomes;
          return null;
        }),
        getPlayers: vi.fn(() => [mahomes]),
        getPortfolioValue: vi.fn(() => ({ value: 1200, cost: 1000, gain: 200, gainPercent: 20 })),
        cash: 5000,
      },
    });
    expect(screen.getByText('Patrick Mahomes')).toBeInTheDocument();
    const holdingRows = screen.getAllByTestId('holding-row');
    expect(holdingRows).toHaveLength(1);
  });

  it('shows gain/loss indicators with correct direction', () => {
    renderPortfolio({
      tradingOverrides: {
        portfolio: { p1: { shares: 10, avgCost: 100 } },
        getPlayer: vi.fn(() => mahomes),
        getPlayers: vi.fn(() => [mahomes]),
        getPortfolioValue: vi.fn(() => ({ value: 1200, cost: 1000, gain: 200, gainPercent: 20 })),
        cash: 5000,
      },
    });
    const gainEl = screen.getByTestId('holding-gain');
    expect(gainEl).toBeInTheDocument();
  });
});
