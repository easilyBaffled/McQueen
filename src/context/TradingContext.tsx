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
  STORAGE_KEYS,
} from '../constants';

import { read, write } from '../services/storageService';
import {
  getEffectivePrice as getEffectivePricePure,
  getMoveReasonFromHistory,
  getLatestContentFromHistory,
  getAllContentFromHistory,
} from '../services/priceResolver';

import { useScenario } from './ScenarioContext';
import { useSimulation } from './SimulationContext';
import type { ChildrenProps, Portfolio, TradingContextValue } from '../types';

export const TradingContext = createContext<TradingContextValue | null>(null);

export function TradingProvider({ children }: ChildrenProps) {
  const { players, scenarioVersion, currentData } = useScenario();
  const { priceOverrides, isEspnLiveMode, espnPriceHistory } =
    useSimulation();

  const [portfolio, setPortfolio] = useState<Portfolio>(() =>
    read(STORAGE_KEYS.portfolio, {}),
  );
  const [cash, setCash] = useState<number>(() =>
    read(STORAGE_KEYS.cash, INITIAL_CASH),
  );
  const [userImpact, setUserImpact] = useState<Record<string, number>>({});
  const didApplyStarting = useRef(false);

  useEffect(() => {
    write(STORAGE_KEYS.portfolio, portfolio);
  }, [portfolio]);

  useEffect(() => {
    write(STORAGE_KEYS.cash, cash);
  }, [cash]);

  // Apply startingPortfolio on initial data load when localStorage is empty
  useEffect(() => {
    if (didApplyStarting.current || !currentData?.startingPortfolio) return;
    didApplyStarting.current = true;

    const stored = read(STORAGE_KEYS.portfolio, {});
    if (Object.keys(stored).length === 0) {
      setPortfolio(currentData.startingPortfolio);
    }
  }, [currentData]);

  // Reset on scenario change
  useEffect(() => {
    if (scenarioVersion === 0) return;

    const startingPortfolio = currentData?.startingPortfolio || {};
    setPortfolio(startingPortfolio);
    setCash(INITIAL_CASH);
    setUserImpact({});
  }, [scenarioVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const getEffectivePrice = useCallback(
    (playerId: string) =>
      getEffectivePricePure(playerId, priceOverrides, userImpact, players),
    [players, priceOverrides, userImpact],
  );

  const getPlayer = useCallback(
    (playerId: string) => {
      const player = players.find((p) => p.id === playerId);
      if (!player) return null;

      const currentPrice = getEffectivePrice(playerId);
      const changePercent =
        ((currentPrice - player.basePrice) / player.basePrice) * 100;

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
        priceChange: +changePercent.toFixed(2),
        moveReason,
        contentTiles,
        allContent,
        priceHistory,
      };
    },
    [players, getEffectivePrice, isEspnLiveMode, espnPriceHistory],
  );

  const getPlayers = useCallback(() => {
    return players.map((player) => {
      const currentPrice = getEffectivePrice(player.id);
      const changePercent =
        ((currentPrice - player.basePrice) / player.basePrice) * 100;

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
        priceChange: +changePercent.toFixed(2),
        moveReason,
        contentTiles,
      };
    });
  }, [players, getEffectivePrice, isEspnLiveMode, espnPriceHistory]);

  const buyShares = useCallback(
    (playerId: string, shares: number) => {
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

      setUserImpact((prev) => ({
        ...prev,
        [playerId]: (prev[playerId] || 0) + shares * USER_IMPACT_FACTOR,
      }));

      return true;
    },
    [cash, getEffectivePrice],
  );

  const sellShares = useCallback(
    (playerId: string, shares: number) => {
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

      setUserImpact((prev) => ({
        ...prev,
        [playerId]: (prev[playerId] || 0) - shares * USER_IMPACT_FACTOR,
      }));

      return true;
    },
    [portfolio, getEffectivePrice],
  );

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

  const value = useMemo<TradingContextValue>(() => ({
    portfolio,
    cash,
    buyShares,
    sellShares,
    getEffectivePrice,
    getPlayer,
    getPlayers,
    getPortfolioValue,
  }), [portfolio, cash, buyShares, sellShares, getEffectivePrice, getPlayer, getPlayers, getPortfolioValue]);

  return (
    <TradingContext.Provider value={value}>{children}</TradingContext.Provider>
  );
}

export function useTrading(): TradingContextValue {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
}
