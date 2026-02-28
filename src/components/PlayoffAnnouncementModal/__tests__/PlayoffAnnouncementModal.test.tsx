import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
      scenario,
      players: [
        { id: 'mahomes', name: 'Mahomes', team: 'KC', position: 'QB', basePrice: 100, priceHistory: [{ price: 110, timestamp: '2024-01-01', reason: { type: 'news', headline: 'baseline' } }], totalSharesAvailable: 1000 },
        { id: 'allen', name: 'Allen', team: 'BUF', position: 'QB', basePrice: 90, priceHistory: [{ price: 95, timestamp: '2024-01-01', reason: { type: 'news', headline: 'baseline' } }], totalSharesAvailable: 1000 },
        { id: 'diggs-s', name: 'Diggs', team: 'HOU', position: 'WR', basePrice: 80, isBuyback: true, priceHistory: [{ price: 70, timestamp: '2024-01-01', reason: { type: 'news', headline: 'baseline' } }], totalSharesAvailable: 1000 },
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

  it('renders nothing for live scenario either', () => {
    const { container } = renderModal('live');
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
    expect(screen.getByText('Eliminated Players Being Bought Back')).toBeInTheDocument();
  });

  it('shows buyback player details with shares and proceeds', () => {
    renderModal('playoffs');
    expect(screen.getByText('Diggs')).toBeInTheDocument();
    expect(screen.getByText('$70.00')).toBeInTheDocument();
    // 5 shares from MOCK_BUYBACK_HOLDINGS
    expect(screen.getByText('5')).toBeInTheDocument();
    // proceeds = 70 * 5 = 350 (appears in row + summary)
    const proceedsElements = screen.getAllByText('+$350.00');
    expect(proceedsElements.length).toBeGreaterThanOrEqual(1);
  });

  it('shows dash for buyback player with no holdings', () => {
    mockUseSimulation.mockReturnValue({
      applyPlayoffDilution: mockApplyPlayoffDilution,
      playoffDilutionApplied: false,
    } as unknown as ReturnType<typeof useSimulation>);

    const scenarioValue: ScenarioContextValue = {
      scenario: 'playoffs',
      setScenario: vi.fn(),
      currentData: {
        scenario: 'playoffs',
        players: [
          { id: 'unknown-player', name: 'NoHoldings', team: 'NYG', position: 'WR', basePrice: 60, isBuyback: true, priceHistory: [{ price: 50, timestamp: '2024-01-01', reason: { type: 'news', headline: 'baseline' } }], totalSharesAvailable: 1000 },
          { id: 'mahomes', name: 'Mahomes', team: 'KC', position: 'QB', basePrice: 100, priceHistory: [{ price: 110, timestamp: '2024-01-01', reason: { type: 'news', headline: 'baseline' } }], totalSharesAvailable: 1000 },
        ],
      },
      players: [],
      scenarioLoading: false,
      scenarioVersion: 0,
    };

    render(
      <ScenarioContext.Provider value={scenarioValue}>
        <PlayoffAnnouncementModal />
      </ScenarioContext.Provider>,
    );

    expect(screen.getByText('NoHoldings')).toBeInTheDocument();
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it('shows buyback summary totals when proceeds exist', () => {
    renderModal('playoffs');
    expect(screen.getByText('Total Buyback Proceeds')).toBeInTheDocument();
    expect(screen.getByText('Total Loss from Original Cost')).toBeInTheDocument();
  });

  it('advances to dilution step on Continue click', () => {
    renderModal('playoffs');
    fireEvent.click(screen.getByText('Continue'));
    expect(screen.getByText('Playoff Stock Issuance')).toBeInTheDocument();
    expect(screen.queryByText('Season-End Buyback')).not.toBeInTheDocument();
    expect(screen.getByText(/15% additional shares/)).toBeInTheDocument();
  });

  it('shows playoff players with price impact in dilution step', () => {
    renderModal('playoffs');
    fireEvent.click(screen.getByText('Continue'));
    expect(screen.getByText('Mahomes')).toBeInTheDocument();
    expect(screen.getByText('Allen')).toBeInTheDocument();
    // Mahomes: current $110, diluted $93.50
    expect(screen.getByText('$110.00')).toBeInTheDocument();
    expect(screen.getByText('$93.50')).toBeInTheDocument();
    // All dilution rows show -15.0%
    const changeElements = screen.getAllByText('-15.0%');
    expect(changeElements.length).toBeGreaterThanOrEqual(1);
  });

  it('applies dilution and closes on Got It click', () => {
    const { container } = renderModal('playoffs');
    fireEvent.click(screen.getByText('Continue'));
    fireEvent.click(screen.getByText('Got It'));
    expect(mockApplyPlayoffDilution).toHaveBeenCalledWith(15);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('closes on close button click and applies dilution', () => {
    const { container } = renderModal('playoffs');
    fireEvent.click(screen.getByRole('button', { name: /close announcement/i }));
    expect(mockApplyPlayoffDilution).toHaveBeenCalledWith(15);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('close button on step 1 also applies dilution', () => {
    const { container } = renderModal('playoffs');
    fireEvent.click(screen.getByText('Continue'));
    fireEvent.click(screen.getByRole('button', { name: /close announcement/i }));
    expect(mockApplyPlayoffDilution).toHaveBeenCalledWith(15);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('closes on Escape key', () => {
    const { container } = renderModal('playoffs');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockApplyPlayoffDilution).toHaveBeenCalledWith(15);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('does not call applyPlayoffDilution again if already applied on close', () => {
    mockUseSimulation.mockReturnValue({
      applyPlayoffDilution: mockApplyPlayoffDilution,
      playoffDilutionApplied: false,
    } as unknown as ReturnType<typeof useSimulation>);

    const scenarioValue: ScenarioContextValue = {
      scenario: 'playoffs',
      setScenario: vi.fn(),
      currentData: {
        scenario: 'playoffs',
        players: [
          { id: 'mahomes', name: 'Mahomes', team: 'KC', position: 'QB', basePrice: 100, priceHistory: [{ price: 110, timestamp: '2024-01-01', reason: { type: 'news', headline: 'baseline' } }], totalSharesAvailable: 1000 },
        ],
      },
      players: [],
      scenarioLoading: false,
      scenarioVersion: 0,
    };

    const { rerender } = render(
      <ScenarioContext.Provider value={scenarioValue}>
        <PlayoffAnnouncementModal />
      </ScenarioContext.Provider>,
    );

    // Now simulate that dilution got applied (e.g., via Got It button)
    mockUseSimulation.mockReturnValue({
      applyPlayoffDilution: mockApplyPlayoffDilution,
      playoffDilutionApplied: true,
    } as unknown as ReturnType<typeof useSimulation>);

    rerender(
      <ScenarioContext.Provider value={scenarioValue}>
        <PlayoffAnnouncementModal />
      </ScenarioContext.Provider>,
    );

    mockApplyPlayoffDilution.mockClear();
    // Modal should be hidden now, close should be a no-op
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockApplyPlayoffDilution).not.toHaveBeenCalled();
  });

  it('shows step indicators with active state for current step', () => {
    const { container } = renderModal('playoffs');
    const dots = container.querySelectorAll('[class*="step-dot"]');
    expect(dots.length).toBe(2);
    expect(dots[0].className).toContain('active');
    expect(dots[1].className).not.toContain('active');
    expect(dots[1].className).not.toContain('completed');
  });

  it('updates step indicators when advancing to step 1', () => {
    const { container } = renderModal('playoffs');
    fireEvent.click(screen.getByText('Continue'));
    const dots = container.querySelectorAll('[class*="step-dot"]');
    expect(dots[0].className).toContain('completed');
    expect(dots[0].className).not.toContain('active');
    expect(dots[1].className).toContain('active');
  });

  it('has correct accessibility attributes', () => {
    renderModal('playoffs');
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'playoff-modal-title');
    const title = document.getElementById('playoff-modal-title');
    expect(title).toBeTruthy();
    expect(title!.textContent).toBe('Season-End Buyback');
  });

  it('shows correct playoff player count in dilution note', () => {
    renderModal('playoffs');
    fireEvent.click(screen.getByText('Continue'));
    // 2 non-buyback players (Mahomes, Allen)
    expect(screen.getByText(/all 2 playoff-bound players/)).toBeInTheDocument();
  });
});
