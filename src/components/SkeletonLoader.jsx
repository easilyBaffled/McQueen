import { motion } from 'framer-motion';
import './SkeletonLoader.css';

// Generic skeleton pulse animation
const shimmer = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Skeleton for player cards on market page
export function PlayerCardSkeleton() {
  return (
    <motion.div
      className="skeleton-card"
      variants={shimmer}
      initial="initial"
      animate="animate"
    >
      <div className="skeleton-card-header">
        <div className="skeleton-team-badge" />
        <div className="skeleton-position" />
        <div className="skeleton-avatar" />
      </div>
      <div className="skeleton-card-body">
        <div className="skeleton-name" />
        <div className="skeleton-price-row">
          <div className="skeleton-price" />
          <div className="skeleton-change" />
        </div>
        <div className="skeleton-chart" />
        <div className="skeleton-headline" />
      </div>
      <div className="skeleton-card-footer">
        <div className="skeleton-owners" />
      </div>
    </motion.div>
  );
}

// Skeleton grid for market page
export function MarketSkeleton({ count = 6 }) {
  return (
    <div className="skeleton-market-grid">
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
      className="skeleton-leaderboard"
      variants={shimmer}
      initial="initial"
      animate="animate"
    >
      <div className="skeleton-leaderboard-header" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton-leaderboard-row">
          <div className="skeleton-rank" />
          <div className="skeleton-name-small" />
          <div className="skeleton-value" />
        </div>
      ))}
    </motion.div>
  );
}

// Skeleton for mission page player grid
export function MissionSkeleton() {
  return (
    <motion.div
      className="skeleton-mission"
      variants={shimmer}
      initial="initial"
      animate="animate"
    >
      <div className="skeleton-mission-header" />
      <div className="skeleton-mission-grid">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="skeleton-mission-player">
            <div className="skeleton-player-mini" />
            <div className="skeleton-player-buttons">
              <div className="skeleton-button" />
              <div className="skeleton-button" />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// Simple text line skeleton
export function TextSkeleton({ width = '100%', height = '16px' }) {
  return (
    <motion.div
      className="skeleton-text"
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
