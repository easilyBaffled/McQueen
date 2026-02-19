import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import './Glossary.css';

const glossaryTerms = [
  {
    term: 'Portfolio',
    definition:
      'Your collection of player investments. When you buy shares of a player, they go into your portfolio.',
    example:
      'If you own shares of Patrick Mahomes and Josh Allen, they are both in your portfolio.',
  },
  {
    term: 'Shares',
    definition:
      'Units of ownership in a player. You can buy multiple shares of the same player.',
    example: 'Buying 5 shares of a player at $100 each costs $500 total.',
  },
  {
    term: 'Price',
    definition:
      'The current value of one share of a player. Prices change based on performance and news.',
    example:
      'If a player scores 3 touchdowns, their price might go from $120 to $135.',
  },
  {
    term: 'Risers',
    definition:
      'Players whose price has increased. Shown in green with an up arrow (▲).',
    example: 'A player who went from $80 to $92 is a "riser" with +15% gain.',
  },
  {
    term: 'Fallers',
    definition:
      'Players whose price has decreased. Shown in red with a down arrow (▼).',
    example:
      'A player who got injured and dropped from $100 to $85 is a "faller".',
  },
  {
    term: 'Watchlist',
    definition:
      'Players you want to keep an eye on without buying. Like a favorites list.',
    example:
      'Add players to your watchlist to track their price before deciding to buy.',
  },
  {
    term: 'Buy',
    definition:
      'Purchase shares of a player using your virtual cash. You profit if their price goes up.',
    example: 'Buy a player at $50, sell at $60 = $10 profit per share.',
  },
  {
    term: 'Sell',
    definition: 'Trade your shares back for virtual cash at the current price.',
    example: "Sell before a player's value drops to lock in your gains.",
  },
  {
    term: 'Total Value',
    definition:
      'Your cash plus the current value of all your player shares combined.',
    example: '$5,000 cash + $6,000 in player shares = $11,000 total value.',
  },
  {
    term: 'Gain/Loss %',
    definition:
      "How much you've made or lost on a player since buying, shown as a percentage.",
    example: 'Bought at $100, now worth $115 = +15% gain.',
  },
];

export default function Glossary({ isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const panelRef = useFocusTrap(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredTerms = glossaryTerms.filter(
    (item) =>
      item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.definition.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="glossary-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="glossary-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="glossary-title"
            ref={panelRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="glossary-header">
              <div className="glossary-title-row">
                <h2 id="glossary-title" className="glossary-title">
                  📖 Trading Terms
                </h2>
                <button
                  className="glossary-close"
                  onClick={onClose}
                  aria-label="Close glossary"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </div>
              <p className="glossary-subtitle">
                New to stock trading? Here's what everything means.
              </p>
              <div className="glossary-search">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="search-icon"
                  aria-hidden="true"
                >
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
                <input
                  type="search"
                  placeholder="Search terms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search trading terms"
                />
              </div>
            </div>

            <div className="glossary-content">
              {filteredTerms.map((item, index) => (
                <motion.div
                  key={item.term}
                  className="glossary-item"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <h3 className="glossary-term">{item.term}</h3>
                  <p className="glossary-definition">{item.definition}</p>
                  <p className="glossary-example">
                    <span className="example-label">Example:</span>{' '}
                    {item.example}
                  </p>
                </motion.div>
              ))}

              {filteredTerms.length === 0 && (
                <div className="glossary-empty">
                  <p>No terms match "{searchQuery}"</p>
                </div>
              )}
            </div>

            <div className="glossary-footer">
              <p>💡 Tip: This is all play money! Experiment freely.</p>
              <button
                className="restart-tutorial-btn"
                onClick={() => {
                  localStorage.removeItem('mcqueen-onboarded');
                  localStorage.removeItem('mcqueen-welcome-dismissed');
                  window.location.reload();
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="16"
                  height="16"
                >
                  <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                </svg>
                Restart Tutorial
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Simple tooltip hook for first-time term encounters
export function useTermTooltip() {
  const [seenTerms, setSeenTerms] = useState(() => {
    const saved = localStorage.getItem('mcqueen-seen-terms');
    return saved ? JSON.parse(saved) : [];
  });

  const markTermSeen = (term) => {
    if (!seenTerms.includes(term)) {
      const updated = [...seenTerms, term];
      setSeenTerms(updated);
      localStorage.setItem('mcqueen-seen-terms', JSON.stringify(updated));
    }
  };

  const shouldShowTooltip = (term) => !seenTerms.includes(term);

  return { shouldShowTooltip, markTermSeen };
}
