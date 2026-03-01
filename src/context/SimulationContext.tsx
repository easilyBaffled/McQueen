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
  MAX_HISTORY_SIZE,
} from '../constants';

import { getCurrentPriceFromHistory } from '../services/priceResolver';
import { buildUnifiedTimeline } from '../services/simulationEngine';

import { useScenario } from './ScenarioContext';
import type { ChildrenProps, HistoryEntry, SimulationContextValue } from '../types';

function capHistory(entries: HistoryEntry[]): HistoryEntry[] {
  if (entries.length <= MAX_HISTORY_SIZE) return entries;
  return entries.slice(entries.length - MAX_HISTORY_SIZE);
}

const SimulationContext = createContext<SimulationContextValue | null>(null);

export { SimulationContext };

export function SimulationProvider({ children }: ChildrenProps) {
  const { scenario, players, scenarioVersion } = useScenario();

  const [tick, setTick] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [playoffDilutionApplied, setPlayoffDilutionApplied] = useState(false);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastResetVersionRef = useRef(0);
  const tickRef = useRef(0);
  const priceOverridesRef = useRef(priceOverrides);
  priceOverridesRef.current = priceOverrides;

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
    if (scenarioVersion === lastResetVersionRef.current) return;
    lastResetVersionRef.current = scenarioVersion;

    setPriceOverrides({});
    tickRef.current = 0;
    setTick(0);
    setPlayoffDilutionApplied(false);
    setIsPlaying(scenario === 'live' || scenario === 'superbowl');

    const initialPrices: Record<string, number> = {};
    players.forEach((player) => {
      if (isEspnLiveMode) {
        initialPrices[player.id] = player.basePrice;
      } else {
        initialPrices[player.id] = getCurrentPriceFromHistory(player);
      }
    });

    const actionMessage = isEspnLiveMode
      ? 'ESPN Live mode activated - fetching real news...'
      : 'Scenario loaded';

    setHistory([{ tick: 0, prices: initialPrices, action: actionMessage }]);
  }, [scenarioVersion, players, scenario, isEspnLiveMode]);

  // Initial history on first mount (when scenarioVersion === 0)
  useEffect(() => {
    if (players.length === 0) return;
    if (history.length > 0) return;

    const initialPrices: Record<string, number> = {};
    players.forEach((player) => {
      if (isEspnLiveMode) {
        initialPrices[player.id] = player.basePrice;
      } else {
        initialPrices[player.id] = getCurrentPriceFromHistory(player);
      }
    });

    const actionMessage = isEspnLiveMode
      ? 'ESPN Live mode activated - fetching real news...'
      : 'Scenario loaded';

    setHistory([{ tick: 0, prices: initialPrices, action: actionMessage }]);
  }, [players, isEspnLiveMode, history.length]);

  // Live scenario tick updates (no nested state setters)
  useEffect(() => {
    if (
      (scenario === 'live' || scenario === 'superbowl') &&
      isPlaying &&
      unifiedTimeline.length > 0
    ) {
      tickIntervalRef.current = setInterval(() => {
        const nextTick = tickRef.current + 1;
        if (nextTick >= unifiedTimeline.length) {
          setIsPlaying(false);
          return;
        }

        const timelineEntry = unifiedTimeline[nextTick];
        if (timelineEntry) {
          const newOverrides = { ...priceOverridesRef.current };
          newOverrides[timelineEntry.playerId] = timelineEntry.price;

          const currentPrices: Record<string, number> = {};
          players.forEach((p) => {
            currentPrices[p.id] =
              newOverrides[p.id] || getCurrentPriceFromHistory(p);
          });

          setPriceOverrides(newOverrides);
          setHistory((h) => capHistory([
            ...h,
            {
              tick: nextTick,
              prices: currentPrices,
              action: timelineEntry.reason?.headline || 'Price update',
              playerId: timelineEntry.playerId,
              playerName: timelineEntry.playerName,
            },
          ]));
        }

        tickRef.current = nextTick;
        setTick(nextTick);
      }, TICK_INTERVAL_MS);

      return () => { if (tickIntervalRef.current) clearInterval(tickIntervalRef.current); };
    }
  }, [scenario, isPlaying, unifiedTimeline, players]);

  const goToHistoryPoint = useCallback(
    (index: number) => {
      if (index >= 0 && index < history.length) {
        const point = history[index];
        setPriceOverrides(point.prices || {});
        tickRef.current = point.tick;
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

      setHistory((h) => capHistory([
        ...h,
        {
          tick,
          prices: {},
          action: `Playoff stock issuance: ${dilutionPercent}% dilution applied`,
        },
      ]));
    },
    [playoffDilutionApplied, scenario, players, tick],
  );

  const getUnifiedTimeline = useCallback(() => {
    return unifiedTimeline;
  }, [unifiedTimeline]);

  const updatePriceOverride = useCallback((playerId: string, price: number) => {
    setPriceOverrides((prev) => ({ ...prev, [playerId]: price }));
  }, []);

  const addHistoryEntry = useCallback((entry: HistoryEntry) => {
    setHistory((h) => capHistory([...h, entry]));
  }, []);

  const value = useMemo<SimulationContextValue>(() => ({
    tick,
    isPlaying,
    setIsPlaying,
    priceOverrides,
    history,
    unifiedTimeline,
    playoffDilutionApplied,
    goToHistoryPoint,
    applyPlayoffDilution,
    getUnifiedTimeline,
    updatePriceOverride,
    addHistoryEntry,
  }), [tick, isPlaying, priceOverrides, history, unifiedTimeline, playoffDilutionApplied, goToHistoryPoint, applyPlayoffDilution, getUnifiedTimeline, updatePriceOverride, addHistoryEntry]);

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
