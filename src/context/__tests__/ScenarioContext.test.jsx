import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ScenarioProvider, useScenario } from '../ScenarioContext';

function wrapper({ children }) {
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

  it('provides default state', () => {
    const { result } = renderScenario();
    expect(result.current.scenario).toBe('midweek');
    expect(result.current.scenarioLoading).toBe(true);
    expect(result.current.scenarioVersion).toBe(0);
  });

  it('throws when useScenario is called outside provider', () => {
    expect(() => {
      renderHook(() => useScenario());
    }).toThrow('useScenario must be used within a ScenarioProvider');
  });

  it('scenarioLoading becomes false after initial load', async () => {
    const { result } = renderScenario();

    await waitFor(() => {
      expect(result.current.scenarioLoading).toBe(false);
    });
    expect(result.current.currentData).not.toBeNull();
    expect(result.current.players.length).toBeGreaterThan(0);
  });

  it('setScenario changes the active scenario', async () => {
    const { result } = await renderScenarioAndWait();

    act(() => {
      result.current.setScenario('playoffs');
    });

    expect(result.current.scenario).toBe('playoffs');
  });

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
  });

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
  });

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

  it('handles unknown scenario ID without crashing', async () => {
    const { result } = await renderScenarioAndWait();

    act(() => {
      result.current.setScenario('nonexistent');
    });

    await waitFor(() => {
      expect(result.current.scenarioLoading).toBe(false);
    });
  });

  it('rapid scenario switching settles on the last scenario', async () => {
    const { result } = await renderScenarioAndWait();

    act(() => {
      result.current.setScenario('live');
      result.current.setScenario('playoffs');
      result.current.setScenario('superbowl');
    });

    await waitFor(() => {
      expect(result.current.scenarioLoading).toBe(false);
    });

    expect(result.current.scenario).toBe('superbowl');
    expect(result.current.currentData).not.toBeNull();
  });
});
