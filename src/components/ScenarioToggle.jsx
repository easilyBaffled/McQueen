import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { isDevMode } from '../utils/devMode';
import './ScenarioToggle.css';

const scenarios = [
  {
    id: 'midweek',
    label: 'Midweek',
    description: 'Wed, Dec 4',
    tooltip:
      'Simulated midweek market activity — prices change based on weekly news and trade rumors',
  },
  {
    id: 'live',
    label: 'Live Game',
    description: 'MNF Q2',
    tooltip:
      'Watch prices change in real-time during a simulated Monday Night Football game',
  },
  {
    id: 'playoffs',
    label: 'Playoffs',
    description: 'Conf. Champ',
    tooltip:
      'Playoff scenario with high-stakes games and championship implications',
  },
  {
    id: 'superbowl',
    label: 'Super Bowl',
    description: 'Chiefs vs 49ers',
    isLive: true,
    tooltip:
      'Live Super Bowl simulation with dramatic price swings and buyback mechanics for the losing team',
  },
  {
    id: 'espn-live',
    label: 'ESPN Live',
    description: 'Real News',
    isEspn: true,
    tooltip:
      'Real ESPN news feed — prices update based on actual current NFL headlines',
  },
];

export default function ScenarioToggle() {
  const { scenario, setScenario, espnLoading, espnError, refreshEspnNews } =
    useGame();
  const [showDemoTooltip, setShowDemoTooltip] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentScenario =
    scenarios.find((s) => s.id === scenario) || scenarios[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMobileDropdownOpen(false);
      }
    }
    if (mobileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [mobileDropdownOpen]);

  const handleMobileSelect = (id) => {
    setScenario(id);
    setMobileDropdownOpen(false);
  };

  return (
    <div className="scenario-toggle">
      {/* Mobile Dropdown */}
      <div className="mobile-scenario-dropdown" ref={dropdownRef}>
        <button
          className={`mobile-dropdown-trigger ${currentScenario.isEspn ? 'espn' : ''}`}
          onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
        >
          <span className="mobile-dropdown-label">
            <span className="mobile-dropdown-badge">DEMO</span>
            <span className="mobile-dropdown-current">
              {currentScenario.label}
            </span>
            {(scenario === 'live' || scenario === 'superbowl') && (
              <span className="mobile-live-dot" />
            )}
            {scenario === 'espn-live' && (
              <span className="mobile-live-dot espn" />
            )}
          </span>
          <svg
            className={`mobile-dropdown-arrow ${mobileDropdownOpen ? 'open' : ''}`}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </button>

        <AnimatePresence mode="wait">
          {mobileDropdownOpen && (
            <motion.div
              className="mobile-dropdown-menu"
              key="mobile-dropdown-menu"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.1 }}
            >
              <div className="mobile-dropdown-header">
                <span className="mobile-dropdown-title">Select Scenario</span>
                <span className="mobile-dropdown-subtitle">
                  Choose a demo to explore
                </span>
              </div>
              {scenarios.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`mobile-dropdown-item ${scenario === s.id ? 'active' : ''} ${s.isEspn ? 'espn' : ''}`}
                  onClick={() => handleMobileSelect(s.id)}
                >
                  <div className="mobile-dropdown-item-left">
                    <span className="mobile-dropdown-item-check">
                      {scenario === s.id && (
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      )}
                    </span>
                    <div className="mobile-dropdown-item-content">
                      <span className="mobile-dropdown-item-label">
                        {s.label}
                        {(s.id === 'live' || s.isLive) && (
                          <span className="mobile-item-live-badge">LIVE</span>
                        )}
                        {s.id === 'espn-live' && (
                          <span className="mobile-item-espn-badge">ESPN</span>
                        )}
                      </span>
                      <span className="mobile-dropdown-item-desc">
                        {s.tooltip}
                      </span>
                    </div>
                  </div>
                  <span className="mobile-dropdown-item-meta">
                    {s.description}
                  </span>
                </button>
              ))}

              {/* ESPN Refresh in dropdown when ESPN is selected */}
              {scenario === 'espn-live' && (
                <div className="mobile-dropdown-actions">
                  <button
                    className="mobile-espn-refresh"
                    onClick={(e) => {
                      e.stopPropagation();
                      refreshEspnNews();
                    }}
                    disabled={espnLoading}
                  >
                    <span className={espnLoading ? 'spinning' : ''}>⟳</span>
                    {espnLoading ? 'Refreshing...' : 'Refresh ESPN News'}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop: Demo Label */}
      <div className="demo-label-container desktop-only">
        <button
          className="demo-label"
          onMouseEnter={() => setShowDemoTooltip(true)}
          onMouseLeave={() => setShowDemoTooltip(false)}
          onClick={() => setShowDemoTooltip(!showDemoTooltip)}
        >
          <span className="demo-badge">DEMO</span>
          <svg
            className="demo-info-icon"
            viewBox="0 0 24 24"
            fill="currentColor"
            width="14"
            height="14"
          >
            <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z" />
          </svg>
        </button>
        <AnimatePresence>
          {showDemoTooltip && (
            <motion.div
              className="demo-tooltip"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
            >
              <div className="demo-tooltip-title">Demo Scenarios</div>
              <p className="demo-tooltip-text">
                These are pre-built scenarios to explore how the market works.
                Switch between them to see different market conditions:
              </p>
              <ul className="demo-tooltip-list">
                <li>
                  <strong>Midweek:</strong> Quiet market with news-driven
                  changes
                </li>
                <li>
                  <strong>Live Game:</strong> Real-time price action during a
                  game
                </li>
                <li>
                  <strong>Playoffs:</strong> High-stakes championship scenarios
                </li>
                <li>
                  <strong>Super Bowl:</strong> Live simulation with buyback
                  mechanics
                </li>
                <li>
                  <strong>ESPN Live:</strong> Real current NFL news
                </li>
              </ul>
              <p className="demo-tooltip-note">
                Your trades and portfolio are saved across scenarios!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop: Scenario Tabs */}
      <div className="scenario-tabs desktop-only">
        {scenarios.map((s) => (
          <button
            key={s.id}
            className={`scenario-tab ${scenario === s.id ? 'active' : ''} ${s.isEspn ? 'espn-tab' : ''}`}
            onClick={() => setScenario(s.id)}
            title={s.tooltip}
          >
            {scenario === s.id && (
              <motion.div
                className="scenario-tab-bg"
                layoutId="scenario-bg"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="scenario-tab-content">
              <span className="scenario-label">{s.label}</span>
              <span className="scenario-desc">{s.description}</span>
            </span>
            {(s.id === 'live' || s.isLive) && scenario === s.id && (
              <span className="live-indicator">
                <span className="live-dot" />
                LIVE
              </span>
            )}
            {s.id === 'espn-live' && scenario === 'espn-live' && (
              <span className="live-indicator espn-indicator">
                {espnLoading ? (
                  <span className="espn-loading">⟳</span>
                ) : espnError ? (
                  <span className="espn-error">!</span>
                ) : (
                  <span className="live-dot espn-dot" />
                )}
                ESPN
              </span>
            )}
          </button>
        ))}

        {/* ESPN Refresh button when in ESPN Live mode */}
        {scenario === 'espn-live' && (
          <button
            className="espn-refresh-btn"
            onClick={refreshEspnNews}
            disabled={espnLoading}
            title="Refresh ESPN news"
          >
            <span className={espnLoading ? 'spinning' : ''}>⟳</span>
          </button>
        )}

        {isDevMode() && (
          <>
            <div className="scenario-divider" />
            <NavLink
              to="/inspector"
              className={({ isActive }) =>
                `scenario-tab inspector-tab ${isActive ? 'active' : ''}`
              }
            >
              <span className="scenario-tab-content">
                <span className="inspector-icon">🔍</span>
                <span className="scenario-label">Inspector</span>
              </span>
            </NavLink>
          </>
        )}
      </div>

      {/* ESPN error message */}
      {scenario === 'espn-live' && espnError && (
        <div className="espn-error-banner">ESPN Error: {espnError}</div>
      )}
    </div>
  );
}
