import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Customized,
} from 'recharts';
import { useTrading } from '../../context/TradingContext';
import { useSocial } from '../../context/SocialContext';
import { EventMarkerPopup, getEventConfig } from '../../shared';
import { useToast } from '../../components';
import { getPlayerNewsUrls, getTeamNewsUrl } from '../../utils/espnUrls';
import { getPlayerHeadshotUrl } from '../../utils/playerImages';
import './PlayerDetail.css';

// Event type colors (matching ScenarioInspector)
const EVENT_TYPE_COLORS = {
  TD: '#00C853',
  INT: '#FF1744',
  stats: '#00BCD4',
  news: '#2196F3',
  trade: '#9C27B0',
  league_trade: '#9C27B0',
  injury: '#FF9800',
  default: '#666666',
};

const REASON_TYPE_COLORS = {
  game_event: '#00BCD4',
  news: '#2196F3',
  league_trade: '#9C27B0',
  unknown: '#666666',
};

// Map reason types to event config types
function getReasonEventType(reason) {
  if (!reason) return 'default';

  if (reason.type === 'game_event') {
    return reason.eventType || 'stats';
  } else if (reason.type === 'news') {
    return 'news';
  } else if (reason.type === 'league_trade') {
    return 'trade';
  }

  return 'default';
}

// Get display label for event type
function getEventTypeLabel(reason) {
  if (!reason) return 'Event';

  if (reason.type === 'game_event') {
    return reason.eventType || 'STATS';
  } else if (reason.type === 'news') {
    return 'NEWS';
  } else if (reason.type === 'league_trade') {
    return 'TRADE';
  }

  return 'EVENT';
}

export default function PlayerDetail() {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const { getPlayer, portfolio, buyShares, sellShares } = useTrading();
  const { addToWatchlist, removeFromWatchlist, isWatching, getLeagueHoldings } =
    useSocial();
  const { addToast } = useToast();

  const [buyAmount, setBuyAmount] = useState(1);
  const [sellAmount, setSellAmount] = useState(1);
  const [activeTab, setActiveTab] = useState('buy');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [imageError, setImageError] = useState(false);
  const [playerNewsUrls, setPlayerNewsUrls] = useState({});
  const chartContainerRef = useRef(null);

  useEffect(() => {
    getPlayerNewsUrls().then(setPlayerNewsUrls);
  }, []);

  const player = getPlayer(playerId);
  const holding = portfolio[playerId];
  const watching = isWatching(playerId);
  const leagueHoldings = getLeagueHoldings(playerId);

  const handleTradeTabKeyDown = useCallback((e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const tabs = Array.from(
      e.currentTarget.querySelectorAll('[role="tab"]:not([disabled])'),
    );
    const currentIndex = tabs.indexOf(document.activeElement);
    if (currentIndex === -1) return;

    e.preventDefault();
    let nextIndex;
    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % tabs.length;
    } else {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    }
    tabs[nextIndex].focus();
  }, []);

  if (!player) {
    return (
      <div className="player-detail-page">
        <div className="error-state">
          <h2>Player Not Found</h2>
          <p>This player doesn't exist in the current scenario.</p>
          <button onClick={() => navigate('/market')} className="back-button">
            Back to Market
          </button>
        </div>
      </div>
    );
  }

  // Generate chart data from new priceHistory format
  const chartData =
    player.priceHistory?.map((entry, i) => ({
      time: i,
      price: entry.price,
      timestamp: entry.timestamp,
      reason: entry.reason,
      content: entry.content,
    })) || [];

  // Format date for x-axis labels (e.g., "Nov 5")
  const formatDateLabel = (index) => {
    const entry = chartData[index];
    if (!entry?.timestamp) return '';
    const date = new Date(entry.timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Calculate tick interval to show ~5 labels
  const xAxisInterval = Math.max(0, Math.floor((chartData.length - 1) / 4));

  // Handle event marker click - now using PriceChange format
  const handleEventClick = (priceEntry, cx, cy) => {
    setPopupPosition({ x: cx, y: cy + 20 });
    // Convert to event format expected by popup
    const eventForPopup = {
      type: getReasonEventType(priceEntry.reason),
      headline: priceEntry.reason?.headline || '',
      source: priceEntry.reason?.source || '',
      url: priceEntry.reason?.url || '',
      price: priceEntry.price,
      timestamp: priceEntry.timestamp,
      // Include trade info if available
      memberId: priceEntry.reason?.memberId,
      action: priceEntry.reason?.action,
      shares: priceEntry.reason?.shares,
    };
    setSelectedEvent(eventForPopup);
  };

  const closeEventPopup = () => {
    setSelectedEvent(null);
  };

  // SVG paths for chart markers (scaled for 10px radius marker)
  const markerPaths = {
    TD: 'M0 -5L1.5 -1.5L5.5 -0.8L2.5 2L3.1 6L0 4.2L-3.1 6L-2.5 2L-5.5 -0.8L-1.5 -1.5Z', // star
    INT: 'M-4 -4L4 4M4 -4L-4 4', // X
    injury: 'M-1.5 -5V5M-5 -1.5H5', // plus
    trade: 'M-4 1L0 -3L4 1M-4 -1L0 3L4 -1', // arrows
    league_trade: 'M-4 3L0 -3L4 3', // up arrow
    news: 'M-4 -4H4V4H-4ZM-2 -1H2M-2 1H2', // document
    earnings: 'M0 -5V5M-3 -3H2M-2 0H3M-3 3H2', // $
    stats: 'M-4 5V0M0 5V-3M4 5V-5', // bar chart
    game_event: 'M0 -4A6 4 0 0 1 0 4A6 4 0 0 1 0 -4', // football
    default: '', // just circle
  };

  // Custom event marker shape component
  const EventMarker = ({ cx, cy, priceEntry }) => {
    const eventType = getReasonEventType(priceEntry.reason);
    const config = getEventConfig(eventType);
    const path = markerPaths[eventType] || markerPaths.default;
    const isStroke = ['INT', 'injury', 'news', 'stats'].includes(eventType);

    return (
      <g
        style={{ cursor: 'pointer' }}
        onClick={() => handleEventClick(priceEntry, cx, cy)}
        transform={`translate(${cx}, ${cy})`}
      >
        <circle
          cx={0}
          cy={0}
          r={10}
          fill={config.color}
          stroke="#1A1A1A"
          strokeWidth={2}
        />
        {path && (
          <path
            d={path}
            fill={isStroke ? 'none' : '#fff'}
            stroke={isStroke ? '#fff' : 'none'}
            strokeWidth={isStroke ? 1.5 : 0}
            strokeLinecap="round"
            style={{ pointerEvents: 'none' }}
          />
        )}
      </g>
    );
  };

  const handleBuy = () => {
    const cost = player.currentPrice * buyAmount;
    if (buyShares(playerId, buyAmount)) {
      addToast(
        `Purchased ${buyAmount} share${buyAmount > 1 ? 's' : ''} of ${player.name} for $${cost.toFixed(2)}`,
        'success',
      );
      setBuyAmount(1);
    } else {
      addToast('Insufficient funds for this purchase', 'error');
    }
  };

  const handleSell = () => {
    const proceeds = player.currentPrice * sellAmount;
    if (sellShares(playerId, sellAmount)) {
      addToast(
        `Sold ${sellAmount} share${sellAmount > 1 ? 's' : ''} of ${player.name} for $${proceeds.toFixed(2)}`,
        'success',
      );
      setSellAmount(1);
    } else {
      addToast('Unable to complete sale', 'error');
    }
  };

  const handleWatchlistToggle = () => {
    if (watching) {
      removeFromWatchlist(playerId);
      addToast(`Removed ${player.name} from watchlist`, 'info');
    } else {
      addToWatchlist(playerId);
      addToast(`Added ${player.name} to watchlist`, 'success');
    }
  };

  const isUp = player.changePercent >= 0;

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="player-detail-page">
      <button onClick={() => navigate(-1)} className="back-link">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
        Back
      </button>

      <div className="player-header">
        <div className="player-header-left">
          <div className="player-avatar">
            {getPlayerHeadshotUrl(playerId, 'large') && !imageError ? (
              <img
                src={getPlayerHeadshotUrl(playerId, 'large')}
                alt={player.name}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="avatar-placeholder">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            )}
          </div>
          <div className="player-info">
            <div className="player-meta">
              <span className="player-team-badge">{player.team}</span>
              <span className="player-position">{player.position}</span>
            </div>
            <h1 className="player-name">{player.name}</h1>
          </div>
        </div>

        <div className="player-price-section">
          <div className={`player-price ${isUp ? 'up' : 'down'}`}>
            <span className="price-value">
              ${player.currentPrice.toFixed(2)}
            </span>
            <span
              className={`price-change ${isUp ? 'text-up' : 'text-down'}`}
              aria-label={`${isUp ? 'Up' : 'Down'} ${Math.abs(player.changePercent).toFixed(2)} percent`}
            >
              {isUp ? '▲' : '▼'} {Math.abs(player.changePercent).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      <div className="player-content">
        <div className="main-column">
          {/* Price Chart */}
          <motion.div
            className="chart-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3>Price History</h3>
            <div className="chart-container" ref={chartContainerRef}>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                >
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#666', fontSize: 11 }}
                    tickFormatter={formatDateLabel}
                    interval={xAxisInterval}
                  />
                  <YAxis
                    domain={['dataMin - 5', 'dataMax + 5']}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#666', fontSize: 12 }}
                    width={50}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1A1A1A',
                      border: '1px solid #333',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ display: 'none' }}
                    formatter={(value, name, props) => {
                      const entry = props.payload;
                      return [
                        `$${value.toFixed(2)}`,
                        entry.reason?.headline
                          ? entry.reason.headline.substring(0, 40) + '...'
                          : 'Price',
                      ];
                    }}
                  />
                  <ReferenceLine
                    y={player.basePrice}
                    stroke="#666"
                    strokeDasharray="3 3"
                  />
                  <Line
                    type="linear"
                    dataKey="price"
                    stroke={isUp ? '#00C853' : '#FF1744'}
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: isUp ? '#00C853' : '#FF1744' }}
                  />
                  {/* Event markers for significant price changes */}
                  <Customized
                    component={({ xAxisMap, yAxisMap }) => {
                      const xAxis = xAxisMap && Object.values(xAxisMap)[0];
                      const yAxis = yAxisMap && Object.values(yAxisMap)[0];
                      if (!xAxis?.scale || !yAxis?.scale) return null;

                      return (
                        <g className="event-markers">
                          {chartData.map((entry, idx) => {
                            // Only show markers for significant events (not baseline entries)
                            const reason = entry.reason;
                            if (
                              !reason ||
                              (reason.type === 'news' &&
                                reason.headline?.includes('baseline'))
                            ) {
                              return null;
                            }

                            // Show markers for game events or significant news
                            const showMarker =
                              reason.type === 'game_event' ||
                              (reason.type === 'news' && reason.eventType) ||
                              reason.type === 'league_trade';

                            if (!showMarker) return null;

                            const cx = xAxis.scale(entry.time);
                            const cy = yAxis.scale(entry.price);

                            if (isNaN(cx) || isNaN(cy)) return null;

                            return (
                              <EventMarker
                                key={idx}
                                cx={cx}
                                cy={cy}
                                priceEntry={entry}
                              />
                            );
                          })}
                        </g>
                      );
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
              {selectedEvent && (
                <EventMarkerPopup
                  event={selectedEvent}
                  position={popupPosition}
                  onClose={closeEventPopup}
                />
              )}
            </div>
          </motion.div>

          {/* Move Reason */}
          <motion.div
            className="reason-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3>Why Did This Move?</h3>
            <p className="move-reason">{player.moveReason}</p>
          </motion.div>

          {/* Content Tiles - now pulled from priceHistory */}
          {player.contentTiles && player.contentTiles.length > 0 && (
            <motion.div
              className="content-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3>Related Content</h3>
              <div className="content-tiles">
                {player.contentTiles.map((tile, i) => (
                  <a
                    key={i}
                    href={tile.url}
                    className="content-tile"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className={`tile-type ${tile.type}`}>
                      {tile.type}
                    </span>
                    <span className="tile-title">{tile.title}</span>
                    <span className="tile-source">{tile.source}</span>
                  </a>
                ))}
              </div>
            </motion.div>
          )}

          {/* Price History Timeline */}
          <motion.div
            className="timeline-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3>Price Changes</h3>
            <div className="price-timeline">
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
                  chartData[chartData.length - 1 - i - 1]?.price ||
                  player.basePrice;
                const priceDiff = entry.price - prevPrice;
                const isPositive = priceDiff >= 0;

                // Get URL from entry, or fallback to player's ESPN news page
                const entryUrl =
                  entry.reason?.url && entry.reason.url !== '#'
                    ? entry.reason.url
                    : entry.reason?.type === 'news' ||
                        entry.reason?.type === 'game_event'
                      ? playerNewsUrls[player.id] || null
                      : null;

                return (
                  <div
                    key={i}
                    className={`timeline-entry ${isTD ? 'is-td' : ''} ${isINT ? 'is-int' : ''}`}
                  >
                    {/* Connector line */}
                    {i < arr.length - 1 && (
                      <div className="timeline-connector" />
                    )}

                    {/* Event marker with inline SVG */}
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
                      {!isTD && !isINT && reasonType === 'news' && (
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
                      {!isTD && !isINT && reasonType === 'game_event' && (
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          width="12"
                          height="12"
                        >
                          <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z" />
                        </svg>
                      )}
                      {/* Trade - Chart */}
                      {!isTD && !isINT && reasonType === 'league_trade' && (
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

                    {/* Event card */}
                    <div className="timeline-entry-card">
                      <div className="timeline-entry-header">
                        <span className="timeline-time-badge">
                          {formatTimestamp(entry.timestamp)}
                        </span>
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

                      {entryUrl ? (
                        <a
                          href={entryUrl}
                          className="timeline-headline timeline-headline-link"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {entry.reason?.headline}
                          <span className="link-icon">↗</span>
                        </a>
                      ) : (
                        <p className="timeline-headline">
                          {entry.reason?.headline}
                        </p>
                      )}

                      <div
                        className={`timeline-price-display ${isPositive ? 'up' : 'down'}`}
                      >
                        ${entry.price.toFixed(2)}
                        {i < arr.length - 1 && (
                          <span className="price-diff">
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
        </div>

        <div className="sidebar-column">
          {/* Trading Card */}
          <motion.div
            className="trading-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus */}
            <div
              className="trading-tabs"
              role="tablist"
              aria-label="Trade type"
              onKeyDown={handleTradeTabKeyDown}
            >
              <button
                className={`trading-tab ${activeTab === 'buy' ? 'active' : ''}`}
                role="tab"
                aria-selected={activeTab === 'buy'}
                tabIndex={activeTab === 'buy' ? 0 : -1}
                onClick={() => setActiveTab('buy')}
              >
                Buy
              </button>
              <button
                className={`trading-tab ${activeTab === 'sell' ? 'active' : ''}`}
                role="tab"
                aria-selected={activeTab === 'sell'}
                tabIndex={activeTab === 'sell' ? 0 : -1}
                onClick={() => setActiveTab('sell')}
                disabled={!holding}
              >
                Sell
              </button>
            </div>

            {activeTab === 'buy' ? (
              <div className="trading-form">
                <label className="form-label">
                  Shares
                  <input
                    type="number"
                    min="1"
                    value={buyAmount}
                    onChange={(e) =>
                      setBuyAmount(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="form-input"
                  />
                </label>
                <div className="order-summary">
                  <span>Estimated Cost</span>
                  <span className="order-total">
                    ${(player.currentPrice * buyAmount).toFixed(2)}
                  </span>
                </div>
                <button className="trade-button buy" onClick={handleBuy}>
                  Buy {buyAmount} Share{buyAmount > 1 ? 's' : ''}
                </button>
              </div>
            ) : (
              <div className="trading-form">
                <label className="form-label">
                  Shares (You own {holding?.shares || 0})
                  <input
                    type="number"
                    min="1"
                    max={holding?.shares || 0}
                    value={sellAmount}
                    onChange={(e) =>
                      setSellAmount(
                        Math.max(
                          1,
                          Math.min(
                            holding?.shares || 1,
                            parseInt(e.target.value) || 1,
                          ),
                        ),
                      )
                    }
                    className="form-input"
                  />
                </label>
                <div className="order-summary">
                  <span>Estimated Proceeds</span>
                  <span className="order-total">
                    ${(player.currentPrice * sellAmount).toFixed(2)}
                  </span>
                </div>
                <button className="trade-button sell" onClick={handleSell}>
                  Sell {sellAmount} Share{sellAmount > 1 ? 's' : ''}
                </button>
              </div>
            )}
          </motion.div>

          {/* Holdings Card */}
          {holding && (
            <motion.div
              className="holdings-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h4>Your Position</h4>
              <div className="holdings-stats">
                <div className="holdings-stat">
                  <span className="stat-label">Shares</span>
                  <span className="stat-value">{holding.shares}</span>
                </div>
                <div className="holdings-stat">
                  <span className="stat-label">Avg Cost</span>
                  <span className="stat-value">
                    ${holding.avgCost.toFixed(2)}
                  </span>
                </div>
                <div className="holdings-stat">
                  <span className="stat-label">Market Value</span>
                  <span className="stat-value">
                    ${(player.currentPrice * holding.shares).toFixed(2)}
                  </span>
                </div>
                <div className="holdings-stat">
                  <span className="stat-label">P/L</span>
                  <span
                    className={`stat-value ${player.currentPrice - holding.avgCost >= 0 ? 'text-up' : 'text-down'}`}
                    aria-label={`${player.currentPrice - holding.avgCost >= 0 ? 'Gain' : 'Loss'} of $${Math.abs((player.currentPrice - holding.avgCost) * holding.shares).toFixed(2)}`}
                  >
                    {player.currentPrice - holding.avgCost >= 0 ? '▲ +' : '▼ '}
                    $
                    {Math.abs(
                      (player.currentPrice - holding.avgCost) * holding.shares,
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Watchlist Button */}
          <button
            className={`watchlist-button ${watching ? 'watching' : ''}`}
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

          {/* League Owners */}
          {leagueHoldings.length > 0 && (
            <motion.div
              className="league-owners-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h4>League Owners ({leagueHoldings.length})</h4>
              <div className="league-owners-list">
                {leagueHoldings.map((holder) => (
                  <div
                    key={holder.memberId}
                    className={`league-owner-row ${holder.isUser ? 'is-user' : ''}`}
                  >
                    <div className="owner-info">
                      <span className="owner-avatar">
                        {holder.isUser ? '👤' : holder.avatar}
                      </span>
                      <span className="owner-name">{holder.name}</span>
                    </div>
                    <div className="owner-stats">
                      <span className="owner-shares">
                        {holder.shares} shares
                      </span>
                    <span
                      className={`owner-gain ${holder.gainPercent >= 0 ? 'text-up' : 'text-down'}`}
                      aria-label={`${holder.gainPercent >= 0 ? 'Gain' : 'Loss'} ${Math.abs(holder.gainPercent).toFixed(1)} percent`}
                    >
                      {holder.gainPercent >= 0 ? '▲ +' : '▼ '}
                      {holder.gainPercent.toFixed(1)}%
                    </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
