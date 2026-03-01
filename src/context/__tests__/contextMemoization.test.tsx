import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ScenarioProvider, useScenario } from '../ScenarioContext';
import { SimulationProvider, useSimulation } from '../SimulationContext';
import { EspnProvider } from '../EspnContext';
import { TradingProvider, useTrading } from '../TradingContext';
import { SocialProvider, useSocial } from '../SocialContext';

vi.mock('../../services/espnService', async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>;
  return {
    ...original,
    fetchNFLNews: vi.fn().mockResolvedValue([]),
  };
});

function ScenarioWrapper({ children }: { children: React.ReactNode }) {
  return <ScenarioProvider>{children}</ScenarioProvider>;
}

function SimulationWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ScenarioProvider>
      <SimulationProvider>{children}</SimulationProvider>
    </ScenarioProvider>
  );
}

function TradingWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ScenarioProvider>
      <SimulationProvider>
        <EspnProvider>
          <TradingProvider>{children}</TradingProvider>
        </EspnProvider>
      </SimulationProvider>
    </ScenarioProvider>
  );
}

function FullWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ScenarioProvider>
      <SimulationProvider>
        <EspnProvider>
          <TradingProvider>
            <SocialProvider>{children}</SocialProvider>
          </TradingProvider>
        </EspnProvider>
      </SimulationProvider>
    </ScenarioProvider>
  );
}

describe('Context value memoization', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // TC-001: ScenarioContext value is referentially stable across renders
  describe('ScenarioContext value stability', () => {
    it('value object retains same reference on re-render when deps unchanged', async () => {
      const hook = renderHook(() => useScenario(), {
        wrapper: ScenarioWrapper,
      });

      await waitFor(() => {
        expect(hook.result.current.scenarioLoading).toBe(false);
      });

      const valueBefore = hook.result.current;

      hook.rerender();

      const valueAfter = hook.result.current;
      expect(valueAfter).toBe(valueBefore);
    });
  });

  // TC-002: SimulationContext value is referentially stable across renders
  describe('SimulationContext value stability', () => {
    function useSimScenario() {
      return { sim: useSimulation(), sc: useScenario() };
    }

    it('value object retains same reference on re-render when deps unchanged', async () => {
      const hook = renderHook(() => useSimScenario(), {
        wrapper: SimulationWrapper,
      });

      await waitFor(() => {
        expect(hook.result.current.sc.scenarioLoading).toBe(false);
      });
      await waitFor(() => {
        expect(hook.result.current.sim.history.length).toBeGreaterThanOrEqual(1);
      });

      const valueBefore = hook.result.current.sim;
      hook.rerender();
      const valueAfter = hook.result.current.sim;

      expect(valueAfter).toBe(valueBefore);
    });
  });

  // TC-003: TradingContext value is referentially stable across renders
  describe('TradingContext value stability', () => {
    function useTradingScenario() {
      return { trading: useTrading(), sc: useScenario() };
    }

    it('value object retains same reference on re-render when deps unchanged', async () => {
      const hook = renderHook(() => useTradingScenario(), {
        wrapper: TradingWrapper,
      });

      await waitFor(() => {
        expect(hook.result.current.sc.scenarioLoading).toBe(false);
      });

      const valueBefore = hook.result.current.trading;
      hook.rerender();
      const valueAfter = hook.result.current.trading;

      expect(valueAfter).toBe(valueBefore);
    });
  });

  // TC-004: SocialContext value is referentially stable across renders
  describe('SocialContext value stability', () => {
    function useSocialScenario() {
      return { social: useSocial(), sc: useScenario() };
    }

    it('value object retains same reference on re-render when deps unchanged', async () => {
      const hook = renderHook(() => useSocialScenario(), {
        wrapper: FullWrapper,
      });

      await waitFor(() => {
        expect(hook.result.current.sc.scenarioLoading).toBe(false);
      });
      // Wait for league data to load
      await waitFor(() => {
        expect(hook.result.current.social.getLeagueMembers().length).toBeGreaterThan(0);
      });

      const valueBefore = hook.result.current.social;
      hook.rerender();
      const valueAfter = hook.result.current.social;

      expect(valueAfter).toBe(valueBefore);
    });
  });

  // TC-005: ScenarioContext `players` array is memoized
  describe('ScenarioContext players memoization', () => {
    it('players array retains same reference on re-render when data unchanged', async () => {
      const hook = renderHook(() => useScenario(), {
        wrapper: ScenarioWrapper,
      });

      await waitFor(() => {
        expect(hook.result.current.scenarioLoading).toBe(false);
      });

      const playersBefore = hook.result.current.players;
      expect(playersBefore.length).toBeGreaterThan(0);

      hook.rerender();

      const playersAfter = hook.result.current.players;
      expect(playersAfter).toBe(playersBefore);
    });

    it('empty players array is stable when currentData is null', () => {
      const hook = renderHook(() => useScenario(), {
        wrapper: ScenarioWrapper,
      });

      expect(hook.result.current.currentData).toBeNull();
      const playersBefore = hook.result.current.players;

      hook.rerender();

      const playersAfter = hook.result.current.players;
      expect(playersAfter).toBe(playersBefore);
    });
  });

  // TC-006: ScenarioContext value updates when a dependency changes
  describe('ScenarioContext value updates on dependency change', () => {
    it('produces new reference when scenario changes', async () => {
      const hook = renderHook(() => useScenario(), {
        wrapper: ScenarioWrapper,
      });

      await waitFor(() => {
        expect(hook.result.current.scenarioLoading).toBe(false);
      });

      const valueBefore = hook.result.current;

      act(() => {
        hook.result.current.setScenario('playoffs');
      });

      await waitFor(() => {
        expect(hook.result.current.scenarioLoading).toBe(false);
      });

      expect(hook.result.current).not.toBe(valueBefore);
      expect(hook.result.current.scenario).toBe('playoffs');
    });
  });

  // TC-013: Consumer re-render isolation — social context value is stable on parent re-render
  describe('Consumer re-render isolation', () => {
    function useSocialAndScenario() {
      return { social: useSocial(), sc: useScenario() };
    }

    it('social context value reference is stable across parent re-renders', async () => {
      const hook = renderHook(() => useSocialAndScenario(), {
        wrapper: FullWrapper,
      });

      await waitFor(() => {
        expect(hook.result.current.sc.scenarioLoading).toBe(false);
      });
      await waitFor(() => {
        expect(hook.result.current.social.getLeagueMembers().length).toBeGreaterThan(0);
      });

      const socialBefore = hook.result.current.social;
      hook.rerender();
      const socialAfter = hook.result.current.social;

      expect(socialAfter).toBe(socialBefore);
    });
  });
});
