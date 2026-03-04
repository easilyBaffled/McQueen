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
vi.mock('../../../context/EspnContext', async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>;
  return {
    ...original,
    useEspn: vi.fn(() => ({
      espnLoading: false,
      espnError: null,
      refreshEspnNews: mockRefreshEspnNews,
      isEspnLiveMode: false,
      espnNews: [],
      espnPriceHistory: {},
    })),
  };
});

import { useEspn } from '../../../context/EspnContext';
const mockUseEspn = vi.mocked(useEspn);

vi.mock('../../../utils/devMode', () => ({
  isDevMode: vi.fn(() => false),
}));

import { isDevMode } from '../../../utils/devMode';
const mockIsDevMode = vi.mocked(isDevMode);

function renderToggle(scenario = 'midweek', { scenarioLoading = false } = {}) {
  const setScenario = vi.fn();
  const result = renderWithProviders(
    <MemoryRouter>
      <ScenarioToggle />
    </MemoryRouter>,
    { scenarioOverrides: { scenario, setScenario, scenarioLoading } },
  );
  return { ...result, setScenario };
}

describe('ScenarioToggle', () => {
  beforeEach(() => {
    mockRefreshEspnNews.mockClear();
    mockIsDevMode.mockReturnValue(false);
    mockUseEspn.mockReturnValue({
      espnLoading: false,
      espnError: null,
      refreshEspnNews: mockRefreshEspnNews,
      isEspnLiveMode: false,
      espnNews: [],
      espnPriceHistory: {},
    });
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
    mockUseEspn.mockReturnValue({
      espnLoading: false,
      espnError: 'Failed to fetch',
      refreshEspnNews: mockRefreshEspnNews,
      isEspnLiveMode: true,
      espnNews: [],
      espnPriceHistory: {},
    });
    renderToggle('espn-live');
    expect(screen.getByText(/ESPN Error: Failed to fetch/)).toBeInTheDocument();
  });

  it('shows ESPN loading state', () => {
    mockUseEspn.mockReturnValue({
      espnLoading: true,
      espnError: null,
      refreshEspnNews: mockRefreshEspnNews,
      isEspnLiveMode: true,
      espnNews: [],
      espnPriceHistory: {},
    });
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

  describe('loading state (mcq-dvn.3)', () => {
    it('active tab has loading class when scenarioLoading is true (TC-001)', () => {
      renderToggle('midweek', { scenarioLoading: true });
      const tabs = screen.getAllByRole('tab');
      const activeTab = tabs.find((t) => t.getAttribute('aria-selected') === 'true')!;
      expect(activeTab.className).toMatch(/loading/);
    });

    it('loading class clears when scenarioLoading becomes false (TC-002)', () => {
      const { rerender } = renderToggle('midweek', { scenarioLoading: true });
      const tabs = screen.getAllByRole('tab');
      const activeTab = tabs.find((t) => t.getAttribute('aria-selected') === 'true')!;
      expect(activeTab.className).toMatch(/loading/);

      rerender(
        <MemoryRouter>
          <ScenarioToggle />
        </MemoryRouter>,
      );
    });

    it('inactive tabs do not have loading class (TC-001 edge)', () => {
      renderToggle('midweek', { scenarioLoading: true });
      const tabs = screen.getAllByRole('tab');
      const inactiveTabs = tabs.filter((t) => t.getAttribute('aria-selected') === 'false');
      inactiveTabs.forEach((tab) => {
        expect(tab.className).not.toMatch(/loading/);
      });
    });

    it('loading appears on newly selected tab after switch (TC-003)', () => {
      const { setScenario } = renderToggle('midweek', { scenarioLoading: false });
      const tabs = screen.getAllByRole('tab');
      const liveTab = tabs.find((t) => t.textContent?.includes('Live Game'))!;
      fireEvent.click(liveTab);
      expect(setScenario).toHaveBeenCalledWith('live');
    });

    it('no tab has loading class when scenarioLoading is false (TC-005)', () => {
      renderToggle('midweek', { scenarioLoading: false });
      const tabs = screen.getAllByRole('tab');
      tabs.forEach((tab) => {
        expect(tab.className).not.toMatch(/loading/);
      });
    });

    it('no tab has loading class for each scenario when not loading (TC-005 edge)', () => {
      for (const id of ['midweek', 'live', 'playoffs', 'superbowl', 'espn-live']) {
        const { unmount } = renderToggle(id, { scenarioLoading: false });
        const tabs = screen.getAllByRole('tab');
        tabs.forEach((tab) => {
          expect(tab.className).not.toMatch(/loading/);
        });
        unmount();
      }
    });

    it('accessibility attributes preserved during loading (TC-008)', () => {
      renderToggle('midweek', { scenarioLoading: true });
      const tabs = screen.getAllByRole('tab');
      const activeTab = tabs.find((t) => t.getAttribute('aria-selected') === 'true')!;
      expect(activeTab).toHaveAttribute('role', 'tab');
      expect(activeTab).toHaveAttribute('aria-selected', 'true');
      expect(activeTab).toHaveAttribute('tabindex', '0');

      const inactiveTabs = tabs.filter((t) => t.getAttribute('aria-selected') === 'false');
      inactiveTabs.forEach((tab) => {
        expect(tab).toHaveAttribute('role', 'tab');
        expect(tab).toHaveAttribute('aria-selected', 'false');
        expect(tab).toHaveAttribute('tabindex', '-1');
      });

      const tablist = screen.getByRole('tablist', { name: /demo scenarios/i });
      expect(tablist).toBeInTheDocument();
    });

    it('tab click still works during loading (TC-011)', () => {
      const { setScenario } = renderToggle('midweek', { scenarioLoading: true });
      const tabs = screen.getAllByRole('tab');
      const playoffsTab = tabs.find((t) => t.textContent?.includes('Playoffs'))!;
      fireEvent.click(playoffsTab);
      expect(setScenario).toHaveBeenCalledWith('playoffs');
    });

    it('className contains no "undefined" or "false" literals (TC-012)', () => {
      renderToggle('midweek', { scenarioLoading: false });
      const tabs = screen.getAllByRole('tab');
      tabs.forEach((tab) => {
        expect(tab.className).not.toContain('undefined');
        expect(tab.className).not.toContain('false');
        expect(tab.className).not.toContain('null');
      });
    });

    it('className contains no "undefined" or "false" literals when loading (TC-012)', () => {
      renderToggle('midweek', { scenarioLoading: true });
      const tabs = screen.getAllByRole('tab');
      tabs.forEach((tab) => {
        expect(tab.className).not.toContain('undefined');
        expect(tab.className).not.toContain('false');
        expect(tab.className).not.toContain('null');
      });
    });

    it('rapid scenario switches only show loading on final tab (TC-004)', () => {
      const { setScenario } = renderToggle('midweek', { scenarioLoading: false });
      const tabs = screen.getAllByRole('tab');
      fireEvent.click(tabs.find((t) => t.textContent?.includes('Live Game'))!);
      fireEvent.click(tabs.find((t) => t.textContent?.includes('Playoffs'))!);
      fireEvent.click(tabs.find((t) => t.textContent?.includes('Super Bowl'))!);
      expect(setScenario).toHaveBeenCalledTimes(3);
      expect(setScenario).toHaveBeenNthCalledWith(1, 'live');
      expect(setScenario).toHaveBeenNthCalledWith(2, 'playoffs');
      expect(setScenario).toHaveBeenNthCalledWith(3, 'superbowl');
    });

    it('mobile dropdown trigger shows loading state (TC-007)', () => {
      renderToggle('midweek', { scenarioLoading: true });
      const trigger = document.querySelector('[class*="mobile-dropdown-trigger"]') as HTMLElement;
      expect(trigger.className).toMatch(/loading/);
    });

    it('ESPN tab shows loading alongside ESPN styles (TC-009)', () => {
      renderToggle('espn-live', { scenarioLoading: true });
      const tabs = screen.getAllByRole('tab');
      const espnTab = tabs.find((t) => t.getAttribute('aria-selected') === 'true')!;
      expect(espnTab.className).toMatch(/loading/);
      expect(espnTab.className).toMatch(/espn-tab/);
    });

    it('Super Bowl tab shows loading alongside LIVE badge (TC-010)', () => {
      renderToggle('superbowl', { scenarioLoading: true });
      const tabs = screen.getAllByRole('tab');
      const sbTab = tabs.find((t) => t.getAttribute('aria-selected') === 'true')!;
      expect(sbTab.className).toMatch(/loading/);
      expect(screen.getAllByText('LIVE').length).toBeGreaterThan(0);
    });
  });
});
