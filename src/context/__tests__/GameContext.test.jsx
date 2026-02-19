import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { GameProvider, useGame } from '../GameContext';

function wrapper({ children }) {
  return <GameProvider>{children}</GameProvider>;
}

function renderGame() {
  return renderHook(() => useGame(), { wrapper });
}

async function renderGameAndWait() {
  const hook = renderGame();
  await waitFor(() => {
    expect(hook.result.current.scenarioLoading).toBe(false);
  });
  return hook;
}

describe('GameContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides default state', () => {
    const { result } = renderGame();
    expect(result.current.scenario).toBe('midweek');
    expect(result.current.cash).toBe(10000);
    expect(result.current.isPlaying).toBe(false);
  });

  it('throws when useGame is called outside provider', () => {
    expect(() => {
      renderHook(() => useGame());
    }).toThrow('useGame must be used within a GameProvider');
  });

  it('getPlayers returns array of players with computed fields', async () => {
    const { result } = await renderGameAndWait();
    const players = result.current.getPlayers();
    expect(Array.isArray(players)).toBe(true);
    expect(players.length).toBeGreaterThan(0);
    expect(players[0]).toHaveProperty('currentPrice');
    expect(players[0]).toHaveProperty('changePercent');
    expect(players[0]).toHaveProperty('id');
    expect(players[0]).toHaveProperty('name');
  });

  it('getPlayer returns single player with computed fields', async () => {
    const { result } = await renderGameAndWait();
    const player = result.current.getPlayer('mahomes');
    expect(player).not.toBeNull();
    expect(player.name).toBe('Patrick Mahomes');
    expect(typeof player.currentPrice).toBe('number');
    expect(typeof player.changePercent).toBe('number');
    expect(player).toHaveProperty('priceHistory');
  });

  it('getPlayer returns null for unknown player', async () => {
    const { result } = await renderGameAndWait();
    expect(result.current.getPlayer('nonexistent')).toBeNull();
  });

  it('getEffectivePrice returns a number for known player', async () => {
    const { result } = await renderGameAndWait();
    const price = result.current.getEffectivePrice('mahomes');
    expect(typeof price).toBe('number');
    expect(price).toBeGreaterThan(0);
  });
});

describe('GameContext – trading', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('buyShares deducts cash and adds to portfolio', async () => {
    const { result } = await renderGameAndWait();

    act(() => {
      result.current.buyShares('mahomes', 1);
    });

    expect(result.current.cash).toBeLessThan(10000);
    expect(result.current.portfolio['mahomes']).toBeDefined();
    expect(result.current.portfolio['mahomes'].shares).toBeGreaterThan(0);
  });

  it('buyShares returns false when insufficient cash', async () => {
    const { result } = await renderGameAndWait();

    let success;
    act(() => {
      success = result.current.buyShares('mahomes', 1_000_000);
    });

    expect(success).toBe(false);
  });

  it('sellShares adds cash and removes from portfolio', async () => {
    const { result } = await renderGameAndWait();

    act(() => {
      result.current.buyShares('mahomes', 5);
    });
    const cashAfterBuy = result.current.cash;

    act(() => {
      result.current.sellShares('mahomes', 2);
    });

    expect(result.current.cash).toBeGreaterThan(cashAfterBuy);
  });

  it('sellShares returns false when not enough shares', () => {
    const { result } = renderGame();

    let success;
    act(() => {
      success = result.current.sellShares('mahomes', 999);
    });

    expect(success).toBe(false);
  });

  it('selling all shares removes player from portfolio', () => {
    const { result } = renderGame();

    act(() => {
      result.current.buyShares('allen', 2);
    });
    expect(result.current.portfolio['allen']).toBeDefined();

    act(() => {
      result.current.sellShares('allen', 2);
    });
    expect(result.current.portfolio['allen']).toBeUndefined();
  });
});

describe('GameContext – watchlist', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('adds a player to watchlist', () => {
    const { result } = renderGame();

    act(() => {
      result.current.addToWatchlist('mahomes');
    });

    expect(result.current.watchlist).toContain('mahomes');
    expect(result.current.isWatching('mahomes')).toBe(true);
  });

  it('does not duplicate watchlist entries', () => {
    const { result } = renderGame();

    act(() => {
      result.current.addToWatchlist('mahomes');
      result.current.addToWatchlist('mahomes');
    });

    expect(result.current.watchlist.filter((id) => id === 'mahomes')).toHaveLength(1);
  });

  it('removes a player from watchlist', () => {
    const { result } = renderGame();

    act(() => {
      result.current.addToWatchlist('mahomes');
    });

    act(() => {
      result.current.removeFromWatchlist('mahomes');
    });

    expect(result.current.isWatching('mahomes')).toBe(false);
  });
});

describe('GameContext – portfolio value', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getPortfolioValue returns correct structure', () => {
    const { result } = renderGame();
    const pv = result.current.getPortfolioValue();
    expect(pv).toHaveProperty('value');
    expect(pv).toHaveProperty('cost');
    expect(pv).toHaveProperty('gain');
    expect(pv).toHaveProperty('gainPercent');
  });

  it('portfolio value updates after buying', async () => {
    const { result } = await renderGameAndWait();
    const valueBefore = result.current.getPortfolioValue().value;

    act(() => {
      result.current.buyShares('allen', 5);
    });

    const valueAfter = result.current.getPortfolioValue().value;
    expect(valueAfter).toBeGreaterThan(valueBefore);
  });
});

describe('GameContext – scenario switching', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('setScenario changes the active scenario', () => {
    const { result } = renderGame();

    act(() => {
      result.current.setScenario('playoffs');
    });

    expect(result.current.scenario).toBe('playoffs');
  });

  it('auto-starts playing for live scenario', () => {
    const { result } = renderGame();

    act(() => {
      result.current.setScenario('live');
    });

    expect(result.current.isPlaying).toBe(true);
  });

  it('resets cash when changing scenario', async () => {
    const { result } = await renderGameAndWait();

    act(() => {
      result.current.buyShares('mahomes', 5);
    });
    const cashAfterBuy = result.current.cash;
    expect(cashAfterBuy).toBeLessThan(10000);

    act(() => {
      result.current.setScenario('playoffs');
    });

    await waitFor(() => {
      expect(result.current.scenarioLoading).toBe(false);
    });

    expect(result.current.cash).toBe(10000);
  });
});

describe('GameContext – missions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('setMissionPick adds player to risers', () => {
    const { result } = renderGame();

    act(() => {
      result.current.setMissionPick('mahomes', 'riser');
    });

    expect(result.current.missionPicks.risers).toContain('mahomes');
  });

  it('setMissionPick adds player to fallers', () => {
    const { result } = renderGame();

    act(() => {
      result.current.setMissionPick('allen', 'faller');
    });

    expect(result.current.missionPicks.fallers).toContain('allen');
  });

  it('clearMissionPick removes player from both arrays', () => {
    const { result } = renderGame();

    act(() => {
      result.current.setMissionPick('mahomes', 'riser');
    });

    act(() => {
      result.current.clearMissionPick('mahomes');
    });

    expect(result.current.missionPicks.risers).not.toContain('mahomes');
    expect(result.current.missionPicks.fallers).not.toContain('mahomes');
  });

  it('resetMission clears all picks and unreveals', () => {
    const { result } = renderGame();

    act(() => {
      result.current.setMissionPick('mahomes', 'riser');
      result.current.revealMission();
    });

    act(() => {
      result.current.resetMission();
    });

    expect(result.current.missionPicks.risers).toHaveLength(0);
    expect(result.current.missionPicks.fallers).toHaveLength(0);
    expect(result.current.missionRevealed).toBe(false);
  });

  it('getMissionScore returns null when not revealed', () => {
    const { result } = renderGame();
    expect(result.current.getMissionScore()).toBeNull();
  });

  it('getMissionScore returns score object when revealed', () => {
    const { result } = renderGame();

    act(() => {
      result.current.setMissionPick('mahomes', 'riser');
      result.current.revealMission();
    });

    const score = result.current.getMissionScore();
    expect(score).toHaveProperty('correct');
    expect(score).toHaveProperty('total');
    expect(score).toHaveProperty('percentile');
  });
});

describe('GameContext – leaderboard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getLeaderboardRankings returns sorted array with user', () => {
    const { result } = renderGame();
    const rankings = result.current.getLeaderboardRankings();

    expect(Array.isArray(rankings)).toBe(true);
    expect(rankings.length).toBeGreaterThan(0);

    const user = rankings.find((r) => r.isUser);
    expect(user).toBeDefined();
    expect(user.name).toBe('You');
  });

  it('rankings are sorted by totalValue descending', () => {
    const { result } = renderGame();
    const rankings = result.current.getLeaderboardRankings();

    for (let i = 1; i < rankings.length; i++) {
      expect(rankings[i - 1].totalValue).toBeGreaterThanOrEqual(
        rankings[i].totalValue,
      );
    }
  });

  it('rankings include rank numbers starting at 1', () => {
    const { result } = renderGame();
    const rankings = result.current.getLeaderboardRankings();
    expect(rankings[0].rank).toBe(1);
    expect(rankings[rankings.length - 1].rank).toBe(rankings.length);
  });
});

describe('GameContext – scenarioLoading transitions (TC-009)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('scenarioLoading is initially true', () => {
    const { result } = renderGame();
    expect(result.current.scenarioLoading).toBe(true);
  });

  it('scenarioLoading becomes false after initial load', async () => {
    const { result } = renderGame();

    await waitFor(() => {
      expect(result.current.scenarioLoading).toBe(false);
    });
    expect(result.current.currentData).not.toBeNull();
  });

  it('scenarioLoading resets to true when switching scenarios', async () => {
    const { result } = await renderGameAndWait();
    expect(result.current.scenarioLoading).toBe(false);

    act(() => {
      result.current.setScenario('live');
    });

    expect(result.current.scenarioLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.scenarioLoading).toBe(false);
    });
    expect(result.current.currentData).not.toBeNull();
  });

  it('currentData updates to the new scenario after switch', async () => {
    const { result } = await renderGameAndWait();
    const midweekData = result.current.currentData;

    act(() => {
      result.current.setScenario('live');
    });

    await waitFor(() => {
      expect(result.current.scenarioLoading).toBe(false);
    });

    expect(result.current.currentData).not.toBeNull();
    expect(result.current.currentData).not.toBe(midweekData);
  });
});

describe('GameContext – invalid scenario (TC-012)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('handles unknown scenario ID without crashing', async () => {
    const { result } = await renderGameAndWait();

    act(() => {
      result.current.setScenario('nonexistent');
    });

    await waitFor(() => {
      expect(result.current.scenarioLoading).toBe(false);
    });
  });

  it('does not throw for empty string scenario ID', async () => {
    const { result } = await renderGameAndWait();

    act(() => {
      result.current.setScenario('');
    });

    await waitFor(() => {
      expect(result.current.scenarioLoading).toBe(false);
    });
  });
});

describe('GameContext – race conditions (TC-013)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('rapid scenario switching settles on the last scenario', async () => {
    const { result } = await renderGameAndWait();

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
    expect(result.current.currentData.scenario).toBe('superbowl');
  });
});

describe('GameContext – import failure (TC-014)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('scenarioLoading does not stay true when loader is missing', async () => {
    const { result } = renderGame();

    act(() => {
      result.current.setScenario('broken-scenario');
    });

    await waitFor(() => {
      expect(result.current.scenarioLoading).toBe(false);
    });
  });

  it('error in dynamic import is caught gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = await renderGameAndWait();

    const originalScenarioData = result.current.currentData;

    act(() => {
      result.current.setScenario('nonexistent');
    });

    await waitFor(() => {
      expect(result.current.scenarioLoading).toBe(false);
    });

    expect(result.current.currentData).toBe(originalScenarioData);
    consoleSpy.mockRestore();
  });
});
