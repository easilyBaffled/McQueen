import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './InfoTooltip.css';

const tooltipDefinitions = {
  shares:
    'Units of ownership in a player. You can buy multiple shares of the same player.',
  portfolio:
    'Your collection of player investments. When you buy shares, they go into your portfolio.',
  risers:
    'Players whose price has increased. Shown in green with an up arrow (▲).',
  fallers:
    'Players whose price has decreased. Shown in red with a down arrow (▼).',
  watchlist: 'Players you want to track without buying. Like a favorites list.',
  price:
    'The current value of one share of a player. Prices change based on performance and news.',
  gainLoss:
    "How much you've made or lost on a player since buying, shown as a percentage.",
  totalValue:
    'Your cash plus the current value of all your player shares combined.',
  cash: 'Available virtual money to spend on player shares.',
  buy: 'Purchase shares of a player using your virtual cash.',
  sell: 'Trade your shares back for virtual cash at the current price.',
};

export default function InfoTooltip({ term, children, inline = false }) {
  const [isVisible, setIsVisible] = useState(false);
  const definition = tooltipDefinitions[term];

  if (!definition) {
    return children || null;
  }

  return (
    <span
      className={`info-tooltip-wrapper ${inline ? 'inline' : ''}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <button
        className="info-tooltip-trigger"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsVisible(!isVisible);
        }}
        aria-label={`What is ${term}?`}
      >
        ?
      </button>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="info-tooltip-content"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
          >
            {definition}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
