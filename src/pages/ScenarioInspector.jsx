import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import midweekData from '../data/midweek.json';
import liveData from '../data/live.json';
import playoffsData from '../data/playoffs.json';
import AddEventModal from '../components/AddEventModal';
import './ScenarioInspector.css';

const scenarioSources = {
  midweek: midweekData,
  live: liveData,
  playoffs: playoffsData,
};

const TEMPLATES = {
  priceChange: {
    timestamp: '2025-12-09T20:00:00',
    price: 0.0,
    reason: {
      type: 'game_event',
      eventType: 'stats',
      headline: '',
      source: '',
      url: '',
    },
    content: [],
  },
  leagueTrade: {
    timestamp: '2025-12-09T20:00:00',
    price: 0.0,
    reason: {
      type: 'league_trade',
      headline: 'Member bought X shares',
      source: 'McQueen Market',
      memberId: '',
      action: 'buy',
      shares: 1,
    },
  },
};

// Map reason types to display colors
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

export default function ScenarioInspector() {
  const [selectedScenario, setSelectedScenario] = useState('live');
  const [viewMode, setViewMode] = useState('full'); // 'full', 'player', or 'timeline'
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [jsonText, setJsonText] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [jsonError, setJsonError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    metadata: true,
    players: true,
  });
  const [expandedPlayers, setExpandedPlayers] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [dividerPosition, setDividerPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [highlightedLine, setHighlightedLine] = useState(null);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [modalPreselectedPlayerId, setModalPreselectedPlayerId] =
    useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const editorRef = useRef(null);
  const textareaRef = useRef(null);

  // Load scenario data
  useEffect(() => {
    const data = scenarioSources[selectedScenario];
    const text = JSON.stringify(data, null, 2);
    setJsonText(text);
    setParsedData(data);
    setJsonError(null);
    setSelectedPlayerId(data.players?.[0]?.id || null);
  }, [selectedScenario]);

  // Parse JSON on text change
  const handleJsonChange = useCallback((e) => {
    const text = e.target.value;
    setJsonText(text);

    try {
      const parsed = JSON.parse(text);
      setParsedData(parsed);
      setJsonError(null);
    } catch (err) {
      setJsonError(err.message);
    }
  }, []);

  // Copy to clipboard helper
  const copyToClipboard = useCallback(async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  // Toggle section expansion
  const toggleSection = useCallback((section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  // Toggle player expansion
  const togglePlayer = useCallback((playerId) => {
    setExpandedPlayers((prev) => ({
      ...prev,
      [playerId]: !prev[playerId],
    }));
  }, []);

  // Scroll to JSON location
  const scrollToJson = useCallback(
    (searchPattern, options = {}) => {
      if (!jsonText) return;

      const lines = jsonText.split('\n');
      let targetLine = -1;

      // Find the line containing the search pattern
      if (typeof searchPattern === 'string') {
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(searchPattern)) {
            targetLine = i;
            break;
          }
        }
      } else if (searchPattern instanceof RegExp) {
        for (let i = 0; i < lines.length; i++) {
          if (searchPattern.test(lines[i])) {
            targetLine = i;
            break;
          }
        }
      }

      // For finding nth occurrence
      if (options.occurrence && options.occurrence > 1) {
        let count = 0;
        for (let i = 0; i < lines.length; i++) {
          const matches =
            typeof searchPattern === 'string'
              ? lines[i].includes(searchPattern)
              : searchPattern.test(lines[i]);
          if (matches) {
            count++;
            if (count === options.occurrence) {
              targetLine = i;
              break;
            }
          }
        }
      }

      if (targetLine >= 0) {
        setHighlightedLine(targetLine);

        if (editorRef.current) {
          const lineHeight = 19.5;
          const scrollTop = Math.max(0, targetLine * lineHeight - 100);
          editorRef.current.scrollTop = scrollTop;
        }

        if (textareaRef.current) {
          const lineHeight = 19.5;
          const scrollTop = Math.max(0, targetLine * lineHeight - 100);
          textareaRef.current.scrollTop = scrollTop;
        }

        setTimeout(() => setHighlightedLine(null), 2000);
      }
    },
    [jsonText],
  );

  // Find player's line in JSON
  const scrollToPlayer = useCallback(
    (playerId) => {
      scrollToJson(`"id": "${playerId}"`);
    },
    [scrollToJson],
  );

  // Find priceHistory entry in JSON (within a specific player)
  const scrollToPriceEntry = useCallback(
    (playerId, entryIndex) => {
      const lines = jsonText.split('\n');
      let inPlayer = false;
      let inPriceHistory = false;
      let entryCount = 0;
      let bracketDepth = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Find the player
        if (line.includes(`"id": "${playerId}"`)) {
          inPlayer = true;
        }

        if (inPlayer) {
          // Track if we enter priceHistory array
          if (line.includes('"priceHistory"')) {
            inPriceHistory = true;
            bracketDepth = 0;
          }

          if (inPriceHistory) {
            // Count opening braces for priceHistory entries
            if (line.includes('{')) {
              if (bracketDepth > 0) {
                if (entryCount === entryIndex) {
                  setHighlightedLine(i);
                  if (editorRef.current) {
                    const lineHeight = 19.5;
                    editorRef.current.scrollTop = Math.max(
                      0,
                      i * lineHeight - 100,
                    );
                  }
                  if (textareaRef.current) {
                    const lineHeight = 19.5;
                    textareaRef.current.scrollTop = Math.max(
                      0,
                      i * lineHeight - 100,
                    );
                  }
                  setTimeout(() => setHighlightedLine(null), 2000);
                  return;
                }
                entryCount++;
              }
              bracketDepth++;
            }
            if (line.includes('}')) bracketDepth--;

            // Exit priceHistory array
            if (line.includes(']') && bracketDepth <= 0) {
              inPriceHistory = false;
            }
          }

          // Exit player if we hit next player or end of players array
          if (line.includes('"id":') && !line.includes(playerId) && inPlayer) {
            break;
          }
        }
      }
    },
    [jsonText],
  );

  // Scroll to metadata field
  const scrollToMetadata = useCallback(
    (field) => {
      scrollToJson(`"${field}":`);
    },
    [scrollToJson],
  );

  // Open Add Event modal
  const openAddEventModal = useCallback((playerId = null) => {
    setModalPreselectedPlayerId(playerId);
    setIsAddEventModalOpen(true);
  }, []);

  // Close Add Event modal
  const closeAddEventModal = useCallback(() => {
    setIsAddEventModalOpen(false);
    setModalPreselectedPlayerId(null);
  }, []);

  // Add event to a player's priceHistory
  const handleAddEvent = useCallback(
    async ({ playerId, entry }) => {
      if (!parsedData || !playerId || !entry) return;

      // Create updated data
      const updatedData = {
        ...parsedData,
        players: parsedData.players.map((player) => {
          if (player.id !== playerId) return player;

          // Add entry to priceHistory in chronological order
          const newHistory = [...(player.priceHistory || []), entry];
          newHistory.sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
          );

          return {
            ...player,
            priceHistory: newHistory,
          };
        }),
      };

      // Update local state
      const newJsonText = JSON.stringify(updatedData, null, 2);
      setJsonText(newJsonText);
      setParsedData(updatedData);

      // Save to file via dev server
      await saveScenarioToFile(selectedScenario, updatedData);

      closeAddEventModal();
    },
    [parsedData, selectedScenario, closeAddEventModal],
  );

  // Save scenario to JSON file
  const saveScenarioToFile = useCallback(async (scenario, data) => {
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const response = await fetch('/api/save-scenario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scenario, data }),
      });

      const result = await response.json();

      if (response.ok) {
        setSaveStatus({
          type: 'success',
          message: `Saved to ${scenario}.json`,
        });
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setSaveStatus({
          type: 'error',
          message: result.error || 'Failed to save',
        });
      }
    } catch (err) {
      setSaveStatus({ type: 'error', message: err.message });
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Handle divider drag
  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const container = document.querySelector('.inspector-panels');
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const percentage = ((e.clientX - rect.left) / rect.width) * 100;
      setDividerPosition(Math.min(Math.max(percentage, 20), 80));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Get current view data
  const getViewData = useCallback(() => {
    if (!parsedData) return null;

    if (viewMode === 'player' && selectedPlayerId) {
      const player = parsedData.players?.find((p) => p.id === selectedPlayerId);
      return player || null;
    }

    return parsedData;
  }, [parsedData, viewMode, selectedPlayerId]);

  const viewData = getViewData();
  const players = parsedData?.players || [];

  // Build unified timeline from all players' priceHistory
  const unifiedTimeline = useMemo(() => {
    if (!parsedData?.players) return [];

    const timeline = [];
    parsedData.players.forEach((player) => {
      if (player.priceHistory) {
        player.priceHistory.forEach((entry, index) => {
          timeline.push({
            playerId: player.id,
            playerName: player.name,
            playerTeam: player.team,
            playerPosition: player.position,
            entryIndex: index,
            timestamp: entry.timestamp,
            price: entry.price,
            reason: entry.reason,
            content: entry.content,
          });
        });
      }
    });

    // Sort by timestamp
    timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return timeline;
  }, [parsedData]);

  return (
    <div className="scenario-inspector">
      {/* Header */}
      <header className="inspector-header">
        <div className="inspector-title">
          <span className="inspector-icon">🔍</span>
          <h1>Scenario Inspector</h1>
        </div>

        <div className="inspector-controls">
          {/* Scenario Selector */}
          <div className="control-group">
            <label htmlFor="inspector-scenario">Scenario</label>
            <select
              id="inspector-scenario"
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
            >
              <option value="midweek">Midweek</option>
              <option value="live">Live Game</option>
              <option value="playoffs">Playoffs</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="control-group">
            <span id="inspector-view-label" className="control-label">View</span>
            <div
              className="toggle-buttons"
              role="group"
              aria-labelledby="inspector-view-label"
            >
              <button
                className={viewMode === 'full' ? 'active' : ''}
                onClick={() => setViewMode('full')}
              >
                Full Scenario
              </button>
              <button
                className={viewMode === 'player' ? 'active' : ''}
                onClick={() => setViewMode('player')}
              >
                Single Player
              </button>
              <button
                className={viewMode === 'timeline' ? 'active' : ''}
                onClick={() => setViewMode('timeline')}
              >
                Timeline
              </button>
            </div>
          </div>

          {/* Player Selector (only in player mode) */}
          {viewMode === 'player' && (
            <div className="control-group">
              <label htmlFor="inspector-player">Player</label>
              <select
                id="inspector-player"
                value={selectedPlayerId || ''}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
              >
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name} ({player.team})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Templates Bar */}
        <div className="templates-bar">
          <span className="templates-label">Templates:</span>
          <button
            className={`template-btn ${copiedId === 'tpl-pricechange' ? 'copied' : ''}`}
            onClick={() =>
              copyToClipboard(
                JSON.stringify(TEMPLATES.priceChange, null, 2),
                'tpl-pricechange',
              )
            }
          >
            {copiedId === 'tpl-pricechange' ? '✓ Copied!' : '📋 PriceChange'}
          </button>
          <button
            className={`template-btn ${copiedId === 'tpl-leaguetrade' ? 'copied' : ''}`}
            onClick={() =>
              copyToClipboard(
                JSON.stringify(TEMPLATES.leagueTrade, null, 2),
                'tpl-leaguetrade',
              )
            }
          >
            {copiedId === 'tpl-leaguetrade' ? '✓ Copied!' : '📋 League Trade'}
          </button>
        </div>
      </header>

      {/* Main Panels */}
      <div className={`inspector-panels ${isDragging ? 'dragging' : ''}`}>
        {/* JSON Editor Panel */}
        <div className="editor-panel" style={{ width: `${dividerPosition}%` }}>
          <div className="panel-header">
            <h2>JSON Editor</h2>
            {jsonError && <span className="json-error">⚠️ {jsonError}</span>}
          </div>
          <div className="editor-wrapper" ref={editorRef}>
            <div className="line-numbers">
              {jsonText.split('\n').map((_, i) => (
                <div
                  key={i}
                  className={`line-number ${highlightedLine === i ? 'highlighted' : ''}`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <div className="editor-content">
              <textarea
                ref={textareaRef}
                className="json-editor"
                value={jsonText}
                onChange={handleJsonChange}
                spellCheck={false}
                style={{
                  height: `${jsonText.split('\n').length * 19.5 + 32}px`,
                }}
              />
              {highlightedLine !== null && (
                <div
                  className="line-highlight"
                  style={{ top: `${highlightedLine * 19.5 + 16}px` }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
        <div
          className="panel-divider"
          role="separator"
          aria-orientation="vertical"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          onMouseDown={handleMouseDown}
        >
          <div className="divider-handle" />
        </div>

        {/* Formatted View Panel */}
        <div
          className="formatted-panel"
          style={{ width: `${100 - dividerPosition}%` }}
        >
          <div className="panel-header">
            <h2>Formatted View</h2>
            <button
              className={`copy-full-btn ${copiedId === 'full' ? 'copied' : ''}`}
              onClick={() => copyToClipboard(jsonText, 'full')}
            >
              {copiedId === 'full' ? '✓ Copied!' : '📋 Copy Full JSON'}
            </button>
          </div>

          <div className="formatted-content">
            {viewMode === 'full' ? (
              <FullScenarioView
                data={parsedData}
                expandedSections={expandedSections}
                toggleSection={toggleSection}
                expandedPlayers={expandedPlayers}
                togglePlayer={togglePlayer}
                copyToClipboard={copyToClipboard}
                copiedId={copiedId}
                scrollToPlayer={scrollToPlayer}
                scrollToPriceEntry={scrollToPriceEntry}
                scrollToMetadata={scrollToMetadata}
                onAddEvent={openAddEventModal}
              />
            ) : viewMode === 'timeline' ? (
              <TimelineView
                timeline={unifiedTimeline}
                players={players}
                copyToClipboard={copyToClipboard}
                copiedId={copiedId}
                scrollToPriceEntry={scrollToPriceEntry}
                onAddEvent={openAddEventModal}
              />
            ) : (
              <PlayerDetailView
                player={viewData}
                copyToClipboard={copyToClipboard}
                copiedId={copiedId}
                scrollToPriceEntry={scrollToPriceEntry}
                onAddEvent={openAddEventModal}
              />
            )}
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      <AddEventModal
        isOpen={isAddEventModalOpen}
        onClose={closeAddEventModal}
        onSubmit={handleAddEvent}
        players={players}
        preselectedPlayerId={modalPreselectedPlayerId}
      />

      {/* Save Status Toast */}
      <AnimatePresence>
        {saveStatus && (
          <motion.div
            className={`save-toast ${saveStatus.type}`}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            {saveStatus.type === 'success' ? '✓' : '✕'} {saveStatus.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saving Overlay */}
      {isSaving && (
        <div className="saving-overlay">
          <div className="saving-spinner" />
          <span>Saving...</span>
        </div>
      )}
    </div>
  );
}

// Calculate change percent from priceHistory
function getChangePercent(player) {
  if (!player || !player.priceHistory || player.priceHistory.length === 0)
    return 0;
  const currentPrice =
    player.priceHistory[player.priceHistory.length - 1].price;
  const basePrice = player.basePrice;
  if (basePrice === 0) return 0;
  return ((currentPrice - basePrice) / basePrice) * 100;
}

// Get current price from priceHistory
function getCurrentPrice(player) {
  if (!player || !player.priceHistory || player.priceHistory.length === 0)
    return player?.basePrice || 0;
  return player.priceHistory[player.priceHistory.length - 1].price;
}

// Full Scenario View Component
function FullScenarioView({
  data,
  expandedSections,
  toggleSection,
  expandedPlayers,
  togglePlayer,
  copyToClipboard,
  copiedId,
  scrollToPlayer,
  scrollToPriceEntry,
  scrollToMetadata,
  onAddEvent,
}) {
  if (!data) return <div className="empty-state">No valid data</div>;

  return (
    <div className="full-scenario-view">
      {/* Metadata Section */}
      <section className="inspector-section">
        <button
          className="section-header"
          onClick={() => toggleSection('metadata')}
        >
          <span className="section-icon">
            {expandedSections.metadata ? '▼' : '▶'}
          </span>
          <span className="section-title">Scenario Metadata</span>
        </button>
        <AnimatePresence>
          {expandedSections.metadata && (
            <motion.div
              className="section-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <div className="metadata-grid">
                <button
                  type="button"
                  className="metadata-item clickable"
                  onClick={() => scrollToMetadata('scenario')}
                >
                  <span className="metadata-label">Scenario</span>
                  <span className="metadata-value">{data.scenario}</span>
                </button>
                <button
                  type="button"
                  className="metadata-item clickable"
                  onClick={() => scrollToMetadata('timestamp')}
                >
                  <span className="metadata-label">Timestamp</span>
                  <span className="metadata-value">{data.timestamp}</span>
                </button>
                <button
                  type="button"
                  className="metadata-item full-width clickable"
                  onClick={() => scrollToMetadata('headline')}
                >
                  <span className="metadata-label">Headline</span>
                  <span className="metadata-value">{data.headline}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Players Section */}
      <section className="inspector-section">
        <button
          className="section-header"
          onClick={() => toggleSection('players')}
        >
          <span className="section-icon">
            {expandedSections.players ? '▼' : '▶'}
          </span>
          <span className="section-title">
            Players ({data.players?.length || 0})
          </span>
        </button>
        <AnimatePresence>
          {expandedSections.players && (
            <motion.div
              className="section-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <div className="players-list">
                {data.players?.map((player, idx) => (
                  <PlayerCard
                    key={player.id || idx}
                    player={player}
                    isExpanded={expandedPlayers[player.id]}
                    onToggle={() => togglePlayer(player.id)}
                    copyToClipboard={copyToClipboard}
                    copiedId={copiedId}
                    onScrollToPlayer={() => scrollToPlayer(player.id)}
                    onScrollToPriceEntry={(entryIdx) =>
                      scrollToPriceEntry(player.id, entryIdx)
                    }
                    onAddEvent={() => onAddEvent(player.id)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}

// Player Card Component
function PlayerCard({
  player,
  isExpanded,
  onToggle,
  copyToClipboard,
  copiedId,
  onScrollToPlayer,
  onScrollToPriceEntry,
  onAddEvent,
}) {
  const changePercent = getChangePercent(player);
  const currentPrice = getCurrentPrice(player);
  const changeClass = changePercent >= 0 ? 'up' : 'down';

  const handleHeaderClick = (e) => {
    if (e.target.closest('.locate-btn') || e.target.closest('.add-event-btn'))
      return;
    onToggle();
  };

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
    <div className="player-card">
      <button className="player-header" onClick={handleHeaderClick}>
        <div className="player-info">
          <span className="player-name">{player.name}</span>
          <span className="player-meta">
            {player.team} • {player.position}
          </span>
        </div>
        <div className="player-price">
          <span className="base-price">${currentPrice.toFixed(2)}</span>
          <span className={`change-percent ${changeClass}`}>
            {changePercent >= 0 ? '+' : ''}
            {changePercent.toFixed(2)}%
          </span>
        </div>
        <button
          type="button"
          className="locate-btn"
          onClick={(e) => {
            e.stopPropagation();
            onScrollToPlayer();
          }}
          title="Locate in JSON"
        >
          ⎋
        </button>
        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="player-details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="detail-row">
              <span className="detail-label">ID</span>
              <span className="detail-value">{player.id}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Base Price</span>
              <span className="detail-value">${player.basePrice}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Total Shares</span>
              <span className="detail-value">
                {player.totalSharesAvailable || 'N/A'}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Active</span>
              <span className="detail-value">
                {player.isActive ? '✓ Yes' : '✗ No'}
              </span>
            </div>
            {player.isBuyback && (
              <div className="detail-row">
                <span className="detail-label">Buyback</span>
                <span className="detail-value buyback">⚠️ Active</span>
              </div>
            )}

            {/* Price History */}
            <div className="price-history-section">
              <div className="price-history-header">
                <h4>Price History ({player.priceHistory?.length || 0})</h4>
                {onAddEvent && (
                  <button
                    className="add-event-btn small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddEvent();
                    }}
                    title="Add event to this player"
                  >
                    + Add Event
                  </button>
                )}
              </div>
              {player.priceHistory?.length > 0 && (
                <>
                  {player.priceHistory.map((entry, idx) => {
                    const reasonType = entry.reason?.type || 'unknown';
                    const eventType = entry.reason?.eventType;
                    const typeColor = eventType
                      ? EVENT_TYPE_COLORS[eventType]
                      : REASON_TYPE_COLORS[reasonType];

                    return (
                      <button
                        type="button"
                        key={idx}
                        className="price-entry-card clickable"
                        onClick={() => onScrollToPriceEntry(idx)}
                      >
                        <div className="price-entry-header">
                          <span className="entry-timestamp">
                            {formatTimestamp(entry.timestamp)}
                          </span>
                          <span className="entry-price">
                            ${entry.price.toFixed(2)}
                          </span>
                        </div>
                        <div className="price-entry-content">
                          <span
                            className="reason-type-badge"
                            style={{
                              backgroundColor: `${typeColor}25`,
                              color: typeColor,
                            }}
                          >
                            {eventType || reasonType}
                          </span>
                          <span className="entry-headline">
                            {entry.reason?.headline}
                          </span>
                        </div>
                        {entry.content?.length > 0 && (
                          <div className="entry-content-badges">
                            {entry.content.map((c, i) => (
                              <span key={i} className="content-badge">
                                {c.type}
                              </span>
                            ))}
                          </div>
                        )}
                        <button
                          className={`copy-btn ${copiedId === `entry-${player.id}-${idx}` ? 'copied' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(
                              JSON.stringify(entry, null, 2),
                              `entry-${player.id}-${idx}`,
                            );
                          }}
                        >
                          {copiedId === `entry-${player.id}-${idx}`
                            ? '✓'
                            : '📋'}
                        </button>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Player Detail View Component (for single player mode)
function PlayerDetailView({
  player,
  copyToClipboard,
  copiedId,
  scrollToPriceEntry,
  onAddEvent,
}) {
  if (!player) return <div className="empty-state">Select a player</div>;

  const changePercent = getChangePercent(player);
  const currentPrice = getCurrentPrice(player);
  const changeClass = changePercent >= 0 ? 'up' : 'down';

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
    <div className="player-detail-view">
      <div className="player-header-large">
        <h2>{player.name}</h2>
        <div className="player-badges">
          <span className="badge team">{player.team}</span>
          <span className="badge position">{player.position}</span>
          {player.isActive && <span className="badge active">ACTIVE</span>}
          {player.isBuyback && <span className="badge buyback">BUYBACK</span>}
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <h4>Pricing</h4>
          <div className="detail-row">
            <span>Base Price</span>
            <span className="value">${player.basePrice}</span>
          </div>
          <div className="detail-row">
            <span>Current Price</span>
            <span className="value">${currentPrice.toFixed(2)}</span>
          </div>
          <div className="detail-row">
            <span>Change</span>
            <span className={`value ${changeClass}`}>
              {changePercent >= 0 ? '+' : ''}
              {changePercent.toFixed(2)}%
            </span>
          </div>
          <div className="detail-row">
            <span>Total Shares</span>
            <span className="value">
              {player.totalSharesAvailable || 'N/A'}
            </span>
          </div>
        </div>

        <div className="detail-card">
          <h4>Latest Update</h4>
          {player.priceHistory?.length > 0 ? (
            <>
              <p className="move-reason">
                {
                  player.priceHistory[player.priceHistory.length - 1].reason
                    ?.headline
                }
              </p>
              <span className="update-time">
                {formatTimestamp(
                  player.priceHistory[player.priceHistory.length - 1].timestamp,
                )}
              </span>
            </>
          ) : (
            <p className="empty-state">No price history</p>
          )}
        </div>
      </div>

      {/* Price History */}
      <div className="detail-card full-width">
        <div className="price-history-header">
          <h4>Price History ({player.priceHistory?.length || 0})</h4>
          {onAddEvent && (
            <button
              className="add-event-btn"
              onClick={() => onAddEvent(player.id)}
            >
              + Add Event
            </button>
          )}
        </div>
        {player.priceHistory?.length > 0 ? (
          <div className="price-history-list">
            {[...player.priceHistory].reverse().map((entry, idx) => {
              const actualIdx = player.priceHistory.length - 1 - idx;
              const reasonType = entry.reason?.type || 'unknown';
              const eventType = entry.reason?.eventType;
              const typeColor = eventType
                ? EVENT_TYPE_COLORS[eventType]
                : REASON_TYPE_COLORS[reasonType];
              const prevPrice =
                actualIdx > 0
                  ? player.priceHistory[actualIdx - 1].price
                  : player.basePrice;
              const priceDiff = entry.price - prevPrice;
              const isPositive = priceDiff >= 0;

              return (
                <button
                  type="button"
                  key={idx}
                  className="price-entry-card-large clickable"
                  onClick={() => scrollToPriceEntry(player.id, actualIdx)}
                >
                  <div className="entry-main">
                    <span
                      className="reason-type-badge"
                      style={{
                        backgroundColor: `${typeColor}25`,
                        color: typeColor,
                      }}
                    >
                      {eventType || reasonType}
                    </span>
                    <span className="entry-headline">
                      {entry.reason?.headline}
                    </span>
                  </div>
                  <div className="entry-details">
                    <span className="entry-timestamp">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                    <span
                      className={`entry-price ${isPositive ? 'up' : 'down'}`}
                    >
                      ${entry.price.toFixed(2)}
                      <span className="price-diff">
                        ({isPositive ? '+' : ''}
                        {priceDiff.toFixed(2)})
                      </span>
                    </span>
                  </div>
                  {entry.reason?.type === 'league_trade' && (
                    <div className="trade-details">
                      <span>
                        {entry.reason.memberId} {entry.reason.action}{' '}
                        {entry.reason.shares} shares
                      </span>
                    </div>
                  )}
                  {entry.content?.length > 0 && (
                    <div className="entry-content-list">
                      {entry.content.map((c, i) => (
                        <div key={i} className="content-item">
                          <span className={`content-type type-${c.type}`}>
                            {c.type}
                          </span>
                          <span className="content-title">{c.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    className={`copy-btn ${copiedId === `detail-entry-${idx}` ? 'copied' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(
                        JSON.stringify(entry, null, 2),
                        `detail-entry-${idx}`,
                      );
                    }}
                  >
                    {copiedId === `detail-entry-${idx}`
                      ? '✓ Copied!'
                      : '📋 Copy Entry'}
                  </button>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">No price history</div>
        )}
      </div>
    </div>
  );
}

// Timeline View Component
function TimelineView({
  timeline,
  players,
  copyToClipboard,
  copiedId,
  scrollToPriceEntry,
  onAddEvent,
}) {
  const [filterPlayer, setFilterPlayer] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);

  if (!timeline || timeline.length === 0) {
    return <div className="empty-state">No events in timeline</div>;
  }

  // Format timestamp for display
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatFullTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Filter timeline by player if selected
  const filteredTimeline =
    filterPlayer === 'all'
      ? timeline
      : timeline.filter((event) => event.playerId === filterPlayer);

  // Calculate stats
  const stats = {
    total: filteredTimeline.length,
    tds: filteredTimeline.filter((e) => e.reason?.eventType === 'TD').length,
    ints: filteredTimeline.filter((e) => e.reason?.eventType === 'INT').length,
    stats: filteredTimeline.filter((e) => e.reason?.eventType === 'stats')
      .length,
    news: filteredTimeline.filter((e) => e.reason?.type === 'news').length,
    trades: filteredTimeline.filter((e) => e.reason?.type === 'league_trade')
      .length,
  };

  // Get unique players for filter
  const uniquePlayers = [...new Set(timeline.map((e) => e.playerId))].map(
    (id) => {
      const event = timeline.find((e) => e.playerId === id);
      return { id, name: event.playerName, team: event.playerTeam };
    },
  );

  return (
    <div className="timeline-view">
      {/* Timeline Header */}
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

        <div className="timeline-filter">
          <label htmlFor="timeline-filter-player">Filter by Player:</label>
          <select
            id="timeline-filter-player"
            value={filterPlayer}
            onChange={(e) => setFilterPlayer(e.target.value)}
          >
            <option value="all">All Players</option>
            {uniquePlayers.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name} ({player.team})
              </option>
            ))}
          </select>
        </div>

        {onAddEvent && (
          <button
            className="add-event-btn timeline-add-btn"
            onClick={() =>
              onAddEvent(filterPlayer !== 'all' ? filterPlayer : null)
            }
          >
            + Add Event
          </button>
        )}
      </div>

      {/* Timeline Track */}
      <div className="timeline-track">
        {filteredTimeline.map((event, idx) => {
          const reasonType = event.reason?.type || 'unknown';
          const eventType = event.reason?.eventType;
          const typeColor = eventType
            ? EVENT_TYPE_COLORS[eventType]
            : REASON_TYPE_COLORS[reasonType];
          const isSelected = selectedEvent === idx;
          const isTD = eventType === 'TD';
          const isINT = eventType === 'INT';

          return (
            <button
              type="button"
              key={idx}
              className={`timeline-event ${isSelected ? 'selected' : ''} ${isTD ? 'is-td' : ''} ${isINT ? 'is-int' : ''}`}
              onClick={() => {
                setSelectedEvent(isSelected ? null : idx);
                scrollToPriceEntry(event.playerId, event.entryIndex);
              }}
            >
              {/* Connecting line */}
              {idx < filteredTimeline.length - 1 && (
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
                {/* Trade - Arrows */}
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

              {/* Event content */}
              <div className="timeline-event-content">
                <div className="timeline-event-header">
                  <span className="timeline-time">
                    {formatTime(event.timestamp)}
                  </span>
                  <span
                    className="timeline-player-badge"
                    style={{ borderColor: typeColor }}
                  >
                    {event.playerName}
                  </span>
                  <span
                    className="timeline-type-badge"
                    style={{
                      backgroundColor: `${typeColor}25`,
                      color: typeColor,
                    }}
                  >
                    {eventType || reasonType}
                  </span>
                </div>
                <div className="timeline-headline">
                  {event.reason?.headline}
                </div>
                <div className="timeline-price">${event.price.toFixed(2)}</div>

                {/* Expanded details */}
                {isSelected && (
                  <motion.div
                    className="timeline-event-details"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <div className="detail-row">
                      <span>Timestamp</span>
                      <span>{formatFullTimestamp(event.timestamp)}</span>
                    </div>
                    <div className="detail-row">
                      <span>Player</span>
                      <span>
                        {event.playerName} ({event.playerTeam}{' '}
                        {event.playerPosition})
                      </span>
                    </div>
                    {event.reason?.source && (
                      <div className="detail-row">
                        <span>Source</span>
                        <span>{event.reason.source}</span>
                      </div>
                    )}
                    {event.reason?.type === 'league_trade' && (
                      <div className="detail-row">
                        <span>Trade</span>
                        <span>
                          {event.reason.memberId} {event.reason.action}{' '}
                          {event.reason.shares} shares
                        </span>
                      </div>
                    )}
                    {event.content?.length > 0 && (
                      <div className="timeline-content-list">
                        <span className="content-label">Content:</span>
                        {event.content.map((c, i) => (
                          <span
                            key={i}
                            className={`content-badge type-${c.type}`}
                          >
                            {c.type}: {c.title}
                          </span>
                        ))}
                      </div>
                    )}
                    <button
                      className={`copy-btn ${copiedId === `timeline-${idx}` ? 'copied' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        const entryData = {
                          timestamp: event.timestamp,
                          price: event.price,
                          reason: event.reason,
                          content: event.content,
                        };
                        copyToClipboard(
                          JSON.stringify(entryData, null, 2),
                          `timeline-${idx}`,
                        );
                      }}
                    >
                      {copiedId === `timeline-${idx}`
                        ? '✓ Copied!'
                        : '📋 Copy Entry'}
                    </button>
                  </motion.div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
