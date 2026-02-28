import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { Holding } from '../../../types';
import styles from '../PlayerDetail.module.css';

interface TradeFormProps {
  playerId: string;
  playerName: string;
  currentPrice: number;
  holding: Holding | undefined;
  buyShares: (playerId: string, shares: number) => boolean;
  sellShares: (playerId: string, shares: number) => boolean;
  addToast: (message: string, type: string) => void;
}

export default function TradeForm({
  playerId,
  playerName,
  currentPrice,
  holding,
  buyShares,
  sellShares,
  addToast,
}: TradeFormProps) {
  const [buyAmount, setBuyAmount] = useState(1);
  const [sellAmount, setSellAmount] = useState(1);
  const [activeTab, setActiveTab] = useState('buy');

  const handleTradeTabKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const tabs = Array.from(
      e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]:not([disabled])'),
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
  }, []);

  const handleBuy = () => {
    const cost = currentPrice * buyAmount;
    if (buyShares(playerId, buyAmount)) {
      addToast(
        `Purchased ${buyAmount} share${buyAmount > 1 ? 's' : ''} of ${playerName} for $${cost.toFixed(2)}`,
        'success',
      );
      setBuyAmount(1);
    } else {
      addToast('Insufficient funds for this purchase', 'error');
    }
  };

  const handleSell = () => {
    const proceeds = currentPrice * sellAmount;
    if (sellShares(playerId, sellAmount)) {
      addToast(
        `Sold ${sellAmount} share${sellAmount > 1 ? 's' : ''} of ${playerName} for $${proceeds.toFixed(2)}`,
        'success',
      );
      setSellAmount(1);
    } else {
      addToast('Unable to complete sale', 'error');
    }
  };

  return (
    <motion.div
      className={styles['trading-card']}
      data-testid="trading-card"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus */}
      <div
        className={styles['trading-tabs']}
        role="tablist"
        aria-label="Trade type"
        onKeyDown={handleTradeTabKeyDown}
      >
        <button
          className={`${styles['trading-tab']} ${activeTab === 'buy' ? styles['active'] : ''}`}
          data-testid="trading-tab"
          data-active={activeTab === 'buy' ? 'true' : undefined}
          role="tab"
          aria-selected={activeTab === 'buy'}
          tabIndex={activeTab === 'buy' ? 0 : -1}
          onClick={() => setActiveTab('buy')}
        >
          Buy
        </button>
        <button
          className={`${styles['trading-tab']} ${activeTab === 'sell' ? styles['active'] : ''}`}
          data-testid="trading-tab"
          data-active={activeTab === 'sell' ? 'true' : undefined}
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
        <div className={styles['trading-form']}>
          <label className={styles['form-label']}>
            Shares
            <input
              type="number"
              min="1"
              value={buyAmount}
              onChange={(e) =>
                setBuyAmount(Math.max(1, parseInt(e.target.value) || 1))
              }
              className={styles['form-input']}
              data-testid="form-input"
            />
          </label>
          <div className={styles['order-summary']}>
            <span>Estimated Cost</span>
            <span className={styles['order-total']} data-testid="order-total">
              ${(currentPrice * buyAmount).toFixed(2)}
            </span>
          </div>
          <button className={`${styles['trade-button']} ${styles['buy']}`} data-testid="trade-button" data-variant="buy" onClick={handleBuy}>
            Buy {buyAmount} Share{buyAmount > 1 ? 's' : ''}
          </button>
        </div>
      ) : (
        <div className={styles['trading-form']}>
          <label className={styles['form-label']}>
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
              className={styles['form-input']}
              data-testid="form-input"
            />
          </label>
          <div className={styles['order-summary']}>
            <span>Estimated Proceeds</span>
            <span className={styles['order-total']} data-testid="order-total">
              ${(currentPrice * sellAmount).toFixed(2)}
            </span>
          </div>
          <button className={`${styles['trade-button']} ${styles['sell']}`} data-testid="trade-button" data-variant="sell" onClick={handleSell}>
            Sell {sellAmount} Share{sellAmount > 1 ? 's' : ''}
          </button>
        </div>
      )}
    </motion.div>
  );
}
