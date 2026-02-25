import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useScenario } from '../../context/ScenarioContext';
import { useSimulation } from '../../context/SimulationContext';
import { useTrading } from '../../context/TradingContext';
import PlayerCard from '../../components/PlayerCard/PlayerCard';
import MiniLeaderboard from '../../components/MiniLeaderboard/MiniLeaderboard';
import { MarketSkeleton, LeaderboardSkeleton } from '../../shared';
import { FirstTradeGuide } from '../../shared';
import styles from './Market.module.css';

const WELCOME_DISMISSED_KEY = 'mcqueen-welcome-dismissed';

const sortOptions = [
  { id: 'risers', label: 'Biggest Risers' },
  { id: 'fallers', label: 'Biggest Fallers' },
  { id: 'active', label: 'Most Active' },
  { id: 'price', label: 'Highest Price' },
];

export default function Market() {
  const { currentData, scenario } = useScenario();
  const { espnLoading, espnError, refreshEspnNews } = useSimulation();
  const { getPlayers, portfolio } = useTrading();
  const hasNoTrades = Object.keys(portfolio).length === 0;
  const [sortBy, setSortBy] = useState('risers');
  const [searchQuery, setSearchQuery] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem(WELCOME_DISMISSED_KEY);
    if (!dismissed) {
      setShowWelcome(true);
    }
  }, []);

  const dismissWelcome = () => {
    localStorage.setItem(WELCOME_DISMISSED_KEY, 'true');
    setShowWelcome(false);
  };

  const players = getPlayers();

  // Simulate initial load and show skeleton briefly
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [scenario]);

  const sortedPlayers = useMemo(() => {
    let filtered = players.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.team.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    switch (sortBy) {
      case 'risers':
        return [...filtered].sort((a, b) => b.changePercent - a.changePercent);
      case 'fallers':
        return [...filtered].sort((a, b) => a.changePercent - b.changePercent);
      case 'active':
        return [...filtered].sort(
          (a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent),
        );
      case 'price':
        return [...filtered].sort((a, b) => b.currentPrice - a.currentPrice);
      default:
        return filtered;
    }
  }, [players, sortBy, searchQuery]);

  return (
    <div className={styles['market-page']} data-testid="market-page">
      <FirstTradeGuide hasCompletedFirstTrade={!hasNoTrades} />

      <AnimatePresence>
        {showWelcome && (
          <motion.div
            className={styles['welcome-banner']}
            data-testid="welcome-banner"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className={styles['welcome-content']}>
              <div className={styles['welcome-icon']}>🏈</div>
              <div className={styles['welcome-text']}>
                <h3>Welcome to McQueen!</h3>
                <p>
                  This is a fantasy NFL stock market. Buy and sell shares of NFL
                  players — prices go up when they score touchdowns, make big
                  plays, or get good news.
                  <strong> It's all play money, so experiment freely!</strong>
                </p>
              </div>
            </div>
            <button
              className={styles['welcome-dismiss']}
              data-testid="welcome-dismiss"
              onClick={dismissWelcome}
              title="Dismiss"
              aria-label="Dismiss welcome message"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={styles['market-header']}>
        <div className={styles['market-title-section']}>
          <h1 className={styles['market-title']}>Today's Movers</h1>
          <p className={styles['market-subtitle']}>
            {currentData?.headline || 'Market activity'}
          </p>
        </div>
      </div>

      <div className={styles['market-controls']}>
        <div className={styles['search-box']}>
          <svg viewBox="0 0 24 24" fill="currentColor" className={styles['search-icon']}>
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <input
            type="search"
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles['search-input']}
            data-testid="search-input"
            aria-label="Search players"
          />
        </div>

        <div className={styles['sort-tabs']}>
          {sortOptions.map((option) => (
            <button
              key={option.id}
              className={`${styles['sort-tab']} ${sortBy === option.id ? styles['active'] + ' active' : ''}`}
              data-testid="sort-tab"
              onClick={() => setSortBy(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles['market-layout']}>
        <div className={styles['market-sidebar']} data-testid="market-sidebar">
          {isLoading ? <LeaderboardSkeleton /> : <MiniLeaderboard />}
        </div>

        <div className={styles['market-main']}>
          {isLoading ? (
            <MarketSkeleton count={6} />
          ) : scenario === 'espn-live' && sortedPlayers.length === 0 && !espnLoading ? (
            <div className={styles['espn-empty-state']} data-testid="espn-empty-state">
              <div className={styles['espn-empty-icon']}>📡</div>
              <h3 className={styles['espn-empty-title']}>
                {espnError ? 'Unable to Load ESPN Data' : 'No Live ESPN Data Right Now'}
              </h3>
              <p className={styles['espn-empty-text']}>
                {espnError
                  ? `There was an error fetching ESPN news: ${espnError}. Try refreshing or switch to another scenario.`
                  : 'There are no live ESPN headlines at the moment. Try refreshing or switch to another scenario to start trading.'}
              </p>
              <button
                className={styles['espn-empty-refresh']}
                data-testid="espn-empty-refresh"
                onClick={refreshEspnNews}
                disabled={espnLoading}
              >
                ⟳ Refresh ESPN News
              </button>
            </div>
          ) : (
            <div className={styles['players-grid']} data-testid="players-grid">
              <AnimatePresence mode="popLayout">
                {sortedPlayers.map((player, index) => (
                  <motion.div
                    key={player.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                  >
                    <Link to={`/player/${player.id}`}>
                      <PlayerCard
                        player={player}
                        showFirstTradeTip={hasNoTrades && index === 0}
                      />
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
