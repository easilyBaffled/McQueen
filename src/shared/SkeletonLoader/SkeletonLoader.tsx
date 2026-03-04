import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import styles from './SkeletonLoader.module.css';

const shimmer: Variants = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
};

// Skeleton for player cards on market page
export function PlayerCardSkeleton() {
  return (
    <motion.div
      className={styles['skeleton-card']}
      variants={shimmer}
      initial="initial"
      animate="animate"
    >
      <div className={styles['skeleton-card-header']}>
        <div className={styles['skeleton-team-badge']} />
        <div className={styles['skeleton-position']} />
        <div className={styles['skeleton-avatar']} />
      </div>
      <div className={styles['skeleton-card-body']}>
        <div className={styles['skeleton-name']} />
        <div className={styles['skeleton-price-row']}>
          <div className={styles['skeleton-price']} />
          <div className={styles['skeleton-change']} />
        </div>
        <div className={styles['skeleton-chart']} />
        <div className={styles['skeleton-headline']} />
      </div>
      <div className={styles['skeleton-card-footer']}>
        <div className={styles['skeleton-owners']} />
      </div>
    </motion.div>
  );
}

// Skeleton grid for market page
export function MarketSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className={styles['skeleton-market-grid']}>
      {Array.from({ length: count }).map((_, i) => (
        <PlayerCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Skeleton for leaderboard
export function LeaderboardSkeleton() {
  return (
    <motion.div
      className={styles['skeleton-leaderboard']}
      variants={shimmer}
      initial="initial"
      animate="animate"
    >
      <div className={styles['skeleton-leaderboard-header']} />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={styles['skeleton-leaderboard-row']}>
          <div className={styles['skeleton-rank']} />
          <div className={styles['skeleton-name-small']} />
          <div className={styles['skeleton-value']} />
        </div>
      ))}
    </motion.div>
  );
}

// Skeleton for mission page player grid
export function MissionSkeleton() {
  return (
    <motion.div
      className={styles['skeleton-mission']}
      variants={shimmer}
      initial="initial"
      animate="animate"
    >
      <div className={styles['skeleton-mission-header']} />
      <div className={styles['skeleton-mission-grid']}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className={styles['skeleton-mission-player']}>
            <div className={styles['skeleton-player-mini']} />
            <div className={styles['skeleton-player-buttons']}>
              <div className={styles['skeleton-button']} />
              <div className={styles['skeleton-button']} />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// Simple text line skeleton
export function TextSkeleton({ width = '100%', height = '16px' }: { width?: string; height?: string }) {
  return (
    <motion.div
      className={styles['skeleton-text']}
      style={{ width, height }}
      variants={shimmer}
      initial="initial"
      animate="animate"
    />
  );
}

export default {
  PlayerCardSkeleton,
  MarketSkeleton,
  LeaderboardSkeleton,
  MissionSkeleton,
  TextSkeleton,
};
