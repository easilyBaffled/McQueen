import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTrading } from '../../context/TradingContext';
import { useSocial } from '../../context/SocialContext';
import './Leaderboard.css';

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
    <div className="leaderboard-page">
      <h1 className="page-title">Leaderboard</h1>
      <p className="page-subtitle">Top traders in your league this week</p>

      <div className="user-rank-card">
        <div className="rank-badge">#{displayRank}</div>
        <div className="rank-details">
          <span className="rank-label">Your Current Rank</span>
          <span className="rank-value">
            ${userValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div
          className={`rank-change ${userGain >= 0 ? 'positive' : 'negative'}`}
          aria-label={`${userGain >= 0 ? 'Up' : 'Down'} ${Math.abs(userGain).toFixed(1)} percent`}
        >
          {userGain >= 0 ? '▲ +' : '▼ '}
          {userGain.toFixed(1)}%
        </div>
      </div>

      {hasNoTrades && (
        <motion.div
          className="leaderboard-tip"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="tip-icon">💡</span>
          <div className="tip-content">
            <strong>Ready to climb the leaderboard?</strong>
            <p>
              Start trading to grow your portfolio value and compete with other
              traders!
            </p>
          </div>
          <Link to="/market" className="tip-cta">
            Start Trading →
          </Link>
        </motion.div>
      )}

      <div className="leaderboard-table">
        <div className="table-header">
          <span className="col-rank">Rank</span>
          <span className="col-trader">Trader</span>
          <span className="col-value">Portfolio Value</span>
          <span className="col-gain">Weekly Gain</span>
        </div>

        {rankings.map((trader, index) => (
          <motion.div
            key={trader.memberId}
            className={`table-row ${index < 3 ? 'top-three' : ''} ${trader.isUser ? 'user-row' : ''}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <span className="col-rank">
              {index === 0 && <span className="medal gold">🥇</span>}
              {index === 1 && <span className="medal silver">🥈</span>}
              {index === 2 && <span className="medal bronze">🥉</span>}
              {index > 2 && <span className="rank-number">{index + 1}</span>}
            </span>
            <span className="col-trader">
              <span className="trader-avatar">{trader.avatar}</span>
              <span className="trader-name">
                {trader.isUser ? 'You' : trader.name}
              </span>
            </span>
            <span className="col-value">
              $
              {trader.totalValue.toLocaleString('en-US', {
                minimumFractionDigits: 2,
              })}
            </span>
            <span
              className={`col-gain ${(trader.gainPercent ?? 0) >= 0 ? 'text-up' : 'text-down'}`}
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
