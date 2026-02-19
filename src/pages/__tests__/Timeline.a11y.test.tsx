import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Timeline from '../Timeline/Timeline';

vi.mock('../../context/TradingContext', () => ({
  useTrading: () => ({
    getPlayers: () => [
      {
        id: 'p1',
        name: 'Patrick Mahomes',
        team: 'KC',
        position: 'QB',
        currentPrice: 54.25,
        basePrice: 50,
        priceHistory: [
          {
            price: 52,
            timestamp: '2025-01-01T12:00:00Z',
            reason: { type: 'news', headline: 'Big game' },
          },
          {
            price: 54.25,
            timestamp: '2025-01-02T14:00:00Z',
            reason: { type: 'game_event', eventType: 'TD', headline: 'TD pass' },
          },
        ],
      },
    ],
    getPlayer: (id: string) =>
      id === 'p1'
        ? { id: 'p1', name: 'Patrick Mahomes', team: 'KC', currentPrice: 54.25 }
        : null,
    cash: 10000,
    buyShares: vi.fn(),
    sellShares: vi.fn(),
    portfolio: {},
  }),
}));

vi.mock('../../components/Toast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, ...props }) => <a {...props}>{children}</a>,
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

describe('Timeline a11y (mcq-o0b.1)', () => {
  it('search input has an accessible label', () => {
    render(<Timeline />);

    const searchInput = screen.getByLabelText(/search/i);
    expect(searchInput).toBeInTheDocument();
    expect(searchInput.tagName).toBe('INPUT');
  });

  it('trade quantity input has an accessible label', async () => {
    render(<Timeline />);

    const user = userEvent.setup();
    const eventCards = document.querySelectorAll('.timeline-event');
    expect(eventCards.length).toBeGreaterThan(0);

    await user.click(eventCards[0]);

    const qtyInput = screen.getByLabelText(/^trade quantity$/i);
    expect(qtyInput).toBeInTheDocument();
    expect(qtyInput).toHaveAttribute('type', 'number');
  });

  it('quantity decrement button has an accessible label', async () => {
    render(<Timeline />);

    const user = userEvent.setup();
    const eventCards = document.querySelectorAll('.timeline-event');
    await user.click(eventCards[0]);

    const decrementBtn = screen.getByLabelText(/decrease/i);
    expect(decrementBtn).toBeInTheDocument();
  });

  it('quantity increment button has an accessible label', async () => {
    render(<Timeline />);

    const user = userEvent.setup();
    const eventCards = document.querySelectorAll('.timeline-event');
    await user.click(eventCards[0]);

    const incrementBtn = screen.getByLabelText(/increase/i);
    expect(incrementBtn).toBeInTheDocument();
  });
});
