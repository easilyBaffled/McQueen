import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import './DailyMission.css';

export default function DailyMission({ collapsible = false }) {
  const {
    getPlayers,
    missionPicks,
    missionRevealed,
    setMissionPick,
    clearMissionPick,
    revealMission,
    resetMission,
    getMissionScore,
  } = useGame();

  const [isExpanded, setIsExpanded] = useState(true);
  const players = getPlayers();
  const score = getMissionScore();

  // If not collapsible, always show expanded
  const showContent = collapsible ? isExpanded : true;

  const totalPicks = missionPicks.risers.length + missionPicks.fallers.length;
  const canReveal = totalPicks === 6;

  const getPlayerById = (id) => players.find((p) => p.id === id);

  const getPredictionStatus = (playerId, type) => {
    if (!missionRevealed) return null;
    const player = getPlayerById(playerId);
    if (!player) return null;

    const isCorrect =
      type === 'riser' ? player.changePercent > 0 : player.changePercent < 0;

    return isCorrect ? 'correct' : 'incorrect';
  };

  return (
    <div className={`daily-mission ${!collapsible ? 'standalone' : ''}`}>
      {collapsible && (
        <div
          className="mission-header"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="mission-title-section">
            <span className="mission-icon">🎯</span>
            <div>
              <h3 className="mission-title">Today's Mission</h3>
              <p className="mission-subtitle">Pick 3 risers and 3 fallers</p>
            </div>
          </div>

          <div className="mission-header-right">
            {missionRevealed && score && (
              <div className="mission-score-badge">
                {score.correct}/{score.total} correct
              </div>
            )}
            <motion.svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="expand-icon"
              animate={{ rotate: isExpanded ? 180 : 0 }}
            >
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
            </motion.svg>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showContent && (
          <motion.div
            className="mission-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {missionRevealed ? (
              <div className="mission-results">
                <div className="results-header">
                  <div className="results-score">
                    <span className="score-number">{score?.correct}</span>
                    <span className="score-divider">/</span>
                    <span className="score-total">{score?.total}</span>
                    <span className="score-label">Correct</span>
                  </div>
                  <div className="results-percentile">
                    You beat{' '}
                    <span className="percentile-value">
                      {score?.percentile}%
                    </span>{' '}
                    of traders!
                  </div>
                </div>

                <div className="results-grid">
                  <div className="results-column">
                    <h4 className="results-column-title">Your Risers</h4>
                    {missionPicks.risers.map((id) => {
                      const player = getPlayerById(id);
                      const status = getPredictionStatus(id, 'riser');
                      return (
                        <div key={id} className={`result-chip ${status}`}>
                          <span className="result-name">
                            {player?.name || id}
                          </span>
                          <span
                            className={`result-change ${player?.changePercent >= 0 ? 'up' : 'down'}`}
                          >
                            {player?.changePercent >= 0 ? '▲' : '▼'}{' '}
                            {Math.abs(player?.changePercent || 0).toFixed(1)}%
                          </span>
                          <span className="result-status">
                            {status === 'correct' ? '✓' : '✗'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="results-column">
                    <h4 className="results-column-title">Your Fallers</h4>
                    {missionPicks.fallers.map((id) => {
                      const player = getPlayerById(id);
                      const status = getPredictionStatus(id, 'faller');
                      return (
                        <div key={id} className={`result-chip ${status}`}>
                          <span className="result-name">
                            {player?.name || id}
                          </span>
                          <span
                            className={`result-change ${player?.changePercent >= 0 ? 'up' : 'down'}`}
                          >
                            {player?.changePercent >= 0 ? '▲' : '▼'}{' '}
                            {Math.abs(player?.changePercent || 0).toFixed(1)}%
                          </span>
                          <span className="result-status">
                            {status === 'correct' ? '✓' : '✗'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button className="reset-button" onClick={resetMission}>
                  Play Again
                </button>
              </div>
            ) : (
              <>
                <div className="picks-grid">
                  <div className="picks-column risers">
                    <h4 className="picks-column-title">
                      <span className="pick-icon up">▲</span>
                      Risers ({missionPicks.risers.length}/3)
                    </h4>
                    <div className="picks-list">
                      {missionPicks.risers.map((id) => {
                        const player = getPlayerById(id);
                        return (
                          <motion.div
                            key={id}
                            className="pick-chip riser"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                          >
                            <span>{player?.name || id}</span>
                            <button onClick={() => clearMissionPick(id)}>
                              ×
                            </button>
                          </motion.div>
                        );
                      })}
                      {[...Array(3 - missionPicks.risers.length)].map(
                        (_, i) => (
                          <div
                            key={`empty-riser-${i}`}
                            className="pick-chip empty"
                          >
                            Select a riser
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="picks-column fallers">
                    <h4 className="picks-column-title">
                      <span className="pick-icon down">▼</span>
                      Fallers ({missionPicks.fallers.length}/3)
                    </h4>
                    <div className="picks-list">
                      {missionPicks.fallers.map((id) => {
                        const player = getPlayerById(id);
                        return (
                          <motion.div
                            key={id}
                            className="pick-chip faller"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                          >
                            <span>{player?.name || id}</span>
                            <button onClick={() => clearMissionPick(id)}>
                              ×
                            </button>
                          </motion.div>
                        );
                      })}
                      {[...Array(3 - missionPicks.fallers.length)].map(
                        (_, i) => (
                          <div
                            key={`empty-faller-${i}`}
                            className="pick-chip empty"
                          >
                            Select a faller
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                <div className="player-selector">
                  <p className="selector-hint">
                    Click a player to add them to your picks:
                  </p>
                  <div className="selector-chips">
                    {players.slice(0, 12).map((player) => {
                      const isRiser = missionPicks.risers.includes(player.id);
                      const isFaller = missionPicks.fallers.includes(player.id);
                      const isPicked = isRiser || isFaller;

                      return (
                        <div
                          key={player.id}
                          className={`selector-chip ${isPicked ? 'picked' : ''}`}
                        >
                          <span className="selector-name">{player.name}</span>
                          <span
                            className={`selector-change ${player.changePercent >= 0 ? 'up' : 'down'}`}
                          >
                            {player.changePercent >= 0 ? '+' : ''}
                            {player.changePercent.toFixed(1)}%
                          </span>
                          <div className="selector-actions">
                            <button
                              className={`selector-btn up ${isRiser ? 'active' : ''}`}
                              onClick={() => setMissionPick(player.id, 'riser')}
                              disabled={
                                missionPicks.risers.length >= 3 && !isRiser
                              }
                            >
                              ▲
                            </button>
                            <button
                              className={`selector-btn down ${isFaller ? 'active' : ''}`}
                              onClick={() =>
                                setMissionPick(player.id, 'faller')
                              }
                              disabled={
                                missionPicks.fallers.length >= 3 && !isFaller
                              }
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  className={`reveal-button ${canReveal ? 'ready' : ''}`}
                  disabled={!canReveal}
                  onClick={revealMission}
                >
                  {canReveal
                    ? 'Reveal Results!'
                    : `Select ${6 - totalPicks} more players`}
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
