import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TimelineDebugger from '../TimelineDebugger';

const animationProps = new Set([
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
            if (animationProps.has(key)) continue;
            if (key === 'style' && typeof value === 'object') domProps[key] = value;
            else if (typeof value === 'function' && key.startsWith('on')) domProps[key] = value;
            else if (typeof value !== 'object') domProps[key] = value;
          }
          return React.createElement(String(tag), { ref, ...domProps }, children);
        };
        return Component;
      },
    },
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockGoToHistoryPoint = vi.fn();
const mockSetIsPlaying = vi.fn();

vi.mock('../../../context/SimulationContext', () => ({
  useSimulation: vi.fn(() => ({
    history: [
      { action: 'Scenario loaded', tick: 0 },
      { action: 'Player price updated', tick: 1 },
    ],
    tick: 1,
    goToHistoryPoint: mockGoToHistoryPoint,
    isPlaying: false,
    setIsPlaying: mockSetIsPlaying,
  })),
}));

vi.mock('../../../context/ScenarioContext', () => ({
  useScenario: vi.fn(() => ({
    scenario: 'midweek',
  })),
}));

vi.mock('../../../utils/devMode', () => ({
  isDevMode: vi.fn(() => true),
}));

import { isDevMode } from '../../../utils/devMode';
import { useSimulation } from '../../../context/SimulationContext';
import { useScenario } from '../../../context/ScenarioContext';
const mockIsDevMode = vi.mocked(isDevMode);
const mockUseSimulation = vi.mocked(useSimulation);
const mockUseScenario = vi.mocked(useScenario);

describe('TimelineDebugger', () => {
  beforeEach(() => {
    mockGoToHistoryPoint.mockClear();
    mockSetIsPlaying.mockClear();
    mockIsDevMode.mockReturnValue(true);
    mockUseScenario.mockReturnValue({ scenario: 'midweek' } as ReturnType<typeof useScenario>);
    mockUseSimulation.mockReturnValue({
      history: [
        { action: 'Scenario loaded', tick: 0 },
        { action: 'Player price updated', tick: 1 },
      ],
      tick: 1,
      goToHistoryPoint: mockGoToHistoryPoint,
      isPlaying: false,
      setIsPlaying: mockSetIsPlaying,
    } as unknown as ReturnType<typeof useSimulation>);
  });

  describe('Dev mode (full debugger)', () => {
    it('renders toggle button in dev mode', () => {
      render(<TimelineDebugger />);
      expect(screen.getByText('Timeline Debugger')).toBeInTheDocument();
      expect(screen.getByText('Tick 1')).toBeInTheDocument();
    });

    it('expands panel on toggle click', () => {
      render(<TimelineDebugger />);
      fireEvent.click(screen.getByText('Timeline Debugger'));
      expect(screen.getByText('Simulation Timeline')).toBeInTheDocument();
    });

    it('shows history entries when expanded', () => {
      render(<TimelineDebugger />);
      fireEvent.click(screen.getByText('Timeline Debugger'));
      expect(screen.getByText('Scenario loaded')).toBeInTheDocument();
      expect(screen.getByText('Player price updated')).toBeInTheDocument();
    });

    it('calls goToHistoryPoint when history item clicked', () => {
      render(<TimelineDebugger />);
      fireEvent.click(screen.getByText('Timeline Debugger'));
      fireEvent.click(screen.getByText('Scenario loaded'));
      expect(mockGoToHistoryPoint).toHaveBeenCalledWith(0);
    });

    it('toggles play/pause state', () => {
      render(<TimelineDebugger />);
      fireEvent.click(screen.getByText('Timeline Debugger'));
      const controlBtns = document.querySelectorAll('[class*="control-btn"]');
      expect(controlBtns.length).toBeGreaterThan(0);
      fireEvent.click(controlBtns[0]);
      expect(mockSetIsPlaying).toHaveBeenCalledWith(true);
    });

    it('shows hint text when expanded', () => {
      render(<TimelineDebugger />);
      fireEvent.click(screen.getByText('Timeline Debugger'));
      expect(screen.getByText(/click any point to rewind/i)).toBeInTheDocument();
    });

    it('TC-004: renders full debugger in dev mode for live scenario', () => {
      mockUseScenario.mockReturnValue({ scenario: 'live' } as ReturnType<typeof useScenario>);
      render(<TimelineDebugger />);
      expect(screen.getByText('Timeline Debugger')).toBeInTheDocument();
      expect(screen.getByText('Tick 1')).toBeInTheDocument();
      expect(screen.queryByText('Live simulation')).not.toBeInTheDocument();
    });

    it('TC-004: renders full debugger in dev mode for superbowl scenario', () => {
      mockUseScenario.mockReturnValue({ scenario: 'superbowl' } as ReturnType<typeof useScenario>);
      render(<TimelineDebugger />);
      expect(screen.getByText('Timeline Debugger')).toBeInTheDocument();
      expect(screen.queryByText('Live simulation')).not.toBeInTheDocument();
    });

    it('TC-004: renders full debugger in dev mode for midweek scenario', () => {
      render(<TimelineDebugger />);
      expect(screen.getByText('Timeline Debugger')).toBeInTheDocument();
    });
  });

  describe('Non-dev mode (simplified indicator)', () => {
    beforeEach(() => {
      mockIsDevMode.mockReturnValue(false);
    });

    it('TC-001: renders simplified indicator for live scenario', () => {
      mockUseScenario.mockReturnValue({ scenario: 'live' } as ReturnType<typeof useScenario>);
      const { container } = render(<TimelineDebugger />);
      expect(container.firstChild).not.toBeNull();
      expect(screen.getByText('Live simulation')).toBeInTheDocument();
      expect(screen.queryByText('Timeline Debugger')).not.toBeInTheDocument();
      expect(screen.queryByText('Simulation Timeline')).not.toBeInTheDocument();
    });

    it('TC-002: renders simplified indicator for superbowl scenario', () => {
      mockUseScenario.mockReturnValue({ scenario: 'superbowl' } as ReturnType<typeof useScenario>);
      const { container } = render(<TimelineDebugger />);
      expect(container.firstChild).not.toBeNull();
      expect(screen.getByText('Live simulation')).toBeInTheDocument();
      expect(screen.queryByText('Timeline Debugger')).not.toBeInTheDocument();
    });

    it('TC-003: returns null for midweek scenario', () => {
      mockUseScenario.mockReturnValue({ scenario: 'midweek' } as ReturnType<typeof useScenario>);
      const { container } = render(<TimelineDebugger />);
      expect(container.firstChild).toBeNull();
    });

    it('TC-003: returns null for playoffs scenario', () => {
      mockUseScenario.mockReturnValue({ scenario: 'playoffs' } as ReturnType<typeof useScenario>);
      const { container } = render(<TimelineDebugger />);
      expect(container.firstChild).toBeNull();
    });

    it('TC-003: returns null for espn-live scenario', () => {
      mockUseScenario.mockReturnValue({ scenario: 'espn-live' } as ReturnType<typeof useScenario>);
      const { container } = render(<TimelineDebugger />);
      expect(container.firstChild).toBeNull();
    });

    it('TC-005: play/pause button calls setIsPlaying with toggled value', () => {
      mockUseScenario.mockReturnValue({ scenario: 'live' } as ReturnType<typeof useScenario>);
      mockUseSimulation.mockReturnValue({
        ...mockUseSimulation(),
        isPlaying: true,
        setIsPlaying: mockSetIsPlaying,
      } as unknown as ReturnType<typeof useSimulation>);

      render(<TimelineDebugger />);
      const button = screen.getByRole('button', { name: /pause simulation/i });
      fireEvent.click(button);
      expect(mockSetIsPlaying).toHaveBeenCalledWith(false);
    });

    it('TC-005: play button calls setIsPlaying(true) when paused', () => {
      mockUseScenario.mockReturnValue({ scenario: 'live' } as ReturnType<typeof useScenario>);
      render(<TimelineDebugger />);
      const button = screen.getByRole('button', { name: /play simulation/i });
      fireEvent.click(button);
      expect(mockSetIsPlaying).toHaveBeenCalledWith(true);
    });

    it('TC-006: displays "Live simulation" label for both live and superbowl', () => {
      mockUseScenario.mockReturnValue({ scenario: 'live' } as ReturnType<typeof useScenario>);
      const { unmount } = render(<TimelineDebugger />);
      expect(screen.getByText('Live simulation')).toBeInTheDocument();
      unmount();

      mockUseScenario.mockReturnValue({ scenario: 'superbowl' } as ReturnType<typeof useScenario>);
      render(<TimelineDebugger />);
      expect(screen.getByText('Live simulation')).toBeInTheDocument();
    });

    it('TC-007: shows pause icon when playing', () => {
      mockUseScenario.mockReturnValue({ scenario: 'live' } as ReturnType<typeof useScenario>);
      mockUseSimulation.mockReturnValue({
        ...mockUseSimulation(),
        isPlaying: true,
        setIsPlaying: mockSetIsPlaying,
      } as unknown as ReturnType<typeof useSimulation>);

      render(<TimelineDebugger />);
      const button = screen.getByRole('button', { name: /pause simulation/i });
      const svg = button.querySelector('svg');
      expect(svg).toBeTruthy();
      const path = svg!.querySelector('path');
      expect(path?.getAttribute('d')).toBe('M6 19h4V5H6v14zm8-14v14h4V5h-4z');
    });

    it('TC-007: shows play icon when paused', () => {
      mockUseScenario.mockReturnValue({ scenario: 'live' } as ReturnType<typeof useScenario>);
      render(<TimelineDebugger />);
      const button = screen.getByRole('button', { name: /play simulation/i });
      const svg = button.querySelector('svg');
      expect(svg).toBeTruthy();
      const path = svg!.querySelector('path');
      expect(path?.getAttribute('d')).toBe('M8 5v14l11-7z');
    });

    it('TC-008: uses simplified CSS classes distinct from full debugger', () => {
      mockUseScenario.mockReturnValue({ scenario: 'live' } as ReturnType<typeof useScenario>);
      render(<TimelineDebugger />);
      const root = screen.getByText('Live simulation').closest('[class]')!;
      expect(root.className).toMatch(/simplified/);
      expect(root.className).not.toMatch(/timeline-debugger/);
      expect(document.querySelector('[class*="debugger-panel"]')).toBeNull();
      expect(document.querySelector('[class*="debugger-toggle"]')).toBeNull();
      expect(document.querySelector('[class*="history-list"]')).toBeNull();
      expect(document.querySelector('[class*="tick-badge"]')).toBeNull();
    });

    it('TC-009: has minimal DOM structure', () => {
      mockUseScenario.mockReturnValue({ scenario: 'live' } as ReturnType<typeof useScenario>);
      const { container } = render(<TimelineDebugger />);
      const root = container.firstChild as HTMLElement;
      expect(root).toBeTruthy();
      expect(root.children.length).toBeGreaterThanOrEqual(2);
      expect(root.children.length).toBeLessThanOrEqual(3);
      expect(document.querySelector('[class*="debugger-panel"]')).toBeNull();
      expect(document.querySelector('[class*="history-list"]')).toBeNull();
      expect(document.querySelector('[class*="timeline-track"]')).toBeNull();
    });

    it('TC-010: button has accessible aria-label that updates with state', () => {
      mockUseScenario.mockReturnValue({ scenario: 'live' } as ReturnType<typeof useScenario>);
      mockUseSimulation.mockReturnValue({
        ...mockUseSimulation(),
        isPlaying: true,
        setIsPlaying: mockSetIsPlaying,
      } as unknown as ReturnType<typeof useSimulation>);

      const { unmount } = render(<TimelineDebugger />);
      expect(screen.getByRole('button', { name: /pause simulation/i })).toBeInTheDocument();
      unmount();

      mockUseSimulation.mockReturnValue({
        ...mockUseSimulation(),
        isPlaying: false,
        setIsPlaying: mockSetIsPlaying,
      } as unknown as ReturnType<typeof useSimulation>);
      render(<TimelineDebugger />);
      expect(screen.getByRole('button', { name: /play simulation/i })).toBeInTheDocument();
    });

    it('TC-011: reads isPlaying from useSimulation, not local state', () => {
      mockUseScenario.mockReturnValue({ scenario: 'live' } as ReturnType<typeof useScenario>);
      mockUseSimulation.mockReturnValue({
        ...mockUseSimulation(),
        isPlaying: true,
        setIsPlaying: mockSetIsPlaying,
      } as unknown as ReturnType<typeof useSimulation>);

      render(<TimelineDebugger />);
      expect(screen.getByRole('button', { name: /pause simulation/i })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /pause simulation/i }));
      expect(mockSetIsPlaying).toHaveBeenCalledWith(false);
    });

    it('TC-012: reads scenario from useScenario context', () => {
      mockUseScenario.mockReturnValue({ scenario: 'live' } as ReturnType<typeof useScenario>);
      const { unmount } = render(<TimelineDebugger />);
      expect(screen.getByText('Live simulation')).toBeInTheDocument();
      unmount();

      mockUseScenario.mockReturnValue({ scenario: 'midweek' } as ReturnType<typeof useScenario>);
      const { container } = render(<TimelineDebugger />);
      expect(container.firstChild).toBeNull();
    });
  });
});
