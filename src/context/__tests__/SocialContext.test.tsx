import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ScenarioProvider, useScenario } from '../ScenarioContext';
import { SimulationProvider } from '../SimulationContext';
import { TradingProvider, useTrading } from '../TradingContext';
import { SocialProvider, useSocial } from '../SocialContext';
import { AI_BASE_CASH, MISSION_PICKS_PER_CATEGORY, STORAGE_KEYS } from '../../constants';
import { read, write } from '../../services/storageService';

vi.mock('../../services/espnService', async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>;
  return {
    ...original,
    fetchNFLNews: vi.fn().mockResolvedValue([]),
  };
});

function FullWrapper({ children }: { children: React.ReactNode }) {
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

function useSocialAndScenarioAndTrading() {
  return {
    social: useSocial(),
    scenario: useScenario(),
    trading: useTrading(),
  };
}

function renderSocial() {
  return renderHook(() => useSocialAndScenarioAndTrading(), {
    wrapper: FullWrapper,
  });
}

async function renderAndWait() {
  const hook = renderSocial();
  await waitFor(() => {
    expect(hook.result.current.scenario.scenarioLoading).toBe(false);
  });
  // Wait for async league data to load
  await waitFor(() => {
    expect(hook.result.current.social.getLeagueMembers().length).toBeGreaterThan(0);
  });
  return hook;
}

describe('SocialContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // TC-001
  describe('TC-001: useSocial returns correct initial state with empty storage', () => {
    it('returns object with all expected fields', async () => {
      const { result } = await renderAndWait();
      const ctx = result.current.social;

      expect(Array.isArray(ctx.watchlist)).toBe(true);
      expect(ctx.missionPicks).toEqual({ risers: [], fallers: [] });
      expect(ctx.missionRevealed).toBe(false);
      expect(typeof ctx.addToWatchlist).toBe('function');
      expect(typeof ctx.removeFromWatchlist).toBe('function');
      expect(typeof ctx.isWatching).toBe('function');
      expect(typeof ctx.setMissionPick).toBe('function');
      expect(typeof ctx.clearMissionPick).toBe('function');
      expect(typeof ctx.revealMission).toBe('function');
      expect(typeof ctx.resetMission).toBe('function');
      expect(typeof ctx.getMissionScore).toBe('function');
      expect(typeof ctx.getLeaderboardRankings).toBe('function');
      expect(typeof ctx.getLeagueHoldings).toBe('function');
      expect(typeof ctx.getLeagueMembers).toBe('function');
    });

    it('watchlist defaults to empty array', async () => {
      const { result } = await renderAndWait();
      expect(result.current.social.watchlist).toEqual([]);
    });

    it('missionPicks defaults to empty risers and fallers', async () => {
      const { result } = await renderAndWait();
      expect(result.current.social.missionPicks).toEqual({ risers: [], fallers: [] });
    });

    it('missionRevealed defaults to false', async () => {
      const { result } = await renderAndWait();
      expect(result.current.social.missionRevealed).toBe(false);
    });
  });

  // TC-002
  describe('TC-002: useSocial throws outside SocialProvider', () => {
    it('throws descriptive error', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => {
        renderHook(() => useSocial());
      }).toThrow('useSocial must be used within a SocialProvider');
      spy.mockRestore();
    });
  });

  // TC-003
  describe('TC-003: addToWatchlist adds a player', () => {
    it('adds player ID to watchlist', async () => {
      const { result } = await renderAndWait();

      act(() => {
        result.current.social.addToWatchlist('mahomes');
      });

      expect(result.current.social.watchlist).toContain('mahomes');
    });

    it('isWatching returns true for added player', async () => {
      const { result } = await renderAndWait();

      act(() => {
        result.current.social.addToWatchlist('mahomes');
      });

      expect(result.current.social.isWatching('mahomes')).toBe(true);
    });

    it('isWatching returns false for non-added player', async () => {
      const { result } = await renderAndWait();

      act(() => {
        result.current.social.addToWatchlist('mahomes');
      });

      expect(result.current.social.isWatching('allen')).toBe(false);
    });
  });

  // TC-004
  describe('TC-004: addToWatchlist is idempotent (no duplicates)', () => {
    it('does not duplicate when adding same player twice', async () => {
      const { result } = await renderAndWait();

      act(() => {
        result.current.social.addToWatchlist('mahomes');
      });

      act(() => {
        result.current.social.addToWatchlist('mahomes');
      });

      expect(result.current.social.watchlist.filter((id) => id === 'mahomes')).toHaveLength(1);
    });

    it('maintains correct count with multiple unique adds and duplicates', async () => {
      const { result } = await renderAndWait();

      act(() => {
        result.current.social.addToWatchlist('mahomes');
        result.current.social.addToWatchlist('allen');
      });

      act(() => {
        result.current.social.addToWatchlist('allen');
      });

      expect(result.current.social.watchlist).toEqual(['mahomes', 'allen']);
    });
  });

  // TC-005
  describe('TC-005: removeFromWatchlist removes a player', () => {
    it('removes specified player from watchlist', async () => {
      const { result } = await renderAndWait();

      act(() => {
        result.current.social.addToWatchlist('mahomes');
        result.current.social.addToWatchlist('allen');
      });

      act(() => {
        result.current.social.removeFromWatchlist('mahomes');
      });

      expect(result.current.social.watchlist).toEqual(['allen']);
      expect(result.current.social.isWatching('mahomes')).toBe(false);
    });

    it('removing all results in empty watchlist', async () => {
      const { result } = await renderAndWait();

      act(() => {
        result.current.social.addToWatchlist('mahomes');
        result.current.social.addToWatchlist('allen');
      });

      act(() => {
        result.current.social.removeFromWatchlist('mahomes');
        result.current.social.removeFromWatchlist('allen');
      });

      expect(result.current.social.watchlist).toEqual([]);
    });

    it('removing nonexistent player is a no-op', async () => {
      const { result } = await renderAndWait();

      act(() => {
        result.current.social.addToWatchlist('mahomes');
      });

      act(() => {
        result.current.social.removeFromWatchlist('nonexistent');
      });

      expect(result.current.social.watchlist).toEqual(['mahomes']);
    });
  });

  // TC-006
  describe('TC-006: Watchlist persists via storageService', () => {
    it('writes watchlist to storage on change', async () => {
      const { result } = await renderAndWait();

      act(() => {
        result.current.social.addToWatchlist('mahomes');
        result.current.social.addToWatchlist('allen');
      });

      const stored = read(STORAGE_KEYS.watchlist, []);
      expect(stored).toEqual(['mahomes', 'allen']);
    });

    it('restores watchlist from storage on remount', async () => {
      write(STORAGE_KEYS.watchlist, ['mahomes', 'allen']);

      const { result } = await renderAndWait();
      expect(result.current.social.watchlist).toEqual(['mahomes', 'allen']);
    });

    it('falls back to empty array on corrupt storage', async () => {
      localStorage.setItem(STORAGE_KEYS.watchlist, '{invalid json');

      const { result } = await renderAndWait();
      expect(result.current.social.watchlist).toEqual([]);
    });
  });

  // TC-007
  describe('TC-007: Watchlist persists across scenario switches', () => {
    it('does not reset watchlist when scenario changes', async () => {
      const { result } = await renderAndWait();

      act(() => {
        result.current.social.addToWatchlist('mahomes');
        result.current.social.addToWatchlist('allen');
      });

      expect(result.current.social.watchlist).toEqual(['mahomes', 'allen']);

      act(() => {
        result.current.scenario.setScenario('playoffs');
      });

      await waitFor(() => {
        expect(result.current.scenario.scenarioLoading).toBe(false);
      });

      expect(result.current.social.watchlist).toEqual(['mahomes', 'allen']);
      expect(result.current.social.isWatching('mahomes')).toBe(true);
    });
  });

  // TC-008
  describe('TC-008: setMissionPick adds player as riser', () => {
    it('adds player to risers', async () => {
      const { result } = await renderAndWait();

      act(() => {
        result.current.social.setMissionPick('mahomes', 'riser');
      });

      expect(result.current.social.missionPicks.risers).toEqual(['mahomes']);
      expect(result.current.social.missionPicks.fallers).toEqual([]);
    });

    it('adds multiple risers', async () => {
      const { result } = await renderAndWait();

      act(() => {
        result.current.social.setMissionPick('mahomes', 'riser');
      });

      act(() => {
        result.current.social.setMissionPick('allen', 'riser');
      });

      expect(result.current.social.missionPicks.risers).toEqual(['mahomes', 'allen']);
    });
  });

  // TC-009
  describe('TC-009: setMissionPick adds player as faller', () => {
    it('adds player to fallers', async () => {
      const { result } = await renderAndWait();

      act(() => {
        result.current.social.setMissionPick('burrow', 'faller');
      });

      expect(result.current.social.missionPicks.fallers).toEqual(['burrow']);
      expect(result.current.social.missionPicks.risers).toEqual([]);
    });
  });

  // TC-010
  describe('TC-010: setMissionPick enforces MISSION_PICKS_PER_CATEGORY limit', () => {
    it('caps risers at MISSION_PICKS_PER_CATEGORY (3)', async () => {
      const { result } = await renderAndWait();

      act(() => {
        result.current.social.setMissionPick('p1', 'riser');
      });
      act(() => {
        result.current.social.setMissionPick('p2', 'riser');
      });
      act(() => {
        result.current.social.setMissionPick('p3', 'riser');
      });

      expect(result.current.social.missionPicks.risers).toEqual(['p1', 'p2', 'p3']);

      act(() => {
        result.current.social.setMissionPick('p4', 'riser');
      });

      expect(result.current.social.missionPicks.risers).toEqual(['p1', 'p2', 'p3']);
      expect(MISSION_PICKS_PER_CATEGORY).toBe(3);
    });

    it('caps fallers at MISSION_PICKS_PER_CATEGORY (3)', async () => {
      const { result } = await renderAndWait();

      act(() => {
        result.current.social.setMissionPick('p1', 'faller');
      });
      act(() => {
        result.current.social.setMissionPick('p2', 'faller');
      });
      act(() => {
        result.current.social.setMissionPick('p3', 'faller');
      });
      act(() => {
        result.current.social.setMissionPick('p4', 'faller');
      });

      expect(result.current.social.missionPicks.fallers).toEqual(['p1', 'p2', 'p3']);
    });
  });

  // TC-011
  describe('TC-011: setMissionPick moves player between categories', () => {
    it('removes from risers and adds to fallers', async () => {
      const { result } = await renderAndWait();

      act(() => {
        result.current.social.setMissionPick('mahomes', 'riser');
      });

      expect(result.current.social.missionPicks.risers).toContain('mahomes');

      act(() => {
        result.current.social.setMissionPick('mahomes', 'faller');
      });

      expect(result.current.social.missionPicks.risers).not.toContain('mahomes');
      expect(result.current.social.missionPicks.fallers).toContain('mahomes');
    });

    it('does not add to target if target is at limit', async () => {
      const { result } = await renderAndWait();

      act(() => {
        result.current.social.setMissionPick('f1', 'faller');
      });
      act(() => {
        result.current.social.setMissionPick('f2', 'faller');
      });
      act(() => {
        result.current.social.setMissionPick('f3', 'faller');
      });
      act(() => {
        result.current.social.setMissionPick('mahomes', 'riser');
      });

      // Move mahomes to fallers (which is at limit)
      act(() => {
        result.current.social.setMissionPick('mahomes', 'faller');
      });

      // mahomes removed from risers but NOT added to fallers (full)
      expect(result.current.social.missionPicks.risers).not.toContain('mahomes');
      expect(result.current.social.missionPicks.fallers).not.toContain('mahomes');
      expect(result.current.social.missionPicks.fallers).toHaveLength(3);
    });
  });

  // TC-012
  describe('TC-012: clearMissionPick removes player from both categories', () => {
    it('removes from risers', async () => {
      const { result } = await renderAndWait();

      act(() => {
        result.current.social.setMissionPick('mahomes', 'riser');
        result.current.social.setMissionPick('allen', 'faller');
      });

      act(() => {
        result.current.social.clearMissionPick('mahomes');
      });

      expect(result.current.social.missionPicks.risers).not.toContain('mahomes');
      expect(result.current.social.missionPicks.fallers).toContain('allen');
    });

    it('removes from fallers', async () => {
      const { result } = await renderAndWait();

      act(() => {
        result.current.social.setMissionPick('allen', 'faller');
      });

      act(() => {
        result.current.social.clearMissionPick('allen');
      });

      expect(result.current.social.missionPicks.fallers).not.toContain('allen');
    });

    it('is a no-op for nonexistent player', async () => {
      const { result } = await renderAndWait();

      act(() => {
        result.current.social.setMissionPick('mahomes', 'riser');
      });

      act(() => {
        result.current.social.clearMissionPick('nonexistent');
      });

      expect(result.current.social.missionPicks.risers).toContain('mahomes');
    });
  });

  // TC-013
  describe('TC-013: revealMission sets missionRevealed to true', () => {
    it('transitions from false to true', async () => {
      const { result } = await renderAndWait();

      expect(result.current.social.missionRevealed).toBe(false);

      act(() => {
        result.current.social.revealMission();
      });

      expect(result.current.social.missionRevealed).toBe(true);
    });

    it('is idempotent', async () => {
      const { result } = await renderAndWait();

      act(() => {
        result.current.social.revealMission();
      });

      act(() => {
        result.current.social.revealMission();
      });

      expect(result.current.social.missionRevealed).toBe(true);
    });
  });

  // TC-014
  describe('TC-014: resetMission clears picks and unreveals', () => {
    it('clears picks and sets missionRevealed to false', async () => {
      const { result } = await renderAndWait();

      act(() => {
        result.current.social.setMissionPick('p1', 'riser');
        result.current.social.setMissionPick('p2', 'faller');
        result.current.social.revealMission();
      });

      expect(result.current.social.missionRevealed).toBe(true);
      expect(result.current.social.missionPicks.risers.length).toBeGreaterThan(0);

      act(() => {
        result.current.social.resetMission();
      });

      expect(result.current.social.missionPicks).toEqual({ risers: [], fallers: [] });
      expect(result.current.social.missionRevealed).toBe(false);
    });

    it('is a no-op when already in default state', async () => {
      const { result } = await renderAndWait();

      act(() => {
        result.current.social.resetMission();
      });

      expect(result.current.social.missionPicks).toEqual({ risers: [], fallers: [] });
      expect(result.current.social.missionRevealed).toBe(false);
    });
  });

  // TC-015
  describe('TC-015: getMissionScore returns null when not revealed', () => {
    it('returns null even with picks', async () => {
      const { result } = await renderAndWait();

      act(() => {
        result.current.social.setMissionPick('mahomes', 'riser');
        result.current.social.setMissionPick('allen', 'faller');
      });

      expect(result.current.social.getMissionScore()).toBeNull();
    });

    it('returns null with no picks', async () => {
      const { result } = await renderAndWait();
      expect(result.current.social.getMissionScore()).toBeNull();
    });
  });

  // TC-016
  describe('TC-016: getMissionScore calculates correct results when revealed', () => {
    it('returns correct, total, and percentile', async () => {
      const { result } = await renderAndWait();

      const players = result.current.trading.getPlayers();
      const correctRisers = players.filter((p) => p.changePercent > 0).slice(0, 2);
      const negativePlayers = players.filter((p) => p.changePercent < 0);
      // Use different players for wrongRiser and correctFaller
      const wrongRiser = negativePlayers[0];
      const correctFaller = negativePlayers[1];

      const picks: { id: string; type: string; isCorrect: boolean }[] = [];
      correctRisers.forEach((p) => picks.push({ id: p.id, type: 'riser', isCorrect: true }));
      if (wrongRiser) picks.push({ id: wrongRiser.id, type: 'riser', isCorrect: false });
      if (correctFaller) picks.push({ id: correctFaller.id, type: 'faller', isCorrect: true });

      act(() => {
        picks.forEach((p) => result.current.social.setMissionPick(p.id, p.type));
        result.current.social.revealMission();
      });

      const score = result.current.social.getMissionScore();
      expect(score).not.toBeNull();

      const expectedCorrect = picks.filter((p) => p.isCorrect).length;
      const expectedTotal = picks.length;
      const expectedPercentile = Math.round(50 + (expectedCorrect / Math.max(expectedTotal, 1)) * 50);

      expect(score!.correct).toBe(expectedCorrect);
      expect(score!.total).toBe(expectedTotal);
      expect(score!.percentile).toBe(expectedPercentile);
    });

    it('returns percentile 50 when all picks wrong', async () => {
      const { result } = await renderAndWait();

      const players = result.current.trading.getPlayers();
      const wrongRiser = players.find((p) => p.changePercent < 0);
      const wrongFaller = players.find((p) => p.changePercent > 0);

      if (wrongRiser && wrongFaller) {
        act(() => {
          result.current.social.setMissionPick(wrongRiser.id, 'riser');
          result.current.social.setMissionPick(wrongFaller.id, 'faller');
          result.current.social.revealMission();
        });

        const score = result.current.social.getMissionScore();
        expect(score!.correct).toBe(0);
        expect(score!.percentile).toBe(50);
      }
    });

    it('returns percentile 100 when all picks correct', async () => {
      const { result } = await renderAndWait();

      const players = result.current.trading.getPlayers();
      const correctRiser = players.find((p) => p.changePercent > 0);
      const correctFaller = players.find((p) => p.changePercent < 0);

      if (correctRiser && correctFaller) {
        act(() => {
          result.current.social.setMissionPick(correctRiser.id, 'riser');
          result.current.social.setMissionPick(correctFaller.id, 'faller');
          result.current.social.revealMission();
        });

        const score = result.current.social.getMissionScore();
        expect(score!.correct).toBe(2);
        expect(score!.percentile).toBe(100);
      }
    });

    it('returns percentile 50 with zero picks', async () => {
      const { result } = await renderAndWait();

      act(() => {
        result.current.social.revealMission();
      });

      const score = result.current.social.getMissionScore();
      expect(score!.correct).toBe(0);
      expect(score!.total).toBe(0);
      expect(score!.percentile).toBe(50);
    });
  });

  // TC-017
  describe('TC-017: Mission state resets on scenarioVersion change', () => {
    it('clears picks and unreveals on scenario switch', async () => {
      const { result } = await renderAndWait();

      act(() => {
        result.current.social.setMissionPick('mahomes', 'riser');
        result.current.social.revealMission();
      });

      expect(result.current.social.missionPicks.risers).toContain('mahomes');
      expect(result.current.social.missionRevealed).toBe(true);

      act(() => {
        result.current.scenario.setScenario('playoffs');
      });

      await waitFor(() => {
        expect(result.current.scenario.scenarioLoading).toBe(false);
      });

      expect(result.current.social.missionPicks).toEqual({ risers: [], fallers: [] });
      expect(result.current.social.missionRevealed).toBe(false);
    });
  });

  // TC-018
  describe('TC-018: scenarioVersion === 0 does NOT trigger mission reset', () => {
    it('initial scenarioVersion 0 does not clear picks', async () => {
      const { result } = await renderAndWait();

      expect(result.current.scenario.scenarioVersion).toBe(0);

      act(() => {
        result.current.social.setMissionPick('mahomes', 'riser');
      });

      expect(result.current.social.missionPicks.risers).toContain('mahomes');
    });
  });

  // TC-019
  describe('TC-019: League data loads from JSON on mount', () => {
    it('loads league members asynchronously', async () => {
      const { result } = await renderAndWait();

      const members = result.current.social.getLeagueMembers();
      expect(Array.isArray(members)).toBe(true);
      expect(members.length).toBeGreaterThan(0);

      const firstMember = members[0];
      expect(firstMember).toHaveProperty('id');
      expect(firstMember).toHaveProperty('name');
    });
  });

  // TC-020
  describe('TC-020: League data is available after remount', () => {
    it('returns same data on remount', async () => {
      const { result, unmount } = await renderAndWait();
      const firstLoad = result.current.social.getLeagueMembers();
      unmount();

      const hook2 = renderHook(() => useSocialAndScenarioAndTrading(), {
        wrapper: FullWrapper,
      });
      await waitFor(() => {
        expect(hook2.result.current.scenario.scenarioLoading).toBe(false);
      });
      await waitFor(() => {
        expect(hook2.result.current.social.getLeagueMembers().length).toBeGreaterThan(0);
      });

      const secondLoad = hook2.result.current.social.getLeagueMembers();
      expect(secondLoad.length).toBe(firstLoad.length);
      expect(secondLoad[0].id).toBe(firstLoad[0].id);

      hook2.unmount();
    });
  });

  // TC-026
  describe('TC-026: Cache resets when SocialProvider unmounts and remounts', () => {
    it('does not share cache state between independent mounts', async () => {
      const { result, unmount } = await renderAndWait();
      expect(result.current.social.getLeagueMembers().length).toBe(11);
      unmount();

      const hook2 = renderHook(() => useSocialAndScenarioAndTrading(), {
        wrapper: FullWrapper,
      });

      expect(hook2.result.current.social.getLeagueMembers()).toEqual([]);

      await waitFor(() => {
        expect(hook2.result.current.scenario.scenarioLoading).toBe(false);
      });
      await waitFor(() => {
        expect(hook2.result.current.social.getLeagueMembers().length).toBeGreaterThan(0);
      });

      expect(hook2.result.current.social.getLeagueMembers().length).toBe(11);
      hook2.unmount();
    });
  });

  // TC-021
  describe('TC-021: getLeaderboardRankings includes all AI members and user', () => {
    it('returns sorted array by totalValue descending', async () => {
      const { result } = await renderAndWait();
      const rankings = result.current.social.getLeaderboardRankings();

      expect(Array.isArray(rankings)).toBe(true);
      expect(rankings.length).toBeGreaterThan(0);

      for (let i = 1; i < rankings.length; i++) {
        expect(rankings[i - 1].totalValue).toBeGreaterThanOrEqual(rankings[i].totalValue);
      }
    });

    it('includes user entry', async () => {
      const { result } = await renderAndWait();
      const rankings = result.current.social.getLeaderboardRankings();
      const user = rankings.find((r) => r.isUser);

      expect(user).toBeDefined();
      expect(user!.name).toBe('You');
      expect(user!.avatar).toBe('👤');
    });

    it('user totalValue equals cash + holdingsValue', async () => {
      const { result } = await renderAndWait();
      const rankings = result.current.social.getLeaderboardRankings();
      const user = rankings.find((r) => r.isUser)!;
      const portfolioStats = result.current.trading.getPortfolioValue();

      expect(user.cash).toBe(result.current.trading.cash);
      expect(user.holdingsValue).toBe(portfolioStats.value);
      expect(user.totalValue).toBe(user.cash + user.holdingsValue);
    });

    it('AI members have AI_BASE_CASH as cash', async () => {
      const { result } = await renderAndWait();
      const rankings = result.current.social.getLeaderboardRankings();
      const aiMembers = rankings.filter((r) => !r.isUser);

      aiMembers.forEach((member) => {
        expect(member.cash).toBe(AI_BASE_CASH);
      });
    });

    it('ranks are sequential 1-based', async () => {
      const { result } = await renderAndWait();
      const rankings = result.current.social.getLeaderboardRankings();

      rankings.forEach((entry, index) => {
        expect(entry.rank).toBe(index + 1);
      });
    });

    it('gapToNext is 0 for rank 1', async () => {
      const { result } = await renderAndWait();
      const rankings = result.current.social.getLeaderboardRankings();

      expect(rankings[0].gapToNext).toBe(0);
    });

    it('gapToNext is positive for non-rank-1 entries', async () => {
      const { result } = await renderAndWait();
      const rankings = result.current.social.getLeaderboardRankings();

      for (let i = 1; i < rankings.length; i++) {
        expect(rankings[i].gapToNext).toBe(
          rankings[i - 1].totalValue - rankings[i].totalValue,
        );
      }
    });

    it('traderAhead is null for rank 1', async () => {
      const { result } = await renderAndWait();
      const rankings = result.current.social.getLeaderboardRankings();

      expect(rankings[0].traderAhead).toBeNull();
    });

    it('traderAhead is defined for non-rank-1 entries', async () => {
      const { result } = await renderAndWait();
      const rankings = result.current.social.getLeaderboardRankings();

      for (let i = 1; i < rankings.length; i++) {
        expect(rankings[i].traderAhead).not.toBeNull();
        expect(rankings[i].traderAhead!.memberId).toBe(rankings[i - 1].memberId);
      }
    });
  });

  // TC-022
  describe('TC-022: getLeagueHoldings returns enriched holdings', () => {
    it('returns enriched holdings for a player with known league data', async () => {
      const { result } = await renderAndWait();

      const holdings = result.current.social.getLeagueHoldings('mahomes');
      expect(Array.isArray(holdings)).toBe(true);
      expect(holdings.length).toBeGreaterThan(0);

      const firstHolding = holdings[0];
      expect(firstHolding).toHaveProperty('memberId');
      expect(firstHolding).toHaveProperty('shares');
      expect(firstHolding).toHaveProperty('avgCost');
      expect(firstHolding).toHaveProperty('name');
      expect(firstHolding).toHaveProperty('avatar');
      expect(typeof firstHolding.isUser).toBe('boolean');
      expect(typeof firstHolding.currentValue).toBe('number');
      expect(typeof firstHolding.gainPercent).toBe('number');
    });

    it('currentValue equals effectivePrice * shares', async () => {
      const { result } = await renderAndWait();

      const holdings = result.current.social.getLeagueHoldings('mahomes');
      const effectivePrice = result.current.trading.getEffectivePrice('mahomes');

      holdings.forEach((h) => {
        expect(h.currentValue).toBe(+(effectivePrice * h.shares).toFixed(2));
      });
    });

    it('gainPercent is correctly calculated', async () => {
      const { result } = await renderAndWait();

      const holdings = result.current.social.getLeagueHoldings('mahomes');
      const effectivePrice = result.current.trading.getEffectivePrice('mahomes');

      holdings.forEach((h) => {
        const expectedGainPercent = +((effectivePrice - h.avgCost) / h.avgCost * 100).toFixed(2);
        expect(h.gainPercent).toBe(expectedGainPercent);
      });
    });
  });

  // TC-023
  describe('TC-023: getLeagueHoldings includes user holding', () => {
    it('includes user holding when user owns shares', async () => {
      const { result } = await renderAndWait();

      // User already owns mahomes from startingPortfolio
      expect(result.current.trading.portfolio['mahomes']).toBeDefined();

      const holdings = result.current.social.getLeagueHoldings('mahomes');
      const userHolding = holdings.find((h) => h.memberId === 'user');

      expect(userHolding).toBeDefined();
      expect(userHolding!.shares).toBe(result.current.trading.portfolio['mahomes'].shares);
      expect(userHolding!.avgCost).toBe(result.current.trading.portfolio['mahomes'].avgCost);
    });

    it('user holding appears first in results', async () => {
      const { result } = await renderAndWait();

      expect(result.current.trading.portfolio['mahomes']).toBeDefined();

      const holdings = result.current.social.getLeagueHoldings('mahomes');
      expect(holdings[0].memberId).toBe('user');
    });

    it('user holding does not appear when user has no shares', async () => {
      const { result } = await renderAndWait();

      // allen is not in startingPortfolio
      const holdings = result.current.social.getLeagueHoldings('allen');
      const userHolding = holdings.find((h) => h.memberId === 'user');

      expect(userHolding).toBeUndefined();
    });
  });

  // TC-024
  describe('TC-024: getLeagueHoldings returns empty array for unknown player', () => {
    it('returns empty for unknown player with no user holding', async () => {
      const { result } = await renderAndWait();
      const holdings = result.current.social.getLeagueHoldings('unknown_player_xyz');
      expect(holdings).toEqual([]);
    });
  });

  // TC-025
  describe('TC-025: getLeagueMembers returns all league members', () => {
    it('returns full array of members', async () => {
      const { result } = await renderAndWait();
      const members = result.current.social.getLeagueMembers();

      expect(members.length).toBe(11); // from leagueMembers.json

      members.forEach((m) => {
        expect(m).toHaveProperty('id');
        expect(m).toHaveProperty('name');
      });
    });

    it('includes user member with isUser: true', async () => {
      const { result } = await renderAndWait();
      const members = result.current.social.getLeagueMembers();
      const userMember = members.find((m) => m.isUser);

      expect(userMember).toBeDefined();
      expect(userMember!.id).toBe('user');
      expect(userMember!.name).toBe('You');
    });
  });
});
