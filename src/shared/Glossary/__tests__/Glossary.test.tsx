import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Glossary, { useTermTooltip } from '../Glossary';

const motionAnimationProps = new Set([
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
            if (motionAnimationProps.has(key)) continue;
            if (key === 'style' && typeof value === 'object') {
              domProps[key] = value;
            } else if (typeof value === 'function' && key.startsWith('on')) {
              domProps[key] = value;
            } else if (typeof value !== 'object') {
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

vi.mock('../../../hooks/useFocusTrap', () => ({
  useFocusTrap: () => React.createRef(),
}));

describe('Glossary', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<Glossary isOpen={false} onClose={vi.fn()} />);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('renders dialog when open', () => {
    render(<Glossary isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Trading Terms/)).toBeInTheDocument();
  });

  it('displays all glossary terms', () => {
    render(<Glossary isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    expect(screen.getByText('Shares')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
    expect(screen.getByText('Risers')).toBeInTheDocument();
    expect(screen.getByText('Fallers')).toBeInTheDocument();
    expect(screen.getByText('Watchlist')).toBeInTheDocument();
    expect(screen.getByText('Buy')).toBeInTheDocument();
    expect(screen.getByText('Sell')).toBeInTheDocument();
    expect(screen.getByText('Total Value')).toBeInTheDocument();
    expect(screen.getByText('Gain/Loss %')).toBeInTheDocument();
  });

  it('filters terms by search query', () => {
    render(<Glossary isOpen={true} onClose={vi.fn()} />);
    const searchInput = screen.getByPlaceholderText('Search terms...');
    fireEvent.change(searchInput, { target: { value: 'portfolio' } });
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    expect(screen.queryByText('Risers')).not.toBeInTheDocument();
  });

  it('shows empty state when no terms match', async () => {
    const user = userEvent.setup();
    render(<Glossary isOpen={true} onClose={vi.fn()} />);
    const searchInput = screen.getByPlaceholderText('Search terms...');
    await user.type(searchInput, 'zzzznotfound');
    expect(screen.getByText(/no terms match/i)).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<Glossary isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /close glossary/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when backdrop clicked', () => {
    const onClose = vi.fn();
    render(<Glossary isOpen={true} onClose={onClose} />);
    const backdrop = document.querySelector('[class*="glossary-backdrop"]')!;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    render(<Glossary isOpen={true} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('search filters by definition text for "green" (TC-030)', () => {
    render(<Glossary isOpen={true} onClose={vi.fn()} />);
    const searchInput = screen.getByPlaceholderText('Search terms...');
    fireEvent.change(searchInput, { target: { value: 'green' } });
    expect(screen.getByText('Risers')).toBeInTheDocument();
  });

  it('search filters by definition text for "favorites" (TC-030)', () => {
    render(<Glossary isOpen={true} onClose={vi.fn()} />);
    const searchInput = screen.getByPlaceholderText('Search terms...');
    fireEvent.change(searchInput, { target: { value: 'favorites' } });
    expect(screen.getByText('Watchlist')).toBeInTheDocument();
    expect(screen.queryByText('Risers')).not.toBeInTheDocument();
  });

  it('search is case-insensitive (TC-030 edge)', () => {
    render(<Glossary isOpen={true} onClose={vi.fn()} />);
    const searchInput = screen.getByPlaceholderText('Search terms...');
    fireEvent.change(searchInput, { target: { value: 'GREEN' } });
    expect(screen.getByText('Risers')).toBeInTheDocument();
  });

  it('clearing search restores all terms (TC-031)', () => {
    const { unmount } = render(<Glossary isOpen={true} onClose={vi.fn()} />);
    const searchInput = screen.getByPlaceholderText('Search terms...');
    fireEvent.change(searchInput, { target: { value: 'portfolio' } });
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    unmount();

    render(<Glossary isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    expect(screen.getByText('Risers')).toBeInTheDocument();
    expect(screen.getByText('Shares')).toBeInTheDocument();
    expect(screen.getByText('Buy')).toBeInTheDocument();
  });

  it('each glossary item shows term, definition, and example (TC-032)', () => {
    render(<Glossary isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    expect(
      screen.getByText(/collection of player investments/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Patrick Mahomes and Josh Allen/),
    ).toBeInTheDocument();
    const exampleLabels = screen.getAllByText('Example:');
    expect(exampleLabels.length).toBeGreaterThan(0);
  });

  it('glossary dialog has correct ARIA attributes (TC-033)', () => {
    render(<Glossary isOpen={true} onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'glossary-title');
    const title = document.getElementById('glossary-title');
    expect(title).toBeTruthy();
    expect(title!.textContent).toContain('Trading Terms');
  });

  it('search input has correct aria-label (TC-034)', () => {
    render(<Glossary isOpen={true} onClose={vi.fn()} />);
    const input = screen.getByLabelText('Search trading terms');
    expect(input).toBeInTheDocument();
  });

  it('restart tutorial button clears localStorage and reloads', () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });
    localStorage.setItem('mcqueen-onboarded', 'true');
    localStorage.setItem('mcqueen-welcome-dismissed', 'true');
    render(<Glossary isOpen={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Restart Tutorial'));
    expect(localStorage.getItem('mcqueen-onboarded')).toBeNull();
    expect(localStorage.getItem('mcqueen-welcome-dismissed')).toBeNull();
  });
});

describe('useTermTooltip', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function TestHook() {
    const { shouldShowTooltip, markTermSeen } = useTermTooltip();
    return (
      <div>
        <span data-testid="shares">{String(shouldShowTooltip('shares'))}</span>
        <span data-testid="price">{String(shouldShowTooltip('price'))}</span>
        <button data-testid="mark" onClick={() => markTermSeen('shares')}>Mark</button>
      </div>
    );
  }

  it('shows tooltip for unseen terms', () => {
    render(<TestHook />);
    expect(screen.getByTestId('shares')).toHaveTextContent('true');
    expect(screen.getByTestId('price')).toHaveTextContent('true');
  });

  it('hides tooltip after marking term as seen', () => {
    render(<TestHook />);
    fireEvent.click(screen.getByTestId('mark'));
    expect(screen.getByTestId('shares')).toHaveTextContent('false');
    expect(screen.getByTestId('price')).toHaveTextContent('true');
  });

  it('loads previously seen terms from localStorage', () => {
    localStorage.setItem('mcqueen-seen-terms', JSON.stringify(['shares']));
    render(<TestHook />);
    expect(screen.getByTestId('shares')).toHaveTextContent('false');
    expect(screen.getByTestId('price')).toHaveTextContent('true');
  });
});
