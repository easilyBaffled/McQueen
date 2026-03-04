import { motion } from 'framer-motion';
import type { Holding } from '../../../types';
import styles from '../PlayerDetail.module.css';

interface HoldingsCardProps {
  holding: Holding;
  currentPrice: number;
}

export default function HoldingsCard({ holding, currentPrice }: HoldingsCardProps) {
  const isGain = currentPrice - holding.avgCost >= 0;
  const plAmount = Math.abs((currentPrice - holding.avgCost) * holding.shares);

  return (
    <motion.div
      className={styles['holdings-card']}
      data-testid="holdings-card"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
    >
      <h4>Your Position</h4>
      <div className={styles['holdings-stats']}>
        <div className={styles['holdings-stat']}>
          <span className={styles['stat-label']}>Shares</span>
          <span className={styles['stat-value']}>{holding.shares}</span>
        </div>
        <div className={styles['holdings-stat']}>
          <span className={styles['stat-label']}>Avg Cost</span>
          <span className={styles['stat-value']}>
            ${holding.avgCost.toFixed(2)}
          </span>
        </div>
        <div className={styles['holdings-stat']}>
          <span className={styles['stat-label']}>Market Value</span>
          <span className={styles['stat-value']}>
            ${(currentPrice * holding.shares).toFixed(2)}
          </span>
        </div>
        <div className={styles['holdings-stat']}>
          <span className={styles['stat-label']}>P/L</span>
          <span
            className={`${styles['stat-value']} ${isGain ? 'text-up' : 'text-down'}`}
            aria-label={`${isGain ? 'Gain' : 'Loss'} of $${plAmount.toFixed(2)}`}
          >
            {isGain ? '▲ +' : '▼ '}${plAmount.toFixed(2)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
