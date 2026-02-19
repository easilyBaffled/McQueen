import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTrading } from '../../context/TradingContext';
import { useToast } from '../../components/Toast/Toast';
import './Timeline.css';

// Color configuration (matches ScenarioInspector)
const REASON_TYPE_COLORS = {
  game_event: '#00C853',
  news: '#2196F3',
  league_trade: '#9C27B0',
};

const EVENT_TYPE_COLORS = {
  TD: '#00C853',
  INT: '#FF1744',
  stats: '#00BCD4',
  injury: '#FF9800',
};

// Filter options
const TYPE_FILTERS = [
  { id: 'all', label: 'All Events' },
  { id: 'news', label: 'News' },
  { id: 'league_trade', label: 'Trades' },
  { id: 'game_event', label: 'Game Updates' },
];

const MAGNITUDE_FILTERS = [
  { id: 'all', label: 'All Changes' },
  { id: 'major', label: 'Major (>5%)' },
  { id: 'significant', label: 'Significant (>2%)' },
];

const TIME_FILTERS = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
];

// Get color for event type
function getEventColor(reason) {
  const eventType = reason?.eventType;
  const reasonType = reason?.type || 'unknown';
  return eventType
    ? EVENT_TYPE_COLORS[eventType]
    : REASON_TYPE_COLORS[reasonType] || '#666';
}

// Get event type label
function getEventTypeLabel(reason) {
  return reason?.eventType || reason?.type || 'event';
}

// Calculate price change percentage from previous entry
function calculatePriceChange(entries, currentIndex, player) {
  if (currentIndex === 0) {
    const basePrice = player?.basePrice || entries[0].price;
    return ((entries[0].price - basePrice) / basePrice) * 100;
  }
  const prevPrice = entries[currentIndex - 1].price;
  const currentPrice = entries[currentIndex].price;
  return ((currentPrice - prevPrice) / prevPrice) * 100;
}

// Format time for display
function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function Timeline() {
  const { getPlayers, getPlayer, cash, buyShares, sellShares, portfolio } =
    useTrading();
  const { addToast } = useToast();

  const [typeFilter, setTypeFilter] = useState('all');
  const [magnitudeFilter, setMagnitudeFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [tradeQuantities, setTradeQuantities] = useState({});

  const players = getPlayers();

  // Build unified timeline from all players' priceHistory
  const allEvents = useMemo(() => {
    const events = [];

    players.forEach((player) => {
      if (player.priceHistory) {
        player.priceHistory.forEach((entry, index) => {
          const priceChange = calculatePriceChange(
            player.priceHistory,
            index,
            player,
          );

          events.push({
            id: `${player.id}-${index}`,
            playerId: player.id,
            playerName: player.name,
            playerTeam: player.team,
            playerPosition: player.position,
            entryIndex: index,
            timestamp: entry.timestamp,
            price: entry.price,
            priceChange,
            reason: entry.reason,
            content: entry.content,
          });
        });
      }
    });

    // Sort by timestamp (newest first)
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return events;
  }, [players]);

  // Apply filters
  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) => {
      // Type filter
      if (typeFilter !== 'all') {
        const eventType = event.reason?.type || 'default';
        if (eventType !== typeFilter) return false;
      }

      // Magnitude filter
      if (magnitudeFilter !== 'all') {
        const absChange = Math.abs(event.priceChange);
        if (magnitudeFilter === 'major' && absChange < 5) return false;
        if (magnitudeFilter === 'significant' && absChange < 2) return false;
      }

      // Time filter
      if (timeFilter !== 'all') {
        const eventDate = new Date(event.timestamp);
        const now = new Date();

        if (timeFilter === 'today') {
          const isToday = eventDate.toDateString() === now.toDateString();
          if (!isToday) return false;
        } else if (timeFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (eventDate < weekAgo) return false;
        }
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesPlayer =
          event.playerName.toLowerCase().includes(query) ||
          event.playerTeam.toLowerCase().includes(query);
        const matchesHeadline = event.reason?.headline
          ?.toLowerCase()
          .includes(query);
        if (!matchesPlayer && !matchesHeadline) return false;
      }

      return true;
    });
  }, [allEvents, typeFilter, magnitudeFilter, timeFilter, searchQuery]);

  // Calculate stats
  const stats = useMemo(
    () => ({
      total: filteredEvents.length,
      tds: filteredEvents.filter((e) => e.reason?.eventType === 'TD').length,
      ints: filteredEvents.filter((e) => e.reason?.eventType === 'INT').length,
      stats: filteredEvents.filter((e) => e.reason?.eventType === 'stats')
        .length,
      news: filteredEvents.filter((e) => e.reason?.type === 'news').length,
      trades: filteredEvents.filter((e) => e.reason?.type === 'league_trade')
        .length,
    }),
    [filteredEvents],
  );

  // Get/set trade quantity for an event
  const getTradeQuantity = (eventId) => tradeQuantities[eventId] || 1;
  const setTradeQuantity = (eventId, qty) => {
    setTradeQuantities((prev) => ({ ...prev, [eventId]: Math.max(1, qty) }));
  };

  // Handle buy
  const handleBuy = (event) => {
    const player = getPlayer(event.playerId);
    if (!player) return;

    const quantity = getTradeQuantity(event.id);
    const cost = player.currentPrice * quantity;

    if (cost > cash) {
      addToast('Insufficient funds for this purchase', 'error');
      return;
    }

    if (buyShares(event.playerId, quantity)) {
      addToast(
        `Bought ${quantity} share${quantity > 1 ? 's' : ''} of ${event.playerName} for $${cost.toFixed(2)}`,
        'success',
      );
      setSelectedEvent(null);
      setTradeQuantity(event.id, 1);
    }
  };

  // Handle sell
  const handleSell = (event) => {
    const player = getPlayer(event.playerId);
    if (!player) return;

    const holding = portfolio[event.playerId];
    if (!holding || holding.shares === 0) {
      addToast("You don't own any shares of this player", 'error');
      return;
    }

    const quantity = Math.min(getTradeQuantity(event.id), holding.shares);
    const proceeds = player.currentPrice * quantity;

    if (sellShares(event.playerId, quantity)) {
      addToast(
        `Sold ${quantity} share${quantity > 1 ? 's' : ''} of ${event.playerName} for $${proceeds.toFixed(2)}`,
        'success',
      );
      setSelectedEvent(null);
      setTradeQuantity(event.id, 1);
    }
  };

  return (
    <div className="timeline-page">
      {/* Header with Stats */}
      <div className="timeline-header">
        <div className="timeline-stats">
          <div className="stat-item">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Events</span>
          </div>
          <div className="stat-item td">
            <span className="stat-value">{stats.tds}</span>
            <span className="stat-label">TDs</span>
          </div>
          <div className="stat-item int">
            <span className="stat-value">{stats.ints}</span>
            <span className="stat-label">INTs</span>
          </div>
          <div className="stat-item stats-type">
            <span className="stat-value">{stats.stats}</span>
            <span className="stat-label">Stats</span>
          </div>
          <div className="stat-item news">
            <span className="stat-value">{stats.news}</span>
            <span className="stat-label">News</span>
          </div>
          <div className="stat-item trade">
            <span className="stat-value">{stats.trades}</span>
            <span className="stat-label">Trades</span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="timeline-filters">
          <div className="search-box">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="search-icon"
            >
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
            <input
              type="text"
              placeholder="Search players or headlines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              aria-label="Search players or headlines"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="timeline-type-filter" className="filter-label">
              Type
            </label>
            <select
              id="timeline-type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="filter-select"
            >
              {TYPE_FILTERS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="timeline-magnitude-filter" className="filter-label">
              Magnitude
            </label>
            <select
              id="timeline-magnitude-filter"
              value={magnitudeFilter}
              onChange={(e) => setMagnitudeFilter(e.target.value)}
              className="filter-select"
            >
              {MAGNITUDE_FILTERS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="timeline-time-filter" className="filter-label">
              Time
            </label>
            <select
              id="timeline-time-filter"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="filter-select"
            >
              {TIME_FILTERS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Timeline Track */}
      <div className="timeline-track">
        {filteredEvents.length === 0 ? (
          <div className="empty-state">No events match your filters</div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredEvents.map((event, idx) => {
              const typeColor = getEventColor(event.reason);
              const typeLabel = getEventTypeLabel(event.reason);
              const isSelected = selectedEvent === event.id;
              const isTD = event.reason?.eventType === 'TD';
              const isINT = event.reason?.eventType === 'INT';
              const player = getPlayer(event.playerId);
              const holding = portfolio[event.playerId];
              const quantity = getTradeQuantity(event.id);
              const isUp = event.priceChange >= 0;

              return (
                <motion.div
                  key={event.id}
                  className={`timeline-event ${isSelected ? 'selected' : ''} ${isTD ? 'is-td' : ''} ${isINT ? 'is-int' : ''}`}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, delay: idx * 0.01 }}
                  onClick={() => setSelectedEvent(isSelected ? null : event.id)}
                >
                  {/* Connecting line */}
                  {idx < filteredEvents.length - 1 && (
                    <div className="timeline-connector" />
                  )}

                  {/* Event marker */}
                  <div
                    className={`timeline-marker ${isTD ? 'marker-td' : ''} ${isINT ? 'marker-int' : ''}`}
                    style={{ backgroundColor: typeColor }}
                  >
                    {/* TD - Star */}
                    {isTD && (
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        width="14"
                        height="14"
                      >
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    )}
                    {/* INT - X */}
                    {isINT && (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        width="12"
                        height="12"
                      >
                        <path d="M6 6L18 18M18 6L6 18" />
                      </svg>
                    )}
                    {/* News - Document */}
                    {!isTD && !isINT && event.reason?.type === 'news' && (
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        width="12"
                        height="12"
                      >
                        <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                      </svg>
                    )}
                    {/* Game Event (stats) - Bar chart */}
                    {!isTD && !isINT && event.reason?.type === 'game_event' && (
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        width="12"
                        height="12"
                      >
                        <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z" />
                      </svg>
                    )}
                    {/* Trade - Arrows */}
                    {!isTD &&
                      !isINT &&
                      event.reason?.type === 'league_trade' && (
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          width="12"
                          height="12"
                        >
                          <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
                        </svg>
                      )}
                  </div>

                  {/* Event content card */}
                  <div className="timeline-event-content">
                    <div className="timeline-event-header">
                      <span className="timeline-time">
                        {formatTime(event.timestamp)}
                      </span>
                      <Link
                        to={`/player/${event.playerId}`}
                        className="timeline-player-badge"
                        style={{ borderColor: typeColor }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {event.playerName}
                      </Link>
                      <span
                        className="timeline-type-badge"
                        style={{
                          backgroundColor: `${typeColor}25`,
                          color: typeColor,
                        }}
                      >
                        {typeLabel}
                      </span>
                    </div>

                    <div className="timeline-headline">
                      {event.reason?.headline || 'Market update'}
                    </div>

                    <div className="timeline-price-row">
                      <span className="timeline-price">
                        ${event.price.toFixed(2)}
                      </span>
                      <span
                        className={`timeline-change ${isUp ? 'up' : 'down'}`}
                      >
                        {isUp ? '▲' : '▼'}{' '}
                        {Math.abs(event.priceChange).toFixed(2)}%
                      </span>
                    </div>

                    {/* Expanded trade section */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          className="timeline-event-details"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                        >
                          {/* Trade details for league_trade events */}
                          {event.reason?.type === 'league_trade' && (
                            <div className="detail-row">
                              <span>Trade</span>
                              <span>
                                {event.reason.memberId} {event.reason.action}{' '}
                                {event.reason.shares} shares
                              </span>
                            </div>
                          )}

                          {/* Content links */}
                          {event.content?.length > 0 && (
                            <div className="timeline-content-list">
                              <span className="content-label">Related:</span>
                              {event.content.map((c, i) => (
                                <a
                                  key={i}
                                  href={c.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`content-badge type-${c.type}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {c.type}: {c.title}
                                </a>
                              ))}
                            </div>
                          )}

                          {/* Inline trade widget */}
                          <div className="inline-trade-widget">
                            <div className="trade-quantity">
                              <button
                                className="qty-btn"
                                aria-label="Decrease quantity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTradeQuantity(event.id, quantity - 1);
                                }}
                              >
                                −
                              </button>
                              <input
                                type="number"
                                value={quantity}
                                onChange={(e) =>
                                  setTradeQuantity(
                                    event.id,
                                    parseInt(e.target.value) || 1,
                                  )
                                }
                                onClick={(e) => e.stopPropagation()}
                                min="1"
                                className="qty-input"
                                aria-label="Trade quantity"
                              />
                              <button
                                className="qty-btn"
                                aria-label="Increase quantity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTradeQuantity(event.id, quantity + 1);
                                }}
                              >
                                +
                              </button>
                            </div>
                            <div className="trade-buttons">
                              <button
                                className="trade-btn buy"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBuy(event);
                                }}
                                disabled={
                                  !player ||
                                  player.currentPrice * quantity > cash
                                }
                              >
                                Buy $
                                {player
                                  ? (player.currentPrice * quantity).toFixed(2)
                                  : '—'}
                              </button>
                              <button
                                className="trade-btn sell"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSell(event);
                                }}
                                disabled={!holding || holding.shares === 0}
                              >
                                Sell {holding ? `(${holding.shares})` : '(0)'}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
