import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ScenarioProvider, useScenario } from '../ScenarioContext';
import { SimulationProvider, useSimulation } from '../SimulationContext';
import { TradingProvider, useTrading } from '../TradingContext';
import { SocialProvider, useSocial } from '../SocialContext';

function FullProviders({ children }: { children: React.ReactNode }) {
  return (
    <ScenarioProvider>
      <SimulationProvider>
        <TradingProvider>
          <SocialProvider>{children}</SocialProvider>
        </TradingProvider>
      </SimulationProvider>
    </ScenarioProvider>
  );
}

function useAllContexts() {
  return {
    scenario: useScenario(),
    simulation: useSimulation(),
    trading: useTrading(),
    social: useSocial(),
  };
}

function renderAll() {
  return renderHook(() => useAllContexts(), {
    wrapper: FullProviders,
  });
}

async function renderAllAndWait() {
  const hook = renderAll();
  await waitFor(() => {
    expect(hook.result.current.scenario.scenarioLoading).toBe(false);
  });
  return hook;
}

describe('Split Contexts – provider composition', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('all four hooks return valid context objects', async () => {
    const { result } = await renderAllAndWait();

    expect(result.current.scenario.scenario).toBe('midweek');
    expect(result.current.simulation.tick).toBe(0);
    expect(result.current.trading.cash).toBe(10000);
    expect(result.current.social.watchlist).toEqual([]);
  });
});

describe('Split Contexts – trading', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides default state with startingPortfolio from scenario', async () => {
    const { result } = await renderAllAndWait();

    expect(result.current.trading.cash).toBe(10000);
    expect(result.current.trading.portfolio).toEqual({
      mahomes: { shares: 3, avgCost: 138 },
      mccaffrey: { shares: 2, avgCost: 148 },
      jefferson: { shares: 2, avgCost: 130 },
    });
  });

  it('throws when useTrading is called outside provider', () => {
    expect(() => {
      renderHook(() => useTrading());
    }).toThrow('useTrading must be used within a TradingProvider');
  });

  it('getPlayers returns array of players with computed fields', async () => {
    const { result } = await renderAllAndWait();
    const players = result.current.trading.getPlayers();
    expect(Array.isArray(players)).toBe(true);
    expect(players.length).toBeGreaterThan(0);
    expect(players[0]).toHaveProperty('currentPrice');
    expect(players[0]).toHaveProperty('changePercent');
  });

  it('getPlayer returns single player with computed fields', async () => {
    const { result } = await renderAllAndWait();
    const player = result.current.trading.getPlayer('mahomes');
    expect(player).not.toBeNull();
    expect(player!.name).toBe('Patrick Mahomes');
    expect(typeof player!.currentPrice).toBe('number');
    expect(typeof player!.changePercent).toBe('number');
    expect(player).toHaveProperty('priceHistory');
  });

  it('getPlayer returns null for unknown player', async () => {
    const { result } = await renderAllAndWait();
    expect(result.current.trading.getPlayer('nonexistent')).toBeNull();
  });

  it('getEffectivePrice returns a number for known player', async () => {
    const { result } = await renderAllAndWait();
    const price = result.current.trading.getEffectivePrice('mahomes');
    expect(typeof price).toBe('number');
    expect(price).toBeGreaterThan(0);
  });

  it('buyShares deducts cash and adds to portfolio', async () => {
    const { result } = await renderAllAndWait();

    act(() => {
      result.current.trading.buyShares('mahomes', 1);
    });

    expect(result.current.trading.cash).toBeLessThan(10000);
    expect(result.current.trading.portfolio['mahomes']).toBeDefined();
    expect(result.current.trading.portfolio['mahomes'].shares).toBeGreaterThan(
      0,
    );
  });

  it('buyShares returns false when insufficient cash', async () => {
    const { result } = await renderAllAndWait();

    let success;
    act(() => {
      success = result.current.trading.buyShares('mahomes', 1_000_000);
    });

    expect(success).toBe(false);
  });

  it('sellShares adds cash and removes from portfolio', async () => {
    const { result } = await renderAllAndWait();

    act(() => {
      result.current.trading.buyShares('mahomes', 5);
    });
    const cashAfterBuy = result.current.trading.cash;

    act(() => {
      result.current.trading.sellShares('mahomes', 2);
    });

    expect(result.current.trading.cash).toBeGreaterThan(cashAfterBuy);
  });

  it('sellShares returns false when not enough shares', async () => {
    const { result } = await renderAllAndWait();

    let success;
    act(() => {
      success = result.current.trading.sellShares('mahomes', 999);
    });

    expect(success).toBe(false);
  });

  it('selling all shares removes player from portfolio', async () => {
    const { result } = await renderAllAndWait();

    act(() => {
      result.current.trading.buyShares('allen', 2);
    });
    expect(result.current.trading.portfolio['allen']).toBeDefined();

    act(() => {
      result.current.trading.sellShares('allen', 2);
    });
    expect(result.current.trading.portfolio['allen']).toBeUndefined();
  });

  it('getPortfolioValue returns correct structure', async () => {
    const { result } = await renderAllAndWait();
    const pv = result.current.trading.getPortfolioValue();
    expect(pv).toHaveProperty('value');
    expect(pv).toHaveProperty('cost');
    expect(pv).toHaveProperty('gain');
    expect(pv).toHaveProperty('gainPercent');
  });

  it('portfolio value updates after buying', async () => {
    const { result } = await renderAllAndWait();
    const valueBefore = result.current.trading.getPortfolioValue().value;

    act(() => {
      result.current.trading.buyShares('allen', 5);
    });

    const valueAfter = result.current.trading.getPortfolioValue().value;
    expect(valueAfter).toBeGreaterThan(valueBefore);
  });
});

describe('Split Contexts – scenario switching resets', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('resets cash when changing scenario', async () => {
    const { result } = await renderAllAndWait();

    act(() => {
      result.current.trading.buyShares('mahomes', 5);
    });
    expect(result.current.trading.cash).toBeLessThan(10000);

    act(() => {
      result.current.scenario.setScenario('playoffs');
    });

    await waitFor(() => {
      expect(result.current.scenario.scenarioLoading).toBe(false);
    });

    expect(result.current.trading.cash).toBe(10000);
  });

  it('auto-starts playing for live scenario', async () => {
    const { result } = await renderAllAndWait();

    act(() => {
      result.current.scenario.setScenario('live');
    });

    await waitFor(() => {
      expect(result.current.scenario.scenarioLoading).toBe(false);
    });

    expect(result.current.simulation.isPlaying).toBe(true);
  });

  it('mission resets on scenario change but watchlist persists', async () => {
    const { result } = await renderAllAndWait();

    act(() => {
      result.current.social.setMissionPick('mahomes', 'riser');
      result.current.social.addToWatchlist('mahomes');
    });

    expect(result.current.social.missionPicks.risers).toContain('mahomes');
    expect(result.current.social.watchlist).toContain('mahomes');

    act(() => {
      result.current.scenario.setScenario('playoffs');
    });

    await waitFor(() => {
      expect(result.current.scenario.scenarioLoading).toBe(false);
    });

    expect(result.current.social.missionPicks.risers).toHaveLength(0);
    expect(result.current.social.watchlist).toContain('mahomes');
  });
});

describe('Split Contexts – watchlist', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('adds a player to watchlist', async () => {
    const { result } = await renderAllAndWait();

    act(() => {
      result.current.social.addToWatchlist('mahomes');
    });

    expect(result.current.social.watchlist).toContain('mahomes');
    expect(result.current.social.isWatching('mahomes')).toBe(true);
  });

  it('does not duplicate watchlist entries', async () => {
    const { result } = await renderAllAndWait();

    act(() => {
      result.current.social.addToWatchlist('mahomes');
      result.current.social.addToWatchlist('mahomes');
    });

    expect(
      result.current.social.watchlist.filter((id) => id === 'mahomes'),
    ).toHaveLength(1);
  });

  it('removes a player from watchlist', async () => {
    const { result } = await renderAllAndWait();

    act(() => {
      result.current.social.addToWatchlist('mahomes');
    });

    act(() => {
      result.current.social.removeFromWatchlist('mahomes');
    });

    expect(result.current.social.isWatching('mahomes')).toBe(false);
  });
});

describe('Split Contexts – missions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('setMissionPick adds player to risers', async () => {
    const { result } = await renderAllAndWait();

    act(() => {
      result.current.social.setMissionPick('mahomes', 'riser');
    });

    expect(result.current.social.missionPicks.risers).toContain('mahomes');
  });

  it('setMissionPick adds player to fallers', async () => {
    const { result } = await renderAllAndWait();

    act(() => {
      result.current.social.setMissionPick('allen', 'faller');
    });

    expect(result.current.social.missionPicks.fallers).toContain('allen');
  });

  it('clearMissionPick removes player from both arrays', async () => {
    const { result } = await renderAllAndWait();

    act(() => {
      result.current.social.setMissionPick('mahomes', 'riser');
    });

    act(() => {
      result.current.social.clearMissionPick('mahomes');
    });

    expect(result.current.social.missionPicks.risers).not.toContain('mahomes');
    expect(result.current.social.missionPicks.fallers).not.toContain('mahomes');
  });

  it('resetMission clears all picks and unreveals', async () => {
    const { result } = await renderAllAndWait();

    act(() => {
      result.current.social.setMissionPick('mahomes', 'riser');
      result.current.social.revealMission();
    });

    act(() => {
      result.current.social.resetMission();
    });

    expect(result.current.social.missionPicks.risers).toHaveLength(0);
    expect(result.current.social.missionPicks.fallers).toHaveLength(0);
    expect(result.current.social.missionRevealed).toBe(false);
  });

  it('getMissionScore returns null when not revealed', async () => {
    const { result } = await renderAllAndWait();
    expect(result.current.social.getMissionScore()).toBeNull();
  });

  it('getMissionScore returns score object when revealed', async () => {
    const { result } = await renderAllAndWait();

    act(() => {
      result.current.social.setMissionPick('mahomes', 'riser');
      result.current.social.revealMission();
    });

    const score = result.current.social.getMissionScore();
    expect(score).toHaveProperty('correct');
    expect(score).toHaveProperty('total');
    expect(score).toHaveProperty('percentile');
  });
});

describe('Split Contexts – leaderboard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getLeaderboardRankings returns sorted array with user', async () => {
    const { result } = await renderAllAndWait();
    const rankings = result.current.social.getLeaderboardRankings();

    expect(Array.isArray(rankings)).toBe(true);
    expect(rankings.length).toBeGreaterThan(0);

    const user = rankings.find((r) => r.isUser);
    expect(user).toBeDefined();
    expect(user!.name).toBe('You');
  });

  it('rankings are sorted by totalValue descending', async () => {
    const { result } = await renderAllAndWait();
    const rankings = result.current.social.getLeaderboardRankings();

    for (let i = 1; i < rankings.length; i++) {
      expect(rankings[i - 1].totalValue).toBeGreaterThanOrEqual(
        rankings[i].totalValue,
      );
    }
  });

  it('rankings include rank numbers starting at 1', async () => {
    const { result } = await renderAllAndWait();
    const rankings = result.current.social.getLeaderboardRankings();
    expect(rankings[0].rank).toBe(1);
    expect(rankings[rankings.length - 1].rank).toBe(rankings.length);
  });
});

describe('Split Contexts – simulation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides correct initial state', async () => {
    const { result } = await renderAllAndWait();

    expect(result.current.simulation.tick).toBe(0);
    expect(result.current.simulation.isPlaying).toBe(false);
    expect(result.current.simulation.history.length).toBeGreaterThanOrEqual(1);
  });

  it('throws when useSimulation is called outside provider', () => {
    expect(() => {
      renderHook(() => useSimulation());
    }).toThrow('useSimulation must be used within a SimulationProvider');
  });

  it('throws when useSocial is called outside provider', () => {
    expect(() => {
      renderHook(() => useSocial());
    }).toThrow('useSocial must be used within a SocialProvider');
  });

  it('resets simulation state on scenario change', async () => {
    const { result } = await renderAllAndWait();

    act(() => {
      result.current.scenario.setScenario('live');
    });

    await waitFor(() => {
      expect(result.current.scenario.scenarioLoading).toBe(false);
    });

    act(() => {
      result.current.scenario.setScenario('midweek');
    });

    await waitFor(() => {
      expect(result.current.scenario.scenarioLoading).toBe(false);
    });

    expect(result.current.simulation.tick).toBe(0);
    expect(result.current.simulation.isPlaying).toBe(false);
  });
});
