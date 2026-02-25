import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import SimulationIndicator from '../SimulationIndicator';
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
            if (typeof value !== 'object' && typeof value !== 'function') domProps[key] = value;
            if (key === 'style' && typeof value === 'object') domProps[key] = value;
            if (typeof value === 'function' && key.startsWith('on')) domProps[key] = value;
          }
          return React.createElement(String(tag), { ref, ...domProps }, children);
        };
        return Component;
      },
    },
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../../utils/devMode', () => ({
  isDevMode: vi.fn(() => false),
}));

import { isDevMode } from '../../../utils/devMode';
const mockIsDevMode = vi.mocked(isDevMode);

const mockSetIsPlaying = vi.fn();

vi.mock('../../../context/SimulationContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../context/SimulationContext')>();
  return {
    ...actual,
    useSimulation: vi.fn(() => ({
      isPlaying: true,
      setIsPlaying: mockSetIsPlaying,
    })),
  };
});

import { useSimulation } from '../../../context/SimulationContext';
const mockUseSimulation = vi.mocked(useSimulation);

describe('SimulationIndicator', () => {
  beforeEach(() => {
    mockIsDevMode.mockReturnValue(false);
    mockSetIsPlaying.mockClear();
    mockUseSimulation.mockReturnValue({
      isPlaying: true,
      setIsPlaying: mockSetIsPlaying,
    } as unknown as ReturnType<typeof useSimulation>);
  });

  it('TC-006: renders for live scenario when dev mode is off', () => {
    renderWithProviders(<SimulationIndicator />, {
      scenarioOverrides: { scenario: 'live' },
    });
    expect(screen.getByText(/simulation/i)).toBeInTheDocument();
  });

  it('TC-006: contains a play/pause toggle button', () => {
    renderWithProviders(<SimulationIndicator />, {
      scenarioOverrides: { scenario: 'live' },
    });
    const button = screen.getByRole('button', { name: /pause|play/i });
    expect(button).toBeInTheDocument();
  });

  it('TC-006: clicking toggle calls setIsPlaying', () => {
    renderWithProviders(<SimulationIndicator />, {
      scenarioOverrides: { scenario: 'live' },
    });
    const button = screen.getByRole('button', { name: /pause/i });
    fireEvent.click(button);
    expect(mockSetIsPlaying).toHaveBeenCalledWith(false);
  });

  it('TC-007: renders for superbowl scenario', () => {
    renderWithProviders(<SimulationIndicator />, {
      scenarioOverrides: { scenario: 'superbowl' },
    });
    expect(screen.getByText(/simulation/i)).toBeInTheDocument();
  });

  it('TC-008: returns null when dev mode is on', () => {
    mockIsDevMode.mockReturnValue(true);
    const { container } = renderWithProviders(<SimulationIndicator />, {
      scenarioOverrides: { scenario: 'live' },
    });
    expect(container.firstChild).toBeNull();
  });

  it('TC-009: returns null for midweek scenario', () => {
    const { container } = renderWithProviders(<SimulationIndicator />, {
      scenarioOverrides: { scenario: 'midweek' },
    });
    expect(container.firstChild).toBeNull();
  });

  it('TC-009: returns null for playoffs scenario', () => {
    const { container } = renderWithProviders(<SimulationIndicator />, {
      scenarioOverrides: { scenario: 'playoffs' },
    });
    expect(container.firstChild).toBeNull();
  });

  it('shows play button when simulation is paused', () => {
    mockUseSimulation.mockReturnValue({
      isPlaying: false,
      setIsPlaying: mockSetIsPlaying,
    } as unknown as ReturnType<typeof useSimulation>);
    renderWithProviders(<SimulationIndicator />, {
      scenarioOverrides: { scenario: 'live' },
    });
    const button = screen.getByRole('button', { name: /play/i });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(mockSetIsPlaying).toHaveBeenCalledWith(true);
  });
});
