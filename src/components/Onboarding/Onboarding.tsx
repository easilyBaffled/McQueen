import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ONBOARDING_KEY, ONBOARDING_COMPLETED_KEY } from './OnboardingProvider';
import styles from './Onboarding.module.css';

export default function Onboarding() {
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Small delay to ensure app has fully loaded before showing onboarding
    const timer = setTimeout(() => {
      const hasOnboarded = localStorage.getItem(ONBOARDING_KEY);
      if (!hasOnboarded) {
        setIsReady(true);
        setIsVisible(true);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const handleComplete = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    setIsVisible(false);
    window.dispatchEvent(new CustomEvent('mcqueen-onboarding-complete'));
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleComplete();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, handleComplete]);

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const steps = [
    {
      title: 'Welcome to McQueen',
      subtitle: 'The NFL Stock Market',
      content:
        'Imagine if NFL players were stocks. When they score touchdowns or make headlines, their value goes up. When they get injured or underperform, it goes down.',
      icon: '🏈',
      highlight: null,
    },
    {
      title: 'Your Starting Balance',
      subtitle: '$10,000 in virtual cash',
      content:
        "You start with $10,000 of play money to invest. Don't worry — it's not real money! Use it to buy shares of your favorite players.",
      icon: '💵',
      highlight: 'virtual',
    },
    {
      title: 'Reading the Market',
      subtitle: 'Green = up, Red = down',
      content:
        'Player prices change based on real NFL news and game performance. Green means their value increased today. Red means it dropped. Your goal: buy low, sell high!',
      icon: '📊',
      highlight: 'colors',
    },
    {
      title: 'Build Your Portfolio',
      subtitle: 'Your collection of player investments',
      content:
        "A portfolio is simply all the players you've bought shares in. Track your investments and watch your total value grow as your players perform well.",
      icon: '📁',
      highlight: null,
    },
    {
      title: 'Daily Predictions',
      subtitle: 'Test your NFL knowledge',
      content:
        'Each day, predict which 3 players will go UP and which 3 will go DOWN. Compete with other fans to see who knows the market best!',
      icon: '🎯',
      highlight: null,
    },
    {
      title: 'Ready to Trade!',
      subtitle: 'Your first move awaits',
      content:
        'Browse the Market, find a player you believe in, and buy your first shares. Look for players with news that might boost their value!',
      icon: '🚀',
      highlight: 'cta',
    },
  ];

  const currentStep = steps[step];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={styles['onboarding-overlay']}
          data-testid="onboarding-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={styles['onboarding-modal']}
            data-testid="onboarding-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-title"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            <div className={styles['onboarding-header']}>
              <div className={styles['step-indicators']}>
                {steps.map((_, i) => (
                  <span
                    key={i}
                    className={`${styles['step-dot']} ${i === step ? styles['active'] : ''} ${i < step ? styles['completed'] : ''}`}
                    data-testid="step-dot"
                    data-active={i === step ? 'true' : undefined}
                  />
                ))}
              </div>
              <button className={styles['skip-button']} data-testid="skip-button" onClick={handleComplete}>
                Skip
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                className={`onboarding-content ${currentStep.highlight ? `highlight-${currentStep.highlight}` : ''}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <span className={styles['onboarding-icon']}>{currentStep.icon}</span>
                <h2 id="onboarding-title" className={styles['onboarding-title']}>
                  {currentStep.title}
                </h2>
                <p className={styles['onboarding-subtitle']}>{currentStep.subtitle}</p>
                <p className={styles['onboarding-text']}>{currentStep.content}</p>

                {currentStep.highlight === 'colors' && (
                  <div className={styles['onboarding-demo']}>
                    <div className={`${styles['demo-price']} ${styles['up']}`}>
                      <span className={styles['demo-label']}>Going Up</span>
                      <span className={styles['demo-value']}>▲ +5.2%</span>
                    </div>
                    <div className={`${styles['demo-price']} ${styles['down']}`}>
                      <span className={styles['demo-label']}>Going Down</span>
                      <span className={styles['demo-value']}>▼ -3.1%</span>
                    </div>
                  </div>
                )}

                {currentStep.highlight === 'virtual' && (
                  <div className={styles['onboarding-balance-demo']}>
                    <span className={styles['demo-cash']}>$10,000.00</span>
                    <span className={styles['demo-note']}>
                      Play money to start trading
                    </span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className={styles['onboarding-footer']}>
              {step > 0 && (
                <button className={styles['back-button']} data-testid="back-button" onClick={handleBack}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                  </svg>
                  Back
                </button>
              )}
              <button
                className={`${styles['next-button']} ${step === steps.length - 1 ? styles['final'] : ''}`}
                data-testid="next-button"
                onClick={handleNext}
              >
                {step === steps.length - 1 ? 'Start Trading!' : 'Next'}
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                </svg>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Tooltip({ children, content, show }: { children: React.ReactNode; content: string; show: boolean }) {
  return (
    <div className={styles['tooltip-wrapper']}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            className={styles['tooltip-content']}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function resetOnboarding() {
  localStorage.removeItem(ONBOARDING_KEY);
  window.location.reload();
}
