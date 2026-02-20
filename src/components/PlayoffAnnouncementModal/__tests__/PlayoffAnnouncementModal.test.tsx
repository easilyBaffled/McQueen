import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PlayoffAnnouncementModal from '../PlayoffAnnouncementModal';
import { ScenarioContext } from '../../../context/ScenarioContext';
import type { ScenarioContextValue } from '../../../types';

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

vi.mock('../../../hooks/useFocusTrap', () => ({
  useFocusTrap: () => React.createRef(),
}));

const mockApplyPlayoffDilution = vi.fn();
vi.mock('../../../context/SimulationContext', () => ({
  useSimulation: vi.fn(() => ({
    applyPlayoffDilution: mockApplyPlayoffDilution,
    playoffDilutionApplied: false,
  })),
}));

import { useSimulation } from '../../../context/SimulationContext';
const mockUseSimulation = vi.mocked(useSimulation);

function renderModal(scenario = 'playoffs', dilutionApplied = false) {
  mockUseSimulation.mockReturnValue({
    applyPlayoffDilution: mockApplyPlayoffDilution,
    playoffDilutionApplied: dilutionApplied,
  } as unknown as ReturnType<typeof useSimulation>);

  const scenarioValue: ScenarioContextValue = {
    scenario,
    setScenario: vi.fn(),
    currentData: {
      players: [
        { id: 'mahomes', name: 'Mahomes', team: 'KC', position: 'QB', basePrice: 100, priceHistory: [{ price: 110, timestamp: '2024-01-01' }], totalSharesAvailable: 1000 },
        { id: 'allen', name: 'Allen', team: 'BUF', position: 'QB', basePrice: 90, priceHistory: [{ price: 95, timestamp: '2024-01-01' }], totalSharesAvailable: 1000 },
        { id: 'diggs-s', name: 'Diggs', team: 'HOU', position: 'WR', basePrice: 80, isBuyback: true, priceHistory: [{ price: 70, timestamp: '2024-01-01' }], totalSharesAvailable: 1000 },
      ],
    },
    players: [],
    scenarioLoading: false,
    scenarioVersion: 0,
  };

  return render(
    <ScenarioContext.Provider value={scenarioValue}>
      <PlayoffAnnouncementModal />
    </ScenarioContext.Provider>,
  );
}

describe('PlayoffAnnouncementModal', () => {
  beforeEach(() => {
    mockApplyPlayoffDilution.mockClear();
  });

  it('renders nothing when scenario is not playoffs', () => {
    const { container } = renderModal('midweek');
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('renders nothing when dilution already applied', () => {
    const { container } = renderModal('playoffs', true);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('renders modal with buyback step when scenario is playoffs', () => {
    renderModal('playoffs');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Season-End Buyback')).toBeInTheDocument();
  });

  it('shows buyback player details', () => {
    renderModal('playoffs');
    expect(screen.getByText('Diggs')).toBeInTheDocument();
    expect(screen.getByText('$70.00')).toBeInTheDocument();
  });

  it('advances to dilution step on Continue click', () => {
    renderModal('playoffs');
    fireEvent.click(screen.getByText('Continue'));
    expect(screen.getByText('Playoff Stock Issuance')).toBeInTheDocument();
    expect(screen.getByText(/15% additional shares/)).toBeInTheDocument();
  });

  it('shows playoff players in dilution step', () => {
    renderModal('playoffs');
    fireEvent.click(screen.getByText('Continue'));
    expect(screen.getByText('Mahomes')).toBeInTheDocument();
    expect(screen.getByText('Allen')).toBeInTheDocument();
  });

  it('applies dilution and closes on Got It click', () => {
    renderModal('playoffs');
    fireEvent.click(screen.getByText('Continue'));
    fireEvent.click(screen.getByText('Got It'));
    expect(mockApplyPlayoffDilution).toHaveBeenCalledWith(15);
  });

  it('closes on close button click and applies dilution', () => {
    renderModal('playoffs');
    fireEvent.click(screen.getByRole('button', { name: /close announcement/i }));
    expect(mockApplyPlayoffDilution).toHaveBeenCalledWith(15);
  });

  it('closes on Escape key', () => {
    renderModal('playoffs');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockApplyPlayoffDilution).toHaveBeenCalledWith(15);
  });
});
