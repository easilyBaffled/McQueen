import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import styles from './AddEventModal.module.css';
import type { Player, PriceHistoryEntry } from '../../types';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { playerId: string; entry: PriceHistoryEntry }) => void;
  players?: Player[];
  preselectedPlayerId?: string | null;
}

interface FormData {
  playerId: string;
  timestamp: string;
  price: string;
  reasonType: string;
  eventType: string;
  headline: string;
  source: string;
  url: string;
  memberId: string;
  action: string;
  shares: number;
  contentEnabled: boolean;
  contentType: string;
  contentTitle: string;
  contentSource: string;
  contentUrl: string;
}

const EVENT_TYPES: Record<string, { label: string; icon: string; eventTypes?: string[]; actions?: string[] }> = {
  game_event: {
    label: 'Game Event',
    icon: '🏈',
    eventTypes: ['TD', 'INT', 'stats', 'injury'],
  },
  news: {
    label: 'News',
    icon: '📰',
  },
  league_trade: {
    label: 'League Trade',
    icon: '💱',
    actions: ['buy', 'sell'],
  },
};

export default function AddEventModal({
  isOpen,
  onClose,
  onSubmit,
  players = [],
  preselectedPlayerId = null,
}: AddEventModalProps) {
  const [formData, setFormData] = useState<FormData>({
    playerId: preselectedPlayerId || '',
    timestamp: new Date().toISOString().slice(0, 16),
    price: '',
    reasonType: 'game_event',
    eventType: 'TD',
    headline: '',
    source: 'ESPN Gamecast',
    url: '',
    // League trade specific
    memberId: '',
    action: 'buy',
    shares: 1,
    // Content tiles
    contentEnabled: false,
    contentType: 'video',
    contentTitle: '',
    contentSource: '',
    contentUrl: '#',
  });

  const [errors, setErrors] = useState({});
  const focusTrapRef = useFocusTrap(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Update playerId when preselectedPlayerId changes
  useEffect(() => {
    if (preselectedPlayerId) {
      setFormData((prev) => ({ ...prev, playerId: preselectedPlayerId }));
    }
  }, [preselectedPlayerId]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        playerId: preselectedPlayerId || prev.playerId || '',
        timestamp: new Date().toISOString().slice(0, 16),
      }));
      setErrors({});
    }
  }, [isOpen, preselectedPlayerId]);

  // Get the selected player's current price for reference
  const selectedPlayer = players.find((p) => p.id === formData.playerId);
  const currentPrice =
    selectedPlayer?.priceHistory?.length > 0
      ? selectedPlayer.priceHistory[selectedPlayer.priceHistory.length - 1]
          .price
      : selectedPlayer?.basePrice || 0;

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.playerId) {
      newErrors.playerId = 'Please select a player';
    }
    if (!formData.price || isNaN(parseFloat(formData.price))) {
      newErrors.price = 'Please enter a valid price';
    }
    if (!formData.headline.trim()) {
      newErrors.headline = 'Please enter a headline';
    }
    if (!formData.source.trim()) {
      newErrors.source = 'Please enter a source';
    }
    if (formData.reasonType === 'league_trade') {
      if (!formData.memberId.trim()) {
        newErrors.memberId = 'Please enter a member ID';
      }
      if (!formData.shares || formData.shares < 1) {
        newErrors.shares = 'Shares must be at least 1';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Build the price history entry
    const entry = {
      timestamp: new Date(formData.timestamp).toISOString(),
      price: parseFloat(formData.price),
      reason: buildReason(),
    };

    // Add content if enabled
    if (formData.contentEnabled && formData.contentTitle.trim()) {
      entry.content = [
        {
          type: formData.contentType,
          title: formData.contentTitle,
          source: formData.contentSource || formData.source,
          url: formData.contentUrl || '#',
        },
      ];
    }

    onSubmit({
      playerId: formData.playerId,
      entry,
    });

    // Reset form
    setFormData((prev) => ({
      ...prev,
      price: '',
      headline: '',
      url: '',
      memberId: '',
      shares: 1,
      contentEnabled: false,
      contentTitle: '',
      contentSource: '',
      contentUrl: '#',
    }));
  };

  const buildReason = () => {
    const base = {
      type: formData.reasonType,
      headline: formData.headline,
      source: formData.source,
    };

    if (formData.url) {
      base.url = formData.url;
    }

    if (formData.reasonType === 'game_event') {
      base.eventType = formData.eventType;
    }

    if (formData.reasonType === 'league_trade') {
      base.memberId = formData.memberId;
      base.action = formData.action;
      base.shares = parseInt(formData.shares, 10);
    }

    return base;
  };

  // Calculate suggested price based on event type
  const getSuggestedPrice = () => {
    if (!currentPrice) return '';

    const changes = {
      TD: currentPrice * 1.025,
      INT: currentPrice * 0.97,
      stats: currentPrice * 1.01,
      injury: currentPrice * 0.985,
      news: currentPrice * 1.005,
      league_trade_buy: currentPrice * 1.005,
      league_trade_sell: currentPrice * 0.995,
    };

    if (formData.reasonType === 'game_event') {
      return changes[formData.eventType]?.toFixed(2) || '';
    }
    if (formData.reasonType === 'league_trade') {
      return changes[`league_trade_${formData.action}`]?.toFixed(2) || '';
    }
    return changes.news?.toFixed(2) || '';
  };

  const applySuggestedPrice = () => {
    const suggested = getSuggestedPrice();
    if (suggested) {
      handleChange('price', suggested);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={styles['modal-overlay']}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={styles['add-event-modal']}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-event-modal-title"
          ref={focusTrapRef}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <header className={styles['modal-header']}>
            <h2 id="add-event-modal-title">Add Price Event</h2>
            <button
              className={styles['close-btn']}
              onClick={onClose}
              aria-label="Close modal"
            >
              ×
            </button>
          </header>

          <form onSubmit={handleSubmit} className={styles['event-form']}>
            {/* Player Selection */}
            <div className={styles['form-group']}>
              <label htmlFor="event-player">Player</label>
              <select
                id="event-player"
                value={formData.playerId}
                onChange={(e) => handleChange('playerId', e.target.value)}
                className={errors.playerId ? 'error' : ''}
              >
                <option value="">Select a player...</option>
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name} ({player.team} - {player.position})
                  </option>
                ))}
              </select>
              {errors.playerId && (
                <span className={styles['error-text']}>{errors.playerId}</span>
              )}
            </div>

            {/* Current Price Reference */}
            {selectedPlayer && (
              <div className={styles['current-price-ref']}>
                <span>Current Price:</span>
                <strong>${currentPrice.toFixed(2)}</strong>
              </div>
            )}

            {/* Timestamp */}
            <div className={styles['form-group']}>
              <label htmlFor="event-timestamp">Timestamp</label>
              <input
                id="event-timestamp"
                type="datetime-local"
                value={formData.timestamp}
                onChange={(e) => handleChange('timestamp', e.target.value)}
              />
            </div>

            {/* Event Type Selection */}
            <div className={styles['form-group']}>
              <span id="event-type-label" className={styles['form-group-label']}>
                Event Type
              </span>
              <div
                className={styles['event-type-buttons']}
                role="group"
                aria-labelledby="event-type-label"
              >
                {Object.entries(EVENT_TYPES).map(([key, { label, icon }]) => (
                  <button
                    key={key}
                    type="button"
                    className={`${styles['event-type-btn']} ${formData.reasonType === key ? styles['active'] : ''}`}
                    onClick={() => handleChange('reasonType', key)}
                  >
                    <span className={styles['icon']}>{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Game Event Type */}
            {formData.reasonType === 'game_event' && (
              <div className={styles['form-group']}>
                <span id="game-event-type-label" className={styles['form-group-label']}>
                  Game Event Type
                </span>
                <div
                  className={styles['sub-type-buttons']}
                  role="group"
                  aria-labelledby="game-event-type-label"
                >
                  {EVENT_TYPES.game_event.eventTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`${styles['sub-type-btn']} ${type.toLowerCase()} ${formData.eventType === type ? styles['active'] : ''}`}
                      onClick={() => handleChange('eventType', type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* League Trade Fields */}
            {formData.reasonType === 'league_trade' && (
              <>
                <div className={styles['form-row']}>
                  <div className={styles['form-group']}>
                    <label htmlFor="event-member-id">Member ID</label>
                    <input
                      id="event-member-id"
                      type="text"
                      value={formData.memberId}
                      onChange={(e) => handleChange('memberId', e.target.value)}
                      placeholder="e.g., gridiron"
                      className={errors.memberId ? 'error' : ''}
                    />
                    {errors.memberId && (
                      <span className={styles['error-text']}>{errors.memberId}</span>
                    )}
                  </div>
                  <div className={styles['form-group']}>
                    <span id="event-action-label" className={styles['form-group-label']}>
                      Action
                    </span>
                    <div
                      className={styles['action-buttons']}
                      role="group"
                      aria-labelledby="event-action-label"
                    >
                      <button
                        type="button"
                        className={`${styles['action-btn']} ${styles['buy']} ${formData.action === styles['buy'] ? styles['active'] : ''}`}
                        onClick={() => handleChange('action', 'buy')}
                      >
                        Buy
                      </button>
                      <button
                        type="button"
                        className={`${styles['action-btn']} ${styles['sell']} ${formData.action === styles['sell'] ? styles['active'] : ''}`}
                        onClick={() => handleChange('action', 'sell')}
                      >
                        Sell
                      </button>
                    </div>
                  </div>
                  <div className={styles['form-group']}>
                    <label htmlFor="event-shares">Shares</label>
                    <input
                      id="event-shares"
                      type="number"
                      min="1"
                      value={formData.shares}
                      onChange={(e) => handleChange('shares', e.target.value)}
                      className={errors.shares ? 'error' : ''}
                    />
                    {errors.shares && (
                      <span className={styles['error-text']}>{errors.shares}</span>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Price */}
            <div className={styles['form-group']}>
              <label htmlFor="event-price">New Price ($)</label>
              <div className={styles['price-input-row']}>
                <input
                  id="event-price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  placeholder="Enter price..."
                  className={errors.price ? 'error' : ''}
                />
                {currentPrice > 0 && (
                  <button
                    type="button"
                    className={styles['suggest-btn']}
                    onClick={applySuggestedPrice}
                    title={`Suggested: $${getSuggestedPrice()}`}
                  >
                    💡 Suggest (${getSuggestedPrice()})
                  </button>
                )}
              </div>
              {errors.price && (
                <span className={styles['error-text']}>{errors.price}</span>
              )}
            </div>

            {/* Headline */}
            <div className={styles['form-group']}>
              <label htmlFor="event-headline">Headline</label>
              <input
                id="event-headline"
                type="text"
                value={formData.headline}
                onChange={(e) => handleChange('headline', e.target.value)}
                placeholder={
                  formData.reasonType === 'game_event'
                    ? 'TOUCHDOWN! Player scores from 5 yards out'
                    : formData.reasonType === 'league_trade'
                      ? 'MemberName bought X shares'
                      : 'Breaking news headline...'
                }
                className={errors.headline ? 'error' : ''}
              />
              {errors.headline && (
                <span className={styles['error-text']}>{errors.headline}</span>
              )}
            </div>

            {/* Source */}
            <div className={styles['form-group']}>
              <label htmlFor="event-source">Source</label>
              <input
                id="event-source"
                type="text"
                value={formData.source}
                onChange={(e) => handleChange('source', e.target.value)}
                placeholder="ESPN Gamecast"
                className={errors.source ? 'error' : ''}
              />
              {errors.source && (
                <span className={styles['error-text']}>{errors.source}</span>
              )}
            </div>

            {/* URL (optional) */}
            <div className={styles['form-group']}>
              <label htmlFor="event-url">URL (optional)</label>
              <input
                id="event-url"
                type="text"
                value={formData.url}
                onChange={(e) => handleChange('url', e.target.value)}
                placeholder="https://..."
              />
            </div>

            {/* Content Tile Toggle */}
            <div className={`${styles['form-group']} ${styles['content-toggle']}`}>
              <label className={styles['checkbox-label']}>
                <input
                  type="checkbox"
                  checked={formData.contentEnabled}
                  onChange={(e) =>
                    handleChange('contentEnabled', e.target.checked)
                  }
                />
                <span>Add content tile (video, article, etc.)</span>
              </label>
            </div>

            {/* Content Tile Fields */}
            {formData.contentEnabled && (
              <div className={styles['content-fields']}>
                <div className={styles['form-row']}>
                  <div className={styles['form-group']}>
                    <label htmlFor="event-content-type">Content Type</label>
                    <select
                      id="event-content-type"
                      value={formData.contentType}
                      onChange={(e) =>
                        handleChange('contentType', e.target.value)
                      }
                    >
                      <option value="video">🎬 Video</option>
                      <option value="article">📰 Article</option>
                      <option value="news">📢 News</option>
                      <option value="analysis">📊 Analysis</option>
                    </select>
                  </div>
                  <div className={`${styles['form-group']} ${styles['flex-grow']}`}>
                    <label htmlFor="event-content-title">Content Title</label>
                    <input
                      id="event-content-title"
                      type="text"
                      value={formData.contentTitle}
                      onChange={(e) =>
                        handleChange('contentTitle', e.target.value)
                      }
                      placeholder="Content title..."
                    />
                  </div>
                </div>
                <div className={styles['form-row']}>
                  <div className={styles['form-group']}>
                    <label htmlFor="event-content-source">Content Source</label>
                    <input
                      id="event-content-source"
                      type="text"
                      value={formData.contentSource}
                      onChange={(e) =>
                        handleChange('contentSource', e.target.value)
                      }
                      placeholder="Same as above if empty"
                    />
                  </div>
                  <div className={`${styles['form-group']} ${styles['flex-grow']}`}>
                    <label htmlFor="event-content-url">Content URL</label>
                    <input
                      id="event-content-url"
                      type="text"
                      value={formData.contentUrl}
                      onChange={(e) =>
                        handleChange('contentUrl', e.target.value)
                      }
                      placeholder="#"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className={styles['modal-actions']}>
              <button type="button" className={styles['cancel-btn']} onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className={styles['submit-btn']}>
                Add Event
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
