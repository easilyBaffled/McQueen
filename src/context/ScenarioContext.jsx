import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';

import { STORAGE_KEYS } from '../constants';
import { read, write } from '../services/storageService';

const ScenarioContext = createContext(null);

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

export function ScenarioProvider({ children }) {
  const [scenario, setScenarioState] = useState(() =>
    read(STORAGE_KEYS.scenario, 'midweek'),
  );
  const [currentData, setCurrentData] = useState(null);
  const [scenarioLoading, setScenarioLoading] = useState(true);
  const scenarioVersionRef = useRef(0);
  const [scenarioVersion, setScenarioVersion] = useState(0);

  useEffect(() => {
    write(STORAGE_KEYS.scenario, scenario);
  }, [scenario]);

  useEffect(() => {
    let cancelled = false;
    setScenarioLoading(true);

    const loader = scenarioLoaders[scenario];
    if (!loader) {
      setScenarioLoading(false);
      return;
    }

    loader()
      .then((data) => {
        if (cancelled) return;
        setCurrentData(data);
        setScenarioLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to load scenario:', err);
        setScenarioLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [scenario]);

  const players = currentData?.players || [];

  const setScenario = useCallback((newScenario) => {
    scenarioVersionRef.current += 1;
    setScenarioVersion(scenarioVersionRef.current);
    setScenarioState(newScenario);
  }, []);

  const value = {
    scenario,
    setScenario,
    currentData,
    players,
    scenarioLoading,
    scenarioVersion,
  };

  return (
    <ScenarioContext.Provider value={value}>
      {children}
    </ScenarioContext.Provider>
  );
}

export function useScenario() {
  const context = useContext(ScenarioContext);
  if (!context) {
    throw new Error('useScenario must be used within a ScenarioProvider');
  }
  return context;
}
