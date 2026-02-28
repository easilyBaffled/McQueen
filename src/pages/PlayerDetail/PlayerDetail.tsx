import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTrading } from '../../context/TradingContext';
import { useSocial } from '../../context/SocialContext';
import { useToast } from '../../components';
import {
  PlayerHeader,
  PriceChart,
  TradeForm,
  HoldingsCard,
  PriceTimeline,
  LeagueOwners,
} from './components';
import styles from './PlayerDetail.module.css';

export default function PlayerDetail() {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const { getPlayer, portfolio, buyShares, sellShares } = useTrading();
  const { addToWatchlist, removeFromWatchlist, isWatching, getLeagueHoldings } =
    useSocial();
  const { addToast } = useToast();

  const id = playerId ?? '';
  const player = getPlayer(id);
  const holding = portfolio[id];
  const watching = isWatching(id);
  const leagueHoldings = getLeagueHoldings(id);

  if (!player) {
    return (
      <div className={styles['player-detail-page']} data-testid="player-detail-page">
        <div className={styles['error-state']} data-testid="error-state">
          <h2>Player Not Found</h2>
          <p>This player doesn't exist in the current scenario.</p>
          <button onClick={() => navigate('/market')} className={styles['back-button']}>
            Back to Market
          </button>
        </div>
      </div>
    );
  }

  const isUp = player.changePercent >= 0;

  const handleWatchlistToggle = () => {
    if (watching) {
      removeFromWatchlist(id);
      addToast(`Removed ${player.name} from watchlist`, 'info');
    } else {
      addToWatchlist(id);
      addToast(`Added ${player.name} to watchlist`, 'success');
    }
  };

  return (
    <div className={styles['player-detail-page']} data-testid="player-detail-page">
      <button onClick={() => navigate(-1)} className={styles['back-link']} data-testid="back-link">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
        Back
      </button>

      <PlayerHeader player={player} playerId={id} />

      <div className={styles['player-content']}>
        <div className={styles['main-column']}>
          <PriceChart
            priceHistory={player.priceHistory || []}
            basePrice={player.basePrice}
            isUp={isUp}
          />

          <motion.div
            className={styles['reason-card']}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3>Why Did This Move?</h3>
            <p className={styles['move-reason']}>{player.moveReason}</p>
          </motion.div>

          {player.contentTiles && player.contentTiles.length > 0 && (
            <motion.div
              className={styles['content-section']}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3>Related Content</h3>
              <div className={styles['content-tiles']}>
                {player.contentTiles.map((tile, i) => (
                  <a
                    key={i}
                    href={tile.url}
                    className={styles['content-tile']}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className={`${styles['tile-type']} ${tile.type}`}>
                      {tile.type}
                    </span>
                    <span className={styles['tile-title']}>{tile.title}</span>
                    <span className={styles['tile-source']}>{tile.source}</span>
                  </a>
                ))}
              </div>
            </motion.div>
          )}

          <PriceTimeline
            priceHistory={player.priceHistory || []}
            basePrice={player.basePrice}
            playerId={id}
          />
        </div>

        <div className={styles['sidebar-column']}>
          <TradeForm
            playerId={id}
            playerName={player.name}
            currentPrice={player.currentPrice}
            holding={holding}
            buyShares={buyShares}
            sellShares={sellShares}
            addToast={addToast}
          />

          {holding && (
            <HoldingsCard holding={holding} currentPrice={player.currentPrice} />
          )}

          <button
            className={`${styles['watchlist-button']} ${watching ? styles['watching'] : ''}`}
            data-testid="watchlist-button"
            onClick={handleWatchlistToggle}
          >
            <svg
              viewBox="0 0 24 24"
              fill={watching ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            {watching ? 'Watching' : 'Add to Watchlist'}
          </button>

          {leagueHoldings.length > 0 && (
            <LeagueOwners leagueHoldings={leagueHoldings} />
          )}
        </div>
      </div>
    </div>
  );
}
