import { useState } from 'react';
import { getPlayerHeadshotUrl } from '../../../utils/playerImages';
import type { EnrichedPlayer } from '../../../types';
import styles from '../PlayerDetail.module.css';

interface PlayerHeaderProps {
  player: EnrichedPlayer;
  playerId: string;
}

export default function PlayerHeader({ player, playerId }: PlayerHeaderProps) {
  const [imageError, setImageError] = useState(false);
  const isUp = player.changePercent >= 0;

  return (
    <div className={styles['player-header']} data-testid="player-header">
      <div className={styles['player-header-left']}>
        <div className={styles['player-avatar']}>
          {getPlayerHeadshotUrl(playerId, 'large') && !imageError ? (
            <img
              src={getPlayerHeadshotUrl(playerId, 'large') ?? undefined}
              alt={player.name}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className={styles['avatar-placeholder']}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          )}
        </div>
        <div className={styles['player-info']}>
          <div className={styles['player-meta']}>
            <span className={styles['player-team-badge']}>{player.team}</span>
            <span className={styles['player-position']}>{player.position}</span>
          </div>
          <h1 className={styles['player-name']} data-testid="player-name">{player.name}</h1>
        </div>
      </div>

      <div className={styles['player-price-section']}>
        <div className={`${styles['player-price']} ${isUp ? styles['up'] : styles['down']}`} data-testid="player-price">
          <span className={styles['price-value']}>
            ${player.currentPrice.toFixed(2)}
          </span>
          <span
            className={`${styles['price-change']} ${isUp ? 'text-up' : 'text-down'}`}
            data-testid="price-change"
            aria-label={`${isUp ? 'Up' : 'Down'} ${Math.abs(player.changePercent).toFixed(2)} percent`}
          >
            {isUp ? '▲' : '▼'} {Math.abs(player.changePercent).toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}
