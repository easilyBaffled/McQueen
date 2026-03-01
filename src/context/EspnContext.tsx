import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';

import { ESPN_REFRESH_MS, ESPN_NEWS_LIMIT } from '../constants';

import { fetchNFLNews } from '../services/espnService';
import {
  analyzeSentiment,
  getSentimentDescription,
} from '../services/sentimentEngine';
import {
  calculateNewPrice,
  createPriceHistoryEntry,
} from '../services/priceCalculator';

import { useScenario } from './ScenarioContext';
import { useSimulation } from './SimulationContext';
import type { ChildrenProps, PriceHistoryEntry, EspnContextValue, EspnArticle } from '../types';

const MAX_PROCESSED_ARTICLES = 5000;

const EspnContext = createContext<EspnContextValue | null>(null);

export { EspnContext };

export function EspnProvider({ children }: ChildrenProps) {
  const { scenario, players, scenarioVersion } = useScenario();
  const { priceOverrides, updatePriceOverride, addHistoryEntry } = useSimulation();

  const isEspnLiveMode = scenario === 'espn-live';

  const [espnNews, setEspnNews] = useState<EspnArticle[]>([]);
  const [espnLoading, setEspnLoading] = useState(false);
  const [espnError, setEspnError] = useState<string | null>(null);
  const [espnPriceHistory, setEspnPriceHistory] = useState<Record<string, PriceHistoryEntry[]>>({});
  const [processedArticleIds, setProcessedArticleIds] = useState<Set<string>>(new Set());
  const espnRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFetchingRef = useRef(false);
  const lastResetVersionRef = useRef(0);

  const espnPriceHistoryRef = useRef(espnPriceHistory);
  espnPriceHistoryRef.current = espnPriceHistory;
  const processedArticleIdsRef = useRef(processedArticleIds);
  processedArticleIdsRef.current = processedArticleIds;
  const priceOverridesRef = useRef(priceOverrides);
  priceOverridesRef.current = priceOverrides;

  // Reset ESPN state on scenario change
  useEffect(() => {
    if (scenarioVersion === 0) return;
    if (scenarioVersion === lastResetVersionRef.current) return;
    lastResetVersionRef.current = scenarioVersion;

    setEspnNews([]);
    setEspnError(null);
    setEspnPriceHistory({});
    setProcessedArticleIds(new Set());
  }, [scenarioVersion]);

  // ESPN Live: Fetch and process news (mutex-guarded)
  const fetchAndProcessEspnNews = useCallback(async (signal?: AbortSignal) => {
    if (!isEspnLiveMode) return;
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setEspnLoading(true);
    setEspnError(null);

    try {
      const news = await fetchNFLNews(ESPN_NEWS_LIMIT, { signal });
      setEspnNews(news);

      const newPriceHistory = { ...espnPriceHistoryRef.current };
      const newProcessedIds = new Set(processedArticleIdsRef.current);

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
              priceOverridesRef.current[player.id] ?? player.basePrice;

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

            updatePriceOverride(player.id, newPrice);

            addHistoryEntry({
              tick: Date.now(),
              prices: { [player.id]: newPrice },
              action: `ESPN: ${article.headline.substring(0, 50)}...`,
              playerId: player.id,
              playerName: player.name,
              sentiment: sentimentResult.sentiment,
              changePercent,
            });
          }
        }

        newProcessedIds.add(article.id);
      }

      if (newProcessedIds.size > MAX_PROCESSED_ARTICLES) {
        const arr = Array.from(newProcessedIds);
        const kept = arr.slice(arr.length - Math.floor(MAX_PROCESSED_ARTICLES / 2));
        setProcessedArticleIds(new Set(kept));
      } else {
        setProcessedArticleIds(newProcessedIds);
      }

      setEspnPriceHistory(newPriceHistory);
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      console.error('ESPN fetch error:', error);
      setEspnError(error instanceof Error ? error.message : 'Failed to fetch ESPN news');
    } finally {
      isFetchingRef.current = false;
      setEspnLoading(false);
    }
  }, [isEspnLiveMode, players, updatePriceOverride, addHistoryEntry]);

  // ESPN Live: Auto-refresh effect
  useEffect(() => {
    if (isEspnLiveMode) {
      const controller = new AbortController();

      fetchAndProcessEspnNews(controller.signal);

      espnRefreshRef.current = setInterval(
        () => { void fetchAndProcessEspnNews(controller.signal); },
        ESPN_REFRESH_MS,
      );

      return () => {
        controller.abort();
        if (espnRefreshRef.current) {
          clearInterval(espnRefreshRef.current);
        }
      };
    }
  }, [isEspnLiveMode, fetchAndProcessEspnNews]);

  const refreshEspnNews = useCallback(() => {
    if (isEspnLiveMode) {
      fetchAndProcessEspnNews();
    }
  }, [isEspnLiveMode, fetchAndProcessEspnNews]);

  const value = useMemo<EspnContextValue>(() => ({
    isEspnLiveMode,
    espnNews,
    espnLoading,
    espnError,
    espnPriceHistory,
    refreshEspnNews,
  }), [isEspnLiveMode, espnNews, espnLoading, espnError, espnPriceHistory, refreshEspnNews]);

  return (
    <EspnContext.Provider value={value}>
      {children}
    </EspnContext.Provider>
  );
}

export function useEspn(): EspnContextValue {
  const context = useContext(EspnContext);
  if (!context) {
    throw new Error('useEspn must be used within an EspnProvider');
  }
  return context;
}
