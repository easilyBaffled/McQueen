import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './EventMarkerPopup.module.css';
import type { EventData } from '../../types';

interface EventMarkerPopupProps {
  event: EventData | null;
  position: { x: number; y: number };
  onClose: () => void;
}

// SVG Icon Components
const Icons = {
  touchdown: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
    </svg>
  ),
  interception: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z" />
    </svg>
  ),
  injury: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
    </svg>
  ),
  trade: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
    </svg>
  ),
  news: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
    </svg>
  ),
  dollar: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
    </svg>
  ),
  stats: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z" />
    </svg>
  ),
  football: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <ellipse cx="12" cy="12" rx="10" ry="6" />
      <path
        d="M7 12h10M12 8v8"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      />
    </svg>
  ),
  dot: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="6" />
    </svg>
  ),
};

const EVENT_TYPE_CONFIG = {
  TD: { label: 'Touchdown', color: '#00C853', icon: Icons.touchdown },
  INT: { label: 'Interception', color: '#FF1744', icon: Icons.interception },
  injury: { label: 'Injury', color: '#FF9800', icon: Icons.injury },
  trade: { label: 'Trade', color: '#9C27B0', icon: Icons.trade },
  league_trade: { label: 'League Trade', color: '#9C27B0', icon: Icons.chart },
  news: { label: 'News', color: '#2196F3', icon: Icons.news },
  earnings: { label: 'Earnings', color: '#4CAF50', icon: Icons.dollar },
  stats: { label: 'Stats Update', color: '#00BCD4', icon: Icons.stats },
  game_event: { label: 'Game Event', color: '#00C853', icon: Icons.football },
  default: { label: 'Event', color: '#666', icon: Icons.dot },
};

export function getEventConfig(type: string) {
  return EVENT_TYPE_CONFIG[type as keyof typeof EVENT_TYPE_CONFIG] || EVENT_TYPE_CONFIG.default;
}

export default function EventMarkerPopup({ event, position, onClose }: EventMarkerPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  // Handle both old event format and new PriceChange format
  const eventType = event?.type || 'default';
  const config = getEventConfig(eventType);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  if (!event) return null;

  // Format price if available
  const priceDisplay = event.price ? `$${event.price.toFixed(2)}` : null;

  // Format timestamp if available
  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={popupRef}
        className={styles['event-popup']}
        style={{
          left: position.x,
          top: position.y,
        }}
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
      >
        <div className={styles['event-popup-header']}>
          <span
            className={styles['event-type-badge']}
            style={{
              backgroundColor: `${config.color}25`,
              color: config.color,
            }}
          >
            <span className={styles['event-type-icon']}>{config.icon}</span>
            {config.label}
          </span>
          <button className={styles['event-popup-close']} onClick={onClose} aria-label="Close event details">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <p className={styles['event-headline']}>{event.headline}</p>

        {/* Price display for PriceChange events */}
        {priceDisplay && (
          <div className={styles['event-price-display']}>
            <span className={styles['price-label']}>Price:</span>
            <span className={styles['price-value']}>{priceDisplay}</span>
          </div>
        )}

        {/* League trade info */}
        {event.type === 'league_trade' && event.memberId && (
          <div className={styles['event-trade-info']}>
            <span className={styles['trade-member']}>{event.memberId}</span>
            <span className={styles['trade-action']}>
              {event.action} {event.shares} shares
            </span>
          </div>
        )}

        {/* Timestamp if available */}
        {event.timestamp && (
          <span className={styles['event-timestamp']}>
            {formatTimestamp(event.timestamp)}
          </span>
        )}

        {event.source && <span className={styles['event-source']}>{event.source}</span>}

        {event.url && (
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles['event-link']}
          >
            Read Full Story
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </svg>
          </a>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
