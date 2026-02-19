import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulation } from '../../context/SimulationContext';
import { isDevMode } from '../../utils/devMode';
import styles from './TimelineDebugger.module.css';

export default function TimelineDebugger() {
  const { history, tick, goToHistoryPoint, isPlaying, setIsPlaying } =
    useSimulation();
  const [isExpanded, setIsExpanded] = useState(false);

  // Only show in dev mode
  if (!isDevMode()) {
    return null;
  }

  return (
    <div className={styles['timeline-debugger']}>
      <button
        className={styles['debugger-toggle']}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className={styles['debugger-icon']}>
          <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
        </svg>
        Timeline Debugger
        <span className={styles['tick-badge']}>Tick {tick}</span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className={styles['debugger-panel']}
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 10, height: 0 }}
          >
            <div className={styles['debugger-header']}>
              <h4>Simulation Timeline</h4>
              <div className={styles['debugger-controls']}>
                <button
                  className={`${styles['control-btn']} ${isPlaying ? styles['active'] : ''}`}
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className={styles['timeline-track']}>
              <div className={styles['track-line']} />
              {history.map((point, index) => (
                <button
                  key={index}
                  className={`${styles['timeline-point']} ${index === history.length - 1 ? styles['current'] : ''}`}
                  style={{
                    left: `${(index / Math.max(history.length - 1, 1)) * 100}%`,
                  }}
                  onClick={() => goToHistoryPoint(index)}
                  title={point.action}
                >
                  <span className={styles['point-dot']} />
                </button>
              ))}
            </div>

            <div className={styles['history-list']}>
              {[...history].reverse().map((point, revIndex) => {
                const index = history.length - 1 - revIndex;
                const isCurrent = index === history.length - 1;

                return (
                  <button
                    type="button"
                    key={index}
                    className={`${styles['history-item']} ${isCurrent ? styles['current'] : ''}`}
                    onClick={() => goToHistoryPoint(index)}
                  >
                    <span className={styles['history-tick']}>T{point.tick}</span>
                    <span className={styles['history-action']}>{point.action}</span>
                    {isCurrent && (
                      <span className={styles['current-badge']}>Current</span>
                    )}
                  </button>
                );
              })}
            </div>

            <p className={styles['debugger-hint']}>
              Click any point to rewind the simulation to that moment.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
