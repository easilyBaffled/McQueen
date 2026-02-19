import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import './Leaderboard.css';

// Fake leaderboard data
const fakeTraders = [
  { id: 1, name: 'GridironGuru', portfolioValue: 15420.5, weeklyGain: 18.4 },
  { id: 2, name: 'TDKing2024', portfolioValue: 14890.25, weeklyGain: 15.2 },
  { id: 3, name: 'FantasyMVP', portfolioValue: 14210.0, weeklyGain: 12.8 },
  { id: 4, name: 'StockJock', portfolioValue: 13850.75, weeklyGain: 11.5 },
  { id: 5, name: 'RookieTrader', portfolioValue: 13420.0, weeklyGain: 9.2 },
  { id: 6, name: 'ChartChaser', portfolioValue: 12980.5, weeklyGain: 7.8 },
  { id: 7, name: 'EndZoneElite', portfolioValue: 12540.25, weeklyGain: 6.1 },
  { id: 8, name: 'PigSkinPro', portfolioValue: 12100.0, weeklyGain: 4.5 },
  { id: 9, name: 'NFLNerd', portfolioValue: 11650.75, weeklyGain: 2.9 },
  { id: 10, name: 'BullMarketBob', portfolioValue: 11200.0, weeklyGain: 1.2 },
];

export default function Leaderboard() {
  const { cash, getPortfolioValue, portfolio } = useGame();
  const hasNoTrades = Object.keys(portfolio).length === 0;
  const portfolioStats = getPortfolioValue();
  const userValue = cash + portfolioStats.value;
  const userGain = portfolioStats.gainPercent;

  // Find user's rank
  const userRank =
    fakeTraders.findIndex((t) => userValue > t.portfolioValue) + 1;
  const displayRank = userRank === 0 ? fakeTraders.length + 1 : userRank;

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

        {fakeTraders.map((trader, index) => (
          <motion.div
            key={trader.id}
            className={`table-row ${index < 3 ? 'top-three' : ''}`}
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
              <span className="trader-name">{trader.name}</span>
            </span>
            <span className="col-value">
              $
              {trader.portfolioValue.toLocaleString('en-US', {
                minimumFractionDigits: 2,
              })}
            </span>
            <span
              className={`col-gain ${trader.weeklyGain >= 0 ? 'text-up' : 'text-down'}`}
              aria-label={`${trader.weeklyGain >= 0 ? 'Up' : 'Down'} ${Math.abs(trader.weeklyGain).toFixed(1)} percent`}
            >
              {trader.weeklyGain >= 0 ? '▲ +' : '▼ '}
              {trader.weeklyGain.toFixed(1)}%
            </span>
          </motion.div>
        ))}

        {/* User row if not in top 10 */}
        {displayRank > 10 && (
          <>
            <div className="table-divider">
              <span>•••</span>
            </div>
            <motion.div
              className="table-row user-row"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <span className="col-rank">
                <span className="rank-number">{displayRank}</span>
              </span>
              <span className="col-trader">
                <span className="trader-name">You</span>
              </span>
              <span className="col-value">
                $
                {userValue.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}
              </span>
              <span
                className={`col-gain ${userGain >= 0 ? 'text-up' : 'text-down'}`}
                aria-label={`${userGain >= 0 ? 'Up' : 'Down'} ${Math.abs(userGain).toFixed(1)} percent`}
              >
                {userGain >= 0 ? '▲ +' : '▼ '}
                {userGain.toFixed(1)}%
              </span>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
