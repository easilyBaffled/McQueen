import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';

import {
  INITIAL_CASH,
  AI_BASE_CASH,
  MISSION_PICKS_PER_CATEGORY,
  STORAGE_KEYS,
} from '../constants';

import { read, write } from '../services/storageService';

import { useScenario } from './ScenarioContext';
import { useTrading } from './TradingContext';
import type { ChildrenProps, LeagueMember, LeagueHolding, MissionPicks, SocialContextValue } from '../types';

const SocialContext = createContext<SocialContextValue | null>(null);

const leagueLoader = () =>
  import('../data/leagueMembers.json').then((m) => m.default as unknown as { members: LeagueMember[]; holdings: Record<string, LeagueHolding[]> });

let leagueMembersCache: LeagueMember[] | null = null;
let leagueHoldingsCache: Record<string, LeagueHolding[]> | null = null;

async function getLeagueData() {
  if (leagueMembersCache) {
    return {
      members: leagueMembersCache,
      holdings: leagueHoldingsCache,
    };
  }
  const data = await leagueLoader();
  leagueMembersCache = data.members;
  leagueHoldingsCache = data.holdings;
  return { members: leagueMembersCache, holdings: leagueHoldingsCache };
}

export function SocialProvider({ children }: ChildrenProps) {
  const { scenarioVersion } = useScenario();
  const { getPlayer, getEffectivePrice, portfolio, cash, getPortfolioValue } =
    useTrading();

  const [watchlist, setWatchlist] = useState<string[]>(() =>
    read(STORAGE_KEYS.watchlist, []),
  );
  const [missionPicks, setMissionPicks] = useState<MissionPicks>({
    risers: [],
    fallers: [],
  });
  const [missionRevealed, setMissionRevealed] = useState(false);
  const [leagueMembers, setLeagueMembers] = useState<LeagueMember[]>([]);
  const [leagueHoldings, setLeagueHoldings] = useState<Record<string, LeagueHolding[]>>({});

  useEffect(() => {
    getLeagueData().then(({ members, holdings }) => {
      setLeagueMembers(members);
      setLeagueHoldings(holdings);
    });
  }, []);

  useEffect(() => {
    write(STORAGE_KEYS.watchlist, watchlist);
  }, [watchlist]);

  // Reset mission state (but NOT watchlist) on scenario change
  useEffect(() => {
    if (scenarioVersion === 0) return;

    setMissionPicks({ risers: [], fallers: [] });
    setMissionRevealed(false);
  }, [scenarioVersion]);

  const addToWatchlist = useCallback((playerId: string) => {
    setWatchlist((prev) =>
      prev.includes(playerId) ? prev : [...prev, playerId],
    );
  }, []);

  const removeFromWatchlist = useCallback((playerId: string) => {
    setWatchlist((prev) => prev.filter((id) => id !== playerId));
  }, []);

  const isWatching = useCallback(
    (playerId: string) => {
      return watchlist.includes(playerId);
    },
    [watchlist],
  );

  const setMissionPick = useCallback((playerId: string, type: string) => {
    setMissionPicks((prev) => {
      const newPicks = { ...prev };
      newPicks.risers = newPicks.risers.filter((id) => id !== playerId);
      newPicks.fallers = newPicks.fallers.filter((id) => id !== playerId);

      if (
        type === 'riser' &&
        newPicks.risers.length < MISSION_PICKS_PER_CATEGORY
      ) {
        newPicks.risers.push(playerId);
      } else if (
        type === 'faller' &&
        newPicks.fallers.length < MISSION_PICKS_PER_CATEGORY
      ) {
        newPicks.fallers.push(playerId);
      }

      return newPicks;
    });
  }, []);

  const clearMissionPick = useCallback((playerId: string) => {
    setMissionPicks((prev) => ({
      risers: prev.risers.filter((id) => id !== playerId),
      fallers: prev.fallers.filter((id) => id !== playerId),
    }));
  }, []);

  const revealMission = useCallback(() => {
    setMissionRevealed(true);
  }, []);

  const resetMission = useCallback(() => {
    setMissionPicks({ risers: [], fallers: [] });
    setMissionRevealed(false);
  }, []);

  const getMissionScore = useCallback(() => {
    if (!missionRevealed) return null;

    let correct = 0;

    missionPicks.risers.forEach((playerId) => {
      const player = getPlayer(playerId);
      if (player && player.changePercent > 0) correct++;
    });

    missionPicks.fallers.forEach((playerId) => {
      const player = getPlayer(playerId);
      if (player && player.changePercent < 0) correct++;
    });

    const total = missionPicks.risers.length + missionPicks.fallers.length;
    const percentile = Math.round(50 + (correct / Math.max(total, 1)) * 50);

    return { correct, total, percentile };
  }, [missionRevealed, missionPicks, getPlayer]);

  const getLeagueHoldingsFn = useCallback(
    (playerId: string) => {
      const holdings = leagueHoldings[playerId] || [];
      const currentPrice = getEffectivePrice(playerId);

      const userHolding = portfolio[playerId];
      const allHoldings = userHolding
        ? [
            {
              memberId: 'user',
              shares: userHolding.shares,
              avgCost: userHolding.avgCost,
            },
            ...holdings,
          ]
        : holdings;

      return allHoldings.map((holding) => {
        const member = leagueMembers.find((m) => m.id === holding.memberId);
        const gainPercent =
          ((currentPrice - holding.avgCost) / holding.avgCost) * 100;

        return {
          ...holding,
          name: member?.name || holding.memberId,
          avatar: member?.avatar || '👤',
          isUser: member?.isUser || false,
          currentValue: +(currentPrice * holding.shares).toFixed(2),
          gainPercent: +gainPercent.toFixed(2),
        };
      });
    },
    [portfolio, getEffectivePrice, leagueHoldings, leagueMembers],
  );

  const getLeagueMembers = useCallback(() => {
    return leagueMembers;
  }, [leagueMembers]);

  const getLeaderboardRankings = useCallback(() => {
    const memberPortfolios: Record<string, { memberId: string; name: string; avatar: string; isUser: boolean; cash: number; holdingsValue: number; totalValue: number }> = {};

    leagueMembers.forEach((member) => {
      if (!member.isUser) {
        memberPortfolios[member.id] = {
          memberId: member.id,
          name: member.name,
          avatar: member.avatar,
          isUser: false,
          cash: AI_BASE_CASH,
          holdingsValue: 0,
          totalValue: AI_BASE_CASH,
        };
      }
    });

    Object.entries(leagueHoldings).forEach(([playerId, holdings]) => {
      const currentPrice = getEffectivePrice(playerId);

      holdings.forEach((holding) => {
        if (memberPortfolios[holding.memberId]) {
          const holdingValue = currentPrice * holding.shares;
          memberPortfolios[holding.memberId].holdingsValue += holdingValue;
          memberPortfolios[holding.memberId].totalValue += holdingValue;
        }
      });
    });

    const portfolioStats = getPortfolioValue();
    const userEntry = {
      memberId: 'user',
      name: 'You',
      avatar: '👤',
      isUser: true,
      cash: cash,
      holdingsValue: portfolioStats.value,
      totalValue: cash + portfolioStats.value,
      gain: portfolioStats.gain,
      gainPercent: portfolioStats.gainPercent,
    };

    const allTraders = [...Object.values(memberPortfolios), userEntry];
    allTraders.sort((a, b) => b.totalValue - a.totalValue);

    return allTraders.map((trader, index) => ({
      ...trader,
      rank: index + 1,
      gapToNext:
        index > 0 ? allTraders[index - 1].totalValue - trader.totalValue : 0,
      traderAhead: index > 0 ? allTraders[index - 1] : null,
    }));
  }, [
    cash,
    getEffectivePrice,
    getPortfolioValue,
    leagueMembers,
    leagueHoldings,
  ]);

  const value: SocialContextValue = {
    watchlist,
    missionPicks,
    missionRevealed,
    addToWatchlist,
    removeFromWatchlist,
    isWatching,
    setMissionPick,
    clearMissionPick,
    revealMission,
    resetMission,
    getMissionScore,
    getLeaderboardRankings,
    getLeagueHoldings: getLeagueHoldingsFn,
    getLeagueMembers,
  };

  return (
    <SocialContext.Provider value={value}>{children}</SocialContext.Provider>
  );
}

export function useSocial(): SocialContextValue {
  const context = useContext(SocialContext);
  if (!context) {
    throw new Error('useSocial must be used within a SocialProvider');
  }
  return context;
}
