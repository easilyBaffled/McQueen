import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScenario } from '../../context/ScenarioContext';
import { useSimulation } from '../../context/SimulationContext';
import styles from './LiveTicker.module.css';

export default function LiveTicker() {
  const { scenario } = useScenario();
  const { history, tick, unifiedTimeline } = useSimulation();

  // Get recent events from the unified timeline (up to current tick)
  const recentEvents = useMemo(() => {
    if (!unifiedTimeline || unifiedTimeline.length === 0) return [];

    // Get events up to the current tick position, then take the last 3
    const eventsUpToTick = unifiedTimeline.slice(0, tick + 1);
    return eventsUpToTick.slice(-3).reverse();
  }, [unifiedTimeline, tick]);

  // Get current event headline
  const currentEvent = useMemo(() => {
    if (!unifiedTimeline || tick >= unifiedTimeline.length) return null;
    const entry = unifiedTimeline[tick];
    return entry?.reason?.headline || null;
  }, [unifiedTimeline, tick]);

  // Fallback to history-based events if unified timeline is empty
  const historyEvents = useMemo(() => {
    return history
      .filter((h) => h.action && h.action !== 'Scenario loaded')
      .slice(-3)
      .reverse();
  }, [history]);

  if (scenario !== 'live') return null;

  const displayEvent =
    currentEvent ||
    recentEvents[0]?.reason?.headline ||
    historyEvents[0]?.action;

  return (
    <div className={styles['live-ticker']}>
      <div className={styles['ticker-label']}>
        <span className={styles['ticker-dot']} />
        LIVE
      </div>
      <div className={styles['ticker-content']}>
        <AnimatePresence mode="wait">
          {displayEvent ? (
            <motion.span
              key={displayEvent}
              className={`${styles['ticker-event']} ${styles['current']}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {displayEvent}
            </motion.span>
          ) : (
            <span className={styles['ticker-event']}>
              MNF: Chiefs vs Bills - Live updates as they happen
            </span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
