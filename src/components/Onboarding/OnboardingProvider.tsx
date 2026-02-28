import { useState, createContext, useContext } from 'react';

export const ONBOARDING_KEY = 'mcqueen-onboarded';
const FIRST_TRADE_KEY = 'mcqueen-first-trade-seen';
export const ONBOARDING_COMPLETED_KEY = 'mcqueen-onboarding-just-completed';

interface OnboardingContextValue {
  hasCompletedOnboarding: boolean;
  showFirstTradeGuide: boolean;
  dismissFirstTradeGuide: () => void;
  isNewUser: boolean;
  markOnboardingComplete?: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue>({
  hasCompletedOnboarding: true,
  showFirstTradeGuide: false,
  dismissFirstTradeGuide: () => {},
  isNewUser: false,
});

export function useOnboarding() {
  return useContext(OnboardingContext);
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  });
  const [showFirstTradeGuide, setShowFirstTradeGuide] = useState(() => {
    return (
      localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true' &&
      localStorage.getItem(FIRST_TRADE_KEY) !== 'true'
    );
  });
  const [isNewUser, setIsNewUser] = useState(() => {
    return localStorage.getItem(ONBOARDING_KEY) !== 'true';
  });

  const dismissFirstTradeGuide = () => {
    localStorage.setItem(FIRST_TRADE_KEY, 'true');
    localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
    setShowFirstTradeGuide(false);
  };

  const markOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    setHasCompletedOnboarding(true);
    setIsNewUser(false);
    setShowFirstTradeGuide(true);
  };

  return (
    <OnboardingContext.Provider
      value={{
        hasCompletedOnboarding,
        showFirstTradeGuide,
        dismissFirstTradeGuide,
        isNewUser,
        markOnboardingComplete,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}
