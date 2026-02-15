import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import './MiniLeaderboard.css';

export default function MiniLeaderboard() {
  const { getLeaderboardRankings } = useGame();
  
  const rankings = useMemo(() => getLeaderboardRankings(), [getLeaderboardRankings]);
  
  // Find user and top 3
  const top3 = rankings.slice(0, 3);
  const userRanking = rankings.find(r => r.isUser);
  const userInTop3 = userRanking && userRanking.rank <= 3;
  
  const getMedal = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  };

  const formatValue = (value) => {
    return '$' + value.toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    });
  };

  return (
    <motion.div 
      className="mini-leaderboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="mini-leaderboard-header">
        <div className="header-left">
          <span className="standings-icon">🏆</span>
          <span className="standings-title">STANDINGS</span>
        </div>
        <Link to="/leaderboard" className="view-all-link">
          View All
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
          </svg>
        </Link>
      </div>

      <div className="mini-leaderboard-list">
        <AnimatePresence mode="popLayout">
          {top3.map((trader, index) => (
            <motion.div
              key={trader.memberId}
              className={`mini-rank-row ${trader.isUser ? 'is-user' : ''} ${index === 0 ? 'is-leader' : ''}`}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="rank-indicator">
                {getMedal(trader.rank)}
              </div>
              <div className="trader-info">
                <span className="trader-avatar">{trader.isUser ? '👤' : trader.avatar}</span>
                <span className="trader-name">{trader.name}</span>
              </div>
              <div className="trader-value">
                {formatValue(trader.totalValue)}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* User position if not in top 3 */}
        {!userInTop3 && userRanking && (
          <>
            <div className="rank-divider">
              <span className="divider-dots">•••</span>
            </div>
            <motion.div
              className="mini-rank-row is-user user-section"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="rank-indicator rank-number">
                #{userRanking.rank}
              </div>
              <div className="trader-info">
                <span className="trader-avatar">👤</span>
                <span className="trader-name">You</span>
              </div>
              <div className="trader-value">
                {formatValue(userRanking.totalValue)}
              </div>
            </motion.div>
            
            {/* Gap indicator */}
            {userRanking.gapToNext > 0 && userRanking.traderAhead && (
              <motion.div 
                className="gap-indicator"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <span className="gap-amount">
                  {formatValue(userRanking.gapToNext)}
                </span>
                <span className="gap-text">
                  behind #{userRanking.rank - 1} {userRanking.traderAhead.name}
                </span>
              </motion.div>
            )}
          </>
        )}

        {/* Motivational message if user is in top 3 */}
        {userInTop3 && userRanking && (
          <motion.div 
            className="top-status"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {userRanking.rank === 1 ? (
              <span className="status-leader">🔥 You're in the lead!</span>
            ) : (
              <span className="status-close">
                {formatValue(userRanking.gapToNext)} to #{userRanking.rank - 1}
              </span>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}


