import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { useScenario } from '../../context/ScenarioContext';
import { useTrading } from '../../context/TradingContext';
import { useSimulation } from '../../context/SimulationContext';
import { isDevMode } from '../../utils/devMode';
import styles from './ScenarioToggle.module.css';

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
  const { scenario, setScenario, scenarioLoading } = useScenario();
  const { portfolio } = useTrading();
  const { espnLoading, espnError, refreshEspnNews } = useSimulation();
  const [showDemoTooltip, setShowDemoTooltip] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const [pendingScenario, setPendingScenario] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentScenario =
    scenarios.find((s) => s.id === scenario) || scenarios[0];

  const hasPortfolio = Object.keys(portfolio).length > 0;

  const requestScenarioSwitch = useCallback((id: string) => {
    if (id === scenario) return;
    if (hasPortfolio) {
      setPendingScenario(id);
    } else {
      setScenario(id);
    }
  }, [scenario, hasPortfolio, setScenario]);

  const confirmSwitch = useCallback(() => {
    if (pendingScenario) {
      setScenario(pendingScenario);
      setPendingScenario(null);
    }
  }, [pendingScenario, setScenario]);

  const cancelSwitch = useCallback(() => {
    setPendingScenario(null);
  }, []);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMobileDropdownOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileDropdownOpen(false);
    }
    if (mobileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [mobileDropdownOpen]);

  const handleMobileSelect = (id: string) => {
    setMobileDropdownOpen(false);
    requestScenarioSwitch(id);
  };

  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const tabs = Array.from(
        e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]:not([data-inspector])'),
      );
      const currentIndex = tabs.indexOf(document.activeElement as HTMLElement);
      if (currentIndex === -1) return;

      e.preventDefault();
      let nextIndex: number;
      if (e.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % tabs.length;
      } else {
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      }
      tabs[nextIndex].focus();
    },
    [],
  );

  return (
    <div className={styles['scenario-toggle']}>
      {/* Mobile Dropdown */}
      <div className={styles['mobile-scenario-dropdown']} ref={dropdownRef}>
        <button
          className={`${styles['mobile-dropdown-trigger']} ${currentScenario.isEspn ? styles['espn'] : ''}`}
          onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
          aria-label={`Select scenario, current: ${currentScenario.label}`}
          aria-expanded={mobileDropdownOpen}
        >
          <span className={styles['mobile-dropdown-label']}>
            <span className={styles['mobile-dropdown-badge']}>DEMO</span>
            <span className={styles['mobile-dropdown-current']}>
              {currentScenario.label}
            </span>
            {(scenario === 'live' || scenario === 'superbowl') && (
              <span className={styles['mobile-live-dot']} />
            )}
            {scenario === 'espn-live' && (
              <span className={`${styles['mobile-live-dot']} ${styles['espn']}`} />
            )}
          </span>
          <svg
            className={`${styles['mobile-dropdown-arrow']} ${mobileDropdownOpen ? styles['open'] : ''}`}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </button>

        <AnimatePresence mode="wait">
          {mobileDropdownOpen && (
            <motion.div
              className={styles['mobile-dropdown-menu']}
              key="mobile-dropdown-menu"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.1 }}
            >
              <div className={styles['mobile-dropdown-header']}>
                <span className={styles['mobile-dropdown-title']}>Select Scenario</span>
                <span className={styles['mobile-dropdown-subtitle']}>
                  Choose a demo to explore
                </span>
              </div>
              {scenarios.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`${styles['mobile-dropdown-item']} ${scenario === s.id ? styles['active'] : ''} ${s.isEspn ? styles['espn'] : ''}`}
                  onClick={() => handleMobileSelect(s.id)}
                >
                  <div className={styles['mobile-dropdown-item-left']}>
                    <span className={styles['mobile-dropdown-item-check']}>
                      {scenario === s.id && (
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      )}
                    </span>
                    <div className={styles['mobile-dropdown-item-content']}>
                      <span className={styles['mobile-dropdown-item-label']}>
                        {s.label}
                        {(s.id === 'live' || s.isLive) && (
                          <span className={styles['mobile-item-live-badge']}>LIVE</span>
                        )}
                        {s.id === 'espn-live' && (
                          <span className={styles['mobile-item-espn-badge']}>ESPN</span>
                        )}
                      </span>
                      <span className={styles['mobile-dropdown-item-desc']}>
                        {s.tooltip}
                      </span>
                    </div>
                  </div>
                  <span className={styles['mobile-dropdown-item-meta']}>
                    {s.description}
                  </span>
                </button>
              ))}

              {/* ESPN Refresh in dropdown when ESPN is selected */}
              {scenario === 'espn-live' && (
                <div className={styles['mobile-dropdown-actions']}>
                  <button
                    className={styles['mobile-espn-refresh']}
                    onClick={(e) => {
                      e.stopPropagation();
                      refreshEspnNews();
                    }}
                    disabled={espnLoading}
                    aria-label="Refresh ESPN news"
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
      <div className={`${styles['demo-label-container']} ${styles['desktop-only']}`}>
        <button
          className={styles['demo-label']}
          onMouseEnter={() => setShowDemoTooltip(true)}
          onMouseLeave={() => setShowDemoTooltip(false)}
          onClick={() => setShowDemoTooltip(!showDemoTooltip)}
          aria-label="Demo scenarios information"
        >
          <span className={styles['demo-badge']}>DEMO</span>
          <svg
            className={styles['demo-info-icon']}
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
              className={styles['demo-tooltip']}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
            >
              <div className={styles['demo-tooltip-title']}>Demo Scenarios</div>
              <p className={styles['demo-tooltip-text']}>
                These are pre-built scenarios to explore how the market works.
                Switch between them to see different market conditions:
              </p>
              <ul className={styles['demo-tooltip-list']}>
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
              <p className={styles['demo-tooltip-note']}>
                Your trades and portfolio are saved across scenarios!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop: Scenario Tabs */}
      {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus */}
      <div
        className={`${styles['scenario-tabs']} ${styles['desktop-only']}`}
        role="tablist"
        aria-label="Demo scenarios"
        onKeyDown={handleTabKeyDown}
      >
        {scenarios.map((s) => (
          <button
            key={s.id}
            className={`${styles['scenario-tab']} ${scenario === s.id ? styles['active'] : ''} ${scenario === s.id && scenarioLoading ? styles['loading'] : ''} ${s.isEspn ? styles['espn-tab'] : ''}`}
            role="tab"
            aria-selected={scenario === s.id}
            tabIndex={scenario === s.id ? 0 : -1}
            onClick={() => requestScenarioSwitch(s.id)}
            title={s.tooltip}
          >
            {scenario === s.id && (
              <motion.div
                className={styles['scenario-tab-bg']}
                layoutId="scenario-bg"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className={styles['scenario-tab-content']}>
              <span className={styles['scenario-label']}>{s.label}</span>
              <span className={styles['scenario-desc']}>{s.description}</span>
            </span>
            {(s.id === 'live' || s.isLive) && scenario === s.id && (
              <span className={styles['live-indicator']}>
                <span className={styles['live-dot']} />
                LIVE
              </span>
            )}
            {s.id === 'espn-live' && scenario === 'espn-live' && (
              <span className={`${styles['live-indicator']} ${styles['espn-indicator']}`}>
                {espnLoading ? (
                  <span className={styles['espn-loading']}>⟳</span>
                ) : espnError ? (
                  <span className={styles['espn-error']}>!</span>
                ) : (
                  <span className={`${styles['live-dot']} ${styles['espn-dot']}`} />
                )}
                ESPN
              </span>
            )}
          </button>
        ))}

        {/* ESPN Refresh button when in ESPN Live mode */}
        {scenario === 'espn-live' && (
          <button
            className={styles['espn-refresh-btn']}
            onClick={refreshEspnNews}
            disabled={espnLoading}
            title="Refresh ESPN news"
            aria-label="Refresh ESPN news"
          >
            <span className={espnLoading ? 'spinning' : ''}>⟳</span>
          </button>
        )}

        {isDevMode() && (
          <>
            <div className={styles['scenario-divider']} />
            <NavLink
              to="/inspector"
              data-inspector="true"
              className={({ isActive }) =>
                `${styles['scenario-tab']} ${styles['inspector-tab']} ${isActive ? styles['active'] : ''}`
              }
            >
              <span className={styles['scenario-tab-content']}>
                <span className={styles['inspector-icon']}>🔍</span>
                <span className={styles['scenario-label']}>Inspector</span>
              </span>
            </NavLink>
          </>
        )}
      </div>

      {/* ESPN error message */}
      {scenario === 'espn-live' && espnError && (
        <div className={styles['espn-error-banner']}>ESPN Error: {espnError}</div>
      )}

      {/* Confirmation dialog for scenario switch with non-empty portfolio */}
      {pendingScenario && (
        <div className={styles['confirm-overlay']} data-testid="scenario-confirm-dialog">
          <div className={styles['confirm-dialog']}>
            <p className={styles['confirm-message']}>
              Switching scenarios will reset your portfolio and cash to defaults.
            </p>
            <div className={styles['confirm-actions']}>
              <button
                className={styles['confirm-cancel']}
                onClick={cancelSwitch}
              >
                Cancel
              </button>
              <button
                className={styles['confirm-switch']}
                onClick={confirmSwitch}
              >
                Switch &amp; Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
