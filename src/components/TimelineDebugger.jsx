import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { isDevMode } from '../utils/devMode';
import './TimelineDebugger.css';

export default function TimelineDebugger() {
  const { history, tick, goToHistoryPoint, isPlaying, setIsPlaying } =
    useGame();
  const [isExpanded, setIsExpanded] = useState(false);

  // Only show in dev mode
  if (!isDevMode()) {
    return null;
  }

  return (
    <div className="timeline-debugger">
      <button
        className="debugger-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="debugger-icon">
          <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
        </svg>
        Timeline Debugger
        <span className="tick-badge">Tick {tick}</span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="debugger-panel"
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 10, height: 0 }}
          >
            <div className="debugger-header">
              <h4>Simulation Timeline</h4>
              <div className="debugger-controls">
                <button
                  className={`control-btn ${isPlaying ? 'active' : ''}`}
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

            <div className="timeline-track">
              <div className="track-line" />
              {history.map((point, index) => (
                <button
                  key={index}
                  className={`timeline-point ${index === history.length - 1 ? 'current' : ''}`}
                  style={{
                    left: `${(index / Math.max(history.length - 1, 1)) * 100}%`,
                  }}
                  onClick={() => goToHistoryPoint(index)}
                  title={point.action}
                >
                  <span className="point-dot" />
                </button>
              ))}
            </div>

            <div className="history-list">
              {[...history].reverse().map((point, revIndex) => {
                const index = history.length - 1 - revIndex;
                const isCurrent = index === history.length - 1;

                return (
                  <button
                    type="button"
                    key={index}
                    className={`history-item ${isCurrent ? 'current' : ''}`}
                    onClick={() => goToHistoryPoint(index)}
                  >
                    <span className="history-tick">T{point.tick}</span>
                    <span className="history-action">{point.action}</span>
                    {isCurrent && (
                      <span className="current-badge">Current</span>
                    )}
                  </button>
                );
              })}
            </div>

            <p className="debugger-hint">
              Click any point to rewind the simulation to that moment.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
