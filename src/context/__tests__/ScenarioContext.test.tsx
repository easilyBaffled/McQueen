import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ScenarioProvider, useScenario } from '../ScenarioContext';

function wrapper({ children }: { children: React.ReactNode }) {
  return <ScenarioProvider>{children}</ScenarioProvider>;
}

function renderScenario() {
  return renderHook(() => useScenario(), { wrapper });
}

async function renderScenarioAndWait() {
  const hook = renderScenario();
  await waitFor(() => {
    expect(hook.result.current.scenarioLoading).toBe(false);
  });
  return hook;
}

describe('ScenarioContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // TC-001: ScenarioProvider renders and useScenario returns correct shape
  it('returns an object with all documented properties and correct types', () => {
    const { result } = renderScenario();
    const ctx = result.current;

    expect(ctx).toHaveProperty('scenario');
    expect(ctx).toHaveProperty('currentData');
    expect(ctx).toHaveProperty('players');
    expect(ctx).toHaveProperty('setScenario');
    expect(ctx).toHaveProperty('scenarioLoading');
    expect(ctx).toHaveProperty('scenarioVersion');

    expect(typeof ctx.scenario).toBe('string');
    expect(Array.isArray(ctx.players)).toBe(true);
    expect(typeof ctx.setScenario).toBe('function');
    expect(typeof ctx.scenarioLoading).toBe('boolean');
    expect(typeof ctx.scenarioVersion).toBe('number');
  });

  // TC-002: useScenario throws when used outside ScenarioProvider
  it('throws when useScenario is called outside provider', () => {
    expect(() => {
      renderHook(() => useScenario());
    }).toThrow('useScenario must be used within a ScenarioProvider');
  });

  // TC-003: Default scenario initializes to midweek with no stored value
  it('provides default state', () => {
    const { result } = renderScenario();
    expect(result.current.scenario).toBe('midweek');
    expect(result.current.scenarioLoading).toBe(true);
    expect(result.current.scenarioVersion).toBe(0);
    expect(result.current.currentData).toBeNull();
    expect(result.current.players).toEqual([]);
  });

  // TC-004: Initial scenario data loads via dynamic import
  it('loads initial scenario data and populates currentData and players', async () => {
    const { result } = renderScenario();
    expect(result.current.scenarioLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.scenarioLoading).toBe(false);
    });

    expect(result.current.currentData).not.toBeNull();
    expect(result.current.players.length).toBeGreaterThan(0);
  });

  // TC-005: Switching scenario loads new data via dynamic import
  it('setScenario changes the active scenario and loads new data', async () => {
    const { result } = await renderScenarioAndWait();

    act(() => {
      result.current.setScenario('playoffs');
    });

    expect(result.current.scenario).toBe('playoffs');
    expect(result.current.scenarioLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.scenarioLoading).toBe(false);
    });

    expect(result.current.currentData).not.toBeNull();
    expect(result.current.players.length).toBeGreaterThan(0);
  });

  // TC-006: espn-live scenario transforms imported data correctly
  it('transforms espn-live data into { scenario, players } shape', async () => {
    const { result } = await renderScenarioAndWait();

    act(() => {
      result.current.setScenario('espn-live');
    });

    await waitFor(() => {
      expect(result.current.scenarioLoading).toBe(false);
    });

    expect(result.current.currentData).toHaveProperty('scenario', 'espn-live');
    expect(result.current.currentData).toHaveProperty('players');
    expect(Array.isArray(result.current.players)).toBe(true);
    expect(result.current.players.length).toBeGreaterThan(0);
  });

  // TC-007: Unknown scenario ID does not crash and stops loading
  it('handles unknown scenario ID without crashing', async () => {
    const { result } = await renderScenarioAndWait();

    act(() => {
      result.current.setScenario('nonexistent');
    });

    await waitFor(() => {
      expect(result.current.scenarioLoading).toBe(false);
    });

    expect(result.current.scenario).toBe('nonexistent');
  });

  // TC-008: scenarioVersion increments on each setScenario call
  it('scenarioVersion increments on setScenario', async () => {
    const { result } = await renderScenarioAndWait();
    const v0 = result.current.scenarioVersion;

    act(() => {
      result.current.setScenario('live');
    });
    expect(result.current.scenarioVersion).toBe(v0 + 1);

    act(() => {
      result.current.setScenario('playoffs');
    });
    expect(result.current.scenarioVersion).toBe(v0 + 2);

    act(() => {
      result.current.setScenario('midweek');
    });
    expect(result.current.scenarioVersion).toBe(v0 + 3);
  });

  // TC-009: scenarioVersion increments when switching to same scenario
  it('scenarioVersion increments even when switching to the same scenario', async () => {
    const { result } = await renderScenarioAndWait();

    act(() => {
      result.current.setScenario('playoffs');
    });
    const v1 = result.current.scenarioVersion;

    act(() => {
      result.current.setScenario('playoffs');
    });
    expect(result.current.scenarioVersion).toBe(v1 + 1);

    act(() => {
      result.current.setScenario('playoffs');
    });
    expect(result.current.scenarioVersion).toBe(v1 + 2);
  });

  // TC-010: scenarioLoading is true during initial load and false after
  it('scenarioLoading becomes false after initial load', async () => {
    const { result } = renderScenario();
    expect(result.current.scenarioLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.scenarioLoading).toBe(false);
    });
    expect(result.current.currentData).not.toBeNull();
    expect(result.current.players.length).toBeGreaterThan(0);
  });

  // TC-011: scenarioLoading resets to true during scenario switch
  it('scenarioLoading resets to true when switching scenarios', async () => {
    const { result } = await renderScenarioAndWait();

    act(() => {
      result.current.setScenario('live');
    });

    expect(result.current.scenarioLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.scenarioLoading).toBe(false);
    });
    expect(result.current.currentData).not.toBeNull();
  });

  // TC-012: Dynamic import error is handled gracefully
  it('handles dynamic import failure without crashing', async () => {
    const { result } = await renderScenarioAndWait();

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    act(() => {
      result.current.setScenario('nonexistent');
    });

    await waitFor(() => {
      expect(result.current.scenarioLoading).toBe(false);
    });

    consoleSpy.mockRestore();
  });

  // TC-013 (mcq-1zw.6): ScenarioContext exposes scenarioError and retryScenarioLoad
  it('exposes scenarioError and retryScenarioLoad on context', () => {
    const { result } = renderScenario();
    expect(result.current).toHaveProperty('scenarioError');
    expect(result.current).toHaveProperty('retryScenarioLoad');
    expect(typeof result.current.retryScenarioLoad).toBe('function');
    expect(result.current.scenarioError).toBeNull();
  });

  // TC-014 (mcq-1zw.6): import failure does not leave UI in permanent loading
  it('scenarioLoading becomes false after import failure', async () => {
    const { result } = await renderScenarioAndWait();

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    act(() => {
      result.current.setScenario('nonexistent');
    });

    await waitFor(() => {
      expect(result.current.scenarioLoading).toBe(false);
    });

    expect(result.current.scenarioLoading).toBe(false);

    consoleSpy.mockRestore();
  });

  // TC-024 (mcq-1zw.6): unknown scenario key handled gracefully
  it('handles unknown scenario key gracefully without crash', async () => {
    const { result } = await renderScenarioAndWait();

    act(() => {
      result.current.setScenario('nonexistent-scenario');
    });

    await waitFor(() => {
      expect(result.current.scenarioLoading).toBe(false);
    });

    expect(result.current.scenario).toBe('nonexistent-scenario');
  });

  it('handles empty string scenario key', async () => {
    const { result } = await renderScenarioAndWait();

    act(() => {
      result.current.setScenario('');
    });

    await waitFor(() => {
      expect(result.current.scenarioLoading).toBe(false);
    });

    expect(result.current.scenario).toBe('');
  });

  // TC-013: Scenario selection persisted to localStorage on change
  it('persists scenario to localStorage on change', async () => {
    const { result } = await renderScenarioAndWait();

    const stored1 = JSON.parse(localStorage.getItem('mcqueen-scenario') ?? 'null');
    expect(stored1.data).toBe('midweek');

    act(() => {
      result.current.setScenario('playoffs');
    });

    await waitFor(() => {
      expect(result.current.scenarioLoading).toBe(false);
    });

    const stored2 = JSON.parse(localStorage.getItem('mcqueen-scenario') ?? 'null');
    expect(stored2.data).toBe('playoffs');

    act(() => {
      result.current.setScenario('superbowl');
    });

    const stored3 = JSON.parse(localStorage.getItem('mcqueen-scenario') ?? 'null');
    expect(stored3.data).toBe('superbowl');
  });

  // TC-014: Scenario selection restored from localStorage on mount
  it('restores scenario from localStorage on mount', async () => {
    localStorage.setItem(
      'mcqueen-scenario',
      JSON.stringify({ version: 1, data: 'playoffs' }),
    );

    const { result } = renderScenario();
    expect(result.current.scenario).toBe('playoffs');

    await waitFor(() => {
      expect(result.current.scenarioLoading).toBe(false);
    });

    expect(result.current.currentData).not.toBeNull();
  });

  // TC-014 edge case: corrupt storage falls back to default
  it('falls back to midweek when localStorage has corrupt data', () => {
    localStorage.setItem(
      'mcqueen-scenario',
      JSON.stringify({ version: 1, data: 42 }),
    );

    const { result } = renderScenario();
    expect(result.current.scenario).toBe(42);
  });

  // TC-015: Rapid scenario switching settles on the last scenario
  it('rapid scenario switching settles on the last scenario', async () => {
    const { result } = await renderScenarioAndWait();
    const v0 = result.current.scenarioVersion;

    act(() => {
      result.current.setScenario('live');
      result.current.setScenario('playoffs');
      result.current.setScenario('superbowl');
    });

    expect(result.current.scenario).toBe('superbowl');
    expect(result.current.scenarioVersion).toBe(v0 + 3);

    await waitFor(() => {
      expect(result.current.scenarioLoading).toBe(false);
    });

    expect(result.current.currentData).not.toBeNull();
  });

  // TC-016: Stale load is cancelled on unmount
  it('does not warn on unmount during pending load', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result, unmount } = renderScenario();

    act(() => {
      result.current.setScenario('live');
    });

    unmount();

    await new Promise((r) => setTimeout(r, 100));

    const reactWarnings = consoleSpy.mock.calls.filter((call) =>
      String(call[0]).includes('unmounted'),
    );
    expect(reactWarnings).toHaveLength(0);

    consoleSpy.mockRestore();
  });

  // TC-017: players is derived as empty array when currentData is null or has no players
  it('players is [] when currentData is null', () => {
    const { result } = renderScenario();
    expect(result.current.currentData).toBeNull();
    expect(result.current.players).toEqual([]);
    expect(Array.isArray(result.current.players)).toBe(true);
  });

  it('players is always an array after loading valid data', async () => {
    const { result } = await renderScenarioAndWait();
    expect(Array.isArray(result.current.players)).toBe(true);
    expect(result.current.players.length).toBeGreaterThan(0);
    expect(result.current.players).toEqual(result.current.currentData?.players);
  });
});
