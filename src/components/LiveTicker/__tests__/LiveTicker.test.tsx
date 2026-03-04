import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import LiveTicker from '../LiveTicker';
import { renderWithProviders } from '../../../test/renderWithProviders';

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
            if (typeof value !== 'object' && typeof value !== 'function') {
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

vi.mock('../../../context/SimulationContext', () => ({
  useSimulation: vi.fn(() => ({
    history: [],
    tick: 0,
    unifiedTimeline: [],
  })),
}));

import { useSimulation } from '../../../context/SimulationContext';
const mockUseSimulation = vi.mocked(useSimulation);

describe('LiveTicker', () => {
  it('returns null when scenario is midweek', () => {
    const { container } = renderWithProviders(<LiveTicker />, {
      scenarioOverrides: { scenario: 'midweek' },
    });
    expect(container.firstChild).toBeNull();
  });

  it('returns null when scenario is playoffs', () => {
    const { container } = renderWithProviders(<LiveTicker />, {
      scenarioOverrides: { scenario: 'playoffs' },
    });
    expect(container.firstChild).toBeNull();
  });

  it('renders LIVE label and ticker dot when scenario is live', () => {
    renderWithProviders(<LiveTicker />, {
      scenarioOverrides: { scenario: 'live' },
    });
    expect(screen.getByText('LIVE')).toBeInTheDocument();
    const dot = document.querySelector('[class*="ticker-dot"]');
    expect(dot).toBeTruthy();
  });

  it('shows current event headline from unified timeline at current tick', () => {
    mockUseSimulation.mockReturnValue({
      history: [],
      tick: 1,
      unifiedTimeline: [
        { reason: { headline: 'Mahomes throws TD' } },
        { reason: { headline: 'Allen interception' } },
      ],
    } as unknown as ReturnType<typeof useSimulation>);
    renderWithProviders(<LiveTicker />, {
      scenarioOverrides: { scenario: 'live' },
    });
    expect(screen.getByText('Allen interception')).toBeInTheDocument();
  });

  it('shows first event headline when tick is 0', () => {
    mockUseSimulation.mockReturnValue({
      history: [],
      tick: 0,
      unifiedTimeline: [
        { reason: { headline: 'Game start' } },
        { reason: { headline: 'First play' } },
      ],
    } as unknown as ReturnType<typeof useSimulation>);
    renderWithProviders(<LiveTicker />, {
      scenarioOverrides: { scenario: 'live' },
    });
    expect(screen.getByText('Game start')).toBeInTheDocument();
  });

  it('falls back to recent events headline when tick exceeds timeline length', () => {
    mockUseSimulation.mockReturnValue({
      history: [],
      tick: 5,
      unifiedTimeline: [
        { reason: { headline: 'Event A' } },
        { reason: { headline: 'Event B' } },
        { reason: { headline: 'Event C' } },
      ],
    } as unknown as ReturnType<typeof useSimulation>);
    renderWithProviders(<LiveTicker />, {
      scenarioOverrides: { scenario: 'live' },
    });
    expect(screen.getByText('Event C')).toBeInTheDocument();
  });

  it('falls back to static text when current tick entry has no headline and recentEvents[0] also lacks headline', () => {
    mockUseSimulation.mockReturnValue({
      history: [],
      tick: 1,
      unifiedTimeline: [
        { reason: { headline: 'Good event' } },
        { reason: {} },
      ],
    } as unknown as ReturnType<typeof useSimulation>);
    renderWithProviders(<LiveTicker />, {
      scenarioOverrides: { scenario: 'live' },
    });
    // recentEvents reversed puts { reason: {} } first, so no headline fallback either → static text
    expect(screen.getByText(/MNF: Chiefs vs Bills/)).toBeInTheDocument();
  });

  it('falls back to history events when unified timeline is empty', () => {
    mockUseSimulation.mockReturnValue({
      history: [
        { action: 'Scenario loaded', tick: 0 },
        { action: 'Player price updated', tick: 1 },
      ],
      tick: 0,
      unifiedTimeline: [],
    } as unknown as ReturnType<typeof useSimulation>);
    renderWithProviders(<LiveTicker />, {
      scenarioOverrides: { scenario: 'live' },
    });
    expect(screen.getByText('Player price updated')).toBeInTheDocument();
  });

  it('shows static fallback text when no events of any kind exist', () => {
    mockUseSimulation.mockReturnValue({
      history: [],
      tick: 0,
      unifiedTimeline: [],
    } as unknown as ReturnType<typeof useSimulation>);
    renderWithProviders(<LiveTicker />, {
      scenarioOverrides: { scenario: 'live' },
    });
    expect(screen.getByText(/MNF: Chiefs vs Bills - Live updates as they happen/)).toBeInTheDocument();
  });

  it('shows static fallback when history only has Scenario loaded entries', () => {
    mockUseSimulation.mockReturnValue({
      history: [
        { action: 'Scenario loaded', tick: 0 },
      ],
      tick: 0,
      unifiedTimeline: [],
    } as unknown as ReturnType<typeof useSimulation>);
    renderWithProviders(<LiveTicker />, {
      scenarioOverrides: { scenario: 'live' },
    });
    expect(screen.getByText(/MNF: Chiefs vs Bills/)).toBeInTheDocument();
  });

  it('shows recent events from unified timeline up to current tick', () => {
    mockUseSimulation.mockReturnValue({
      history: [],
      tick: 2,
      unifiedTimeline: [
        { reason: { headline: 'Event 1' } },
        { reason: { headline: 'Event 2' } },
        { reason: { headline: 'Event 3' } },
        { reason: { headline: 'Event 4' } },
      ],
    } as unknown as ReturnType<typeof useSimulation>);
    renderWithProviders(<LiveTicker />, {
      scenarioOverrides: { scenario: 'live' },
    });
    expect(screen.getByText('Event 3')).toBeInTheDocument();
  });
});
