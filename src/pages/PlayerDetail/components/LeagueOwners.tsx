import { motion } from 'framer-motion';
import styles from '../PlayerDetail.module.css';

interface LeagueHolder {
  memberId: string;
  name: string;
  avatar: string;
  isUser: boolean;
  shares: number;
  avgCost: number;
  gainPercent: number;
}

interface LeagueOwnersProps {
  leagueHoldings: LeagueHolder[];
}

export default function LeagueOwners({ leagueHoldings }: LeagueOwnersProps) {
  return (
    <motion.div
      className={styles['league-owners-card']}
      data-testid="league-owners-card"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h4>League Owners ({leagueHoldings.length})</h4>
      <div className={styles['league-owners-list']}>
        {leagueHoldings.map((holder) => (
          <div
            key={holder.memberId}
            className={`${styles['league-owner-row']} ${holder.isUser ? styles['is-user'] : ''}`}
            data-testid="league-owner-row"
          >
            <div className={styles['owner-info']}>
              <span className={styles['owner-avatar']}>
                {holder.isUser ? '👤' : holder.avatar}
              </span>
              <span className={styles['owner-name']}>{holder.name}</span>
            </div>
            <div className={styles['owner-stats']}>
              <span className={styles['owner-shares']}>
                {holder.shares} shares
              </span>
              <span
                className={`${styles['owner-gain']} ${holder.gainPercent >= 0 ? 'text-up' : 'text-down'}`}
                aria-label={`${holder.gainPercent >= 0 ? 'Gain' : 'Loss'} ${Math.abs(holder.gainPercent).toFixed(1)} percent`}
              >
                {holder.gainPercent >= 0 ? '▲ +' : '▼ '}
                {holder.gainPercent.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
