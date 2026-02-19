import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTrading } from '../../context/TradingContext';
import { useSocial } from '../../context/SocialContext';
import { useToast } from '../../components/Toast/ToastProvider';
import PlayerCard from '../../components/PlayerCard/PlayerCard';
import styles from './Watchlist.module.css';

export default function Watchlist() {
  const { getPlayer, getPlayers } = useTrading();
  const { watchlist, removeFromWatchlist, addToWatchlist } = useSocial();
  const { addToast } = useToast();

  const watchedPlayers = watchlist.map((id) => getPlayer(id)).filter((p): p is NonNullable<typeof p> => p !== null);

  // Get popular players that aren't already watched
  const popularPlayers = getPlayers()
    .filter((p) => !watchlist.includes(p.id))
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 4);

  const handleQuickAdd = (playerId: string, playerName: string) => {
    addToWatchlist(playerId);
    addToast(`Added ${playerName} to watchlist`, 'success');
  };

  const handleRemove = (e: React.MouseEvent, playerId: string, playerName: string) => {
    e.preventDefault();
    removeFromWatchlist(playerId);
    addToast(`Removed ${playerName} from watchlist`, 'info');
  };

  return (
    <div className={styles['watchlist-page']}>
      <h1 className={styles['page-title']}>Your Watchlist</h1>
      <p className={styles['page-subtitle']}>Players you're keeping an eye on</p>

      {watchedPlayers.length === 0 ? (
        <motion.div
          className={`${styles['empty-state']} ${styles['enhanced']}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={`${styles['empty-illustration']} ${styles['watchlist-illustration']}`}>
            <motion.svg
              viewBox="0 0 80 80"
              className={styles['heart-icon']}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <defs>
                <linearGradient
                  id="heartGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="var(--color-primary)" />
                  <stop offset="100%" stopColor="#ff6b6b" />
                </linearGradient>
              </defs>
              <motion.path
                d="M40 65l-3.5-3.2C20 47.5 10 38.5 10 27.5 10 18.5 17 11.5 26 11.5c5 0 10 2.5 14 6.5 4-4 9-6.5 14-6.5 9 0 16 7 16 16 0 11-10 20-26.5 34.3L40 65z"
                fill="url(#heartGradient)"
                initial={{ pathLength: 0, fillOpacity: 0 }}
                animate={{ pathLength: 1, fillOpacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              />
            </motion.svg>
            <motion.div
              className={styles['pulse-ring']}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>

          <h3>Track Your Favorites</h3>
          <p>
            Watch players you're interested in without committing to buy. Get
            notified when prices move.
          </p>

          {popularPlayers.length > 0 && (
            <div className={styles['quick-add-section']}>
              <span className={styles['quick-add-label']}>📊 Popular Players</span>
              <div className={styles['quick-add-list']}>
                {popularPlayers.map((player) => (
                  <button
                    key={player.id}
                    className={styles['quick-add-player']}
                    onClick={() => handleQuickAdd(player.id, player.name)}
                  >
                    <div className={styles['quick-add-info']}>
                      <span className={styles['quick-add-team']}>{player.team}</span>
                      <span className={styles['quick-add-name']}>{player.name}</span>
                    </div>
                    <div
                      className={`${styles['quick-add-change']} ${player.changePercent >= 0 ? styles['up'] : styles['down']}`}
                      aria-label={`${player.changePercent >= 0 ? 'Up' : 'Down'} ${Math.abs(player.changePercent).toFixed(1)} percent`}
                    >
                      {player.changePercent >= 0 ? '▲' : '▼'}{' '}
                      {Math.abs(player.changePercent).toFixed(1)}%
                    </div>
                    <span className={styles['quick-add-icon']}>+</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <Link to="/market" className={styles['cta-button']}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
            </svg>
            Browse All Players
          </Link>
        </motion.div>
      ) : (
        <div className={styles['watchlist-grid']}>
          {watchedPlayers.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={styles['watchlist-card-wrapper']}
            >
              <Link to={`/player/${player.id}`}>
                <PlayerCard player={player} />
              </Link>
              <button
                className={styles['remove-button']}
                onClick={(e) => handleRemove(e, player.id, player.name)}
                title="Remove from watchlist"
                aria-label={`Remove ${player.name} from watchlist`}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
