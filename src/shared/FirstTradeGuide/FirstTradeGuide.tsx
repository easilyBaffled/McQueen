import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from '../../components/Onboarding/OnboardingProvider';
import styles from './FirstTradeGuide.module.css';

interface FirstTradeGuideProps {
  hasCompletedFirstTrade: boolean;
}

export default function FirstTradeGuide({ hasCompletedFirstTrade }: FirstTradeGuideProps) {
  const { showFirstTradeGuide, dismissFirstTradeGuide } = useOnboarding();
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (showFirstTradeGuide && !hasCompletedFirstTrade) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }
    if (!showFirstTradeGuide || hasCompletedFirstTrade) {
      setIsVisible(false);
    }
  }, [showFirstTradeGuide, hasCompletedFirstTrade]);

  useEffect(() => {
    if (hasCompletedFirstTrade && isVisible) {
      dismissFirstTradeGuide();
      setIsVisible(false);
    }
  }, [hasCompletedFirstTrade, isVisible, dismissFirstTradeGuide]);

  const handleDismiss = () => {
    dismissFirstTradeGuide();
    setIsVisible(false);
  };

  const steps = [
    {
      title: 'Make Your First Trade!',
      content:
        "Now it's time to build your portfolio. Click on any player card to see their details and buy shares.",
      icon: '🎯',
      action: null,
    },
    {
      title: 'Look for Risers',
      content:
        'Green players (▲) are gaining value. Look for players with positive news who might keep rising!',
      icon: '📈',
      action: null,
    },
    {
      title: 'Click to Buy',
      content:
        'Tap a player you like, then hit the "Buy" button. Start small with 1-2 shares.',
      icon: '🛒',
      action: null,
    },
  ];

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={styles['first-trade-guide']}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
      >
        <div className={styles['guide-header']}>
          <div className={styles['guide-progress']}>
            {steps.map((_, i) => (
              <span
                key={i}
                className={`${styles['guide-dot']} ${i === step ? styles['active'] : ''} ${i < step ? styles['completed'] : ''}`}
              />
            ))}
          </div>
          <button className={styles['guide-close']} onClick={handleDismiss} aria-label="Close guide">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            className={styles['guide-content']}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            <span className={styles['guide-icon']}>{steps[step].icon}</span>
            <h3 className={styles['guide-title']}>{steps[step].title}</h3>
            <p className={styles['guide-text']}>{steps[step].content}</p>
          </motion.div>
        </AnimatePresence>

        <div className={styles['guide-footer']}>
          {step > 0 && (
            <button
              className={`${styles['guide-btn']} ${styles['secondary']}`}
              onClick={() => setStep(step - 1)}
            >
              Back
            </button>
          )}
          {step < steps.length - 1 ? (
            <button
              className={`${styles['guide-btn']} ${styles['primary']}`}
              onClick={() => setStep(step + 1)}
            >
              Next
            </button>
          ) : (
            <button className={`${styles['guide-btn']} ${styles['primary']}`} onClick={handleDismiss}>
              Let's Trade!
            </button>
          )}
        </div>

        <div className={styles['guide-pointer']}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 10l5 5 5-5z" />
          </svg>
          <span>Click a player below</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
