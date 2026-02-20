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

vi.mock('../../../utils/devMode', () => ({
  isDevMode: vi.fn(() => true),
}));

import { isDevMode } from '../../../utils/devMode';
const mockIsDevMode = vi.mocked(isDevMode);

describe('TimelineDebugger', () => {
  beforeEach(() => {
    mockGoToHistoryPoint.mockClear();
    mockSetIsPlaying.mockClear();
    mockIsDevMode.mockReturnValue(true);
  });

  it('renders nothing when not in dev mode', () => {
    mockIsDevMode.mockReturnValue(false);
    const { container } = render(<TimelineDebugger />);
    expect(container.firstChild).toBeNull();
  });

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
});
