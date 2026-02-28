import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ScenarioProvider, useScenario } from '../ScenarioContext';
import { SimulationProvider, useSimulation } from '../SimulationContext';
import { TICK_INTERVAL_MS, ESPN_REFRESH_MS } from '../../constants';

vi.mock('../../services/espnService', async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>;
  return {
    ...original,
    fetchNFLNews: vi.fn().mockResolvedValue([]),
  };
});

import { fetchNFLNews } from '../../services/espnService';

const mockFetchNFLNews = vi.mocked(fetchNFLNews);

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ScenarioProvider>
      <SimulationProvider>{children}</SimulationProvider>
    </ScenarioProvider>
  );
}

function useSimAndScenario() {
  return { sim: useSimulation(), sc: useScenario() };
}

function renderSim() {
  return renderHook(() => useSimAndScenario(), { wrapper: Wrapper });
}

async function renderAndWait() {
  const hook = renderSim();
  await waitFor(() => {
    expect(hook.result.current.sc.scenarioLoading).toBe(false);
  });
  await waitFor(() => {
    expect(hook.result.current.sim.history.length).toBeGreaterThanOrEqual(1);
  });
  return hook;
}

async function switchAndWait(
  result: ReturnType<typeof renderSim>['result'],
  scenario: string,
) {
  act(() => {
    result.current.sc.setScenario(scenario);
  });
  await waitFor(() => {
    expect(result.current.sc.scenarioLoading).toBe(false);
  });
}

function makeArticle(overrides: Record<string, unknown> = {}) {
  return {
    id: 'art-1',
    headline: 'Test article',
    description: 'A test article',
    published: new Date().toISOString(),
    url: 'https://example.com',
    images: [],
    thumbnail: null,
    source: 'ESPN NFL',
    type: 'news',
    premium: false,
    categories: [],
    ...overrides,
  };
}

describe('SimulationContext', () => {
  beforeEach(() => {
    localStorage.clear();
    mockFetchNFLNews.mockReset().mockResolvedValue([]);
  });

  // TC-001
  it('returns an object with all documented properties and correct types', async () => {
    const { result } = await renderAndWait();
    const s = result.current.sim;

    expect(typeof s.tick).toBe('number');
    expect(typeof s.isPlaying).toBe('boolean');
    expect(typeof s.setIsPlaying).toBe('function');
    expect(typeof s.priceOverrides).toBe('object');
    expect(Array.isArray(s.history)).toBe(true);
    expect(Array.isArray(s.unifiedTimeline)).toBe(true);
    expect(typeof s.playoffDilutionApplied).toBe('boolean');
    expect(typeof s.isEspnLiveMode).toBe('boolean');
    expect(Array.isArray(s.espnNews)).toBe(true);
    expect(typeof s.espnLoading).toBe('boolean');
    expect(s.espnError === null || typeof s.espnError === 'string').toBe(true);
    expect(typeof s.espnPriceHistory).toBe('object');
    expect(typeof s.goToHistoryPoint).toBe('function');
    expect(typeof s.applyPlayoffDilution).toBe('function');
    expect(typeof s.refreshEspnNews).toBe('function');
    expect(typeof s.getUnifiedTimeline).toBe('function');
  });

  // TC-002
  it('throws when useSimulation is called outside SimulationProvider', () => {
    expect(() => {
      renderHook(() => useSimulation());
    }).toThrow('useSimulation must be used within a SimulationProvider');
  });

  it('throws even inside ScenarioProvider without SimulationProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useSimulation(), {
        wrapper: ({ children }) => (
          <ScenarioProvider>{children}</ScenarioProvider>
        ),
      });
    }).toThrow('useSimulation must be used within a SimulationProvider');
    spy.mockRestore();
  });

  // TC-003
  it('initializes all state to defaults on mount', async () => {
    const { result } = await renderAndWait();
    const s = result.current.sim;

    expect(s.tick).toBe(0);
    expect(s.isPlaying).toBe(false);
    expect(s.priceOverrides).toEqual({});
    expect(s.playoffDilutionApplied).toBe(false);
    expect(s.isEspnLiveMode).toBe(false);
    expect(s.espnNews).toEqual([]);
    expect(s.espnLoading).toBe(false);
    expect(s.espnError).toBeNull();
    expect(s.espnPriceHistory).toEqual({});
  });

  // TC-004
  it('creates initial history entry when players load', async () => {
    const { result } = await renderAndWait();
    const players = result.current.sc.players;
    const h = result.current.sim.history;

    expect(h.length).toBe(1);
    expect(h[0].tick).toBe(0);
    expect(h[0].action).toBe('Scenario loaded');
    players.forEach((p) => {
      expect(h[0].prices).toHaveProperty(p.id);
      expect(typeof h[0].prices[p.id]).toBe('number');
    });
  });

  it('does not duplicate the initial history entry on re-render', async () => {
    const { result, rerender } = await renderAndWait();
    const len = result.current.sim.history.length;
    rerender();
    expect(result.current.sim.history.length).toBe(len);
  });

  // TC-005
  it('builds non-empty sorted unified timeline for live scenario', async () => {
    const { result } = await renderAndWait();
    await switchAndWait(result, 'live');

    const tl = result.current.sim.unifiedTimeline;
    expect(tl.length).toBeGreaterThan(0);
    for (let i = 1; i < tl.length; i++) {
      expect(new Date(tl[i].timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(tl[i - 1].timestamp).getTime(),
      );
    }
    const ids = new Set(tl.map((e) => e.playerId));
    expect(ids.size).toBeGreaterThan(1);
  });

  // TC-006
  it('builds non-empty sorted unified timeline for superbowl scenario', async () => {
    const { result } = await renderAndWait();
    await switchAndWait(result, 'superbowl');

    const tl = result.current.sim.unifiedTimeline;
    expect(tl.length).toBeGreaterThan(0);
    for (let i = 1; i < tl.length; i++) {
      expect(new Date(tl[i].timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(tl[i - 1].timestamp).getTime(),
      );
    }
  });

  // TC-007
  it('unified timeline is empty for midweek', async () => {
    const { result } = await renderAndWait();
    expect(result.current.sim.unifiedTimeline).toEqual([]);
  });

  it('unified timeline is empty for playoffs', async () => {
    const { result } = await renderAndWait();
    await switchAndWait(result, 'playoffs');
    expect(result.current.sim.unifiedTimeline).toEqual([]);
  });

  it('unified timeline is empty for espn-live', async () => {
    const { result } = await renderAndWait();
    await switchAndWait(result, 'espn-live');
    expect(result.current.sim.unifiedTimeline).toEqual([]);
  });

  // TC-008
  it('isEspnLiveMode is false for midweek', async () => {
    const { result } = await renderAndWait();
    expect(result.current.sim.isEspnLiveMode).toBe(false);
  });

  it('isEspnLiveMode is false for live', async () => {
    const { result } = await renderAndWait();
    await switchAndWait(result, 'live');
    expect(result.current.sim.isEspnLiveMode).toBe(false);
  });

  it('isEspnLiveMode is true for espn-live', async () => {
    const { result } = await renderAndWait();
    await switchAndWait(result, 'espn-live');
    expect(result.current.sim.isEspnLiveMode).toBe(true);
  });

  it('isEspnLiveMode returns to false after leaving espn-live', async () => {
    const { result } = await renderAndWait();
    await switchAndWait(result, 'espn-live');
    expect(result.current.sim.isEspnLiveMode).toBe(true);
    await switchAndWait(result, 'playoffs');
    expect(result.current.sim.isEspnLiveMode).toBe(false);
  });

  // TC-009
  it('resets all simulation state on scenarioVersion change', async () => {
    const { result } = await renderAndWait();
    await switchAndWait(result, 'live');
    expect(result.current.sim.isPlaying).toBe(true);

    await switchAndWait(result, 'midweek');
    const s = result.current.sim;
    expect(s.tick).toBe(0);
    expect(s.priceOverrides).toEqual({});
    expect(s.playoffDilutionApplied).toBe(false);
    expect(s.espnNews).toEqual([]);
    expect(s.espnError).toBeNull();
    expect(s.espnPriceHistory).toEqual({});
    expect(s.history.length).toBe(1);
    expect(s.history[0].tick).toBe(0);
  });

  // TC-010
  it('auto-starts playing for live scenario', async () => {
    const { result } = await renderAndWait();
    expect(result.current.sim.isPlaying).toBe(false);
    await switchAndWait(result, 'live');
    expect(result.current.sim.isPlaying).toBe(true);
  });

  // TC-011
  it('auto-starts playing for superbowl scenario', async () => {
    const { result } = await renderAndWait();
    await switchAndWait(result, 'superbowl');
    expect(result.current.sim.isPlaying).toBe(true);
  });

  // TC-012
  it('does not auto-start playing for midweek', async () => {
    const { result } = await renderAndWait();
    await switchAndWait(result, 'live');
    expect(result.current.sim.isPlaying).toBe(true);
    await switchAndWait(result, 'midweek');
    expect(result.current.sim.isPlaying).toBe(false);
  });

  it('does not auto-start playing for playoffs', async () => {
    const { result } = await renderAndWait();
    await switchAndWait(result, 'playoffs');
    expect(result.current.sim.isPlaying).toBe(false);
  });

  it('does not auto-start playing for espn-live', async () => {
    const { result } = await renderAndWait();
    await switchAndWait(result, 'espn-live');
    expect(result.current.sim.isPlaying).toBe(false);
  });

  // TC-013
  it('reset creates initial history using getCurrentPriceFromHistory for standard scenario', async () => {
    const { result } = await renderAndWait();
    await switchAndWait(result, 'live');

    const h = result.current.sim.history;
    expect(h.length).toBe(1);
    expect(h[0].tick).toBe(0);
    expect(h[0].action).toBe('Scenario loaded');
    expect(Object.keys(h[0].prices).length).toBeGreaterThan(0);
  });

  it('reset creates initial history using basePrice for espn-live', async () => {
    const { result } = await renderAndWait();
    const oldPlayers = result.current.sc.players;

    await switchAndWait(result, 'espn-live');

    const h = result.current.sim.history;
    expect(h.length).toBe(1);
    expect(h[0].action).toBe(
      'ESPN Live mode activated - fetching real news...',
    );
    oldPlayers.forEach((p) => {
      expect(h[0].prices[p.id]).toBe(p.basePrice);
    });
  });

  // TC-014
  it('reset effect skips when scenarioVersion is 0', async () => {
    const { result } = await renderAndWait();
    expect(result.current.sc.scenarioVersion).toBe(0);
    expect(result.current.sim.history.length).toBe(1);
    expect(result.current.sim.history[0].action).toBe('Scenario loaded');
  });

  // TC-021
  it('applyPlayoffDilution adjusts non-buyback player prices', async () => {
    const { result } = await renderAndWait();
    await switchAndWait(result, 'playoffs');

    const players = result.current.sc.players;
    expect(players.length).toBeGreaterThan(0);

    act(() => {
      result.current.sim.applyPlayoffDilution(25);
    });

    expect(result.current.sim.playoffDilutionApplied).toBe(true);
    const overrides = result.current.sim.priceOverrides;
    players.forEach((p) => {
      if (!p.isBuyback) {
        expect(overrides[p.id]).toBeDefined();
      }
    });
    const lastH =
      result.current.sim.history[result.current.sim.history.length - 1];
    expect(lastH.action).toBe('Playoff stock issuance: 25% dilution applied');
  });

  // TC-022
  it('applyPlayoffDilution can only be applied once', async () => {
    const { result } = await renderAndWait();
    await switchAndWait(result, 'playoffs');

    act(() => {
      result.current.sim.applyPlayoffDilution(25);
    });
    const pricesAfter = { ...result.current.sim.priceOverrides };
    const histLen = result.current.sim.history.length;

    act(() => {
      result.current.sim.applyPlayoffDilution(50);
    });

    expect(result.current.sim.priceOverrides).toEqual(pricesAfter);
    expect(result.current.sim.history.length).toBe(histLen);
    expect(result.current.sim.playoffDilutionApplied).toBe(true);
  });

  // TC-023
  it('applyPlayoffDilution is no-op for non-playoffs scenarios', async () => {
    const { result } = await renderAndWait();
    const pricesBefore = { ...result.current.sim.priceOverrides };
    const histLen = result.current.sim.history.length;

    act(() => {
      result.current.sim.applyPlayoffDilution(25);
    });

    expect(result.current.sim.priceOverrides).toEqual(pricesBefore);
    expect(result.current.sim.playoffDilutionApplied).toBe(false);
    expect(result.current.sim.history.length).toBe(histLen);
  });

  // TC-031
  it('getUnifiedTimeline returns the same array as unifiedTimeline', async () => {
    const { result } = await renderAndWait();
    await switchAndWait(result, 'live');

    const fromState = result.current.sim.unifiedTimeline;
    const fromFn = result.current.sim.getUnifiedTimeline();
    expect(fromFn).toEqual(fromState);
    expect(fromFn.length).toBeGreaterThan(0);
  });

  it('getUnifiedTimeline returns [] for non-live scenarios', async () => {
    const { result } = await renderAndWait();
    expect(result.current.sim.getUnifiedTimeline()).toEqual([]);
  });

  // TC-032
  it('throws when SimulationProvider rendered without ScenarioProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useSimulation(), {
        wrapper: ({ children }) => (
          <SimulationProvider>{children}</SimulationProvider>
        ),
      });
    }).toThrow('useScenario must be used within a ScenarioProvider');
    spy.mockRestore();
  });

  // --- Tick interval tests (fake timers) ---
  describe('Tick interval', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.clearAllTimers();
      vi.useRealTimers();
    });

    async function renderFake() {
      const hook = renderSim();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });
      return hook;
    }

    async function switchFake(
      result: ReturnType<typeof renderSim>['result'],
      scenario: string,
    ) {
      await act(async () => {
        result.current.sc.setScenario(scenario);
        await vi.advanceTimersByTimeAsync(500);
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
    }

    // TC-015
    it('tick interval advances through unified timeline', async () => {
      vi.useRealTimers();
      const { result } = await renderAndWait();
      await switchAndWait(result, 'live');

      expect(result.current.sim.isPlaying).toBe(true);
      act(() => {
        result.current.sim.setIsPlaying(false);
      });

      const histBefore = result.current.sim.history.length;

      vi.useFakeTimers();
      act(() => {
        result.current.sim.setIsPlaying(true);
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(TICK_INTERVAL_MS);
      });

      expect(result.current.sim.tick).toBe(1);
      expect(
        Object.keys(result.current.sim.priceOverrides).length,
      ).toBeGreaterThan(0);
      expect(result.current.sim.history.length).toBeGreaterThan(histBefore);
    });

    // TC-016
    it('stops when tick reaches end of timeline', async () => {
      vi.useRealTimers();
      const { result } = await renderAndWait();
      await switchAndWait(result, 'live');
      act(() => {
        result.current.sim.setIsPlaying(false);
      });

      const len = result.current.sim.unifiedTimeline.length;
      expect(len).toBeGreaterThan(0);

      vi.useFakeTimers();
      act(() => {
        result.current.sim.setIsPlaying(true);
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(TICK_INTERVAL_MS * len);
      });

      expect(result.current.sim.isPlaying).toBe(false);
      expect(result.current.sim.tick).toBe(len - 1);

      const tickAfter = result.current.sim.tick;
      await act(async () => {
        await vi.advanceTimersByTimeAsync(TICK_INTERVAL_MS * 3);
      });
      expect(result.current.sim.tick).toBe(tickAfter);
    });

    // TC-017
    it('clears tick interval on unmount', async () => {
      const { result, unmount } = await renderFake();
      await switchFake(result, 'live');
      expect(result.current.sim.isPlaying).toBe(true);

      unmount();

      await vi.advanceTimersByTimeAsync(TICK_INTERVAL_MS * 5);
    });

    // TC-018
    it('setIsPlaying toggles play/pause', async () => {
      vi.useRealTimers();
      const { result } = await renderAndWait();
      await switchAndWait(result, 'live');
      expect(result.current.sim.isPlaying).toBe(true);

      act(() => {
        result.current.sim.setIsPlaying(false);
      });
      expect(result.current.sim.isPlaying).toBe(false);

      vi.useFakeTimers();

      const paused = result.current.sim.tick;
      await act(async () => {
        await vi.advanceTimersByTimeAsync(TICK_INTERVAL_MS * 2);
      });
      expect(result.current.sim.tick).toBe(paused);

      act(() => {
        result.current.sim.setIsPlaying(true);
      });
      expect(result.current.sim.isPlaying).toBe(true);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(TICK_INTERVAL_MS);
      });
      expect(result.current.sim.tick).toBeGreaterThan(paused);
    });

    // TC-019
    it('goToHistoryPoint restores state at given index', async () => {
      vi.useRealTimers();
      const { result } = await renderAndWait();
      await switchAndWait(result, 'live');
      act(() => {
        result.current.sim.setIsPlaying(false);
      });

      vi.useFakeTimers();
      act(() => {
        result.current.sim.setIsPlaying(true);
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(TICK_INTERVAL_MS * 5);
      });
      expect(result.current.sim.history.length).toBeGreaterThanOrEqual(4);

      act(() => {
        result.current.sim.setIsPlaying(false);
      });

      const targetIdx = 1;
      const targetTick = result.current.sim.history[targetIdx].tick;
      const targetPrices = result.current.sim.history[targetIdx].prices;

      act(() => {
        result.current.sim.goToHistoryPoint(targetIdx);
      });

      expect(result.current.sim.tick).toBe(targetTick);
      expect(result.current.sim.priceOverrides).toEqual(targetPrices);
      expect(result.current.sim.history.length).toBe(targetIdx + 1);
    });

    it('goToHistoryPoint(0) restores initial snapshot', async () => {
      const { result } = await renderFake();
      await switchFake(result, 'live');

      await act(async () => {
        await vi.advanceTimersByTimeAsync(TICK_INTERVAL_MS * 3);
      });

      act(() => {
        result.current.sim.setIsPlaying(false);
      });

      act(() => {
        result.current.sim.goToHistoryPoint(0);
      });

      expect(result.current.sim.tick).toBe(0);
      expect(result.current.sim.history.length).toBe(1);
    });

    // TC-020
    it('goToHistoryPoint with invalid index does nothing', async () => {
      const { result } = await renderFake();
      await vi.advanceTimersByTimeAsync(100);

      const tick0 = result.current.sim.tick;
      const hLen = result.current.sim.history.length;

      act(() => {
        result.current.sim.goToHistoryPoint(-1);
      });
      expect(result.current.sim.tick).toBe(tick0);
      expect(result.current.sim.history.length).toBe(hLen);

      act(() => {
        result.current.sim.goToHistoryPoint(999);
      });
      expect(result.current.sim.tick).toBe(tick0);
      expect(result.current.sim.history.length).toBe(hLen);

      act(() => {
        result.current.sim.goToHistoryPoint(hLen);
      });
      expect(result.current.sim.tick).toBe(tick0);
      expect(result.current.sim.history.length).toBe(hLen);
    });

    // TC-033
    it('multiple rapid scenario switches settle cleanly', async () => {
      const { result } = await renderFake();

      await act(async () => {
        result.current.sc.setScenario('live');
        result.current.sc.setScenario('espn-live');
        result.current.sc.setScenario('playoffs');
      });
      await vi.advanceTimersByTimeAsync(200);

      expect(result.current.sc.scenario).toBe('playoffs');
      expect(result.current.sim.isPlaying).toBe(false);
      expect(result.current.sim.isEspnLiveMode).toBe(false);
      expect(result.current.sim.unifiedTimeline).toEqual([]);

      const tickBefore = result.current.sim.tick;
      await act(async () => {
        await vi.advanceTimersByTimeAsync(TICK_INTERVAL_MS * 5);
      });
      expect(result.current.sim.tick).toBe(tickBefore);
    });
  });

  // --- ESPN integration tests ---
  describe('ESPN integration', () => {
    // TC-024
    it('triggers ESPN fetch on espn-live activation', async () => {
      const { result } = await renderAndWait();
      mockFetchNFLNews.mockResolvedValue([
        makeArticle({ id: 'espn-1', headline: 'NFL Update' }),
      ]);

      await switchAndWait(result, 'espn-live');
      expect(result.current.sim.isEspnLiveMode).toBe(true);

      await waitFor(() => {
        expect(result.current.sim.espnLoading).toBe(false);
      });
      expect(mockFetchNFLNews).toHaveBeenCalled();
    });

    // TC-025
    it('auto-refresh runs on ESPN_REFRESH_MS interval', async () => {
      vi.useFakeTimers();
      const hook = renderSim();
      await vi.advanceTimersByTimeAsync(200);

      mockFetchNFLNews.mockResolvedValue([]);
      await act(async () => {
        hook.result.current.sc.setScenario('espn-live');
      });
      await vi.advanceTimersByTimeAsync(200);

      const calls1 = mockFetchNFLNews.mock.calls.length;
      await act(async () => {
        await vi.advanceTimersByTimeAsync(ESPN_REFRESH_MS);
      });
      expect(mockFetchNFLNews.mock.calls.length).toBeGreaterThan(calls1);

      const calls2 = mockFetchNFLNews.mock.calls.length;
      await act(async () => {
        await vi.advanceTimersByTimeAsync(ESPN_REFRESH_MS);
      });
      expect(mockFetchNFLNews.mock.calls.length).toBeGreaterThan(calls2);

      vi.clearAllTimers();
      vi.useRealTimers();
    });

    // TC-026
    it('updates prices via sentiment analysis for matching articles', async () => {
      const { result } = await renderAndWait();

      mockFetchNFLNews.mockResolvedValue([
        makeArticle({
          id: 'art-mahomes',
          headline: 'Patrick Mahomes scores touchdown in dominant performance',
          description: 'Mahomes leads team to a winning effort',
        }),
      ]);

      await switchAndWait(result, 'espn-live');
      await waitFor(() => {
        expect(result.current.sim.espnLoading).toBe(false);
      });

      await waitFor(() => {
        const espnEntries = result.current.sim.history.filter((h) =>
          h.action.startsWith('ESPN:'),
        );
        expect(espnEntries.length).toBeGreaterThan(0);
      });

      const espnEntry = result.current.sim.history.find((h) =>
        h.action.startsWith('ESPN:'),
      );
      expect(espnEntry).toBeDefined();
      expect(espnEntry!.playerId).toBeDefined();
      expect(espnEntry!.sentiment).toBeDefined();

      expect(result.current.sim.priceOverrides).toHaveProperty('mahomes');
    });

    // TC-027
    it('does not reprocess duplicate ESPN articles', async () => {
      const { result } = await renderAndWait();

      const article = makeArticle({
        id: 'dup-1',
        headline: 'Patrick Mahomes scores touchdown',
        description: 'Mahomes great game',
      });
      mockFetchNFLNews.mockResolvedValue([article]);

      await switchAndWait(result, 'espn-live');
      await waitFor(() => {
        expect(result.current.sim.espnLoading).toBe(false);
      });

      const histLen = result.current.sim.history.length;

      act(() => {
        result.current.sim.refreshEspnNews();
      });
      await waitFor(() => {
        expect(result.current.sim.espnLoading).toBe(false);
      });

      expect(result.current.sim.history.length).toBe(histLen);
    });

    // TC-028
    it('captures fetch error in espnError', async () => {
      const { result } = await renderAndWait();
      mockFetchNFLNews.mockRejectedValue(new Error('Network timeout'));
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await switchAndWait(result, 'espn-live');
      await waitFor(() => {
        expect(result.current.sim.espnLoading).toBe(false);
      });
      expect(result.current.sim.espnError).toBe('Network timeout');
      spy.mockRestore();
    });

    it('captures non-Error thrown value as generic message', async () => {
      const { result } = await renderAndWait();
      mockFetchNFLNews.mockRejectedValue('string error');
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await switchAndWait(result, 'espn-live');
      await waitFor(() => {
        expect(result.current.sim.espnLoading).toBe(false);
      });
      expect(result.current.sim.espnError).toBe('Failed to fetch ESPN news');
      spy.mockRestore();
    });

    // TC-029
    it('refreshEspnNews manually triggers fetch in espn-live mode', async () => {
      const { result } = await renderAndWait();
      mockFetchNFLNews.mockResolvedValue([]);

      await switchAndWait(result, 'espn-live');
      await waitFor(() => {
        expect(result.current.sim.espnLoading).toBe(false);
      });

      const callsBefore = mockFetchNFLNews.mock.calls.length;
      act(() => {
        result.current.sim.refreshEspnNews();
      });
      await waitFor(() => {
        expect(mockFetchNFLNews.mock.calls.length).toBeGreaterThan(callsBefore);
      });
    });

    it('refreshEspnNews is no-op when not in espn-live mode', async () => {
      const { result } = await renderAndWait();
      const callsBefore = mockFetchNFLNews.mock.calls.length;

      act(() => {
        result.current.sim.refreshEspnNews();
      });
      expect(mockFetchNFLNews.mock.calls.length).toBe(callsBefore);
    });

    // TC-030
    it('ESPN refresh interval cleared on scenario change', async () => {
      vi.useFakeTimers();
      const hook = renderSim();
      await vi.advanceTimersByTimeAsync(200);

      mockFetchNFLNews.mockResolvedValue([]);
      await act(async () => {
        hook.result.current.sc.setScenario('espn-live');
      });
      await vi.advanceTimersByTimeAsync(200);

      await act(async () => {
        hook.result.current.sc.setScenario('live');
      });
      await vi.advanceTimersByTimeAsync(200);
      expect(hook.result.current.sim.isEspnLiveMode).toBe(false);

      const callsAfter = mockFetchNFLNews.mock.calls.length;
      await act(async () => {
        await vi.advanceTimersByTimeAsync(ESPN_REFRESH_MS * 3);
      });
      expect(mockFetchNFLNews.mock.calls.length).toBe(callsAfter);

      vi.clearAllTimers();
      vi.useRealTimers();
    });
  });
});
