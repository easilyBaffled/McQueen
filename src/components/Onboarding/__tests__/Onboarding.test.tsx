import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Onboarding from '../Onboarding';

// ── Mock framer-motion ──────────────────────────────────────────────
const componentCache: Record<string, React.ComponentType<Record<string, unknown>>> = {};
vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_: unknown, tag: string | symbol) => {
        const tagStr = String(tag);
        if (!componentCache[tagStr]) {
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

function renderAndShow() {
  const result = render(<Onboarding />);
  act(() => {
    vi.advanceTimersByTime(300);
  });
  return result;
}

function clickNext(times = 1) {
  for (let i = 0; i < times; i++) {
    fireEvent.click(screen.getByRole('button', { name: /next|start trading/i }));
  }
}

describe('Onboarding', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── TC-001: Modal renders for new users ───────────────────────────
  describe('TC-001: Modal renders for new users', () => {
    it('shows the modal after 300ms delay', () => {
      render(<Onboarding />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Welcome to McQueen')).toBeInTheDocument();
      expect(screen.getByText('The NFL Stock Market')).toBeInTheDocument();
      expect(screen.getByText('🏈')).toBeInTheDocument();
    });

    it('does not show modal before 300ms', () => {
      render(<Onboarding />);
      act(() => {
        vi.advanceTimersByTime(299);
      });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  // ── TC-002: Modal does not render for returning users ─────────────
  describe('TC-002: Modal does not render for returning users', () => {
    it('hides modal when mcqueen-onboarded is "true"', () => {
      localStorage.setItem('mcqueen-onboarded', 'true');
      render(<Onboarding />);
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('suppresses modal for any localStorage value', () => {
      localStorage.setItem('mcqueen-onboarded', 'yes');
      render(<Onboarding />);
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  // ── TC-003: Next button advances through all 6 steps ──────────────
  it('TC-003: Next button advances through all 6 steps', () => {
    renderAndShow();

    const stepData = [
      { title: 'Welcome to McQueen', subtitle: 'The NFL Stock Market', icon: '🏈' },
      { title: 'Your Starting Balance', subtitle: '$10,000 in virtual cash', icon: '💵' },
      { title: 'Reading the Market', subtitle: 'Green = up, Red = down', icon: '📊' },
      { title: 'Build Your Portfolio', subtitle: 'Your collection of player investments', icon: '📁' },
      { title: 'Daily Predictions', subtitle: 'Test your NFL knowledge', icon: '🎯' },
      { title: 'Ready to Trade!', subtitle: 'Your first move awaits', icon: '🚀' },
    ];

    expect(screen.getByText(stepData[0].title)).toBeInTheDocument();
    expect(screen.getByText(stepData[0].subtitle)).toBeInTheDocument();

    for (let i = 1; i < stepData.length; i++) {
      fireEvent.click(screen.getByRole('button', { name: /next|start trading/i }));
      expect(screen.getByText(stepData[i].title)).toBeInTheDocument();
      expect(screen.getByText(stepData[i].subtitle)).toBeInTheDocument();
      expect(screen.getByText(stepData[i].icon)).toBeInTheDocument();
    }
  });

  // ── TC-004: Final step completes onboarding ───────────────────────
  it('TC-004: Next button on final step closes modal', () => {
    renderAndShow();
    clickNext(5);

    expect(screen.getByText('Ready to Trade!')).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /start trading/i });
    expect(btn).toBeInTheDocument();

    fireEvent.click(btn);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // ── TC-005: Back button navigates to previous step ────────────────
  it('TC-005: Back button navigates to previous step', () => {
    renderAndShow();
    clickNext(2);
    expect(screen.getByText('Reading the Market')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByText('Your Starting Balance')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByText('Welcome to McQueen')).toBeInTheDocument();
  });

  // ── TC-006: Back button hidden on step 0 ──────────────────────────
  describe('TC-006: Back button is hidden on step 0', () => {
    it('does not show Back on initial step', () => {
      renderAndShow();
      expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
    });

    it('hides Back after navigating back to step 0', () => {
      renderAndShow();
      clickNext();
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /back/i }));
      expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
    });
  });

  // ── TC-007: Back button appears on step 1+ ────────────────────────
  it('TC-007: Back button appears on step 1 and beyond', () => {
    renderAndShow();
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    }
  });

  // ── TC-008: Skip button closes modal ──────────────────────────────
  describe('TC-008: Skip button closes modal', () => {
    it('closes from step 0', () => {
      renderAndShow();
      fireEvent.click(screen.getByRole('button', { name: /skip/i }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes from middle step', () => {
      renderAndShow();
      clickNext(3);
      fireEvent.click(screen.getByRole('button', { name: /skip/i }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes from last step', () => {
      renderAndShow();
      clickNext(5);
      fireEvent.click(screen.getByRole('button', { name: /skip/i }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  // ── TC-009: Escape key closes modal ───────────────────────────────
  describe('TC-009: Escape key closes modal', () => {
    it('closes the modal on Escape', () => {
      renderAndShow();
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('does not close on other keys', () => {
      renderAndShow();
      fireEvent.keyDown(document, { key: 'Enter' });
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Tab' });
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'a' });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  // ── TC-010: Escape inactive after dismissal ───────────────────────
  it('TC-010: Escape key does not fire after modal dismissed', () => {
    renderAndShow();
    fireEvent.click(screen.getByRole('button', { name: /skip/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const spy = vi.fn();
    window.addEventListener('mcqueen-onboarding-complete', spy);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(spy).not.toHaveBeenCalled();

    window.removeEventListener('mcqueen-onboarding-complete', spy);
  });

  // ── TC-011: localStorage mcqueen-onboarded set on completion ──────
  it('TC-011: localStorage mcqueen-onboarded set to true on completion', () => {
    renderAndShow();
    fireEvent.click(screen.getByRole('button', { name: /skip/i }));
    expect(localStorage.getItem('mcqueen-onboarded')).toBe('true');
  });

  // ── TC-012: localStorage mcqueen-onboarding-just-completed set ────
  describe('TC-012: localStorage mcqueen-onboarding-just-completed set', () => {
    it('sets key on Skip', () => {
      renderAndShow();
      fireEvent.click(screen.getByRole('button', { name: /skip/i }));
      expect(localStorage.getItem('mcqueen-onboarding-just-completed')).toBe('true');
    });

    it('sets key on Escape', () => {
      renderAndShow();
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(localStorage.getItem('mcqueen-onboarding-just-completed')).toBe('true');
    });

    it('sets key on final Next', () => {
      renderAndShow();
      clickNext(5);
      fireEvent.click(screen.getByRole('button', { name: /start trading/i }));
      expect(localStorage.getItem('mcqueen-onboarding-just-completed')).toBe('true');
    });
  });

  // ── TC-013: Custom event dispatched on completion ─────────────────
  describe('TC-013: Custom event mcqueen-onboarding-complete dispatched', () => {
    it('dispatches on Skip', () => {
      renderAndShow();
      const spy = vi.fn();
      window.addEventListener('mcqueen-onboarding-complete', spy);

      fireEvent.click(screen.getByRole('button', { name: /skip/i }));
      expect(spy).toHaveBeenCalledTimes(1);

      window.removeEventListener('mcqueen-onboarding-complete', spy);
    });

    it('dispatches on Escape', () => {
      renderAndShow();
      const spy = vi.fn();
      window.addEventListener('mcqueen-onboarding-complete', spy);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(spy).toHaveBeenCalledTimes(1);

      window.removeEventListener('mcqueen-onboarding-complete', spy);
    });

    it('dispatches on final Next', () => {
      renderAndShow();
      const spy = vi.fn();
      window.addEventListener('mcqueen-onboarding-complete', spy);

      clickNext(5);
      fireEvent.click(screen.getByRole('button', { name: /start trading/i }));
      expect(spy).toHaveBeenCalledTimes(1);

      window.removeEventListener('mcqueen-onboarding-complete', spy);
    });
  });

  // ── TC-014: Step indicators show 6 dots ───────────────────────────
  it('TC-014: Step indicators show 6 dots', () => {
    renderAndShow();
    const dots = document.querySelectorAll('[class*="step-dot"]');
    expect(dots).toHaveLength(6);
  });

  // ── TC-015: Active step indicator reflects current step ───────────
  describe('TC-015: Active step indicator reflects current step', () => {
    const getDots = () => document.querySelectorAll('[class*="step-dot"]');

    it('highlights dot 0 on step 0', () => {
      renderAndShow();
      expect(getDots()[0].className).toMatch(/active/);
      expect(getDots()[1].className).not.toMatch(/active/);
    });

    it('moves active indicator forward with Next', () => {
      renderAndShow();
      clickNext();
      expect(getDots()[1].className).toMatch(/active/);
      expect(getDots()[0].className).not.toMatch(/active/);

      clickNext();
      expect(getDots()[2].className).toMatch(/active/);
    });

    it('moves active indicator backward with Back', () => {
      renderAndShow();
      clickNext(2);
      expect(getDots()[2].className).toMatch(/active/);

      fireEvent.click(screen.getByRole('button', { name: /back/i }));
      expect(getDots()[1].className).toMatch(/active/);
      expect(getDots()[2].className).not.toMatch(/active/);
    });

    it('highlights last dot on final step', () => {
      renderAndShow();
      clickNext(5);
      expect(getDots()[5].className).toMatch(/active/);
    });
  });

  // ── TC-016: Completed step indicators ─────────────────────────────
  describe('TC-016: Completed step indicators', () => {
    const getDots = () => document.querySelectorAll('[class*="step-dot"]');

    it('no completed dots on step 0', () => {
      renderAndShow();
      getDots().forEach((dot) => {
        expect(dot.className).not.toMatch(/completed/);
      });
    });

    it('marks previous steps as completed', () => {
      renderAndShow();

      clickNext();
      expect(getDots()[0].className).toMatch(/completed/);

      clickNext();
      expect(getDots()[0].className).toMatch(/completed/);
      expect(getDots()[1].className).toMatch(/completed/);
      expect(getDots()[2].className).toMatch(/active/);

      clickNext(2);
      for (let i = 0; i < 4; i++) {
        expect(getDots()[i].className).toMatch(/completed/);
      }
      expect(getDots()[4].className).toMatch(/active/);
    });

    it('adjusts on backward navigation', () => {
      renderAndShow();
      clickNext(3);
      fireEvent.click(screen.getByRole('button', { name: /back/i }));

      expect(getDots()[0].className).toMatch(/completed/);
      expect(getDots()[1].className).toMatch(/completed/);
      expect(getDots()[2].className).toMatch(/active/);
      expect(getDots()[3].className).not.toMatch(/completed/);
      expect(getDots()[3].className).not.toMatch(/active/);
    });
  });

  // ── TC-017: Final step button text changes ────────────────────────
  describe('TC-017: Final step button text', () => {
    it('shows "Next" on non-final steps and "Start Trading!" on final step', () => {
      renderAndShow();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();

      clickNext(5);
      expect(screen.getByRole('button', { name: /start trading/i })).toBeInTheDocument();
    });

    it('reverts to "Next" when navigating back from final step', () => {
      renderAndShow();
      clickNext(5);
      expect(screen.getByRole('button', { name: /start trading/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /back/i }));
      expect(screen.queryByRole('button', { name: /start trading/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });
  });

  // ── TC-018: Step 1 balance demo widget ────────────────────────────
  it('TC-018: Step 1 renders balance demo widget', () => {
    renderAndShow();
    expect(screen.queryByText('$10,000.00')).not.toBeInTheDocument();

    clickNext();
    expect(screen.getByText('$10,000.00')).toBeInTheDocument();
    expect(screen.getByText('Play money to start trading')).toBeInTheDocument();

    clickNext();
    expect(screen.queryByText('$10,000.00')).not.toBeInTheDocument();
  });

  // ── TC-019: Step 2 color demo widget ──────────────────────────────
  it('TC-019: Step 2 renders color demo widget', () => {
    renderAndShow();
    expect(screen.queryByText('Going Up')).not.toBeInTheDocument();

    clickNext(2);
    expect(screen.getByText('Going Up')).toBeInTheDocument();
    expect(screen.getByText('▲ +5.2%')).toBeInTheDocument();
    expect(screen.getByText('Going Down')).toBeInTheDocument();
    expect(screen.getByText('▼ -3.1%')).toBeInTheDocument();

    clickNext();
    expect(screen.queryByText('Going Up')).not.toBeInTheDocument();
  });

  // ── TC-020: Accessibility ARIA attributes ─────────────────────────
  describe('TC-020: Accessibility ARIA attributes', () => {
    it('dialog has role, aria-modal, and aria-labelledby', () => {
      renderAndShow();
      const dialog = screen.getByRole('dialog');

      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'onboarding-title');
    });

    it('h2 has id="onboarding-title"', () => {
      renderAndShow();
      const title = document.getElementById('onboarding-title');
      expect(title).toBeInTheDocument();
      expect(title!.tagName).toBe('H2');
      expect(title).toHaveTextContent('Welcome to McQueen');
    });

    it('title text updates on navigation', () => {
      renderAndShow();
      const title = document.getElementById('onboarding-title');
      expect(title).toHaveTextContent('Welcome to McQueen');

      clickNext();
      expect(document.getElementById('onboarding-title')).toHaveTextContent(
        'Your Starting Balance',
      );
    });
  });
});
