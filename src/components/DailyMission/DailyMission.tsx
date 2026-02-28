import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTrading } from '../../context/TradingContext';
import { useSocial } from '../../context/SocialContext';
import styles from './DailyMission.module.css';

export default function DailyMission({ collapsible = false }) {
  const { getPlayers } = useTrading();
  const {
    missionPicks,
    missionRevealed,
    setMissionPick,
    clearMissionPick,
    revealMission,
    resetMission,
    getMissionScore,
  } = useSocial();

  const [isExpanded, setIsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const players = getPlayers();

  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) return players;
    const q = searchQuery.toLowerCase();
    return players.filter(
      (p) => p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q),
    );
  }, [players, searchQuery]);
  const score = getMissionScore();

  // If not collapsible, always show expanded
  const showContent = collapsible ? isExpanded : true;

  const totalPicks = missionPicks.risers.length + missionPicks.fallers.length;
  const canReveal = totalPicks === 6;

  const getPlayerById = (id: string) => players.find((p) => p.id === id);

  const getPredictionStatus = (playerId: string, type: string) => {
    if (!missionRevealed) return null;
    const player = getPlayerById(playerId);
    if (!player) return null;

    const isCorrect =
      type === 'riser' ? player.changePercent > 0 : player.changePercent < 0;

    return isCorrect ? 'correct' : 'incorrect';
  };

  return (
    <div className={`${styles['daily-mission']} ${!collapsible ? styles['standalone'] : ''}`} data-testid="daily-mission">
      {collapsible && (
        <button
          type="button"
          className={styles['mission-header']}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
        >
          <div className={styles['mission-title-section']}>
            <span className={styles['mission-icon']}>🎯</span>
            <div>
              <h3 className={styles['mission-title']}>Today's Mission</h3>
              <p className={styles['mission-subtitle']}>Pick 3 risers and 3 fallers</p>
            </div>
          </div>

          <div className={styles['mission-header-right']}>
            {missionRevealed && score && (
              <div className={styles['mission-score-badge']}>
                {score.correct}/{score.total} correct
              </div>
            )}
            <motion.svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className={styles['expand-icon']}
              animate={{ rotate: isExpanded ? 180 : 0 }}
            >
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
            </motion.svg>
          </div>
        </button>
      )}

      <AnimatePresence>
        {showContent && (
          <motion.div
            className={styles['mission-content']}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {missionRevealed ? (
              <div className={styles['mission-results']} data-testid="mission-results">
                <div className={styles['results-header']}>
                  <div className={styles['results-score']}>
                    <span className={styles['score-number']}>{score?.correct}</span>
                    <span className={styles['score-divider']}>/</span>
                    <span className={styles['score-total']}>{score?.total}</span>
                    <span className={styles['score-label']}>Correct</span>
                  </div>
                  <div className={styles['results-percentile']}>
                    You beat{' '}
                    <span className={styles['percentile-value']}>
                      {score?.percentile}%
                    </span>{' '}
                    of traders!
                  </div>
                </div>

                <div className={styles['results-grid']}>
                  <div className={styles['results-column']}>
                    <h4 className={styles['results-column-title']}>Your Risers</h4>
                    {missionPicks.risers.map((id) => {
                      const player = getPlayerById(id);
                      const status = getPredictionStatus(id, 'riser');
                      return (
                        <div key={id} className={`${styles['result-chip']} ${status ? styles[status] : ''}`}>
                          <span className={styles['result-name']}>
                            {player?.name || id}
                          </span>
                          <span
                            className={`${styles['result-change']} ${(player?.changePercent ?? 0) >= 0 ? styles['up'] : styles['down']}`}
                          >
                            {(player?.changePercent ?? 0) >= 0 ? '▲' : '▼'}{' '}
                            {Math.abs(player?.changePercent || 0).toFixed(1)}%
                          </span>
                          <span className={styles['result-status']}>
                            {status === 'correct' ? '✓' : '✗'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className={styles['results-column']}>
                    <h4 className={styles['results-column-title']}>Your Fallers</h4>
                    {missionPicks.fallers.map((id) => {
                      const player = getPlayerById(id);
                      const status = getPredictionStatus(id, 'faller');
                      return (
                        <div key={id} className={`${styles['result-chip']} ${status ? styles[status] : ''}`}>
                          <span className={styles['result-name']}>
                            {player?.name || id}
                          </span>
                          <span
                            className={`${styles['result-change']} ${(player?.changePercent ?? 0) >= 0 ? styles['up'] : styles['down']}`}
                          >
                            {(player?.changePercent ?? 0) >= 0 ? '▲' : '▼'}{' '}
                            {Math.abs(player?.changePercent || 0).toFixed(1)}%
                          </span>
                          <span className={styles['result-status']}>
                            {status === 'correct' ? '✓' : '✗'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button className={styles['reset-button']} data-testid="reset-button" onClick={resetMission}>
                  Play Again
                </button>
              </div>
            ) : (
              <>
                <div className={styles['picks-grid']}>
                  <div className={`${styles['picks-column']} ${styles['risers']}`} data-testid="picks-column" data-variant="risers">
                    <h4 className={styles['picks-column-title']}>
                      <span className={`${styles['pick-icon']} ${styles['up']}`}>▲</span>
                      Risers ({missionPicks.risers.length}/3)
                    </h4>
                    <div className={styles['picks-list']}>
                      {missionPicks.risers.map((id) => {
                        const player = getPlayerById(id);
                        return (
                          <motion.div
                            key={id}
                            className={`${styles['pick-chip']} ${styles['riser']}`}
                            data-testid="pick-chip"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                          >
                            <span>{player?.name || id}</span>
                            <button onClick={() => clearMissionPick(id)} aria-label={`Remove ${player?.name || id} from risers`}>
                              ×
                            </button>
                          </motion.div>
                        );
                      })}
                      {[...Array(3 - missionPicks.risers.length)].map(
                        (_, i) => (
                          <div
                            key={`empty-riser-${i}`}
                            className={`${styles['pick-chip']} ${styles['empty']}`}
                            data-testid="pick-chip"
                            data-empty="true"
                          >
                            Select a riser
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <div className={`${styles['picks-column']} ${styles['fallers']}`} data-testid="picks-column" data-variant="fallers">
                    <h4 className={styles['picks-column-title']}>
                      <span className={`${styles['pick-icon']} ${styles['down']}`}>▼</span>
                      Fallers ({missionPicks.fallers.length}/3)
                    </h4>
                    <div className={styles['picks-list']}>
                      {missionPicks.fallers.map((id) => {
                        const player = getPlayerById(id);
                        return (
                          <motion.div
                            key={id}
                            className={`${styles['pick-chip']} ${styles['faller']}`}
                            data-testid="pick-chip"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                          >
                            <span>{player?.name || id}</span>
                            <button onClick={() => clearMissionPick(id)} aria-label={`Remove ${player?.name || id} from fallers`}>
                              ×
                            </button>
                          </motion.div>
                        );
                      })}
                      {[...Array(3 - missionPicks.fallers.length)].map(
                        (_, i) => (
                          <div
                            key={`empty-faller-${i}`}
                            className={`${styles['pick-chip']} ${styles['empty']}`}
                            data-testid="pick-chip"
                            data-empty="true"
                          >
                            Select a faller
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles['player-selector']} data-testid="player-selector">
                  <p className={styles['selector-hint']}>
                    Click a player to add them to your picks:
                  </p>
                  <input
                    type="text"
                    className={styles['selector-search']}
                    placeholder="Search by name or team..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className={styles['selector-chips']}>
                    {filteredPlayers.length === 0 && (
                      <p className={styles['selector-empty']}>No players found</p>
                    )}
                    {filteredPlayers.map((player) => {
                      const isRiser = missionPicks.risers.includes(player.id);
                      const isFaller = missionPicks.fallers.includes(player.id);
                      const isPicked = isRiser || isFaller;

                      return (
                        <div
                          key={player.id}
                          className={`${styles['selector-chip']} ${isPicked ? styles['picked'] : ''}`}
                        >
                          <span className={styles['selector-name']}>{player.name}</span>
                          <span
                            className={`${styles['selector-change']} ${player.changePercent >= 0 ? styles['up'] : styles['down']}`}
                          >
                            {player.changePercent >= 0 ? '+' : ''}
                            {player.changePercent.toFixed(1)}%
                          </span>
                          <div className={styles['selector-actions']}>
                            <button
                              className={`${styles['selector-btn']} ${styles['up']} ${isRiser ? styles['active'] : ''}`}
                              data-testid="selector-btn"
                              data-variant="up"
                              onClick={() => setMissionPick(player.id, 'riser')}
                              disabled={
                                missionPicks.risers.length >= 3 && !isRiser
                              }
                              aria-label={`Pick ${player.name} as riser`}
                            >
                              ▲
                            </button>
                            <button
                              className={`${styles['selector-btn']} ${styles['down']} ${isFaller ? styles['active'] : ''}`}
                              data-testid="selector-btn"
                              data-variant="down"
                              onClick={() =>
                                setMissionPick(player.id, 'faller')
                              }
                              disabled={
                                missionPicks.fallers.length >= 3 && !isFaller
                              }
                              aria-label={`Pick ${player.name} as faller`}
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
                  className={`${styles['reveal-button']} ${canReveal ? styles['ready'] : ''}`}
                  data-testid="reveal-button"
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
