import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';

import {
  INITIAL_CASH,
  USER_IMPACT_FACTOR,
  AI_BASE_CASH,
  TICK_INTERVAL_MS,
  ESPN_REFRESH_MS,
  ESPN_NEWS_LIMIT,
  MISSION_PICKS_PER_CATEGORY,
  STORAGE_KEYS,
} from '../constants';

import { read, write } from '../services/storageService';

// ESPN Services
import { fetchNFLNews, fetchPlayerNews } from '../services/espnService';
import {
  analyzeSentiment,
  getSentimentDescription,
} from '../services/sentimentEngine';
import {
  calculateNewPrice,
  createPriceHistoryEntry,
} from '../services/priceCalculator';

const GameContext = createContext(null);

const scenarioLoaders = {
  midweek: () => import('../data/midweek.json').then((m) => m.default),
  live: () => import('../data/live.json').then((m) => m.default),
  playoffs: () => import('../data/playoffs.json').then((m) => m.default),
  superbowl: () => import('../data/superbowl.json').then((m) => m.default),
  'espn-live': () =>
    import('../data/espnPlayers.json').then((m) => ({
      scenario: 'espn-live',
      players: m.default.players,
    })),
};

const leagueLoader = () =>
  import('../data/leagueMembers.json').then((m) => m.default);

let leagueMembersCache = null;
let leagueHoldingsCache = null;

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

// ============================================================================
// Helper functions for the new priceHistory-based data structure
// ============================================================================

// Get the current price from a player's priceHistory (last entry) or basePrice
function getCurrentPriceFromHistory(player) {
  if (!player) return 0;
  const history = player.priceHistory;
  if (history && history.length > 0) {
    return history[history.length - 1].price;
  }
  return player.basePrice;
}

// Calculate change percent from basePrice to current price
function getChangePercentFromHistory(player) {
  if (!player) return 0;
  const currentPrice = getCurrentPriceFromHistory(player);
  const basePrice = player.basePrice;
  if (basePrice === 0) return 0;
  return ((currentPrice - basePrice) / basePrice) * 100;
}

// Get the move reason (headline) from the most recent priceHistory entry
function getMoveReasonFromHistory(player) {
  if (!player) return '';
  const history = player.priceHistory;
  if (history && history.length > 0) {
    const lastEntry = history[history.length - 1];
    return lastEntry.reason?.headline || '';
  }
  return '';
}

// Get the content array from the most recent priceHistory entry
function getLatestContentFromHistory(player) {
  if (!player) return [];
  const history = player.priceHistory;
  if (history && history.length > 0) {
    const lastEntry = history[history.length - 1];
    return lastEntry.content || [];
  }
  return [];
}

// Get all content from a player's priceHistory (aggregated)
function getAllContentFromHistory(player) {
  if (!player || !player.priceHistory) return [];
  const allContent = [];
  player.priceHistory.forEach((entry) => {
    if (entry.content && entry.content.length > 0) {
      allContent.push(...entry.content);
    }
  });
  return allContent;
}

// Build a unified timeline from all players' priceHistory entries
function buildUnifiedTimeline(players) {
  const timeline = [];

  players.forEach((player) => {
    if (player.priceHistory) {
      player.priceHistory.forEach((entry, index) => {
        timeline.push({
          playerId: player.id,
          playerName: player.name,
          entryIndex: index,
          timestamp: entry.timestamp,
          price: entry.price,
          reason: entry.reason,
          content: entry.content,
        });
      });
    }
  });

  // Sort by timestamp
  timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return timeline;
}

export function GameProvider({ children }) {
  const [scenario, setScenarioState] = useState(() =>
    read(STORAGE_KEYS.scenario, 'midweek'),
  );
  const [tick, setTick] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [priceOverrides, setPriceOverrides] = useState({});
  const [userImpact, setUserImpact] = useState({});
  const [portfolio, setPortfolio] = useState(() =>
    read(STORAGE_KEYS.portfolio, {}),
  );
  const [watchlist, setWatchlist] = useState(() =>
    read(STORAGE_KEYS.watchlist, []),
  );
  const [cash, setCash] = useState(() =>
    read(STORAGE_KEYS.cash, INITIAL_CASH),
  );
  const [missionPicks, setMissionPicks] = useState({ risers: [], fallers: [] });
  const [missionRevealed, setMissionRevealed] = useState(false);
  const [history, setHistory] = useState([]);
  const [playoffDilutionApplied, setPlayoffDilutionApplied] = useState(false);
  const tickIntervalRef = useRef(null);

  // Dynamic scenario data loading
  const [currentData, setCurrentData] = useState(null);
  const [scenarioLoading, setScenarioLoading] = useState(true);
  const [leagueMembers, setLeagueMembers] = useState([]);
  const [leagueHoldings, setLeagueHoldings] = useState({});

  // Load league data on mount
  useEffect(() => {
    getLeagueData().then(({ members, holdings }) => {
      setLeagueMembers(members);
      setLeagueHoldings(holdings);
    });
  }, []);

  // Persist to storage via storageService
  useEffect(() => {
    write(STORAGE_KEYS.scenario, scenario);
  }, [scenario]);

  useEffect(() => {
    write(STORAGE_KEYS.portfolio, portfolio);
  }, [portfolio]);

  useEffect(() => {
    write(STORAGE_KEYS.watchlist, watchlist);
  }, [watchlist]);

  useEffect(() => {
    write(STORAGE_KEYS.cash, cash);
  }, [cash]);

  // ESPN Live mode state
  const [espnNews, setEspnNews] = useState([]); // Current ESPN news articles
  const [espnLoading, setEspnLoading] = useState(false);
  const [espnError, setEspnError] = useState(null);
  const [espnPriceHistory, setEspnPriceHistory] = useState({}); // { playerId: [priceHistoryEntries] }
  const [processedArticleIds, setProcessedArticleIds] = useState(new Set()); // Track processed articles
  const espnRefreshRef = useRef(null);

  const players = currentData?.players || [];

  // Build unified timeline for live simulation (live and superbowl scenarios)
  const unifiedTimeline = useMemo(() => {
    if (scenario === 'live' || scenario === 'superbowl') {
      return buildUnifiedTimeline(players);
    }
    return [];
  }, [scenario, players]);

  // Check if we're in ESPN Live mode
  const isEspnLiveMode = scenario === 'espn-live';

  // ESPN Live: Fetch and process news
  const fetchAndProcessEspnNews = useCallback(async () => {
    if (!isEspnLiveMode) return;

    setEspnLoading(true);
    setEspnError(null);

    try {
      // Fetch general NFL news
      const news = await fetchNFLNews(ESPN_NEWS_LIMIT);
      setEspnNews(news);

      // Process each article to find relevant players and calculate price impacts
      const newPriceHistory = { ...espnPriceHistory };
      const newProcessedIds = new Set(processedArticleIds);

      for (const article of news) {
        // Skip already processed articles
        if (newProcessedIds.has(article.id)) continue;

        // Find which players this article is about
        for (const player of players) {
          const searchTerms = player.searchTerms || [player.name];
          const articleText =
            `${article.headline} ${article.description}`.toLowerCase();

          const isRelevant = searchTerms.some((term) =>
            articleText.includes(term.toLowerCase()),
          );

          if (isRelevant) {
            // Analyze sentiment
            const sentimentResult = analyzeSentiment(
              `${article.headline} ${article.description}`,
              player.name,
              player.position,
            );

            // Get current price
            const currentPrice = priceOverrides[player.id] ?? player.basePrice;

            // Calculate new price
            const { newPrice, changePercent } = calculateNewPrice(
              currentPrice,
              sentimentResult,
            );

            // Create price history entry
            const historyEntry = createPriceHistoryEntry(
              article,
              sentimentResult,
              newPrice,
            );
            historyEntry.sentimentDescription =
              getSentimentDescription(sentimentResult);

            // Add to player's price history
            if (!newPriceHistory[player.id]) {
              newPriceHistory[player.id] = [];
            }
            newPriceHistory[player.id].push(historyEntry);

            // Update price override
            setPriceOverrides((prev) => ({
              ...prev,
              [player.id]: newPrice,
            }));

            // Add to history log
            setHistory((h) => [
              ...h,
              {
                tick: Date.now(),
                prices: { [player.id]: newPrice },
                action: `ESPN: ${article.headline.substring(0, 50)}...`,
                playerId: player.id,
                playerName: player.name,
                sentiment: sentimentResult.sentiment,
                changePercent,
              },
            ]);
          }
        }

        newProcessedIds.add(article.id);
      }

      setEspnPriceHistory(newPriceHistory);
      setProcessedArticleIds(newProcessedIds);
    } catch (error) {
      console.error('ESPN fetch error:', error);
      setEspnError(error.message || 'Failed to fetch ESPN news');
    } finally {
      setEspnLoading(false);
    }
  }, [
    isEspnLiveMode,
    players,
    espnPriceHistory,
    processedArticleIds,
    priceOverrides,
  ]);

  // ESPN Live: Auto-refresh effect
  useEffect(() => {
    if (isEspnLiveMode) {
      // Initial fetch
      fetchAndProcessEspnNews();

      // Set up refresh interval
      espnRefreshRef.current = setInterval(
        fetchAndProcessEspnNews,
        ESPN_REFRESH_MS,
      );

      return () => {
        if (espnRefreshRef.current) {
          clearInterval(espnRefreshRef.current);
        }
      };
    }
  }, [isEspnLiveMode]); // Only re-run when mode changes

  // Manual ESPN refresh function
  const refreshEspnNews = useCallback(() => {
    if (isEspnLiveMode) {
      fetchAndProcessEspnNews();
    }
  }, [isEspnLiveMode, fetchAndProcessEspnNews]);

  // Load scenario data dynamically when scenario changes
  useEffect(() => {
    let cancelled = false;
    setScenarioLoading(true);

    const loader = scenarioLoaders[scenario];
    if (!loader) {
      setScenarioLoading(false);
      return;
    }

    loader().then((data) => {
      if (cancelled) return;
      setCurrentData(data);

      setPriceOverrides({});
      setTick(0);
      setUserImpact({});
      setPlayoffDilutionApplied(false);

      const startingPortfolio = data?.startingPortfolio || {};
      setPortfolio(startingPortfolio);
      setCash(INITIAL_CASH);

      setEspnNews([]);
      setEspnError(null);
      setEspnPriceHistory({});
      setProcessedArticleIds(new Set());

      const scenarioPlayers = data?.players || [];
      const initialPrices = {};
      scenarioPlayers.forEach((player) => {
        if (scenario === 'espn-live') {
          initialPrices[player.id] = player.basePrice;
        } else {
          initialPrices[player.id] = getCurrentPriceFromHistory(player);
        }
      });

      const actionMessage =
        scenario === 'espn-live'
          ? 'ESPN Live mode activated - fetching real news...'
          : 'Scenario loaded';

      setHistory([{ tick: 0, prices: initialPrices, action: actionMessage }]);
      setScenarioLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [scenario]);

  // Apply tick updates for live scenarios (live and superbowl) using unified timeline
  useEffect(() => {
    if (
      (scenario === 'live' || scenario === 'superbowl') &&
      isPlaying &&
      unifiedTimeline.length > 0
    ) {
      tickIntervalRef.current = setInterval(() => {
        setTick((prevTick) => {
          const nextTick = prevTick + 1;
          if (nextTick >= unifiedTimeline.length) {
            setIsPlaying(false);
            return prevTick;
          }

          // Get the timeline entry for this tick
          const timelineEntry = unifiedTimeline[nextTick];
          if (timelineEntry) {
            setPriceOverrides((prev) => {
              const newOverrides = { ...prev };
              newOverrides[timelineEntry.playerId] = timelineEntry.price;

              // Build current prices for history
              const currentPrices = {};
              players.forEach((p) => {
                currentPrices[p.id] =
                  newOverrides[p.id] || getCurrentPriceFromHistory(p);
              });

              setHistory((h) => [
                ...h,
                {
                  tick: nextTick,
                  prices: currentPrices,
                  action: timelineEntry.reason?.headline || 'Price update',
                  playerId: timelineEntry.playerId,
                  playerName: timelineEntry.playerName,
                },
              ]);

              return newOverrides;
            });
          }

          return nextTick;
        });
      }, TICK_INTERVAL_MS);

      return () => clearInterval(tickIntervalRef.current);
    }
  }, [scenario, isPlaying, unifiedTimeline, players]);

  // Get effective price (from priceHistory or overrides + user impact)
  const getEffectivePrice = useCallback(
    (playerId) => {
      const player = players.find((p) => p.id === playerId);

      // Start with the price from priceHistory or override
      let basePrice;
      if (priceOverrides[playerId] !== undefined) {
        basePrice = priceOverrides[playerId];
      } else {
        basePrice = getCurrentPriceFromHistory(player);
      }

      // Apply user impact
      const impact = userImpact[playerId] || 0;
      return +(basePrice * (1 + impact)).toFixed(2);
    },
    [players, priceOverrides, userImpact],
  );

  // Get player with computed derived fields
  const getPlayer = useCallback(
    (playerId) => {
      const player = players.find((p) => p.id === playerId);
      if (!player) return null;

      const currentPrice = getEffectivePrice(playerId);
      const changePercent =
        ((currentPrice - player.basePrice) / player.basePrice) * 100;

      // In ESPN Live mode, use ESPN price history; otherwise use scenario data
      let moveReason, contentTiles, allContent, priceHistory;

      if (isEspnLiveMode && espnPriceHistory[playerId]?.length > 0) {
        const espnHistory = espnPriceHistory[playerId];
        const latestEntry = espnHistory[espnHistory.length - 1];
        moveReason = latestEntry.reason?.headline || '';
        contentTiles = latestEntry.content || [];
        allContent = espnHistory.flatMap((entry) => entry.content || []);
        priceHistory = espnHistory;
      } else {
        moveReason = getMoveReasonFromHistory(player);
        contentTiles = getLatestContentFromHistory(player);
        allContent = getAllContentFromHistory(player);
        priceHistory = player.priceHistory;
      }

      return {
        ...player,
        currentPrice,
        changePercent: +changePercent.toFixed(2),
        priceChange: +changePercent.toFixed(2), // Alias for backward compatibility
        moveReason,
        contentTiles,
        allContent,
        priceHistory,
      };
    },
    [players, getEffectivePrice, isEspnLiveMode, espnPriceHistory],
  );

  // Get all players with computed derived fields
  const getPlayers = useCallback(() => {
    return players.map((player) => {
      const currentPrice = getEffectivePrice(player.id);
      const changePercent =
        ((currentPrice - player.basePrice) / player.basePrice) * 100;

      // In ESPN Live mode, use ESPN price history
      let moveReason, contentTiles;

      if (isEspnLiveMode && espnPriceHistory[player.id]?.length > 0) {
        const espnHistory = espnPriceHistory[player.id];
        const latestEntry = espnHistory[espnHistory.length - 1];
        moveReason = latestEntry.reason?.headline || '';
        contentTiles = latestEntry.content || [];
      } else {
        moveReason = getMoveReasonFromHistory(player);
        contentTiles = getLatestContentFromHistory(player);
      }

      return {
        ...player,
        currentPrice,
        changePercent: +changePercent.toFixed(2),
        priceChange: +changePercent.toFixed(2), // Alias for backward compatibility
        moveReason,
        contentTiles,
      };
    });
  }, [players, getEffectivePrice, isEspnLiveMode, espnPriceHistory]);

  // Buy shares
  const buyShares = useCallback(
    (playerId, shares) => {
      const price = getEffectivePrice(playerId);
      const cost = price * shares;

      if (cost > cash) return false;

      setCash((prev) => +(prev - cost).toFixed(2));

      setPortfolio((prev) => {
        const existing = prev[playerId] || { shares: 0, avgCost: 0 };
        const totalShares = existing.shares + shares;
        const totalCost = existing.shares * existing.avgCost + cost;
        return {
          ...prev,
          [playerId]: {
            shares: totalShares,
            avgCost: +(totalCost / totalShares).toFixed(2),
          },
        };
      });

      // User buying increases price
      setUserImpact((prev) => ({
        ...prev,
        [playerId]: (prev[playerId] || 0) + shares * USER_IMPACT_FACTOR,
      }));

      // Build current prices for history
      const currentPrices = {};
      players.forEach((p) => {
        currentPrices[p.id] = getEffectivePrice(p.id);
      });

      setHistory((h) => [
        ...h,
        {
          tick,
          prices: currentPrices,
          action: `Bought ${shares} shares of ${playerId}`,
        },
      ]);

      return true;
    },
    [cash, getEffectivePrice, tick, players],
  );

  // Sell shares
  const sellShares = useCallback(
    (playerId, shares) => {
      const holding = portfolio[playerId];
      if (!holding || holding.shares < shares) return false;

      const price = getEffectivePrice(playerId);
      const proceeds = price * shares;

      setCash((prev) => +(prev + proceeds).toFixed(2));

      setPortfolio((prev) => {
        const existing = prev[playerId];
        const remainingShares = existing.shares - shares;

        if (remainingShares === 0) {
          const { [playerId]: _, ...rest } = prev;
          return rest;
        }

        return {
          ...prev,
          [playerId]: {
            ...existing,
            shares: remainingShares,
          },
        };
      });

      // User selling decreases price
      setUserImpact((prev) => ({
        ...prev,
        [playerId]: (prev[playerId] || 0) - shares * USER_IMPACT_FACTOR,
      }));

      // Build current prices for history
      const currentPrices = {};
      players.forEach((p) => {
        currentPrices[p.id] = getEffectivePrice(p.id);
      });

      setHistory((h) => [
        ...h,
        {
          tick,
          prices: currentPrices,
          action: `Sold ${shares} shares of ${playerId}`,
        },
      ]);

      return true;
    },
    [portfolio, getEffectivePrice, tick, players],
  );

  // Watchlist operations
  const addToWatchlist = useCallback((playerId) => {
    setWatchlist((prev) =>
      prev.includes(playerId) ? prev : [...prev, playerId],
    );
  }, []);

  const removeFromWatchlist = useCallback((playerId) => {
    setWatchlist((prev) => prev.filter((id) => id !== playerId));
  }, []);

  const isWatching = useCallback(
    (playerId) => {
      return watchlist.includes(playerId);
    },
    [watchlist],
  );

  // Mission operations
  const setMissionPick = useCallback((playerId, type) => {
    setMissionPicks((prev) => {
      const newPicks = { ...prev };

      // Remove from both arrays first
      newPicks.risers = newPicks.risers.filter((id) => id !== playerId);
      newPicks.fallers = newPicks.fallers.filter((id) => id !== playerId);

      // Add to appropriate array if not already at limit
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

  const clearMissionPick = useCallback((playerId) => {
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

  // Calculate mission score
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

  // Portfolio calculations
  const getPortfolioValue = useCallback(() => {
    let totalValue = 0;
    let totalCost = 0;

    Object.entries(portfolio).forEach(([playerId, holding]) => {
      const currentPrice = getEffectivePrice(playerId);
      totalValue += currentPrice * holding.shares;
      totalCost += holding.avgCost * holding.shares;
    });

    return {
      value: +totalValue.toFixed(2),
      cost: +totalCost.toFixed(2),
      gain: +(totalValue - totalCost).toFixed(2),
      gainPercent:
        totalCost > 0
          ? +(((totalValue - totalCost) / totalCost) * 100).toFixed(2)
          : 0,
    };
  }, [portfolio, getEffectivePrice]);

  // Get league holdings for a player
  const getLeagueHoldings = useCallback(
    (playerId) => {
      const holdings = leagueHoldings[playerId] || [];
      const currentPrice = getEffectivePrice(playerId);

      // Add user's holdings if they have any
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

  // Get all league members
  const getLeagueMembers = useCallback(() => {
    return leagueMembers;
  }, [leagueMembers]);

  // Calculate leaderboard rankings with actual portfolio values
  const getLeaderboardRankings = useCallback(() => {
    // Calculate portfolio value for each league member from their holdings
    const memberPortfolios = {};

    // Initialize all members with base cash (simulated starting cash for AI traders)
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

    // Calculate holdings value for each member
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

    // Add user to the rankings
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

    // Combine all traders and sort by total value
    const allTraders = [...Object.values(memberPortfolios), userEntry];
    allTraders.sort((a, b) => b.totalValue - a.totalValue);

    // Add rank and gap to next
    return allTraders.map((trader, index) => ({
      ...trader,
      rank: index + 1,
      gapToNext:
        index > 0 ? allTraders[index - 1].totalValue - trader.totalValue : 0,
      traderAhead: index > 0 ? allTraders[index - 1] : null,
    }));
  }, [cash, getEffectivePrice, getPortfolioValue, leagueMembers, leagueHoldings]);

  // Timeline debugger - go to specific history point
  const goToHistoryPoint = useCallback(
    (index) => {
      if (index >= 0 && index < history.length) {
        const point = history[index];
        setPriceOverrides(point.prices || {});
        setTick(point.tick);
        setHistory((h) => h.slice(0, index + 1));
      }
    },
    [history],
  );

  // Apply playoff dilution to non-buyback players
  const applyPlayoffDilution = useCallback(
    (dilutionPercent) => {
      if (playoffDilutionApplied || scenario !== 'playoffs') return;

      const dilutionMultiplier = 1 - dilutionPercent / 100;

      setPriceOverrides((prev) => {
        const newOverrides = { ...prev };

        // Apply dilution only to playoff players (not buyback players)
        players.forEach((player) => {
          if (!player.isBuyback) {
            const currentPrice =
              prev[player.id] ?? getCurrentPriceFromHistory(player);
            newOverrides[player.id] = +(
              currentPrice * dilutionMultiplier
            ).toFixed(2);
          }
        });

        return newOverrides;
      });

      setPlayoffDilutionApplied(true);

      // Add to history
      setHistory((h) => [
        ...h,
        {
          tick,
          prices: {},
          action: `Playoff stock issuance: ${dilutionPercent}% dilution applied`,
        },
      ]);
    },
    [playoffDilutionApplied, scenario, players, tick],
  );

  // Scenario setter with reset
  const setScenario = useCallback((newScenario) => {
    // Auto-start playing when switching to live scenarios (live or superbowl)
    setIsPlaying(newScenario === 'live' || newScenario === 'superbowl');
    setScenarioState(newScenario);
  }, []);

  // Get unified timeline for external access
  const getUnifiedTimeline = useCallback(() => {
    return unifiedTimeline;
  }, [unifiedTimeline]);

  const value = {
    // State
    scenario,
    tick,
    isPlaying,
    cash,
    portfolio,
    watchlist,
    missionPicks,
    missionRevealed,
    history,
    currentData,
    unifiedTimeline,
    playoffDilutionApplied,
    scenarioLoading,

    // ESPN Live state
    isEspnLiveMode,
    espnNews,
    espnLoading,
    espnError,
    espnPriceHistory,

    // Actions
    setScenario,
    setIsPlaying,
    buyShares,
    sellShares,
    addToWatchlist,
    removeFromWatchlist,
    isWatching,
    setMissionPick,
    clearMissionPick,
    revealMission,
    resetMission,
    goToHistoryPoint,
    applyPlayoffDilution,
    refreshEspnNews, // Manual ESPN refresh

    // Getters
    getPlayer,
    getPlayers,
    getEffectivePrice,
    getPortfolioValue,
    getMissionScore,
    getLeagueHoldings,
    getLeagueMembers,
    getLeaderboardRankings,
    getUnifiedTimeline,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
