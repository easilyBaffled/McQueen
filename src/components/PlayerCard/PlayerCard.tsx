import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useScenario } from '../../context/ScenarioContext';
import { useTrading } from '../../context/TradingContext';
import { useSocial } from '../../context/SocialContext';
import { getPlayerHeadshotUrl } from '../../utils/playerImages';
import styles from './PlayerCard.module.css';

function truncateAtWord(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const truncated = text.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(' ');
  const cutoff = lastSpace > 0 ? lastSpace : maxLen;
  return text.slice(0, cutoff).trimEnd() + '...';
}

const LEAGUE_TOOLTIP_SEEN_KEY = 'mcqueen-league-tooltip-seen';

import type { EnrichedPlayer } from '../../types';

interface PlayerCardProps {
  player: EnrichedPlayer;
  showFirstTradeTip?: boolean;
}

export default function PlayerCard({ player, showFirstTradeTip = false }: PlayerCardProps) {
  const { scenario } = useScenario();
  const { portfolio } = useTrading();
  const { isWatching, getLeagueHoldings } = useSocial();
  const [imageError, setImageError] = useState(false);
  const [showLeagueTooltip, setShowLeagueTooltip] = useState(false);
  const [tooltipDismissed, setTooltipDismissed] = useState(() => {
    return localStorage.getItem(LEAGUE_TOOLTIP_SEEN_KEY) === 'true';
  });

  const dismissLeagueTooltip = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    localStorage.setItem(LEAGUE_TOOLTIP_SEEN_KEY, 'true');
    setTooltipDismissed(true);
    setShowLeagueTooltip(false);
  };
  const isUp = player.changePercent >= 0;
  const holding = portfolio[player.id];
  const watching = isWatching(player.id);
  const isBuyback = player.isBuyback;
  const leagueHoldings = getLeagueHoldings(player.id);
  const headshotUrl = getPlayerHeadshotUrl(player.id, 'medium');

  // Generate sparkline data
  const sparklineData =
    player.priceHistory?.map((entry) => ({ price: entry.price })) || [];
  if (sparklineData.length > 0) {
    sparklineData.push({ price: player.currentPrice });
  }

  return (
    <motion.div
      className={`${styles['player-card']} ${isUp ? styles['up'] : styles['down']} ${isBuyback ? styles['buyback'] : ''}`}
      data-testid="player-card"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {scenario === 'live' && player.isActive && (
        <div className={styles['live-badge']}>
          <span className={styles['live-dot']} />
          LIVE
        </div>
      )}

      {isBuyback && <div className={styles['buyback-badge']}>BUYBACK</div>}

      {showFirstTradeTip && (
        <motion.div
          className={styles['first-trade-tip']}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
        >
          <span className={styles['tip-icon']}>💡</span>
          <span>Try your first trade!</span>
        </motion.div>
      )}

      {(holding || watching) && !isBuyback && (
        <div className={styles['card-badges']}>
          {holding && <span className={styles['owned-badge']}>Owned</span>}
          {watching && <span className={styles['watching-badge']}>★</span>}
        </div>
      )}

      <div className={styles['card-header']}>
        <div className={styles['player-identity']}>
          <span className={styles['team-badge']}>{player.team}</span>
          <span className={styles['position-badge']}>{player.position}</span>
        </div>
        {headshotUrl && !imageError ? (
          <div className={styles['player-headshot']}>
            <img
              src={headshotUrl}
              alt={player.name}
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className={`${styles['player-headshot']} ${styles['placeholder']}`}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        )}
      </div>

      <div className={styles['card-body']}>
        <h3 className={styles['player-name']}>{player.name}</h3>

        <div className={styles['price-row']}>
          <span className={styles['current-price']}>
            ${player.currentPrice.toFixed(2)}
          </span>
          <span
            className={`${styles['price-change']} ${isUp ? styles['up'] : styles['down']}`}
            aria-label={`${isUp ? 'Up' : 'Down'} ${Math.abs(player.changePercent).toFixed(2)} percent`}
          >
            {isUp ? '▲' : '▼'} {Math.abs(player.changePercent).toFixed(2)}%
          </span>
        </div>
      </div>

      <div className={styles['card-chart']}>
        <div className={styles['chart-time-label']}>Last 7 days</div>
        <ResponsiveContainer width="100%" height={40}>
          <LineChart data={sparklineData}>
            <Line
              type="linear"
              dataKey="price"
              stroke={isUp ? '#00C853' : '#FF1744'}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {player.moveReason && (
        <p className={styles['card-reason']}>{truncateAtWord(player.moveReason, 60)}</p>
      )}

      {leagueHoldings.length > 0 && (
        <div
          className={styles['league-holders']}
          onMouseEnter={() => !tooltipDismissed && setShowLeagueTooltip(true)}
          onMouseLeave={() => setShowLeagueTooltip(false)}
        >
          <div className={styles['holders-label-row']}>
            <span className={styles['holders-label']}>Also owned by:</span>
            {!tooltipDismissed && <span className={styles['holders-info-icon']}>ⓘ</span>}
          </div>

          <AnimatePresence>
            {showLeagueTooltip && !tooltipDismissed && (
              <motion.div
                className={styles['league-tooltip']}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                onClick={(e) => e.preventDefault()}
              >
                <div className={styles['league-tooltip-content']}>
                  <strong>League Members</strong>
                  <p>
                    See who else in your league owns this player and how their
                    investment is performing.
                  </p>
                  <p className={styles['tooltip-detail']}>
                    <span className={"text-up"}>+%</span> = profit since they
                    bought
                    <br />
                    <span className={"text-down"}>−%</span> = loss since they
                    bought
                  </p>
                  <button
                    className={styles['tooltip-dismiss']}
                    onClick={dismissLeagueTooltip}
                  >
                    Got it!
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={styles['holders-list']}>
            {leagueHoldings.slice(0, 3).map((holder) => (
              <div
                key={holder.memberId}
                className={`${styles['holder-chip']} ${holder.isUser ? styles['user'] : ''}`}
              >
                <span className={styles['holder-avatar']}>
                  {holder.isUser ? '👤' : holder.avatar}
                </span>
                <span className={styles['holder-name']}>
                  {holder.isUser ? 'You' : holder.name.substring(0, 8)}
                </span>
                <span
                  className={`${styles['holder-gain']} ${holder.gainPercent >= 0 ? styles['up'] : styles['down']}`}
                  aria-label={`${holder.gainPercent >= 0 ? 'Gain' : 'Loss'} ${Math.abs(holder.gainPercent).toFixed(1)} percent`}
                >
                  {holder.gainPercent >= 0 ? '▲ +' : '▼ '}
                  {holder.gainPercent.toFixed(1)}%
                </span>
              </div>
            ))}
            {leagueHoldings.length > 3 && (
              <span className={styles['holders-more']}>
                +{leagueHoldings.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
