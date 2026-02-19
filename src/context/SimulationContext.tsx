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
  TICK_INTERVAL_MS,
  ESPN_REFRESH_MS,
  ESPN_NEWS_LIMIT,
} from '../constants';

import { fetchNFLNews } from '../services/espnService';
import {
  analyzeSentiment,
  getSentimentDescription,
} from '../services/sentimentEngine';
import {
  calculateNewPrice,
  createPriceHistoryEntry,
} from '../services/priceCalculator';
import { getCurrentPriceFromHistory } from '../services/priceResolver';
import { buildUnifiedTimeline } from '../services/simulationEngine';

import { useScenario } from './ScenarioContext';
import type { ChildrenProps, HistoryEntry, PriceHistoryEntry, SimulationContextValue, EspnArticle, Player, TimelineEntry } from '../types';

const SimulationContext = createContext<SimulationContextValue | null>(null);

export function SimulationProvider({ children }: ChildrenProps) {
  const { scenario, players, scenarioVersion } = useScenario();

  const [tick, setTick] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [playoffDilutionApplied, setPlayoffDilutionApplied] = useState(false);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [espnNews, setEspnNews] = useState<EspnArticle[]>([]);
  const [espnLoading, setEspnLoading] = useState(false);
  const [espnError, setEspnError] = useState<string | null>(null);
  const [espnPriceHistory, setEspnPriceHistory] = useState<Record<string, PriceHistoryEntry[]>>({});
  const [processedArticleIds, setProcessedArticleIds] = useState<Set<string>>(new Set());
  const espnRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isEspnLiveMode = scenario === 'espn-live';

  const unifiedTimeline = useMemo(() => {
    if (scenario === 'live' || scenario === 'superbowl') {
      return buildUnifiedTimeline(players);
    }
    return [];
  }, [scenario, players]);

  // Reset state on scenario change
  useEffect(() => {
    if (scenarioVersion === 0) return;

    setPriceOverrides({});
    setTick(0);
    setPlayoffDilutionApplied(false);
    setIsPlaying(scenario === 'live' || scenario === 'superbowl');

    setEspnNews([]);
    setEspnError(null);
    setEspnPriceHistory({});
    setProcessedArticleIds(new Set());

    const initialPrices: Record<string, number> = {};
    players.forEach((player) => {
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
  }, [scenarioVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial history on first mount (when scenarioVersion === 0)
  useEffect(() => {
    if (players.length === 0) return;
    if (history.length > 0) return;

    const initialPrices: Record<string, number> = {};
    players.forEach((player) => {
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
  }, [players, scenario, history.length]);

  // ESPN Live: Fetch and process news
  const fetchAndProcessEspnNews = useCallback(async () => {
    if (!isEspnLiveMode) return;

    setEspnLoading(true);
    setEspnError(null);

    try {
      const news = await fetchNFLNews(ESPN_NEWS_LIMIT);
      setEspnNews(news);

      const newPriceHistory = { ...espnPriceHistory };
      const newProcessedIds = new Set(processedArticleIds);

      for (const article of news) {
        if (newProcessedIds.has(article.id)) continue;

        for (const player of players) {
          const searchTerms = player.searchTerms || [player.name];
          const articleText =
            `${article.headline} ${article.description}`.toLowerCase();

          const isRelevant = searchTerms.some((term) =>
            articleText.includes(term.toLowerCase()),
          );

          if (isRelevant) {
            const sentimentResult = analyzeSentiment(
              `${article.headline} ${article.description}`,
              player.name,
              player.position,
            );

            const currentPrice =
              priceOverrides[player.id] ?? player.basePrice;

            const { newPrice, changePercent } = calculateNewPrice(
              currentPrice,
              sentimentResult,
            );

            const historyEntry = createPriceHistoryEntry(
              article,
              sentimentResult,
              newPrice,
            );
            historyEntry.sentimentDescription =
              getSentimentDescription(sentimentResult);

            if (!newPriceHistory[player.id]) {
              newPriceHistory[player.id] = [];
            }
            newPriceHistory[player.id].push(historyEntry);

            setPriceOverrides((prev) => ({
              ...prev,
              [player.id]: newPrice,
            }));

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
    } catch (error: unknown) {
      console.error('ESPN fetch error:', error);
      setEspnError(error instanceof Error ? error.message : 'Failed to fetch ESPN news');
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
      fetchAndProcessEspnNews();

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
  }, [isEspnLiveMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshEspnNews = useCallback(() => {
    if (isEspnLiveMode) {
      fetchAndProcessEspnNews();
    }
  }, [isEspnLiveMode, fetchAndProcessEspnNews]);

  // Live scenario tick updates
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

          const timelineEntry = unifiedTimeline[nextTick];
          if (timelineEntry) {
            setPriceOverrides((prev) => {
              const newOverrides = { ...prev };
              newOverrides[timelineEntry.playerId] = timelineEntry.price;

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

  const goToHistoryPoint = useCallback(
    (index: number) => {
      if (index >= 0 && index < history.length) {
        const point = history[index];
        setPriceOverrides(point.prices || {});
        setTick(point.tick);
        setHistory((h) => h.slice(0, index + 1));
      }
    },
    [history],
  );

  const applyPlayoffDilution = useCallback(
    (dilutionPercent: number) => {
      if (playoffDilutionApplied || scenario !== 'playoffs') return;

      const dilutionMultiplier = 1 - dilutionPercent / 100;

      setPriceOverrides((prev) => {
        const newOverrides = { ...prev };
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

  const getUnifiedTimeline = useCallback(() => {
    return unifiedTimeline;
  }, [unifiedTimeline]);

  const value: SimulationContextValue = {
    tick,
    isPlaying,
    setIsPlaying,
    priceOverrides,
    history,
    unifiedTimeline,
    playoffDilutionApplied,
    isEspnLiveMode,
    espnNews,
    espnLoading,
    espnError,
    espnPriceHistory,
    goToHistoryPoint,
    applyPlayoffDilution,
    refreshEspnNews,
    getUnifiedTimeline,
  };

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation(): SimulationContextValue {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
}
