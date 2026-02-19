import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlayerDetail from '../PlayerDetail/PlayerDetail';

vi.mock('../../context/TradingContext', () => ({
  useTrading: () => ({
    getPlayer: () => ({
      id: 'mahomes',
      name: 'Patrick Mahomes',
      team: 'KC',
      position: 'QB',
      currentPrice: 120.5,
      basePrice: 100,
      changePercent: 5.2,
      priceHistory: [
        {
          price: 100,
          timestamp: '2025-01-01T12:00:00Z',
          reason: { type: 'news', headline: 'Baseline' },
        },
        {
          price: 120.5,
          timestamp: '2025-01-02T14:00:00Z',
          reason: {
            type: 'game_event',
            eventType: 'TD',
            headline: 'Throws 3 TDs',
          },
        },
      ],
    }),
    portfolio: { mahomes: { shares: 5, avgCost: 110 } },
    cash: 10000,
    buyShares: vi.fn(() => true),
    sellShares: vi.fn(() => true),
  }),
}));

vi.mock('../../context/SocialContext', () => ({
  useSocial: () => ({
    addToWatchlist: vi.fn(),
    removeFromWatchlist: vi.fn(),
    isWatching: () => false,
    getLeagueHoldings: () => [],
  }),
}));

vi.mock('../../components/Toast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock('../../components', () => ({
  EventMarkerPopup: () => null,
  getEventConfig: () => ({ color: '#ccc', icon: '?' }),
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock('../../utils/espnUrls', () => ({
  getPlayerNewsUrls: () => Promise.resolve({}),
  getTeamNewsUrl: () => null,
}));

vi.mock('../../utils/playerImages', () => ({
  getPlayerHeadshotUrl: () => null,
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ playerId: 'mahomes' }),
  useNavigate: () => vi.fn(),
}));

vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ReferenceLine: () => null,
  Customized: () => null,
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

describe('PlayerDetail keyboard navigation (mcq-o0b.3)', () => {
  it('trading tabs support arrow key navigation', async () => {
    render(<PlayerDetail />);

    const buyTab = screen.getByRole('tab', { name: /buy/i });
    const sellTab = screen.getByRole('tab', { name: /sell/i });

    buyTab.focus();
    const user = userEvent.setup();

    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(sellTab);

    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(buyTab);
  });

  it('trading tabs wrap around with arrow keys', async () => {
    render(<PlayerDetail />);

    const buyTab = screen.getByRole('tab', { name: /buy/i });
    const sellTab = screen.getByRole('tab', { name: /sell/i });

    sellTab.focus();
    const user = userEvent.setup();

    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(buyTab);
  });
});
