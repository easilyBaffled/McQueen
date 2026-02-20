import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InfoTooltip from '../InfoTooltip';

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
            if (typeof value !== 'object' && typeof value !== 'function') {
              domProps[key] = value;
            }
          }
          return React.createElement(String(tag), domProps, children);
        };
        return Component;
      },
    },
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('InfoTooltip', () => {
  it('renders children and trigger button for known term', () => {
    render(<InfoTooltip term="shares">Shares Label</InfoTooltip>);
    expect(screen.getByText('Shares Label')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /what is shares/i })).toBeInTheDocument();
  });

  it('returns null for unknown term without children', () => {
    const { container } = render(<InfoTooltip term="unknownTerm" />);
    expect(container.firstChild).toBeNull();
  });

  it('returns children for unknown term when children provided', () => {
    render(<InfoTooltip term="unknownTerm">Label</InfoTooltip>);
    expect(screen.getByText('Label')).toBeInTheDocument();
  });

  it('shows tooltip on mouse enter', () => {
    render(<InfoTooltip term="portfolio">Portfolio</InfoTooltip>);
    const wrapper = screen.getByText('Portfolio').closest('span')!;
    fireEvent.mouseEnter(wrapper);
    expect(screen.getByText(/your collection of player investments/i)).toBeInTheDocument();
  });

  it('hides tooltip on mouse leave', () => {
    render(<InfoTooltip term="portfolio">Portfolio</InfoTooltip>);
    const wrapper = screen.getByText('Portfolio').closest('span')!;
    fireEvent.mouseEnter(wrapper);
    expect(screen.getByText(/your collection of player investments/i)).toBeInTheDocument();
    fireEvent.mouseLeave(wrapper);
    expect(screen.queryByText(/your collection of player investments/i)).not.toBeInTheDocument();
  });

  it('toggles tooltip on button click', () => {
    render(<InfoTooltip term="cash">Cash</InfoTooltip>);
    const btn = screen.getByRole('button', { name: /what is cash/i });
    fireEvent.click(btn);
    expect(screen.getByText(/available virtual money/i)).toBeInTheDocument();
    fireEvent.click(btn);
    expect(screen.queryByText(/available virtual money/i)).not.toBeInTheDocument();
  });

  it('applies inline class when inline prop is true', () => {
    render(<InfoTooltip term="buy" inline>Buy</InfoTooltip>);
    const wrapper = screen.getByText('Buy').closest('span');
    expect(wrapper?.className).toContain('inline');
  });

  it('renders definitions for all known terms', () => {
    const terms = ['shares', 'portfolio', 'risers', 'fallers', 'watchlist', 'price', 'gainLoss', 'totalValue', 'cash', 'buy', 'sell'];
    terms.forEach((term) => {
      const { unmount } = render(<InfoTooltip term={term}>Label</InfoTooltip>);
      expect(screen.getByRole('button', { name: new RegExp(`what is ${term}`, 'i') })).toBeInTheDocument();
      unmount();
    });
  });
});
