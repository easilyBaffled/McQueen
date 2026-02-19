import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import ErrorBoundary from '../ErrorBoundary';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

function ThrowingChild({ error = new Error('render failure') }) {
  throw error;
}

function HealthyChild() {
  return <div data-testid="child">Hello</div>;
}

function ThrowOnRerender({ throwAfter = 1 }) {
  const [count, setCount] = useState(0);
  if (count >= throwAfter) throw new Error('re-render failure');
  return (
    <button data-testid="increment" onClick={() => setCount((c) => c + 1)}>
      Count: {count}
    </button>
  );
}

function EventHandlerThrower() {
  return (
    <button
      data-testid="throw-btn"
      onClick={() => {
        throw new Error('click error');
      }}
    >
      Click me
    </button>
  );
}

describe('ErrorBoundary', () => {
  // TC-001
  describe('TC-001: catches synchronous rendering errors', () => {
    it('catches a thrown Error during render and shows fallback', () => {
      render(
        <ErrorBoundary>
          <ThrowingChild />
        </ErrorBoundary>,
      );
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('catches a non-Error object (string) thrown during render', () => {
      function ThrowsString() {
        throw 'string error';
      }
      render(
        <ErrorBoundary>
          <ThrowsString />
        </ErrorBoundary>,
      );
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  // TC-002
  describe('TC-002: renders children normally', () => {
    it('renders the child content when no error occurs', () => {
      render(
        <ErrorBoundary>
          <HealthyChild />
        </ErrorBoundary>,
      );
      expect(screen.getByTestId('child')).toHaveTextContent('Hello');
    });

    it('does not display any fallback UI when children are healthy', () => {
      render(
        <ErrorBoundary>
          <HealthyChild />
        </ErrorBoundary>,
      );
      expect(
        screen.queryByText(/something went wrong/i),
      ).not.toBeInTheDocument();
    });

    it('renders nothing when child returns null', () => {
      function NullChild() {
        return null;
      }
      const { container } = render(
        <ErrorBoundary>
          <NullChild />
        </ErrorBoundary>,
      );
      expect(
        screen.queryByText(/something went wrong/i),
      ).not.toBeInTheDocument();
      expect(container.querySelector('[data-testid]')).toBeNull();
    });
  });

  // TC-003
  describe('TC-003: user-friendly fallback message', () => {
    it('shows a friendly message without technical details', () => {
      render(
        <ErrorBoundary>
          <ThrowingChild
            error={
              new Error('TypeError: Cannot read properties of undefined')
            }
          />
        </ErrorBoundary>,
      );
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.queryByText(/TypeError/)).not.toBeInTheDocument();
      expect(
        screen.queryByText(/Cannot read properties/),
      ).not.toBeInTheDocument();
    });
  });

  // TC-004
  describe('TC-004: retry button present', () => {
    it('renders a retry button in the fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowingChild />
        </ErrorBoundary>,
      );
      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toBeEnabled();
    });

    it('retry action is an actual <button> element', () => {
      render(
        <ErrorBoundary>
          <ThrowingChild />
        </ErrorBoundary>,
      );
      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton.tagName).toBe('BUTTON');
    });
  });

  // TC-005
  describe('TC-005: retry clears error state', () => {
    it('re-renders children after clicking retry when error is resolved', () => {
      let shouldThrow = true;

      function ToggleChild() {
        if (shouldThrow) throw new Error('toggled error');
        return <div data-testid="child">Recovered</div>;
      }

      render(
        <ErrorBoundary>
          <ToggleChild />
        </ErrorBoundary>,
      );
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      shouldThrow = false;
      fireEvent.click(screen.getByRole('button', { name: /try again/i }));

      expect(screen.getByTestId('child')).toHaveTextContent('Recovered');
      expect(
        screen.queryByText(/something went wrong/i),
      ).not.toBeInTheDocument();
    });

    it('shows fallback again if child still throws after retry', () => {
      render(
        <ErrorBoundary>
          <ThrowingChild />
        </ErrorBoundary>,
      );
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /try again/i }));

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  // TC-007
  describe('TC-007: custom fallback prop', () => {
    it('renders custom fallback when provided', () => {
      render(
        <ErrorBoundary
          fallback={<div data-testid="custom-fallback">Custom Error</div>}
        >
          <ThrowingChild />
        </ErrorBoundary>,
      );
      expect(screen.getByTestId('custom-fallback')).toHaveTextContent(
        'Custom Error',
      );
      expect(
        screen.queryByText(/something went wrong/i),
      ).not.toBeInTheDocument();
    });

    it('uses default fallback when fallback prop is undefined', () => {
      render(
        <ErrorBoundary>
          <ThrowingChild />
        </ErrorBoundary>,
      );
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  // TC-008
  describe('TC-008: reusable across multiple instances', () => {
    it('two instances work independently', () => {
      render(
        <div>
          <ErrorBoundary>
            <ThrowingChild />
          </ErrorBoundary>
          <ErrorBoundary>
            <HealthyChild />
          </ErrorBoundary>
        </div>,
      );
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByTestId('child')).toHaveTextContent('Hello');
    });

    it('inner ErrorBoundary catches error before outer one', () => {
      render(
        <ErrorBoundary
          fallback={<div data-testid="outer-fallback">Outer</div>}
        >
          <ErrorBoundary
            fallback={<div data-testid="inner-fallback">Inner</div>}
          >
            <ThrowingChild />
          </ErrorBoundary>
        </ErrorBoundary>,
      );
      expect(screen.getByTestId('inner-fallback')).toBeInTheDocument();
      expect(screen.queryByTestId('outer-fallback')).not.toBeInTheDocument();
    });
  });

  // TC-009
  describe('TC-009: does not catch event handler errors', () => {
    it('does not show fallback when an event handler throws', () => {
      render(
        <ErrorBoundary>
          <EventHandlerThrower />
        </ErrorBoundary>,
      );
      expect(screen.getByTestId('throw-btn')).toBeInTheDocument();

      try {
        fireEvent.click(screen.getByTestId('throw-btn'));
      } catch {
        // Event handler errors propagate differently across environments
      }

      expect(
        screen.queryByText(/something went wrong/i),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('throw-btn')).toBeInTheDocument();
    });
  });

  // TC-010
  describe('TC-010: catches errors on re-render', () => {
    it('catches error thrown during a re-render caused by state change', async () => {
      const user = userEvent.setup();
      render(
        <ErrorBoundary>
          <ThrowOnRerender throwAfter={1} />
        </ErrorBoundary>,
      );
      expect(screen.getByTestId('increment')).toHaveTextContent('Count: 0');

      await user.click(screen.getByTestId('increment'));

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  // TC-012
  describe('TC-012: multiple error/retry cycles', () => {
    it('handles error -> retry (still fails) -> fallback shown again', () => {
      render(
        <ErrorBoundary>
          <ThrowingChild />
        </ErrorBoundary>,
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /try again/i }));
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('handles error -> fix -> retry -> recover -> error -> fix -> retry -> recover', () => {
      let shouldThrow = true;

      function CycleChild() {
        if (shouldThrow) throw new Error('cycle error');
        return <div data-testid="child">Working</div>;
      }

      const { unmount } = render(
        <ErrorBoundary>
          <CycleChild />
        </ErrorBoundary>,
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      shouldThrow = false;
      fireEvent.click(screen.getByRole('button', { name: /try again/i }));
      expect(screen.getByTestId('child')).toHaveTextContent('Working');

      unmount();
      shouldThrow = true;

      render(
        <ErrorBoundary>
          <CycleChild />
        </ErrorBoundary>,
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      shouldThrow = false;
      fireEvent.click(screen.getByRole('button', { name: /try again/i }));
      expect(screen.getByTestId('child')).toHaveTextContent('Working');
    });
  });
});
