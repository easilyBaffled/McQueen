import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './FirstTradeGuide.css';

const FIRST_TRADE_KEY = 'mcqueen-first-trade-seen';
const ONBOARDING_COMPLETED_KEY = 'mcqueen-onboarding-just-completed';

export default function FirstTradeGuide({ hasCompletedFirstTrade }) {
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Only show if user just completed onboarding and hasn't made a trade
    const justCompleted = localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true';
    const hasSeenGuide = localStorage.getItem(FIRST_TRADE_KEY) === 'true';
    
    if (justCompleted && !hasSeenGuide && !hasCompletedFirstTrade) {
      // Small delay to let the page load first
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [hasCompletedFirstTrade]);

  // Auto-hide when user makes their first trade
  useEffect(() => {
    if (hasCompletedFirstTrade && isVisible) {
      localStorage.setItem(FIRST_TRADE_KEY, 'true');
      localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
      setIsVisible(false);
    }
  }, [hasCompletedFirstTrade, isVisible]);

  const handleDismiss = () => {
    localStorage.setItem(FIRST_TRADE_KEY, 'true');
    localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
    setIsVisible(false);
  };

  const steps = [
    {
      title: "Make Your First Trade!",
      content: "Now it's time to build your portfolio. Click on any player card to see their details and buy shares.",
      icon: "🎯",
      action: null,
    },
    {
      title: "Look for Risers",
      content: "Green players (▲) are gaining value. Look for players with positive news who might keep rising!",
      icon: "📈",
      action: null,
    },
    {
      title: "Click to Buy",
      content: "Tap a player you like, then hit the \"Buy\" button. Start small with 1-2 shares.",
      icon: "🛒",
      action: null,
    },
  ];

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="first-trade-guide"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
      >
        <div className="guide-header">
          <div className="guide-progress">
            {steps.map((_, i) => (
              <span 
                key={i} 
                className={`guide-dot ${i === step ? 'active' : ''} ${i < step ? 'completed' : ''}`}
              />
            ))}
          </div>
          <button className="guide-close" onClick={handleDismiss}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            className="guide-content"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            <span className="guide-icon">{steps[step].icon}</span>
            <h3 className="guide-title">{steps[step].title}</h3>
            <p className="guide-text">{steps[step].content}</p>
          </motion.div>
        </AnimatePresence>

        <div className="guide-footer">
          {step > 0 && (
            <button className="guide-btn secondary" onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          {step < steps.length - 1 ? (
            <button className="guide-btn primary" onClick={() => setStep(step + 1)}>
              Next
            </button>
          ) : (
            <button className="guide-btn primary" onClick={handleDismiss}>
              Let's Trade!
            </button>
          )}
        </div>

        <div className="guide-pointer">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 10l5 5 5-5z"/>
          </svg>
          <span>Click a player below</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}


