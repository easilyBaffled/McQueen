import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { OnboardingProvider, useOnboarding, ONBOARDING_KEY, ONBOARDING_COMPLETED_KEY } from '../OnboardingProvider';

function TestConsumer() {
  const ctx = useOnboarding();
  return (
    <div>
      <span data-testid="completed">{String(ctx.hasCompletedOnboarding)}</span>
      <span data-testid="firstTrade">{String(ctx.showFirstTradeGuide)}</span>
      <span data-testid="newUser">{String(ctx.isNewUser)}</span>
      <button data-testid="dismiss" onClick={ctx.dismissFirstTradeGuide}>Dismiss</button>
      <button data-testid="complete" onClick={ctx.markOnboardingComplete}>Complete</button>
    </div>
  );
}

describe('OnboardingProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides default values for a new user', () => {
    render(
      <OnboardingProvider>
        <TestConsumer />
      </OnboardingProvider>,
    );
    expect(screen.getByTestId('completed')).toHaveTextContent('false');
    expect(screen.getByTestId('firstTrade')).toHaveTextContent('false');
    expect(screen.getByTestId('newUser')).toHaveTextContent('true');
  });

  it('recognizes returning user from localStorage', () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    render(
      <OnboardingProvider>
        <TestConsumer />
      </OnboardingProvider>,
    );
    expect(screen.getByTestId('completed')).toHaveTextContent('true');
    expect(screen.getByTestId('newUser')).toHaveTextContent('false');
  });

  it('shows first trade guide when onboarding just completed', () => {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    render(
      <OnboardingProvider>
        <TestConsumer />
      </OnboardingProvider>,
    );
    expect(screen.getByTestId('firstTrade')).toHaveTextContent('true');
  });

  it('markOnboardingComplete sets all flags correctly', () => {
    render(
      <OnboardingProvider>
        <TestConsumer />
      </OnboardingProvider>,
    );
    act(() => {
      screen.getByTestId('complete').click();
    });
    expect(screen.getByTestId('completed')).toHaveTextContent('true');
    expect(screen.getByTestId('newUser')).toHaveTextContent('false');
    expect(screen.getByTestId('firstTrade')).toHaveTextContent('true');
    expect(localStorage.getItem(ONBOARDING_KEY)).toBe('true');
    expect(localStorage.getItem(ONBOARDING_COMPLETED_KEY)).toBe('true');
  });

  it('dismissFirstTradeGuide hides guide and cleans up localStorage', () => {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    render(
      <OnboardingProvider>
        <TestConsumer />
      </OnboardingProvider>,
    );
    expect(screen.getByTestId('firstTrade')).toHaveTextContent('true');
    act(() => {
      screen.getByTestId('dismiss').click();
    });
    expect(screen.getByTestId('firstTrade')).toHaveTextContent('false');
    expect(localStorage.getItem(ONBOARDING_COMPLETED_KEY)).toBeNull();
  });

  it('useOnboarding returns defaults outside provider', () => {
    function Standalone() {
      const ctx = useOnboarding();
      return <span data-testid="default">{String(ctx.hasCompletedOnboarding)}</span>;
    }
    render(<Standalone />);
    expect(screen.getByTestId('default')).toHaveTextContent('true');
  });
});
