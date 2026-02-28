import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AddEventModal from '../../components/AddEventModal/AddEventModal';
import styles from './ScenarioInspector.module.css';
import type { ScenarioData, Player, PriceHistoryEntry, ContentItem, PriceReason } from '../../types';

interface InspectorTimelineEntry {
  playerId: string;
  playerName: string;
  playerTeam: string;
  playerPosition: string;
  entryIndex: number;
  timestamp: string;
  price: number;
  reason?: PriceReason & { eventType?: string };
  content?: ContentItem[];
}

interface SaveStatus {
  type: 'success' | 'error';
  message: string;
}

const scenarioLoaders: Record<string, () => Promise<unknown>> = {
  midweek: () => import('../../data/midweek.json').then((m) => m.default),
  live: () => import('../../data/live.json').then((m) => m.default),
  playoffs: () => import('../../data/playoffs.json').then((m) => m.default),
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
const REASON_TYPE_COLORS: Record<string, string> = {
  game_event: '#00C853',
  news: '#2196F3',
  league_trade: '#9C27B0',
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  TD: '#00C853',
  INT: '#FF1744',
  stats: '#00BCD4',
  injury: '#FF9800',
};

export default function ScenarioInspector() {
  const [selectedScenario, setSelectedScenario] = useState('live');
  const [viewMode, setViewMode] = useState('full');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [jsonText, setJsonText] = useState('');
  const [parsedData, setParsedData] = useState<ScenarioData | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    metadata: true,
    players: true,
  });
  const [expandedPlayers, setExpandedPlayers] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dividerPosition, setDividerPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [modalPreselectedPlayerId, setModalPreselectedPlayerId] =
    useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load scenario data dynamically
  useEffect(() => {
    let cancelled = false;
    const loader = scenarioLoaders[selectedScenario];
    if (!loader) return;

    loader().then((data: unknown) => {
      if (cancelled) return;
      const scenarioData = data as ScenarioData;
      const text = JSON.stringify(scenarioData, null, 2);
      setJsonText(text);
      setParsedData(scenarioData);
      setJsonError(null);
      setSelectedPlayerId(scenarioData.players?.[0]?.id || null);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedScenario]);

  // Parse JSON on text change
  const handleJsonChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setJsonText(text);

    try {
      const parsed = JSON.parse(text);
      setParsedData(parsed);
      setJsonError(null);
    } catch (err: unknown) {
      setJsonError(err instanceof Error ? err.message : 'Parse error');
    }
  }, []);

  // Copy to clipboard helper
  const copyToClipboard = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  // Toggle section expansion
  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  // Toggle player expansion
  const togglePlayer = useCallback((playerId: string) => {
    setExpandedPlayers((prev) => ({
      ...prev,
      [playerId]: !prev[playerId],
    }));
  }, []);

  // Scroll to JSON location
  const scrollToJson = useCallback(
    (searchPattern: string | RegExp, options: { occurrence?: number } = {}) => {
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
    (playerId: string) => {
      scrollToJson(`"id": "${playerId}"`);
    },
    [scrollToJson],
  );

  // Find priceHistory entry in JSON (within a specific player)
  const scrollToPriceEntry = useCallback(
    (playerId: string, entryIndex: number) => {
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
    (field: string) => {
      scrollToJson(`"${field}":`);
    },
    [scrollToJson],
  );

  // Open Add Event modal
  const openAddEventModal = useCallback((playerId: string | null = null) => {
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
    async ({ playerId, entry }: { playerId: string; entry: PriceHistoryEntry }) => {
      if (!parsedData || !playerId || !entry) return;

      const updatedData = {
        ...parsedData,
        players: parsedData.players.map((player: Player) => {
          if (player.id !== playerId) return player;

          const newHistory = [...(player.priceHistory || []), entry];
          newHistory.sort(
            (a: PriceHistoryEntry, b: PriceHistoryEntry) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
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
  const saveScenarioToFile = useCallback(async (scenario: string, data: ScenarioData) => {
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
    } catch (err: unknown) {
      setSaveStatus({ type: 'error', message: err instanceof Error ? err.message : 'Save failed' });
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Handle divider drag
  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
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
  const unifiedTimeline = useMemo((): InspectorTimelineEntry[] => {
    if (!parsedData?.players) return [];

    const timeline: InspectorTimelineEntry[] = [];
    parsedData.players.forEach((player: Player) => {
      if (player.priceHistory) {
        player.priceHistory.forEach((entry: PriceHistoryEntry, index: number) => {
          timeline.push({
            playerId: player.id,
            playerName: player.name,
            playerTeam: player.team,
            playerPosition: player.position,
            entryIndex: index,
            timestamp: entry.timestamp,
            price: entry.price,
            reason: entry.reason as PriceReason & { eventType?: string },
            content: entry.content,
          });
        });
      }
    });

    timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return timeline;
  }, [parsedData]);

  return (
    <div className={styles['scenario-inspector']}>
      {/* Header */}
      <header className={styles['inspector-header']}>
        <div className={styles['inspector-title']}>
          <span className={styles['inspector-icon']}>🔍</span>
          <h1>Scenario Inspector</h1>
        </div>

        <div className={styles['inspector-controls']}>
          {/* Scenario Selector */}
          <div className={styles['control-group']}>
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
          <div className={styles['control-group']}>
            <span id="inspector-view-label" className={styles['control-label']}>View</span>
            <div
              className={styles['toggle-buttons']}
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
            <div className={styles['control-group']}>
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
        <div className={styles['templates-bar']}>
          <span className={styles['templates-label']}>Templates:</span>
          <button
            className={`${styles['template-btn']} ${copiedId === styles['tpl-pricechange'] ? styles['copied'] : ''}`}
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
            className={`${styles['template-btn']} ${copiedId === styles['tpl-leaguetrade'] ? styles['copied'] : ''}`}
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
      <div className={`${styles['inspector-panels']} ${isDragging ? styles['dragging'] : ''}`}>
        {/* JSON Editor Panel */}
        <div className={styles['editor-panel']} style={{ width: `${dividerPosition}%` }}>
          <div className={styles['panel-header']}>
            <h2>JSON Editor</h2>
            {jsonError && <span className={styles['json-error']}>⚠️ {jsonError}</span>}
          </div>
          <div className={styles['editor-wrapper']} ref={editorRef}>
            <div className={styles['line-numbers']}>
              {jsonText.split('\n').map((_, i) => (
                <div
                  key={i}
                  className={`${styles['line-number']} ${highlightedLine === i ? styles['highlighted'] : ''}`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <div className={styles['editor-content']}>
              <textarea
                ref={textareaRef}
                className={styles['json-editor']}
                value={jsonText}
                onChange={handleJsonChange}
                spellCheck={false}
                style={{
                  height: `${jsonText.split('\n').length * 19.5 + 32}px`,
                }}
              />
              {highlightedLine !== null && (
                <div
                  className={styles['line-highlight']}
                  style={{ top: `${highlightedLine * 19.5 + 16}px` }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
        <div
          className={styles['panel-divider']}
          role="separator"
          aria-orientation="vertical"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          onMouseDown={handleMouseDown}
        >
          <div className={styles['divider-handle']} />
        </div>

        {/* Formatted View Panel */}
        <div
          className={styles['formatted-panel']}
          style={{ width: `${100 - dividerPosition}%` }}
        >
          <div className={styles['panel-header']}>
            <h2>Formatted View</h2>
            <button
              className={`${styles['copy-full-btn']} ${copiedId === styles['full'] ? styles['copied'] : ''}`}
              onClick={() => copyToClipboard(jsonText, 'full')}
            >
              {copiedId === 'full' ? '✓ Copied!' : '📋 Copy Full JSON'}
            </button>
          </div>

          <div className={styles['formatted-content']}>
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
                player={viewData as Player | null}
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
            className={`${styles['save-toast']} ${saveStatus.type}`}
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
        <div className={styles['saving-overlay']}>
          <div className={styles['saving-spinner']} />
          <span>Saving...</span>
        </div>
      )}
    </div>
  );
}

// Calculate change percent from priceHistory
function getChangePercent(player: Player) {
  if (!player || !player.priceHistory || player.priceHistory.length === 0)
    return 0;
  const currentPrice =
    player.priceHistory[player.priceHistory.length - 1].price;
  const basePrice = player.basePrice;
  if (basePrice === 0) return 0;
  return ((currentPrice - basePrice) / basePrice) * 100;
}

// Get current price from priceHistory
function getCurrentPrice(player: Player) {
  if (!player || !player.priceHistory || player.priceHistory.length === 0)
    return player?.basePrice || 0;
  return player.priceHistory[player.priceHistory.length - 1].price;
}

interface FullScenarioViewProps {
  data: ScenarioData | null;
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
  expandedPlayers: Record<string, boolean>;
  togglePlayer: (playerId: string) => void;
  copyToClipboard: (text: string, id: string) => void;
  copiedId: string | null;
  scrollToPlayer: (playerId: string) => void;
  scrollToPriceEntry: (playerId: string, entryIdx: number) => void;
  scrollToMetadata: (field: string) => void;
  onAddEvent: (playerId?: string | null) => void;
}

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
}: FullScenarioViewProps) {
  if (!data) return <div className={styles['empty-state']}>No valid data</div>;

  return (
    <div className={styles['full-scenario-view']}>
      {/* Metadata Section */}
      <section className={styles['inspector-section']}>
        <button
          className={styles['section-header']}
          onClick={() => toggleSection('metadata')}
        >
          <span className={styles['section-icon']}>
            {expandedSections.metadata ? '▼' : '▶'}
          </span>
          <span className={styles['section-title']}>Scenario Metadata</span>
        </button>
        <AnimatePresence>
          {expandedSections.metadata && (
            <motion.div
              className={styles['section-content']}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <div className={styles['metadata-grid']}>
                <button
                  type="button"
                  className={`${styles['metadata-item']} ${styles['clickable']}`}
                  onClick={() => scrollToMetadata('scenario')}
                >
                  <span className={styles['metadata-label']}>Scenario</span>
                  <span className={styles['metadata-value']}>{data.scenario}</span>
                </button>
                <button
                  type="button"
                  className={`${styles['metadata-item']} ${styles['clickable']}`}
                  onClick={() => scrollToMetadata('timestamp')}
                >
                  <span className={styles['metadata-label']}>Timestamp</span>
                  <span className={styles['metadata-value']}>{data.timestamp}</span>
                </button>
                <button
                  type="button"
                  className={`${styles['metadata-item']} ${styles['full-width']} ${styles['clickable']}`}
                  onClick={() => scrollToMetadata('headline')}
                >
                  <span className={styles['metadata-label']}>Headline</span>
                  <span className={styles['metadata-value']}>{data.headline}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Players Section */}
      <section className={styles['inspector-section']}>
        <button
          className={styles['section-header']}
          onClick={() => toggleSection('players')}
        >
          <span className={styles['section-icon']}>
            {expandedSections.players ? '▼' : '▶'}
          </span>
          <span className={styles['section-title']}>
            Players ({data.players?.length || 0})
          </span>
        </button>
        <AnimatePresence>
          {expandedSections.players && (
            <motion.div
              className={styles['section-content']}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <div className={styles['players-list']}>
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

interface InspectorPlayerCardProps {
  player: Player;
  isExpanded: boolean;
  onToggle: () => void;
  copyToClipboard: (text: string, id: string) => void;
  copiedId: string | null;
  onScrollToPlayer: () => void;
  onScrollToPriceEntry: (entryIdx: number) => void;
  onAddEvent: () => void;
}

function PlayerCard({
  player,
  isExpanded,
  onToggle,
  copyToClipboard,
  copiedId,
  onScrollToPlayer,
  onScrollToPriceEntry,
  onAddEvent,
}: InspectorPlayerCardProps) {
  const changePercent = getChangePercent(player);
  const currentPrice = getCurrentPrice(player);
  const changeClass = changePercent >= 0 ? 'up' : 'down';

  const handleHeaderClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.locate-btn') || (e.target as HTMLElement).closest('.add-event-btn'))
      return;
    onToggle();
  };

  const formatTimestamp = (timestamp: string) => {
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
    <div className={styles['player-card']}>
      <button className={styles['player-header']} onClick={handleHeaderClick}>
        <div className={styles['player-info']}>
          <span className={styles['player-name']}>{player.name}</span>
          <span className={styles['player-meta']}>
            {player.team} • {player.position}
          </span>
        </div>
        <div className={styles['player-price']}>
          <span className={styles['base-price']}>${currentPrice.toFixed(2)}</span>
          <span className={`${styles['change-percent']} ${changeClass}`}>
            {changePercent >= 0 ? '+' : ''}
            {changePercent.toFixed(2)}%
          </span>
        </div>
        <button
          type="button"
          className={styles['locate-btn']}
          onClick={(e) => {
            e.stopPropagation();
            onScrollToPlayer();
          }}
          title="Locate in JSON"
        >
          ⎋
        </button>
        <span className={styles['expand-icon']}>{isExpanded ? '▼' : '▶'}</span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className={styles['player-details']}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className={styles['detail-row']}>
              <span className={styles['detail-label']}>ID</span>
              <span className={styles['detail-value']}>{player.id}</span>
            </div>
            <div className={styles['detail-row']}>
              <span className={styles['detail-label']}>Base Price</span>
              <span className={styles['detail-value']}>${player.basePrice}</span>
            </div>
            <div className={styles['detail-row']}>
              <span className={styles['detail-label']}>Total Shares</span>
              <span className={styles['detail-value']}>
                {player.totalSharesAvailable || 'N/A'}
              </span>
            </div>
            <div className={styles['detail-row']}>
              <span className={styles['detail-label']}>Active</span>
              <span className={styles['detail-value']}>
                {player.isActive ? '✓ Yes' : '✗ No'}
              </span>
            </div>
            {player.isBuyback && (
              <div className={styles['detail-row']}>
                <span className={styles['detail-label']}>Buyback</span>
                <span className={`${styles['detail-value']} ${styles['buyback']}`}>⚠️ Active</span>
              </div>
            )}

            {/* Price History */}
            <div className={styles['price-history-section']}>
              <div className={styles['price-history-header']}>
                <h4>Price History ({player.priceHistory?.length || 0})</h4>
                {onAddEvent && (
                  <button
                    className={`${styles['add-event-btn']} ${styles['small']}`}
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
              {(player.priceHistory?.length ?? 0) > 0 && (
                <>
                  {player.priceHistory!.map((entry, idx) => {
                    const reasonType = entry.reason?.type || 'unknown';
                    const eventType = entry.reason?.eventType;
                    const typeColor = eventType
                      ? EVENT_TYPE_COLORS[eventType]
                      : REASON_TYPE_COLORS[reasonType];

                    return (
                      <button
                        type="button"
                        key={idx}
                        className={`${styles['price-entry-card']} ${styles['clickable']}`}
                        onClick={() => onScrollToPriceEntry(idx)}
                      >
                        <div className={styles['price-entry-header']}>
                          <span className={styles['entry-timestamp']}>
                            {formatTimestamp(entry.timestamp)}
                          </span>
                          <span className={styles['entry-price']}>
                            ${entry.price.toFixed(2)}
                          </span>
                        </div>
                        <div className={styles['price-entry-content']}>
                          <span
                            className={styles['reason-type-badge']}
                            style={{
                              backgroundColor: `${typeColor}25`,
                              color: typeColor,
                            }}
                          >
                            {eventType || reasonType}
                          </span>
                          <span className={styles['entry-headline']}>
                            {entry.reason?.headline}
                          </span>
                        </div>
                        {(entry.content?.length ?? 0) > 0 && (
                          <div className={styles['entry-content-badges']}>
                            {entry.content!.map((c, i) => (
                              <span key={i} className={styles['content-badge']}>
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

interface PlayerDetailViewProps {
  player: Player | null;
  copyToClipboard: (text: string, id: string) => void;
  copiedId: string | null;
  scrollToPriceEntry: (playerId: string, entryIdx: number) => void;
  onAddEvent: (playerId?: string | null) => void;
}

function PlayerDetailView({
  player,
  copyToClipboard,
  copiedId,
  scrollToPriceEntry,
  onAddEvent,
}: PlayerDetailViewProps) {
  if (!player) return <div className={styles['empty-state']}>Select a player</div>;

  const changePercent = getChangePercent(player);
  const currentPrice = getCurrentPrice(player);
  const changeClass = changePercent >= 0 ? 'up' : 'down';

  const formatTimestamp = (timestamp: string) => {
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
    <div className={styles['player-detail-view']}>
      <div className={styles['player-header-large']}>
        <h2>{player.name}</h2>
        <div className={styles['player-badges']}>
          <span className={`${styles['badge']} ${styles['team']}`}>{player.team}</span>
          <span className={`${styles['badge']} ${styles['position']}`}>{player.position}</span>
          {player.isActive && <span className={`${styles['badge']} ${styles['active']}`}>ACTIVE</span>}
          {player.isBuyback && <span className={`${styles['badge']} ${styles['buyback']}`}>BUYBACK</span>}
        </div>
      </div>

      <div className={styles['detail-grid']}>
        <div className={styles['detail-card']}>
          <h4>Pricing</h4>
          <div className={styles['detail-row']}>
            <span>Base Price</span>
            <span className={styles['value']}>${player.basePrice}</span>
          </div>
          <div className={styles['detail-row']}>
            <span>Current Price</span>
            <span className={styles['value']}>${currentPrice.toFixed(2)}</span>
          </div>
          <div className={styles['detail-row']}>
            <span>Change</span>
            <span className={`${styles['value']} ${changeClass}`}>
              {changePercent >= 0 ? '+' : ''}
              {changePercent.toFixed(2)}%
            </span>
          </div>
          <div className={styles['detail-row']}>
            <span>Total Shares</span>
            <span className={styles['value']}>
              {player.totalSharesAvailable || 'N/A'}
            </span>
          </div>
        </div>

        <div className={styles['detail-card']}>
          <h4>Latest Update</h4>
          {(player.priceHistory?.length ?? 0) > 0 ? (
            <>
              <p className={styles['move-reason']}>
                {
                  player.priceHistory![player.priceHistory!.length - 1].reason
                    ?.headline
                }
              </p>
              <span className={styles['update-time']}>
                {formatTimestamp(
                  player.priceHistory![player.priceHistory!.length - 1].timestamp,
                )}
              </span>
            </>
          ) : (
            <p className={styles['empty-state']}>No price history</p>
          )}
        </div>
      </div>

      {/* Price History */}
      <div className={`${styles['detail-card']} ${styles['full-width']}`}>
        <div className={styles['price-history-header']}>
          <h4>Price History ({player.priceHistory?.length || 0})</h4>
          {onAddEvent && (
            <button
              className={styles['add-event-btn']}
              onClick={() => onAddEvent(player.id)}
            >
              + Add Event
            </button>
          )}
        </div>
        {(player.priceHistory?.length ?? 0) > 0 ? (
          <div className={styles['price-history-list']}>
            {[...player.priceHistory!].reverse().map((entry, idx) => {
              const actualIdx = player.priceHistory!.length - 1 - idx;
              const reasonType = entry.reason?.type || 'unknown';
              const eventType = entry.reason?.eventType;
              const typeColor = eventType
                ? EVENT_TYPE_COLORS[eventType]
                : REASON_TYPE_COLORS[reasonType];
              const prevPrice =
                actualIdx > 0
                  ? player.priceHistory![actualIdx - 1].price
                  : player.basePrice;
              const priceDiff = entry.price - prevPrice;
              const isPositive = priceDiff >= 0;

              return (
                <button
                  type="button"
                  key={idx}
                  className={`${styles['price-entry-card-large']} ${styles['clickable']}`}
                  onClick={() => scrollToPriceEntry(player.id, actualIdx)}
                >
                  <div className={styles['entry-main']}>
                    <span
                      className={styles['reason-type-badge']}
                      style={{
                        backgroundColor: `${typeColor}25`,
                        color: typeColor,
                      }}
                    >
                      {eventType || reasonType}
                    </span>
                    <span className={styles['entry-headline']}>
                      {entry.reason?.headline}
                    </span>
                  </div>
                  <div className={styles['entry-details']}>
                    <span className={styles['entry-timestamp']}>
                      {formatTimestamp(entry.timestamp)}
                    </span>
                    <span
                      className={`${styles['entry-price']} ${isPositive ? styles['up'] : styles['down']}`}
                    >
                      ${entry.price.toFixed(2)}
                      <span className={styles['price-diff']}>
                        ({isPositive ? '+' : ''}
                        {priceDiff.toFixed(2)})
                      </span>
                    </span>
                  </div>
                  {entry.reason?.type === 'league_trade' && (
                    <div className={styles['trade-details']}>
                      <span>
                        {entry.reason.memberId} {entry.reason.action}{' '}
                        {entry.reason.shares} shares
                      </span>
                    </div>
                  )}
                  {(entry.content?.length ?? 0) > 0 && (
                    <div className={styles['entry-content-list']}>
                      {entry.content!.map((c: ContentItem, i: number) => (
                        <div key={i} className={styles['content-item']}>
                          <span className={`${styles['content-type']} ${styles['type-']} ${c.type}`}>
                            {c.type}
                          </span>
                          <span className={styles['content-title']}>{c.title}</span>
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
          <div className={styles['empty-state']}>No price history</div>
        )}
      </div>
    </div>
  );
}

interface TimelineViewProps {
  timeline: InspectorTimelineEntry[];
  players: Player[];
  copyToClipboard: (text: string, id: string) => void;
  copiedId: string | null;
  scrollToPriceEntry: (playerId: string, entryIdx: number) => void;
  onAddEvent: (playerId?: string | null) => void;
}

function TimelineView({
  timeline,
  players,
  copyToClipboard,
  copiedId,
  scrollToPriceEntry,
  onAddEvent,
}: TimelineViewProps) {
  const [filterPlayer, setFilterPlayer] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);

  if (!timeline || timeline.length === 0) {
    return <div className={styles['empty-state']}>No events in timeline</div>;
  }

  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatFullTimestamp = (timestamp: string) => {
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
      return { id, name: event?.playerName ?? '', team: event?.playerTeam ?? '' };
    },
  );

  return (
    <div className={styles['timeline-view']}>
      {/* Timeline Header */}
      <div className={styles['timeline-header']}>
        <div className={styles['timeline-stats']}>
          <div className={styles['stat-item']}>
            <span className={styles['stat-value']}>{stats.total}</span>
            <span className={styles['stat-label']}>Events</span>
          </div>
          <div className={`${styles['stat-item']} ${styles['td']}`}>
            <span className={styles['stat-value']}>{stats.tds}</span>
            <span className={styles['stat-label']}>TDs</span>
          </div>
          <div className={`${styles['stat-item']} ${styles['int']}`}>
            <span className={styles['stat-value']}>{stats.ints}</span>
            <span className={styles['stat-label']}>INTs</span>
          </div>
          <div className={`${styles['stat-item']} ${styles['stats-type']}`}>
            <span className={styles['stat-value']}>{stats.stats}</span>
            <span className={styles['stat-label']}>Stats</span>
          </div>
          <div className={`${styles['stat-item']} ${styles['news']}`}>
            <span className={styles['stat-value']}>{stats.news}</span>
            <span className={styles['stat-label']}>News</span>
          </div>
          <div className={`${styles['stat-item']} ${styles['trade']}`}>
            <span className={styles['stat-value']}>{stats.trades}</span>
            <span className={styles['stat-label']}>Trades</span>
          </div>
        </div>

        <div className={styles['timeline-filter']}>
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
            className={`${styles['add-event-btn']} ${styles['timeline-add-btn']}`}
            onClick={() =>
              onAddEvent(filterPlayer !== 'all' ? filterPlayer : null)
            }
          >
            + Add Event
          </button>
        )}
      </div>

      {/* Timeline Track */}
      <div className={styles['timeline-track']}>
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
              className={`${styles['timeline-event']} ${isSelected ? styles['selected'] : ''} ${isTD ? styles['is-td'] : ''} ${isINT ? styles['is-int'] : ''}`}
              onClick={() => {
                setSelectedEvent(isSelected ? null : idx);
                scrollToPriceEntry(event.playerId, event.entryIndex);
              }}
            >
              {/* Connecting line */}
              {idx < filteredTimeline.length - 1 && (
                <div className={styles['timeline-connector']} />
              )}

              {/* Event marker */}
              <div
                className={`${styles['timeline-marker']} ${isTD ? styles['marker-td'] : ''} ${isINT ? styles['marker-int'] : ''}`}
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
              <div className={styles['timeline-event-content']}>
                <div className={styles['timeline-event-header']}>
                  <span className={styles['timeline-time']}>
                    {formatTime(event.timestamp)}
                  </span>
                  <span
                    className={styles['timeline-player-badge']}
                    style={{ borderColor: typeColor }}
                  >
                    {event.playerName}
                  </span>
                  <span
                    className={styles['timeline-type-badge']}
                    style={{
                      backgroundColor: `${typeColor}25`,
                      color: typeColor,
                    }}
                  >
                    {eventType || reasonType}
                  </span>
                </div>
                <div className={styles['timeline-headline']}>
                  {event.reason?.headline}
                </div>
                <div className={styles['timeline-price']}>${event.price.toFixed(2)}</div>

                {/* Expanded details */}
                {isSelected && (
                  <motion.div
                    className={styles['timeline-event-details']}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <div className={styles['detail-row']}>
                      <span>Timestamp</span>
                      <span>{formatFullTimestamp(event.timestamp)}</span>
                    </div>
                    <div className={styles['detail-row']}>
                      <span>Player</span>
                      <span>
                        {event.playerName} ({event.playerTeam}{' '}
                        {event.playerPosition})
                      </span>
                    </div>
                    {event.reason?.source && (
                      <div className={styles['detail-row']}>
                        <span>Source</span>
                        <span>{event.reason.source}</span>
                      </div>
                    )}
                    {event.reason?.type === 'league_trade' && (
                      <div className={styles['detail-row']}>
                        <span>Trade</span>
                        <span>
                          {event.reason.memberId} {event.reason.action}{' '}
                          {event.reason.shares} shares
                        </span>
                      </div>
                    )}
                    {(event.content?.length ?? 0) > 0 && (
                      <div className={styles['timeline-content-list']}>
                        <span className={styles['content-label']}>Content:</span>
                        {event.content!.map((c: ContentItem, i: number) => (
                          <span
                            key={i}
                            className={`${styles['content-badge']} ${styles['type-']} ${c.type}`}
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
