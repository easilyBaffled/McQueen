import { useEffect, useRef, useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useScenario } from '../../context/ScenarioContext';
import { useTrading } from '../../context/TradingContext';
import ScenarioToggle from '../ScenarioToggle/ScenarioToggle';
import LiveTicker from '../LiveTicker/LiveTicker';
import TimelineDebugger from '../TimelineDebugger/TimelineDebugger';
import SimulationIndicator from '../SimulationIndicator/SimulationIndicator';
import { Glossary } from '../../shared';
import styles from './Layout.module.css';

export default function Layout() {
  const location = useLocation();
  const { scenario } = useScenario();
  const { cash, getPortfolioValue } = useTrading();
  const portfolioStats = getPortfolioValue();
  const totalValue = cash + portfolioStats.value;
  const mainContentRef = useRef<HTMLElement>(null);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  return (
    <div className={styles['layout']}>
      <a href="#main-content" className={styles['skip-to-main']}>
        Skip to main content
      </a>
      <header className={styles['header']}>
        <div className={styles['header-left']}>
          <div className={styles['logo']}>
            <span className={styles['logo-mcqueen']}>McQUEEN</span>
            <span className={styles['logo-tagline']}>NFL Stock Market</span>
          </div>
        </div>

        <div className={styles['header-center']} data-testid="header-center">
          <ScenarioToggle />
        </div>

        <div className={styles['header-right']}>
          <button
            className={styles['help-button']}
            data-testid="help-button"
            onClick={() => setIsGlossaryOpen(true)}
            title="Trading Terms Glossary"
            aria-label="Open trading terms glossary"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z" />
            </svg>
            <span className={styles['help-text']}>Help</span>
          </button>
          <div className={styles['user-balance']}>
            <span className={styles['balance-label']} data-testid="balance-label">Total Value</span>
            <span
              className={`${styles['balance-value']} ${portfolioStats.gain >= 0 ? styles['up'] : styles['down']}`}
              data-testid="balance-value"
              aria-label={`Total value $${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            >
              $
              {totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </header>

      {(scenario === 'live' || scenario === 'superbowl') && <LiveTicker />}

      <nav className={styles['nav']} aria-label="Main navigation">
        <NavLink
          to="/"
          className={({ isActive }) => `${styles['nav-link']} ${isActive ? styles['active'] : ''}`}
          data-testid="nav-link"
          end
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className={styles['nav-icon']}>
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
          </svg>
          Timeline
        </NavLink>
        <NavLink
          to="/market"
          className={({ isActive }) => `${styles['nav-link']} ${isActive ? styles['active'] : ''}`}
          data-testid="nav-link"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className={styles['nav-icon']}>
            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
          </svg>
          Market
        </NavLink>
        <NavLink
          to="/portfolio"
          className={({ isActive }) => `${styles['nav-link']} ${isActive ? styles['active'] : ''}`}
          data-testid="nav-link"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className={styles['nav-icon']}>
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
          </svg>
          Portfolio
        </NavLink>
        <NavLink
          to="/watchlist"
          className={({ isActive }) => `${styles['nav-link']} ${isActive ? styles['active'] : ''}`}
          data-testid="nav-link"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className={styles['nav-icon']}>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          Watchlist
        </NavLink>
        <NavLink
          to="/mission"
          className={({ isActive }) => `${styles['nav-link']} ${isActive ? styles['active'] : ''}`}
          data-testid="nav-link"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className={styles['nav-icon']}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          Mission
        </NavLink>
        <NavLink
          to="/leaderboard"
          className={({ isActive }) => `${styles['nav-link']} ${isActive ? styles['active'] : ''}`}
          data-testid="nav-link"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className={styles['nav-icon']}>
            <path d="M7.5 21H2V9h5.5v12zm7.25-18h-5.5v18h5.5V3zM22 11h-5.5v10H22V11z" />
          </svg>
          Leaderboard
        </NavLink>
      </nav>

      <main className={styles['main-content']} ref={mainContentRef} id="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={styles['page-container']}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <SimulationIndicator />
      <TimelineDebugger />
      <Glossary
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
      />
    </div>
  );
}
