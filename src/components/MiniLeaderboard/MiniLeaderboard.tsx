import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocial } from '../../context/SocialContext';
import styles from './MiniLeaderboard.module.css';

export default function MiniLeaderboard() {
  const { getLeaderboardRankings } = useSocial();

  const rankings = useMemo(
    () => getLeaderboardRankings(),
    [getLeaderboardRankings],
  );

  // Find user and top 3
  const top3 = rankings.slice(0, 3);
  const userRanking = rankings.find((r) => r.isUser);
  const userInTop3 = userRanking && userRanking.rank <= 3;

  const getMedal = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  const formatValue = (value: string) => {
    return (
      '$' +
      value.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    );
  };

  return (
    <motion.div
      className={styles['mini-leaderboard']}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className={styles['mini-leaderboard-header']}>
        <div className={styles['header-left']}>
          <span className={styles['standings-icon']}>🏆</span>
          <span className={styles['standings-title']}>STANDINGS</span>
        </div>
        <Link to="/leaderboard" className={styles['view-all-link']}>
          View All
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
          </svg>
        </Link>
      </div>

      <div className={styles['mini-leaderboard-list']}>
        <AnimatePresence mode="popLayout">
          {top3.map((trader, index) => (
            <motion.div
              key={trader.memberId}
              className={`${styles['mini-rank-row']} ${trader.isUser ? styles['is-user'] : ''} ${index === 0 ? styles['is-leader'] : ''}`}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className={styles['rank-indicator']}>{getMedal(trader.rank)}</div>
              <div className={styles['trader-info']}>
                <span className={styles['trader-avatar']}>
                  {trader.isUser ? '👤' : trader.avatar}
                </span>
                <span className={styles['trader-name']}>{trader.name}</span>
              </div>
              <div className={styles['trader-value']}>
                {formatValue(trader.totalValue)}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* User position if not in top 3 */}
        {!userInTop3 && userRanking && (
          <>
            <div className={styles['rank-divider']}>
              <span className={styles['divider-dots']}>•••</span>
            </div>
            <motion.div
              className={`${styles['mini-rank-row']} ${styles['is-user']} ${styles['user-section']}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className={`${styles['rank-indicator']} ${styles['rank-number']}`}>
                #{userRanking.rank}
              </div>
              <div className={styles['trader-info']}>
                <span className={styles['trader-avatar']}>👤</span>
                <span className={styles['trader-name']}>You</span>
              </div>
              <div className={styles['trader-value']}>
                {formatValue(userRanking.totalValue)}
              </div>
            </motion.div>

            {/* Gap indicator */}
            {userRanking.gapToNext > 0 && userRanking.traderAhead && (
              <motion.div
                className={styles['gap-indicator']}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <span className={styles['gap-amount']}>
                  {formatValue(userRanking.gapToNext)}
                </span>
                <span className={styles['gap-text']}>
                  behind #{userRanking.rank - 1} {userRanking.traderAhead.name}
                </span>
              </motion.div>
            )}
          </>
        )}

        {/* Motivational message if user is in top 3 */}
        {userInTop3 && userRanking && (
          <motion.div
            className={styles['top-status']}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {userRanking.rank === 1 ? (
              <span className={styles['status-leader']}>🔥 You're in the lead!</span>
            ) : (
              <span className={styles['status-close']}>
                {formatValue(userRanking.gapToNext)} to #{userRanking.rank - 1}
              </span>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
