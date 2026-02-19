import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DailyMission from '../components/DailyMission/DailyMission';
import './Mission.css';

const MISSION_HELP_SEEN_KEY = 'mcqueen-mission-help-seen';

export default function Mission() {
  // Check if user has seen mission help before - if not, show it expanded
  const [showHelp, setShowHelp] = useState(() => {
    const hasSeen = localStorage.getItem(MISSION_HELP_SEEN_KEY);
    return !hasSeen; // Show by default for new users
  });

  // Mark help as seen when user closes it
  useEffect(() => {
    if (!showHelp) {
      const hasSeen = localStorage.getItem(MISSION_HELP_SEEN_KEY);
      if (!hasSeen) {
        localStorage.setItem(MISSION_HELP_SEEN_KEY, 'true');
      }
    }
  }, [showHelp]);

  return (
    <div className="mission-page">
      <div className="mission-header">
        <div className="mission-header-text">
          <h1 className="page-title">Daily Predictions</h1>
          <p className="page-subtitle">
            Test your NFL knowledge by predicting player price movements
          </p>
        </div>
        <button className="help-toggle" onClick={() => setShowHelp(!showHelp)}>
          {showHelp ? 'Hide Tips' : 'How It Works'}
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z" />
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {showHelp && (
          <motion.div
            className="mission-help"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="help-content">
              <div className="help-step">
                <div className="help-step-icon">🎯</div>
                <div className="help-step-text">
                  <h4>Pick Your Predictions</h4>
                  <p>
                    Choose 3 players you think will go{' '}
                    <span className="text-up">UP</span> (risers) and 3 you think
                    will go <span className="text-down">DOWN</span> (fallers).
                  </p>
                </div>
              </div>

              <div className="help-step">
                <div className="help-step-icon">📰</div>
                <div className="help-step-text">
                  <h4>Use the News</h4>
                  <p>
                    Check player headlines for clues. Injuries, big games, and
                    trade rumors all affect prices!
                  </p>
                </div>
              </div>

              <div className="help-step">
                <div className="help-step-icon">🏆</div>
                <div className="help-step-text">
                  <h4>Compete & Climb</h4>
                  <p>
                    Your accuracy is scored and ranked. Beat other traders to
                    climb the leaderboard!
                  </p>
                </div>
              </div>

              <div className="help-tip">
                <strong>💡 Pro Tip:</strong> Look for players with recent news
                that could boost or hurt their value tomorrow.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DailyMission />
    </div>
  );
}
