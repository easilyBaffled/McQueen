import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTrading } from '../../context/TradingContext';
import { useSocial } from '../../context/SocialContext';
import styles from './Leaderboard.module.css';

export default function Leaderboard() {
  const { portfolio } = useTrading();
  const { getLeaderboardRankings } = useSocial();
  const hasNoTrades = Object.keys(portfolio).length === 0;

  const rankings = useMemo(
    () => getLeaderboardRankings(),
    [getLeaderboardRankings],
  );

  const userRanking = rankings.find((r) => r.isUser);
  const userValue = userRanking?.totalValue ?? 0;
  const userGain = userRanking?.gainPercent ?? 0;
  const displayRank = userRanking?.rank ?? rankings.length + 1;

  return (
    <div className={styles['leaderboard-page']}>
      <h1 className={styles['page-title']}>Leaderboard</h1>
      <p className={styles['page-subtitle']}>Top traders in your league this week</p>

      <div className={styles['user-rank-card']}>
        <div className={styles['rank-badge']}>#{displayRank}</div>
        <div className={styles['rank-details']}>
          <span className={styles['rank-label']}>Your Current Rank</span>
          <span className={styles['rank-value']}>
            ${userValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div
          className={`${styles['rank-change']} ${userGain >= 0 ? styles['positive'] : styles['negative']}`}
          aria-label={`${userGain >= 0 ? 'Up' : 'Down'} ${Math.abs(userGain).toFixed(1)} percent`}
        >
          {userGain >= 0 ? '▲ +' : '▼ '}
          {userGain.toFixed(1)}%
        </div>
      </div>

      {hasNoTrades && (
        <motion.div
          className={styles['leaderboard-tip']}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className={styles['tip-icon']}>💡</span>
          <div className={styles['tip-content']}>
            <strong>Ready to climb the leaderboard?</strong>
            <p>
              Start trading to grow your portfolio value and compete with other
              traders!
            </p>
          </div>
          <Link to="/market" className={styles['tip-cta']}>
            Start Trading →
          </Link>
        </motion.div>
      )}

      <div className={styles['leaderboard-table']}>
        <div className={styles['table-header']}>
          <span className={styles['col-rank']}>Rank</span>
          <span className={styles['col-trader']}>Trader</span>
          <span className={styles['col-value']}>Portfolio Value</span>
          <span className={styles['col-gain']}>Weekly Gain</span>
        </div>

        {rankings.map((trader, index) => (
          <motion.div
            key={trader.memberId}
            className={`${styles['table-row']} ${index < 3 ? styles['top-three'] : ''} ${trader.isUser ? styles['user-row'] : ''}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <span className={styles['col-rank']}>
              {index === 0 && <span className={`${styles['medal']} ${styles['gold']}`}>🥇</span>}
              {index === 1 && <span className={`${styles['medal']} ${styles['silver']}`}>🥈</span>}
              {index === 2 && <span className={`${styles['medal']} ${styles['bronze']}`}>🥉</span>}
              {index > 2 && <span className={styles['rank-number']}>{index + 1}</span>}
            </span>
            <span className={styles['col-trader']}>
              <span className={styles['trader-avatar']}>{trader.avatar}</span>
              <span className={styles['trader-name']}>
                {trader.isUser ? 'You' : trader.name}
              </span>
            </span>
            <span className={styles['col-value']}>
              $
              {trader.totalValue.toLocaleString('en-US', {
                minimumFractionDigits: 2,
              })}
            </span>
            <span
              className={`${styles['col-gain']} ${(trader.gainPercent ?? 0) >= 0 ? 'text-up' : 'text-down'}`}
              aria-label={`${(trader.gainPercent ?? 0) >= 0 ? 'Up' : 'Down'} ${Math.abs(trader.gainPercent ?? 0).toFixed(1)} percent`}
            >
              {(trader.gainPercent ?? 0) >= 0 ? '▲ +' : '▼ '}
              {Math.abs(trader.gainPercent ?? 0).toFixed(1)}%
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
