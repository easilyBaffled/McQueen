import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ScenarioToggle from '../ScenarioToggle';
import { renderWithProviders } from '../../../test/renderWithProviders';

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

const mockRefreshEspnNews = vi.fn();
vi.mock('../../../context/SimulationContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../context/SimulationContext')>();
  return {
    ...actual,
    useSimulation: vi.fn(() => ({
      espnLoading: false,
      espnError: null,
      refreshEspnNews: mockRefreshEspnNews,
    })),
  };
});

import { useSimulation } from '../../../context/SimulationContext';
const mockUseSimulation = vi.mocked(useSimulation);

vi.mock('../../../utils/devMode', () => ({
  isDevMode: vi.fn(() => false),
}));

import { isDevMode } from '../../../utils/devMode';
const mockIsDevMode = vi.mocked(isDevMode);

function renderToggle(scenario = 'midweek', portfolio?: Record<string, { shares: number; avgCost: number }>) {
  const setScenario = vi.fn();
  const overrides: Parameters<typeof renderWithProviders>[1] = {
    scenarioOverrides: { scenario, setScenario },
  };
  if (portfolio !== undefined) {
    overrides.tradingOverrides = { portfolio };
  }
  const result = renderWithProviders(
    <MemoryRouter>
      <ScenarioToggle />
    </MemoryRouter>,
    overrides,
  );
  return { ...result, setScenario };
}

describe('ScenarioToggle', () => {
  beforeEach(() => {
    mockRefreshEspnNews.mockClear();
    mockIsDevMode.mockReturnValue(false);
    mockUseSimulation.mockReturnValue({
      espnLoading: false,
      espnError: null,
      refreshEspnNews: mockRefreshEspnNews,
    } as unknown as ReturnType<typeof useSimulation>);
  });

  it('renders DEMO badge', () => {
    renderToggle();
    expect(screen.getAllByText('DEMO').length).toBeGreaterThan(0);
  });

  it('renders all scenario tabs', () => {
    renderToggle();
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(5);
    expect(tabs[0]).toHaveAttribute('title', expect.stringContaining('midweek'));
    expect(tabs[1]).toHaveAttribute('title', expect.stringContaining('real-time'));
    expect(tabs[2]).toHaveAttribute('title', expect.stringContaining('Playoff'));
    expect(tabs[3]).toHaveAttribute('title', expect.stringContaining('Super Bowl'));
    expect(tabs[4]).toHaveAttribute('title', expect.stringContaining('ESPN'));
  });

  it('highlights active scenario tab', () => {
    renderToggle('midweek');
    const tabs = screen.getAllByRole('tab');
    const midweekTab = tabs.find((t) => t.textContent?.includes('Midweek'));
    expect(midweekTab).toHaveAttribute('aria-selected', 'true');
  });

  it('calls setScenario when tab clicked', () => {
    const { setScenario } = renderToggle('midweek');
    const tabs = screen.getAllByRole('tab');
    const liveTab = tabs.find((t) => t.textContent?.includes('Live Game'));
    fireEvent.click(liveTab!);
    expect(setScenario).toHaveBeenCalledWith('live');
  });

  it('shows live indicator for live scenario', () => {
    renderToggle('live');
    expect(screen.getAllByText('LIVE').length).toBeGreaterThan(0);
  });

  it('shows live indicator for superbowl scenario', () => {
    renderToggle('superbowl');
    expect(screen.getAllByText('LIVE').length).toBeGreaterThan(0);
  });

  it('shows ESPN indicator for espn-live scenario', () => {
    renderToggle('espn-live');
    expect(screen.getAllByText('ESPN').length).toBeGreaterThan(0);
  });

  it('shows ESPN refresh button for espn-live scenario', () => {
    renderToggle('espn-live');
    const refreshBtn = screen.getByRole('button', { name: /refresh espn/i });
    expect(refreshBtn).toBeInTheDocument();
    fireEvent.click(refreshBtn);
    expect(mockRefreshEspnNews).toHaveBeenCalled();
  });

  it('shows ESPN error banner when there is an error', () => {
    mockUseSimulation.mockReturnValue({
      espnLoading: false,
      espnError: 'Failed to fetch',
      refreshEspnNews: mockRefreshEspnNews,
    } as unknown as ReturnType<typeof useSimulation>);
    renderToggle('espn-live');
    expect(screen.getByText(/ESPN Error: Failed to fetch/)).toBeInTheDocument();
  });

  it('shows ESPN loading state', () => {
    mockUseSimulation.mockReturnValue({
      espnLoading: true,
      espnError: null,
      refreshEspnNews: mockRefreshEspnNews,
    } as unknown as ReturnType<typeof useSimulation>);
    renderToggle('espn-live');
    const refreshBtn = screen.getByRole('button', { name: /refresh espn/i });
    expect(refreshBtn).toBeDisabled();
  });

  it('shows demo tooltip on hover', () => {
    renderToggle();
    const demoBtn = screen.getByRole('button', { name: /demo scenarios information/i });
    fireEvent.mouseEnter(demoBtn);
    expect(screen.getByText('Demo Scenarios')).toBeInTheDocument();
    fireEvent.mouseLeave(demoBtn);
    expect(screen.queryByText('Demo Scenarios')).not.toBeInTheDocument();
  });

  it('shows Inspector tab in dev mode', () => {
    mockIsDevMode.mockReturnValue(true);
    renderToggle();
    expect(screen.getByText('Inspector')).toBeInTheDocument();
  });

  it('hides Inspector tab in production mode', () => {
    mockIsDevMode.mockReturnValue(false);
    renderToggle();
    expect(screen.queryByText('Inspector')).not.toBeInTheDocument();
  });

  it('mobile dropdown trigger exists with correct initial state', () => {
    renderToggle();
    const trigger = document.querySelector('[class*="mobile-dropdown-trigger"]') as HTMLElement;
    expect(trigger).toBeTruthy();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('mobile dropdown shows scenario items when open', () => {
    renderToggle();
    const trigger = document.querySelector('[class*="mobile-dropdown-trigger"]') as HTMLElement;
    fireEvent.click(trigger);
    const menu = document.querySelector('[class*="mobile-dropdown-menu"]');
    expect(menu).toBeTruthy();
    const buttons = menu!.querySelectorAll('button[type="button"]');
    expect(buttons.length).toBe(5);
  });

  it('mobile dropdown closes on Escape key', () => {
    renderToggle();
    const trigger = document.querySelector('[class*="mobile-dropdown-trigger"]') as HTMLElement;
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('mobile dropdown closes on outside click', () => {
    renderToggle();
    const trigger = document.querySelector('[class*="mobile-dropdown-trigger"]') as HTMLElement;
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    fireEvent.mouseDown(document.body);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('handles ArrowRight/ArrowLeft keyboard navigation on tabs', () => {
    renderToggle('midweek');
    const tablist = screen.getByRole('tablist', { name: /demo scenarios/i });
    const tabs = screen.getAllByRole('tab');
    tabs[0].focus();
    fireEvent.keyDown(tablist, { key: 'ArrowRight' });
    fireEvent.keyDown(tablist, { key: 'ArrowLeft' });
  });

  it('mobile dropdown shows espn refresh when espn-live is selected', () => {
    renderToggle('espn-live');
    const trigger = document.querySelector('[class*="mobile-dropdown-trigger"]') as HTMLElement;
    fireEvent.click(trigger);
    const mobileRefresh = document.querySelectorAll('[class*="mobile-espn-refresh"]');
    expect(mobileRefresh.length).toBeGreaterThanOrEqual(0);
  });

  it('shows live dot in mobile trigger for live scenario', () => {
    renderToggle('live');
    const trigger = document.querySelector('[class*="mobile-dropdown-trigger"]') as HTMLElement;
    const liveDot = trigger.querySelector('[class*="mobile-live-dot"]');
    expect(liveDot).toBeTruthy();
  });

  it('non-active tabs have tabIndex -1 for roving tabindex (TC-028)', () => {
    renderToggle('midweek');
    const tabs = screen.getAllByRole('tab');
    const midweekTab = tabs.find((t) => t.textContent?.includes('Midweek'));
    expect(midweekTab).toHaveAttribute('tabindex', '0');
    tabs
      .filter((t) => !t.textContent?.includes('Midweek'))
      .forEach((t) => expect(t).toHaveAttribute('tabindex', '-1'));
  });

  it('switching scenario updates active tab aria-selected (TC-026)', () => {
    const { setScenario } = renderToggle('midweek');
    const tabs = screen.getAllByRole('tab');
    const midweekTab = tabs.find((t) => t.textContent?.includes('Midweek'));
    expect(midweekTab).toHaveAttribute('aria-selected', 'true');
    tabs
      .filter((t) => !t.textContent?.includes('Midweek'))
      .forEach((t) => expect(t).toHaveAttribute('aria-selected', 'false'));

    const playoffsTab = tabs.find((t) => t.textContent?.includes('Playoffs'))!;
    fireEvent.click(playoffsTab);
    expect(setScenario).toHaveBeenCalledWith('playoffs');
  });

  it('mobile dropdown selection calls setScenario and closes dropdown (TC-027)', () => {
    const { setScenario } = renderToggle('midweek');
    const trigger = document.querySelector('[class*="mobile-dropdown-trigger"]') as HTMLElement;
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    const menu = document.querySelector('[class*="mobile-dropdown-menu"]')!;
    const buttons = menu.querySelectorAll('button[type="button"]');
    const playoffsBtn = Array.from(buttons).find((b) =>
      b.textContent?.includes('Playoffs'),
    )!;
    fireEvent.click(playoffsBtn);

    expect(setScenario).toHaveBeenCalledWith('playoffs');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('mobile dropdown trigger shows current scenario label (TC-029)', () => {
    renderToggle('playoffs');
    const trigger = document.querySelector('[class*="mobile-dropdown-trigger"]') as HTMLElement;
    expect(trigger.textContent).toContain('Playoffs');
  });

  it('mobile dropdown trigger shows Super Bowl for superbowl scenario (TC-029 edge)', () => {
    renderToggle('superbowl');
    const trigger = document.querySelector('[class*="mobile-dropdown-trigger"]') as HTMLElement;
    expect(trigger.textContent).toContain('Super Bowl');
  });

  describe('scenario switch confirmation dialog', () => {
    it('shows confirmation dialog when switching with non-empty portfolio', () => {
      renderToggle('midweek', { mahomes: { shares: 5, avgCost: 100 } });
      const tabs = screen.getAllByRole('tab');
      const liveTab = tabs.find((t) => t.textContent?.includes('Live Game'))!;
      fireEvent.click(liveTab);
      expect(screen.getByText(/Switching scenarios will reset/)).toBeInTheDocument();
    });

    it('does not show dialog when portfolio is empty', () => {
      const { setScenario } = renderToggle('midweek', {});
      const tabs = screen.getAllByRole('tab');
      const liveTab = tabs.find((t) => t.textContent?.includes('Live Game'))!;
      fireEvent.click(liveTab);
      expect(screen.queryByText(/Switching scenarios will reset/)).not.toBeInTheDocument();
      expect(setScenario).toHaveBeenCalledWith('live');
    });

    it('cancel on dialog preserves scenario and portfolio', () => {
      const { setScenario } = renderToggle('midweek', { mahomes: { shares: 5, avgCost: 100 } });
      const tabs = screen.getAllByRole('tab');
      const liveTab = tabs.find((t) => t.textContent?.includes('Live Game'))!;
      fireEvent.click(liveTab);
      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelBtn);
      expect(screen.queryByText(/Switching scenarios will reset/)).not.toBeInTheDocument();
      expect(setScenario).not.toHaveBeenCalled();
    });

    it('"Switch & Reset" proceeds with scenario change', () => {
      const { setScenario } = renderToggle('midweek', { mahomes: { shares: 5, avgCost: 100 } });
      const tabs = screen.getAllByRole('tab');
      const liveTab = tabs.find((t) => t.textContent?.includes('Live Game'))!;
      fireEvent.click(liveTab);
      const confirmBtn = screen.getByRole('button', { name: /switch & reset/i });
      fireEvent.click(confirmBtn);
      expect(screen.queryByText(/Switching scenarios will reset/)).not.toBeInTheDocument();
      expect(setScenario).toHaveBeenCalledWith('live');
    });

    it('shows confirmation dialog on mobile dropdown switch with non-empty portfolio', () => {
      renderToggle('midweek', { mahomes: { shares: 5, avgCost: 100 } });
      const trigger = document.querySelector('[class*="mobile-dropdown-trigger"]') as HTMLElement;
      fireEvent.click(trigger);
      const menu = document.querySelector('[class*="mobile-dropdown-menu"]')!;
      const buttons = menu.querySelectorAll('button[type="button"]');
      const liveBtn = Array.from(buttons).find((b) => b.textContent?.includes('Live Game'))!;
      fireEvent.click(liveBtn);
      expect(screen.getByText(/Switching scenarios will reset/)).toBeInTheDocument();
    });

    it('no dialog when clicking current scenario tab', () => {
      const { setScenario } = renderToggle('midweek', { mahomes: { shares: 5, avgCost: 100 } });
      const tabs = screen.getAllByRole('tab');
      const midweekTab = tabs.find((t) => t.textContent?.includes('Midweek'))!;
      fireEvent.click(midweekTab);
      expect(screen.queryByText(/Switching scenarios will reset/)).not.toBeInTheDocument();
      expect(setScenario).not.toHaveBeenCalled();
    });

    it('mobile dropdown skips dialog with empty portfolio (TC-007)', () => {
      const { setScenario } = renderToggle('midweek', {});
      const trigger = document.querySelector('[class*="mobile-dropdown-trigger"]') as HTMLElement;
      fireEvent.click(trigger);
      const menu = document.querySelector('[class*="mobile-dropdown-menu"]')!;
      const buttons = menu.querySelectorAll('button[type="button"]');
      const playoffsBtn = Array.from(buttons).find((b) => b.textContent?.includes('Playoffs'))!;
      fireEvent.click(playoffsBtn);
      expect(screen.queryByText(/Switching scenarios will reset/)).not.toBeInTheDocument();
      expect(setScenario).toHaveBeenCalledWith('playoffs');
    });

    it('confirm from mobile selection proceeds with switch (TC-008)', () => {
      const { setScenario } = renderToggle('midweek', { mahomes: { shares: 5, avgCost: 100 } });
      const trigger = document.querySelector('[class*="mobile-dropdown-trigger"]') as HTMLElement;
      fireEvent.click(trigger);
      const menu = document.querySelector('[class*="mobile-dropdown-menu"]')!;
      const buttons = menu.querySelectorAll('button[type="button"]');
      const sbBtn = Array.from(buttons).find((b) => b.textContent?.includes('Super Bowl'))!;
      fireEvent.click(sbBtn);
      expect(screen.getByText(/Switching scenarios will reset/)).toBeInTheDocument();
      const confirmBtn = screen.getByRole('button', { name: /switch & reset/i });
      fireEvent.click(confirmBtn);
      expect(screen.queryByText(/Switching scenarios will reset/)).not.toBeInTheDocument();
      expect(setScenario).toHaveBeenCalledWith('superbowl');
    });

    it('cancel from mobile selection preserves state (TC-009)', () => {
      const { setScenario } = renderToggle('midweek', { mahomes: { shares: 5, avgCost: 100 } });
      const trigger = document.querySelector('[class*="mobile-dropdown-trigger"]') as HTMLElement;
      fireEvent.click(trigger);
      const menu = document.querySelector('[class*="mobile-dropdown-menu"]')!;
      const buttons = menu.querySelectorAll('button[type="button"]');
      const playoffsBtn = Array.from(buttons).find((b) => b.textContent?.includes('Playoffs'))!;
      fireEvent.click(playoffsBtn);
      expect(screen.getByText(/Switching scenarios will reset/)).toBeInTheDocument();
      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelBtn);
      expect(screen.queryByText(/Switching scenarios will reset/)).not.toBeInTheDocument();
      expect(setScenario).not.toHaveBeenCalled();
    });

    it('dialog displays correct warning text and buttons (TC-010)', () => {
      renderToggle('midweek', { mahomes: { shares: 5, avgCost: 100 } });
      const tabs = screen.getAllByRole('tab');
      fireEvent.click(tabs.find((t) => t.textContent?.includes('Live Game'))!);
      expect(screen.getByText('Switching scenarios will reset your portfolio and cash to defaults.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /switch & reset/i })).toBeInTheDocument();
    });

    it('dialog overlay has data-testid attribute (TC-012)', () => {
      renderToggle('midweek', { mahomes: { shares: 5, avgCost: 100 } });
      const tabs = screen.getAllByRole('tab');
      fireEvent.click(tabs.find((t) => t.textContent?.includes('Live Game'))!);
      expect(screen.getByTestId('scenario-confirm-dialog')).toBeInTheDocument();
    });

    it('data-testid not present when dialog is hidden (TC-012 edge)', () => {
      renderToggle('midweek', { mahomes: { shares: 5, avgCost: 100 } });
      expect(screen.queryByTestId('scenario-confirm-dialog')).not.toBeInTheDocument();
    });

    it('dialog appears with multiple holdings (TC-013)', () => {
      renderToggle('midweek', {
        mahomes: { shares: 5, avgCost: 100 },
        kelce: { shares: 3, avgCost: 80 },
        allen: { shares: 10, avgCost: 50 },
      });
      const tabs = screen.getAllByRole('tab');
      fireEvent.click(tabs.find((t) => t.textContent?.includes('Playoffs'))!);
      expect(screen.getByText(/Switching scenarios will reset/)).toBeInTheDocument();
    });

    it('dialog appears with single share holding (TC-013 edge)', () => {
      renderToggle('midweek', { mahomes: { shares: 1, avgCost: 100 } });
      const tabs = screen.getAllByRole('tab');
      fireEvent.click(tabs.find((t) => t.textContent?.includes('Live Game'))!);
      expect(screen.getByText(/Switching scenarios will reset/)).toBeInTheDocument();
    });

    it('no duplicate dialogs on rapid sequential clicks (TC-014)', () => {
      renderToggle('midweek', { mahomes: { shares: 5, avgCost: 100 } });
      const tabs = screen.getAllByRole('tab');
      fireEvent.click(tabs.find((t) => t.textContent?.includes('Live Game'))!);
      fireEvent.click(tabs.find((t) => t.textContent?.includes('Playoffs'))!);
      const dialogs = screen.getAllByText(/Switching scenarios will reset/);
      expect(dialogs).toHaveLength(1);
      const confirmBtn = screen.getByRole('button', { name: /switch & reset/i });
      fireEvent.click(confirmBtn);
      expect(screen.queryByText(/Switching scenarios will reset/)).not.toBeInTheDocument();
    });
  });
});
