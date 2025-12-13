import { useState } from 'react';
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
    tooltip: 'Simulated midweek market activity — prices change based on weekly news and trade rumors'
  },
  { 
    id: 'live', 
    label: 'Live Game', 
    description: 'MNF Q2',
    tooltip: 'Watch prices change in real-time during a simulated Monday Night Football game'
  },
  { 
    id: 'playoffs', 
    label: 'Playoffs', 
    description: 'Conf. Champ',
    tooltip: 'Playoff scenario with high-stakes games and championship implications'
  },
  { 
    id: 'espn-live', 
    label: 'ESPN Live', 
    description: 'Real News', 
    isEspn: true,
    tooltip: 'Real ESPN news feed — prices update based on actual current NFL headlines'
  },
];

export default function ScenarioToggle() {
  const { scenario, setScenario, espnLoading, espnError, refreshEspnNews } = useGame();
  const [showDemoTooltip, setShowDemoTooltip] = useState(false);

  return (
    <div className="scenario-toggle">
      <div className="demo-label-container">
        <button 
          className="demo-label"
          onMouseEnter={() => setShowDemoTooltip(true)}
          onMouseLeave={() => setShowDemoTooltip(false)}
          onClick={() => setShowDemoTooltip(!showDemoTooltip)}
        >
          <span className="demo-badge">DEMO</span>
          <svg className="demo-info-icon" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
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
                <li><strong>Midweek:</strong> Quiet market with news-driven changes</li>
                <li><strong>Live Game:</strong> Real-time price action during a game</li>
                <li><strong>Playoffs:</strong> High-stakes championship scenarios</li>
                <li><strong>ESPN Live:</strong> Real current NFL news</li>
              </ul>
              <p className="demo-tooltip-note">
                Your trades and portfolio are saved across scenarios!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="scenario-tabs">
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
            {s.id === 'live' && scenario === 'live' && (
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
              className={({ isActive }) => `scenario-tab inspector-tab ${isActive ? 'active' : ''}`}
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
        <div className="espn-error-banner">
          ESPN Error: {espnError}
        </div>
      )}
    </div>
  );
}

