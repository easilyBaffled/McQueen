import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';

import { STORAGE_KEYS } from '../constants';
import { read, write } from '../services/storageService';
import type { ChildrenProps, Player, ScenarioContextValue, ScenarioData } from '../types';

export const ScenarioContext = createContext<ScenarioContextValue | null>(null);

const scenarioLoaders: Record<string, () => Promise<ScenarioData>> = {
  midweek: () => import('../data/midweek.json').then((m) => m.default as unknown as ScenarioData),
  live: () => import('../data/live.json').then((m) => m.default as unknown as ScenarioData),
  playoffs: () => import('../data/playoffs.json').then((m) => m.default as unknown as ScenarioData),
  superbowl: () => import('../data/superbowl.json').then((m) => m.default as unknown as ScenarioData),
  'espn-live': () =>
    import('../data/espnPlayers.json').then((m) => ({
      scenario: 'espn-live',
      players: (m.default as unknown as { players: Player[] }).players,
    })),
};

export function ScenarioProvider({ children }: ChildrenProps) {
  const [scenario, setScenarioState] = useState(() =>
    read(STORAGE_KEYS.scenario, 'midweek'),
  );
  const [currentData, setCurrentData] = useState<ScenarioData | null>(null);
  const [scenarioLoading, setScenarioLoading] = useState(true);
  const [scenarioError, setScenarioError] = useState<string | null>(null);
  const scenarioVersionRef = useRef(0);
  const [scenarioVersion, setScenarioVersion] = useState(0);
  const loadIdRef = useRef(0);

  useEffect(() => {
    write(STORAGE_KEYS.scenario, scenario);
  }, [scenario]);

  const loadScenario = useCallback((scenarioKey: string) => {
    loadIdRef.current += 1;
    const thisLoadId = loadIdRef.current;

    setScenarioLoading(true);
    setScenarioError(null);

    const loader = scenarioLoaders[scenarioKey];
    if (!loader) {
      setScenarioLoading(false);
      return;
    }

    loader()
      .then((data) => {
        if (loadIdRef.current !== thisLoadId) return;
        setCurrentData(data);
        setScenarioLoading(false);
      })
      .catch((err: unknown) => {
        if (loadIdRef.current !== thisLoadId) return;
        console.error('Failed to load scenario:', err);
        const message = err instanceof Error ? err.message : 'Failed to load scenario';
        setScenarioError(message);
        setScenarioLoading(false);
      });
  }, []);

  useEffect(() => {
    loadScenario(scenario);
  }, [scenario, loadScenario]);

  const players = useMemo(() => currentData?.players || [], [currentData]);

  const setScenario = useCallback((newScenario: string) => {
    scenarioVersionRef.current += 1;
    setScenarioVersion(scenarioVersionRef.current);
    setScenarioState(newScenario);
  }, []);

  const retryScenarioLoad = useCallback(() => {
    loadScenario(scenario);
  }, [scenario, loadScenario]);

  const value = useMemo<ScenarioContextValue>(() => ({
    scenario,
    setScenario,
    currentData,
    players,
    scenarioLoading,
    scenarioVersion,
    scenarioError,
    retryScenarioLoad,
  }), [scenario, setScenario, currentData, players, scenarioLoading, scenarioVersion, scenarioError, retryScenarioLoad]);

  return (
    <ScenarioContext.Provider value={value}>
      {children}
    </ScenarioContext.Provider>
  );
}

export function useScenario(): ScenarioContextValue {
  const context = useContext(ScenarioContext);
  if (!context) {
    throw new Error('useScenario must be used within a ScenarioProvider');
  }
  return context;
}
