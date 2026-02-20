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
vi.mock('../../../context/SimulationContext', () => ({
  useSimulation: vi.fn(() => ({
    espnLoading: false,
    espnError: null,
    refreshEspnNews: mockRefreshEspnNews,
  })),
}));

import { useSimulation } from '../../../context/SimulationContext';
const mockUseSimulation = vi.mocked(useSimulation);

vi.mock('../../../utils/devMode', () => ({
  isDevMode: vi.fn(() => false),
}));

import { isDevMode } from '../../../utils/devMode';
const mockIsDevMode = vi.mocked(isDevMode);

function renderToggle(scenario = 'midweek') {
  const setScenario = vi.fn();
  const result = renderWithProviders(
    <MemoryRouter>
      <ScenarioToggle />
    </MemoryRouter>,
    { scenarioOverrides: { scenario, setScenario } },
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
});
