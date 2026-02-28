import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Mission from '../Mission';

// ── Mock DailyMission ───────────────────────────────────────────────
vi.mock('../../../components/DailyMission/DailyMission', () => ({
  default: () => <div data-testid="daily-mission-mock">DailyMission</div>,
}));

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

// ── Suite ────────────────────────────────────────────────────────────

describe('Mission page', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // TC-001
  it('renders without crashing', () => {
    render(<Mission />);
    expect(document.querySelector('[class*="mission-page"]')).toBeInTheDocument();
  });

  // TC-002
  it('displays the page title and subtitle', () => {
    render(<Mission />);
    expect(screen.getByRole('heading', { level: 1, name: 'Daily Predictions' })).toBeInTheDocument();
    expect(screen.getByText('Test your NFL knowledge by predicting player price movements')).toBeInTheDocument();
  });

  // TC-003
  it('renders the DailyMission child component', () => {
    render(<Mission />);
    const mock = screen.getByTestId('daily-mission-mock');
    expect(mock).toBeInTheDocument();
    expect(screen.getAllByTestId('daily-mission-mock')).toHaveLength(1);
  });

  // TC-004
  it('shows help panel by default for new users (no localStorage key)', () => {
    render(<Mission />);

    expect(screen.getByText('Pick Your Predictions')).toBeInTheDocument();
    expect(screen.getByText('Use the News')).toBeInTheDocument();
    expect(screen.getByText('Compete & Climb')).toBeInTheDocument();
    expect(screen.getByText(/Pro Tip:/)).toBeInTheDocument();
    expect(screen.getByText(/Look for players with recent news/)).toBeInTheDocument();
  });

  // TC-005
  it('hides help panel by default for returning users (localStorage key set)', () => {
    localStorage.setItem('mcqueen-mission-help-seen', 'true');
    render(<Mission />);

    expect(screen.queryByText('Pick Your Predictions')).not.toBeInTheDocument();
    expect(screen.queryByText('Use the News')).not.toBeInTheDocument();
    expect(screen.queryByText('Compete & Climb')).not.toBeInTheDocument();
  });

  // TC-006
  it('shows "How It Works" button text when panel is collapsed', () => {
    localStorage.setItem('mcqueen-mission-help-seen', 'true');
    render(<Mission />);

    const btn = screen.getByRole('button', { name: /How It Works/i });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toHaveTextContent('Hide Tips');
    expect(btn.querySelector('svg')).toBeInTheDocument();
  });

  // TC-007
  it('shows "Hide Tips" button text when panel is expanded', () => {
    render(<Mission />);

    const btn = screen.getByRole('button', { name: /Hide Tips/i });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toHaveTextContent('How It Works');
  });

  // TC-008
  it('clicking toggle button hides the help panel', async () => {
    const user = userEvent.setup();
    render(<Mission />);

    expect(screen.getByText('Pick Your Predictions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hide Tips/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Hide Tips/i }));

    expect(screen.queryByText('Pick Your Predictions')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /How It Works/i })).toBeInTheDocument();
  });

  // TC-009
  it('clicking toggle button shows the help panel', async () => {
    localStorage.setItem('mcqueen-mission-help-seen', 'true');
    const user = userEvent.setup();
    render(<Mission />);

    expect(screen.queryByText('Pick Your Predictions')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /How It Works/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /How It Works/i }));

    expect(screen.getByText('Pick Your Predictions')).toBeInTheDocument();
    expect(screen.getByText('Use the News')).toBeInTheDocument();
    expect(screen.getByText('Compete & Climb')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hide Tips/i })).toBeInTheDocument();
  });

  // TC-010
  it('closing help panel for the first time persists to localStorage', async () => {
    const setItemSpy = vi.spyOn(localStorage, 'setItem');
    const user = userEvent.setup();
    render(<Mission />);

    expect(screen.getByText('Pick Your Predictions')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Hide Tips/i }));

    expect(setItemSpy).toHaveBeenCalledWith('mcqueen-mission-help-seen', 'true');
    expect(localStorage.getItem('mcqueen-mission-help-seen')).toBe('true');

    setItemSpy.mockRestore();
  });

  // TC-011
  it('closing help panel a second time does not re-write localStorage', async () => {
    localStorage.setItem('mcqueen-mission-help-seen', 'true');
    const setItemSpy = vi.spyOn(localStorage, 'setItem');
    const user = userEvent.setup();
    render(<Mission />);

    await user.click(screen.getByRole('button', { name: /How It Works/i }));
    setItemSpy.mockClear();

    await user.click(screen.getByRole('button', { name: /Hide Tips/i }));

    const missionCalls = setItemSpy.mock.calls.filter(
      ([key]) => key === 'mcqueen-mission-help-seen',
    );
    expect(missionCalls).toHaveLength(0);

    setItemSpy.mockRestore();
  });

  // TC-012
  it('help panel contains all three instructional steps with correct content', () => {
    render(<Mission />);

    const steps = document.querySelectorAll('[class*="help-step"]');
    expect(steps.length).toBeGreaterThanOrEqual(3);

    expect(screen.getByText('🎯')).toBeInTheDocument();
    expect(screen.getByText('Pick Your Predictions')).toBeInTheDocument();
    expect(screen.getByText(/UP/)).toBeInTheDocument();
    expect(screen.getByText(/DOWN/)).toBeInTheDocument();

    expect(screen.getByText('📰')).toBeInTheDocument();
    expect(screen.getByText('Use the News')).toBeInTheDocument();
    expect(screen.getByText(/Injuries, big games, and trade rumors/)).toBeInTheDocument();

    expect(screen.getByText('🏆')).toBeInTheDocument();
    expect(screen.getByText('Compete & Climb')).toBeInTheDocument();
    expect(screen.getByText(/leaderboard/)).toBeInTheDocument();

    expect(screen.getByText(/💡 Pro Tip:/)).toBeInTheDocument();
    expect(screen.getByText(/Look for players with recent news/)).toBeInTheDocument();

    const upSpan = document.querySelector('.text-up');
    const downSpan = document.querySelector('.text-down');
    expect(upSpan).toBeInTheDocument();
    expect(downSpan).toBeInTheDocument();
  });

  // TC-013
  it('help panel renders with AnimatePresence wrapping (toggle cycle)', async () => {
    const user = userEvent.setup();
    render(<Mission />);

    expect(screen.getByText('Pick Your Predictions')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Hide Tips/i }));
    expect(screen.queryByText('Pick Your Predictions')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /How It Works/i }));
    expect(screen.getByText('Pick Your Predictions')).toBeInTheDocument();
  });

  // TC-014
  it('multiple toggle cycles work correctly', async () => {
    const setItemSpy = vi.spyOn(localStorage, 'setItem');
    const user = userEvent.setup();
    render(<Mission />);

    expect(screen.getByText('Pick Your Predictions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hide Tips/i })).toBeInTheDocument();

    // Cycle 1: close
    await user.click(screen.getByRole('button', { name: /Hide Tips/i }));
    expect(screen.queryByText('Pick Your Predictions')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /How It Works/i })).toBeInTheDocument();

    // Cycle 1: open
    await user.click(screen.getByRole('button', { name: /How It Works/i }));
    expect(screen.getByText('Pick Your Predictions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hide Tips/i })).toBeInTheDocument();

    // Cycle 2: close
    await user.click(screen.getByRole('button', { name: /Hide Tips/i }));
    expect(screen.queryByText('Pick Your Predictions')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /How It Works/i })).toBeInTheDocument();

    // Cycle 2: open
    await user.click(screen.getByRole('button', { name: /How It Works/i }));
    expect(screen.getByText('Pick Your Predictions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hide Tips/i })).toBeInTheDocument();

    // localStorage.setItem should have been called exactly once (first close)
    const missionCalls = setItemSpy.mock.calls.filter(
      ([key]) => key === 'mcqueen-mission-help-seen',
    );
    expect(missionCalls).toHaveLength(1);

    setItemSpy.mockRestore();
  });
});
