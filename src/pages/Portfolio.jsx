import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTrading } from '../context/TradingContext';
import InfoTooltip from '../components/InfoTooltip';
import './Portfolio.css';

export default function Portfolio() {
  const { portfolio, getPlayer, getPlayers, getPortfolioValue, cash } =
    useTrading();

  // Get top 3 trending players for suggestions
  const trendingPlayers = getPlayers()
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 3);
  const portfolioStats = getPortfolioValue();
  const totalValue = cash + portfolioStats.value;

  const holdings = Object.entries(portfolio)
    .map(([playerId, holding]) => {
      const player = getPlayer(playerId);
      // Skip holdings where player data is not found (e.g., from different scenario)
      if (!player) return null;

      const currentValue = player.currentPrice * holding.shares;
      const costBasis = holding.avgCost * holding.shares;
      const gain = currentValue - costBasis;
      const gainPercent =
        costBasis > 0 ? ((currentValue - costBasis) / costBasis) * 100 : 0;

      return {
        ...player,
        shares: holding.shares,
        avgCost: holding.avgCost,
        currentValue,
        gain,
        gainPercent,
      };
    })
    .filter(Boolean); // Remove null entries

  return (
    <div className="portfolio-page">
      <h1 className="page-title">Your Portfolio</h1>

      <div className="portfolio-summary">
        <div className="summary-card total">
          <span className="summary-label">
            <InfoTooltip term="totalValue">Total Value</InfoTooltip>
          </span>
          <span className="summary-value">
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">
            <InfoTooltip term="cash">Cash Available</InfoTooltip>
          </span>
          <span className="summary-value">
            ${cash.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">
            <InfoTooltip term="portfolio">Invested</InfoTooltip>
          </span>
          <span className="summary-value">
            $
            {portfolioStats.value.toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}
          </span>
        </div>
        <div
          className={`summary-card ${portfolioStats.gain >= 0 ? 'positive' : 'negative'}`}
        >
          <span className="summary-label">
            <InfoTooltip term="gainLoss">Total Gain/Loss</InfoTooltip>
          </span>
          <span
            className={`summary-value ${portfolioStats.gain >= 0 ? 'text-up' : 'text-down'}`}
            aria-label={`${portfolioStats.gain >= 0 ? 'Gain' : 'Loss'} of $${Math.abs(portfolioStats.gain).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          >
            {portfolioStats.gain >= 0 ? '▲ +' : '▼ '}$
            {portfolioStats.gain.toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}
            <span className="summary-percent">
              ({portfolioStats.gain >= 0 ? '+' : ''}
              {portfolioStats.gainPercent.toFixed(2)}%)
            </span>
          </span>
        </div>
      </div>

      {holdings.length === 0 ? (
        <motion.div
          className="empty-state enhanced"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="empty-illustration">
            <motion.div
              className="chart-bar bar-1"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
            />
            <motion.div
              className="chart-bar bar-2"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
            />
            <motion.div
              className="chart-bar bar-3"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.4, duration: 0.5, ease: 'easeOut' }}
            />
            <motion.div
              className="chart-line"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <svg viewBox="0 0 100 40" preserveAspectRatio="none">
                <motion.path
                  d="M0 35 L20 28 L40 32 L60 20 L80 15 L100 5"
                  fill="none"
                  stroke="var(--color-up)"
                  strokeWidth="2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                />
              </svg>
            </motion.div>
          </div>

          <h3>Start Your Trading Journey</h3>
          <p>
            Build your portfolio by investing in NFL players you believe will
            outperform the market.
          </p>

          {trendingPlayers.length > 0 && (
            <div className="suggested-players">
              <span className="suggested-label">🔥 Trending Now</span>
              <div className="suggested-list">
                {trendingPlayers.map((player) => (
                  <Link
                    key={player.id}
                    to={`/player/${player.id}`}
                    className="suggested-player"
                  >
                    <span className="suggested-name">{player.name}</span>
                    <span
                      className={`suggested-change ${player.changePercent >= 0 ? 'up' : 'down'}`}
                      aria-label={`${player.changePercent >= 0 ? 'Up' : 'Down'} ${Math.abs(player.changePercent).toFixed(1)} percent`}
                    >
                      {player.changePercent >= 0 ? '▲' : '▼'}{' '}
                      {Math.abs(player.changePercent).toFixed(1)}%
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <Link to="/market" className="cta-button">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
            </svg>
            Browse Market
          </Link>
        </motion.div>
      ) : (
        <div className="holdings-list">
          <div className="holdings-header">
            <span>Player</span>
            <span>Shares</span>
            <span>Avg Cost</span>
            <span>Current</span>
            <span>Value</span>
            <span>Gain/Loss</span>
          </div>

          {holdings.map((holding, index) => (
            <motion.div
              key={holding.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={`/player/${holding.id}`} className="holding-row">
                <div className="holding-player">
                  <span className="player-name">{holding.name}</span>
                  <span className="player-team">
                    {holding.team} • {holding.position}
                  </span>
                </div>
                <span className="holding-shares">{holding.shares}</span>
                <span className="holding-cost">
                  ${holding.avgCost.toFixed(2)}
                </span>
                <span
                  className={`holding-current ${holding.changePercent >= 0 ? 'text-up' : 'text-down'}`}
                >
                  ${holding.currentPrice.toFixed(2)}
                </span>
                <span className="holding-value">
                  ${holding.currentValue.toFixed(2)}
                </span>
                <span
                  className={`holding-gain ${holding.gain >= 0 ? 'text-up' : 'text-down'}`}
                  aria-label={`${holding.gain >= 0 ? 'Gain' : 'Loss'} of $${Math.abs(holding.gain).toFixed(2)}, ${Math.abs(holding.gainPercent).toFixed(1)} percent`}
                >
                  {holding.gain >= 0 ? '▲ +' : '▼ '}${holding.gain.toFixed(2)}
                  <span className="gain-percent">
                    ({holding.gain >= 0 ? '+' : ''}
                    {holding.gainPercent.toFixed(1)}%)
                  </span>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
