import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getPlayerNewsUrls } from '../../../utils/espnUrls';
import type { PriceReason, PriceHistoryEntry } from '../../../types';
import styles from '../PlayerDetail.module.css';

const EVENT_TYPE_COLORS: Record<string, string> = {
  TD: '#00C853',
  INT: '#FF1744',
  stats: '#00BCD4',
  news: '#2196F3',
  trade: '#9C27B0',
  league_trade: '#9C27B0',
  injury: '#FF9800',
  default: '#666666',
};

const REASON_TYPE_COLORS: Record<string, string> = {
  game_event: '#00BCD4',
  news: '#2196F3',
  league_trade: '#9C27B0',
  unknown: '#666666',
};

function getEventTypeLabel(reason: PriceReason | null | undefined): string {
  if (!reason) return 'Event';
  if (reason.type === 'game_event') return reason.eventType || 'STATS';
  if (reason.type === 'news') return 'NEWS';
  if (reason.type === 'league_trade') return 'TRADE';
  return 'EVENT';
}

function formatTimestamp(timestamp: string) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface PriceTimelineProps {
  priceHistory: PriceHistoryEntry[];
  basePrice: number;
  playerId: string;
}

export default function PriceTimeline({ priceHistory, basePrice, playerId }: PriceTimelineProps) {
  const [playerNewsUrls, setPlayerNewsUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    getPlayerNewsUrls().then(setPlayerNewsUrls);
  }, []);

  const chartData = priceHistory.map((entry, i) => ({
    time: i,
    price: entry.price,
    timestamp: entry.timestamp,
    reason: entry.reason,
    content: entry.content,
  }));

  return (
    <motion.div
      className={styles['timeline-card']}
      data-testid="timeline-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <h3>Price Changes</h3>
      <div className={styles['price-timeline']} data-testid="price-timeline">
        {[...chartData].reverse().map((entry, i, arr) => {
          const reasonType = entry.reason?.type || 'unknown';
          const eventType = entry.reason?.eventType;
          const typeColor = eventType
            ? EVENT_TYPE_COLORS[eventType]
            : REASON_TYPE_COLORS[reasonType];
          const typeLabel = getEventTypeLabel(entry.reason);
          const isTD = eventType === 'TD';
          const isINT = eventType === 'INT';
          const prevPrice =
            chartData[chartData.length - 1 - i - 1]?.price || basePrice;
          const priceDiff = entry.price - prevPrice;
          const isPositive = priceDiff >= 0;

          const entryUrl =
            entry.reason?.url && entry.reason.url !== '#'
              ? entry.reason.url
              : entry.reason?.type === 'news' || entry.reason?.type === 'game_event'
                ? playerNewsUrls[playerId] || null
                : null;

          return (
            <div
              key={i}
              className={`${styles['timeline-entry']} ${isTD ? styles['is-td'] : ''} ${isINT ? styles['is-int'] : ''}`}
              data-testid="timeline-entry"
            >
              {i < arr.length - 1 && (
                <div className={styles['timeline-connector']} />
              )}

              <div
                className={`${styles['timeline-marker']} ${isTD ? styles['marker-td'] : ''} ${isINT ? styles['marker-int'] : ''}`}
                style={{ backgroundColor: typeColor }}
              >
                {isTD && (
                  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                )}
                {isINT && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" width="12" height="12">
                    <path d="M6 6L18 18M18 6L6 18" />
                  </svg>
                )}
                {!isTD && !isINT && reasonType === 'news' && (
                  <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                    <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                  </svg>
                )}
                {!isTD && !isINT && reasonType === 'game_event' && (
                  <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                    <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z" />
                  </svg>
                )}
                {!isTD && !isINT && reasonType === 'league_trade' && (
                  <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
                  </svg>
                )}
              </div>

              <div className={styles['timeline-entry-card']}>
                <div className={styles['timeline-entry-header']}>
                  <span className={styles['timeline-time-badge']}>
                    {formatTimestamp(entry.timestamp)}
                  </span>
                  <span
                    className={styles['timeline-type-badge']}
                    style={{
                      backgroundColor: `${typeColor}25`,
                      color: typeColor,
                    }}
                  >
                    {typeLabel}
                  </span>
                </div>

                {entryUrl ? (
                  <a
                    href={entryUrl}
                    className={`${styles['timeline-headline']} ${styles['timeline-headline-link']}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {entry.reason?.headline}
                    <span className={styles['link-icon']}>↗</span>
                  </a>
                ) : (
                  <p className={styles['timeline-headline']}>
                    {entry.reason?.headline}
                  </p>
                )}

                <div
                  className={`${styles['timeline-price-display']} ${isPositive ? styles['up'] : styles['down']}`}
                >
                  ${entry.price.toFixed(2)}
                  {i < arr.length - 1 && (
                    <span className={styles['price-diff']}>
                      ({isPositive ? '+' : ''}
                      {priceDiff.toFixed(2)})
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
