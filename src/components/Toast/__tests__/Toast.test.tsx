import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '../ToastProvider';

vi.mock('framer-motion', () => {
  const componentCache: Record<string, React.ComponentType<Record<string, unknown>>> = {};
  return {
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
  };
});

function TriggerToast({ type = 'success' }: { type?: string }) {
  const { addToast } = useToast();
  return (
    <button onClick={() => addToast(`Test ${type} message`, type)}>
      Show Toast
    </button>
  );
}

describe('Toast keyboard dismissal (mcq-x02)', () => {
  it('dismisses toast on Escape key press', async () => {
    render(
      <ToastProvider>
        <TriggerToast />
      </ToastProvider>,
    );
    const user = userEvent.setup();

    await user.click(screen.getByText('Show Toast'));
    expect(screen.getByTestId('toast')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
  });

  it('dismisses toast close button via Enter key', async () => {
    render(
      <ToastProvider>
        <TriggerToast />
      </ToastProvider>,
    );
    const user = userEvent.setup();

    await user.click(screen.getByText('Show Toast'));
    expect(screen.getByTestId('toast')).toBeInTheDocument();

    const closeBtn = screen.getByTestId('toast-close');
    closeBtn.focus();
    await user.keyboard('{Enter}');
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
  });

  it('dismisses toast close button via Space key', async () => {
    render(
      <ToastProvider>
        <TriggerToast />
      </ToastProvider>,
    );
    const user = userEvent.setup();

    await user.click(screen.getByText('Show Toast'));
    expect(screen.getByTestId('toast')).toBeInTheDocument();

    const closeBtn = screen.getByTestId('toast-close');
    closeBtn.focus();
    await user.keyboard(' ');
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
  });

  it('does not error when Escape is pressed with no toasts', async () => {
    render(
      <ToastProvider>
        <TriggerToast />
      </ToastProvider>,
    );
    const user = userEvent.setup();

    await user.keyboard('{Escape}');
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
  });

  it('preserves existing ARIA attributes after keyboard changes', async () => {
    render(
      <ToastProvider>
        <TriggerToast />
      </ToastProvider>,
    );
    const user = userEvent.setup();

    await user.click(screen.getByText('Show Toast'));

    const container = document.querySelector('[role="status"]');
    expect(container).toHaveAttribute('aria-live', 'polite');

    const closeBtn = screen.getByTestId('toast-close');
    expect(closeBtn).toHaveAttribute('aria-label', 'Dismiss notification');
  });

  it('auto-dismisses after timeout still works', () => {
    vi.useFakeTimers();

    render(
      <ToastProvider>
        <TriggerToast />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByTestId('toast')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3100);
    });
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();

    vi.useRealTimers();
  });
});
